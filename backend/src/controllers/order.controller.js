const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const DeliveryPartner = require('../models/DeliveryPartner');

const DELIVERY_FEE_THRESHOLD = 199;
const DELIVERY_FEE = 25;
const TAX_RATE = 0.05;

/** orderId (string) -> User ids (strings) who received `order:offer` for that order */
const dispatchOfferRecipients = new Map();

const MAX_DISPATCH_RADIUS_M = 25_000;
const MAX_DISPATCH_PARTNERS = 20;

function withdrawOrderOffers(io, orderId, winnerUserId) {
  if (!io) return;
  const key = orderId.toString();
  const recipients = dispatchOfferRecipients.get(key);
  dispatchOfferRecipients.delete(key);
  if (!recipients?.length) return;
  const win = winnerUserId != null ? winnerUserId.toString() : null;
  for (const uid of recipients) {
    if (win && uid === win) continue;
    io.to(`user:${uid}`).emit('order:offer:withdraw', { orderId: key });
  }
}

async function broadcastOrderOffers(io, orderDoc) {
  if (!io) return;

  const coords = orderDoc.address?.location?.coordinates;
  const payloadBase = {
    orderId: orderDoc._id.toString(),
    orderNumber: orderDoc.orderNumber,
    total: orderDoc.total,
    dropLat: coords?.[1],
    dropLng: coords?.[0],
    itemsCount: orderDoc.items?.length || 0,
  };

  let partners = [];

  if (
    coords &&
    typeof coords[0] === 'number' &&
    typeof coords[1] === 'number' &&
    !(coords[0] === 0 && coords[1] === 0)
  ) {
    const [lng, lat] = coords;
    partners = await DeliveryPartner.find({
      isAvailable: true,
      isOnDuty: true,
      activeOrder: null,
      currentLocation: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: MAX_DISPATCH_RADIUS_M,
        },
      },
    })
      .limit(MAX_DISPATCH_PARTNERS)
      .populate('user', 'name');
    partners = partners.filter((p) => {
      const c = p.currentLocation?.coordinates;
      return c && !(c[0] === 0 && c[1] === 0);
    });
  }

  if (partners.length === 0) {
    partners = await DeliveryPartner.find({
      isAvailable: true,
      isOnDuty: true,
      activeOrder: null,
    })
      .limit(MAX_DISPATCH_PARTNERS)
      .populate('user', 'name');
  }

  const ids = [];
  for (const p of partners) {
    if (!p.user?._id) continue;
    const uid = p.user._id.toString();
    ids.push(uid);
    io.to(`user:${p.user._id}`).emit('order:offer', payloadBase);
  }

  if (ids.length) dispatchOfferRecipients.set(orderDoc._id.toString(), ids);
}

async function computeTotals({ items, couponCode }) {
  let subtotal = 0;
  let mrpTotal = 0;
  for (const i of items) {
    subtotal += i.price * i.quantity;
    mrpTotal += i.mrp * i.quantity;
  }
  let couponDiscount = 0;
  let coupon = null;
  if (couponCode) {
    coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (coupon && subtotal >= coupon.minOrderValue) {
      if (coupon.type === 'flat') couponDiscount = coupon.value;
      else couponDiscount = Math.round((subtotal * coupon.value) / 100);
      if (coupon.maxDiscount > 0) couponDiscount = Math.min(couponDiscount, coupon.maxDiscount);
    }
  }
  const discount = mrpTotal - subtotal;
  const deliveryFee = subtotal >= DELIVERY_FEE_THRESHOLD ? 0 : DELIVERY_FEE;
  const taxes = Math.round(subtotal * TAX_RATE);
  const total = Math.max(0, subtotal - couponDiscount + deliveryFee + taxes);
  return { subtotal, mrpTotal, discount, couponDiscount, deliveryFee, taxes, total, coupon };
}

