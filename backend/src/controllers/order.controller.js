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

  const order = await Order.create({
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
    paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
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

  await Transaction.create({
    user: req.user._id,
    order: order._id,
    type: 'payment',
    method: paymentMethod,
    status: paymentMethod === 'cod' ? 'pending' : 'pending',
    amount: totals.total,
  });

  const io = req.app.get('io');
  if (io) io.to('admin').emit('order:new', { orderId: order._id, orderNumber: order.orderNumber });

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
  await order.save();

  for (const i of order.items) {
    await Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity } });
  }

  const io = req.app.get('io');
  if (io) {
    io.to(`order:${order._id}`).emit('order:status', { orderId: order._id, status: 'cancelled' });
    io.to('admin').emit('order:status', { orderId: order._id, status: 'cancelled' });
  }
  res.json({ success: true, order });
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
    io.to(`order:${order._id}`).emit('order:status', { orderId: order._id, status: 'assigned' });
    io.to(`user:${partner.user._id}`).emit('order:assigned', { orderId: order._id });
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
  adminListOrders,
  deliveryActiveOrder,
  deliveryHistory,
};