const checkout = asyncHandler(async (req, res) => {
  const { addressId, paymentMethod = 'cod', couponCode, deliveryType = 'now', scheduledFor, notes } = req.body;
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(addressId) || user.addresses.find((a) => a.isDefault) || user.addresses[0];
  if (!address) {
    res.status(400);
    throw new Error('Please add a delivery address');
  }

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error('Cart is empty');
  }

  const orderItems = cart.items.map((i) => ({
    product: i.product._id,
    name: i.product.name,
    image: i.product.images?.[0],
    unit: i.product.unit,
    quantity: i.quantity,
    price: i.priceSnapshot,
    mrp: i.mrpSnapshot,
    lineTotal: i.priceSnapshot * i.quantity,
  }));

  const totals = await computeTotals({ items: orderItems, couponCode });

  for (const i of cart.items) {
    if (i.product.stock < i.quantity) {
      res.status(409);
      throw new Error(`Insufficient stock for ${i.product.name}`);
    }
  }

  let walletDebited = 0;
  if (paymentMethod === 'wallet') {
    const paidUser = await User.findOneAndUpdate(
      { _id: req.user._id, walletBalance: { $gte: totals.total } },
      { $inc: { walletBalance: -totals.total } },
      { new: true },
    );
    if (!paidUser) {
      res.status(400);
      throw new Error('Insufficient wallet balance');
    }
    walletDebited = totals.total;
  }

  let order;
  try {
    order = await Order.create({
      user: req.user._id,
      items: orderItems,
      address: address.toObject(),
      subtotal: totals.subtotal,
      mrpTotal: totals.mrpTotal,
      discount: totals.discount,
      couponCode: totals.coupon ? totals.coupon.code : undefined,
      couponDiscount: totals.couponDiscount,
      deliveryFee: totals.deliveryFee,
      taxes: totals.taxes,
      total: totals.total,
      paymentMethod,
      paymentStatus:
        paymentMethod === 'wallet'
          ? 'paid'
          : paymentMethod === 'cod'
            ? 'pending'
            : 'pending',
      status: 'pending',
      deliveryType,
      scheduledFor,
      notes,
      timeline: [{ status: 'pending', note: 'Order placed', by: req.user._id }],
    });

    for (const i of cart.items) {
      await Product.updateOne({ _id: i.product._id }, { $inc: { stock: -i.quantity } });
    }
    if (totals.coupon) {
      await Coupon.updateOne({ _id: totals.coupon._id }, { $inc: { usedCount: 1 } });
    }

    cart.items = [];
    cart.couponCode = null;
    await cart.save();

    if (paymentMethod === 'wallet') {
      await Transaction.create({
        user: req.user._id,
        order: order._id,
        type: 'wallet_debit',
        method: 'wallet',
        status: 'success',
        amount: totals.total,
      });
    } else {
      await Transaction.create({
        user: req.user._id,
        order: order._id,
        type: 'payment',
        method: paymentMethod,
        status: paymentMethod === 'cod' ? 'pending' : 'pending',
        amount: totals.total,
      });
    }
  } catch (err) {
    if (walletDebited > 0) {
      await User.updateOne({ _id: req.user._id }, { $inc: { walletBalance: walletDebited } });
    }
    throw err;
  }

  const io = req.app.get('io');
  if (io) {
    io.to('admin').emit('order:new', { orderId: order._id, orderNumber: order.orderNumber });
    await broadcastOrderOffers(io, order);
  }

  res.status(201).json({ success: true, order });
});

const myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .sort('-createdAt')
    .populate('deliveryPartner', 'name phone');
  res.json({ success: true, count: orders.length, orders });
});

const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('deliveryPartner', 'name phone avatar');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (
    req.user.role === 'customer' &&
    order.user._id.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Forbidden');
  }
  if (
    req.user.role === 'delivery' &&
    (!order.deliveryPartner || order.deliveryPartner._id.toString() !== req.user._id.toString())
  ) {
    res.status(403);
    throw new Error('Forbidden');
  }
  res.json({ success: true, order });
});

const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Forbidden');
  }
  if (['delivered', 'cancelled', 'refunded'].includes(order.status)) {
    res.status(400);
    throw new Error(`Cannot cancel an order in ${order.status} state`);
  }
  order.status = 'cancelled';
  order.cancelledAt = new Date();
  order.cancelReason = req.body.reason || 'Cancelled by user';
  order.timeline.push({ status: 'cancelled', note: order.cancelReason, by: req.user._id });

  const customerId = order.user._id || order.user;
  const notifyPartnerId = order.deliveryPartner;

  // Release rider so they can take new jobs; clear assignment on the order
  if (order.deliveryPartner) {
    await DeliveryPartner.updateOne(
      { user: order.deliveryPartner },
      { $set: { activeOrder: null, isAvailable: true } },
    );
    order.deliveryPartner = null;
  }

  // Refund to Dailyzo wallet for any prepaid order (wallet, UPI, Razorpay after capture). COD stays pending → no refund.
  const prepaidCaptured =
    order.paymentStatus === 'paid' && order.paymentMethod !== 'cod';

  if (prepaidCaptured) {
    await User.updateOne({ _id: customerId }, { $inc: { walletBalance: order.total } });
    order.paymentStatus = 'refunded';
    await Transaction.create({
      user: customerId,
      order: order._id,
      type: 'wallet_credit',
      method: 'wallet',
      status: 'success',
      amount: order.total,
      meta: { reason: 'order_cancelled', originalPaymentMethod: order.paymentMethod },
    });
  }

  await order.save();

  for (const i of order.items) {
    await Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity } });
  }

  const io = req.app.get('io');
  if (io) {
    withdrawOrderOffers(io, order._id, null);
    const payload = { orderId: order._id, status: 'cancelled' };
    io.to(`order:${order._id}`).emit('order:status', payload);
    if (notifyPartnerId) {
      io.to(`user:${notifyPartnerId}`).emit('order:status', payload);
    }
    io.to('admin').emit('order:status', payload);
  }

  const freshUser = await User.findById(customerId).select('-password');
  res.json({ success: true, order, user: freshUser });
});

const updateStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  if (!Order.ORDER_STATUSES.includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (['cancelled', 'delivered'].includes(order.status)) {
    res.status(400);
    throw new Error(`Cannot change status — order is already ${order.status}`);
  }
  order.status = status;
  if (status === 'delivered') {
    order.deliveredAt = new Date();
    order.paymentStatus = order.paymentMethod === 'cod' ? 'paid' : order.paymentStatus;
    if (order.deliveryPartner) {
      await DeliveryPartner.updateOne(
        { user: order.deliveryPartner },
        { $inc: { completedOrders: 1, earnings: 30 }, activeOrder: null, isAvailable: true },
      );
    }
  }
  order.timeline.push({ status, note, by: req.user._id });
  await order.save();

  const io = req.app.get('io');
  if (io) {
    io.to(`order:${order._id}`).emit('order:status', { orderId: order._id, status, note });
    io.to('admin').emit('order:status', { orderId: order._id, status });
  }
  res.json({ success: true, order });
});

const assignDelivery = asyncHandler(async (req, res) => {
  const { partnerUserId } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (['cancelled', 'delivered'].includes(order.status)) {
    res.status(400);
    throw new Error(`Cannot assign delivery — order is ${order.status}`);
  }
  const partner = await DeliveryPartner.findOne({ user: partnerUserId }).populate('user');
  if (!partner) {
    res.status(404);
    throw new Error('Delivery partner not found');
  }
  if (!partner.isAvailable) {
    res.status(409);
    throw new Error('Partner is currently not available');
  }
  order.deliveryPartner = partner.user._id;
  order.status = 'assigned';
  order.timeline.push({ status: 'assigned', note: `Assigned to ${partner.user.name}`, by: req.user._id });
  await order.save();

  partner.isAvailable = false;
  partner.isOnDuty = true;
  partner.activeOrder = order._id;
  await partner.save();

  const io = req.app.get('io');
  if (io) {
    withdrawOrderOffers(io, order._id, partner.user._id);
    io.to(`order:${order._id}`).emit('order:status', { orderId: order._id, status: 'assigned' });
    io.to(`user:${partner.user._id}`).emit('order:assigned', { orderId: order._id });
    io.to('admin').emit('order:status', { orderId: order._id, status: 'assigned' });
  }
  res.json({ success: true, order });
});

const acceptDeliveryOrder = asyncHandler(async (req, res) => {
  const partner = await DeliveryPartner.findOne({ user: req.user._id }).populate('user');
  if (!partner?.user) {
    res.status(404);
    throw new Error('Delivery profile not found');
  }
  if (!partner.isOnDuty) {
    res.status(400);
    throw new Error('Go on duty to accept orders');
  }
  if (partner.activeOrder) {
    res.status(409);
    throw new Error('Finish your active order before accepting another');
  }

  const orderId = req.params.id;
  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      deliveryPartner: null,
      status: { $in: ['pending', 'confirmed', 'packed'] },
    },
    {
      $set: {
        deliveryPartner: req.user._id,
        status: 'assigned',
      },
      $push: {
        timeline: {
          status: 'assigned',
          note: `Accepted by ${partner.user.name}`,
          by: req.user._id,
        },
      },
    },
    { new: true },
  ).populate('user', 'name phone');

  if (!order) {
    res.status(409);
    throw new Error('Order is no longer available');
  }

  partner.isAvailable = false;
  partner.isOnDuty = true;
  partner.activeOrder = order._id;
  await partner.save();

  const io = req.app.get('io');
  if (io) {
    withdrawOrderOffers(io, order._id, req.user._id);
    io.to(`order:${order._id}`).emit('order:status', { orderId: order._id, status: 'assigned' });
    io.to(`user:${req.user._id}`).emit('order:assigned', { orderId: order._id });
    io.to('admin').emit('order:status', { orderId: order._id, status: 'assigned' });
  }

  res.json({ success: true, order });
});

const adminListOrders = asyncHandler(async (req, res) => {
  const { status, q, from, to, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (q) filter.orderNumber = { $regex: q, $options: 'i' };
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit))
      .populate('user', 'name email phone')
      .populate('deliveryPartner', 'name phone'),
    Order.countDocuments(filter),
  ]);
  res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), orders });
});

const deliveryActiveOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    deliveryPartner: req.user._id,
    status: { $in: ['assigned', 'out_for_delivery'] },
  }).populate('user', 'name phone');
  res.json({ success: true, order });
});

const deliveryHistory = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    deliveryPartner: req.user._id,
    status: { $in: ['delivered', 'cancelled'] },
  })
    .sort('-deliveredAt')
    .limit(50);
  res.json({ success: true, orders });
});

module.exports = {
  checkout,
  myOrders,
  getOrder,
  cancelOrder,
  updateStatus,
  assignDelivery,
  acceptDeliveryOrder,
  adminListOrders,
  deliveryActiveOrder,
  deliveryHistory,
};
