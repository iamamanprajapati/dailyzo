const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const env = require('../config/env');
const razorpayService = require('../services/razorpay');

// Uses the real Razorpay SDK when keys are configured;
// otherwise transparently falls back to a mock order_id so the UI flow still works.
const createPaymentOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Forbidden');
  }
  if (['cancelled', 'delivered'].includes(order.status)) {
    res.status(400);
    throw new Error('Cannot pay for this order');
  }

  const rzpOrder = await razorpayService.createOrder({
    amount: order.total,
    currency: 'INR',
    receipt: order.orderNumber,
    notes: { userId: req.user._id.toString(), orderNumber: order.orderNumber },
  });

  order.razorpayOrderId = rzpOrder.id;
  await order.save();

  res.json({
    success: true,
    keyId: env.RAZORPAY_KEY_ID || 'rzp_test_mock',
    gatewayOrderId: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
    orderId: order._id,
    mock: !!rzpOrder.mock,
  });
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, gatewayOrderId, paymentId, signature } = req.body;
  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (['cancelled', 'delivered'].includes(order.status)) {
    res.status(400);
    throw new Error('This order cannot be paid anymore');
  }

  let valid = true;
  if (env.RAZORPAY_KEY_SECRET && signature) {
    const expected = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${gatewayOrderId}|${paymentId}`)
      .digest('hex');
    valid = expected === signature;
  }
  if (!valid) {
    res.status(400);
    throw new Error('Payment signature verification failed');
  }

  order.paymentStatus = 'paid';
  order.razorpayPaymentId = paymentId;
  order.status = order.status === 'pending' ? 'confirmed' : order.status;
  order.timeline.push({ status: order.status, note: 'Payment received', by: req.user._id });
  await order.save();

  await Transaction.create({
    user: req.user._id,
    order: order._id,
    type: 'payment',
    method: order.paymentMethod,
    status: 'success',
    amount: order.total,
    gatewayOrderId,
    gatewayPaymentId: paymentId,
    gatewaySignature: signature,
  });

  const io = req.app.get('io');
  if (io) io.to('admin').emit('order:paid', { orderId: order._id });

  res.json({ success: true, order });
});

const listTransactions = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const walletOnly = req.query.wallet === 'true' || req.query.wallet === '1';

  let filter;
  if (walletOnly) {
    filter = {
      type: { $in: ['wallet_debit', 'wallet_credit'] },
      ...(isAdmin ? {} : { user: req.user._id }),
    };
  } else {
    filter = isAdmin ? {} : { user: req.user._id };
  }

  const limit = walletOnly ? 80 : 200;
  let q = Transaction.find(filter).sort('-createdAt').limit(limit).populate('order', 'orderNumber status total paymentMethod');
  if (isAdmin) q = q.populate('user', 'name email');
  const txns = await q;
  res.json({ success: true, count: txns.length, transactions: txns });
});

module.exports = { createPaymentOrder, verifyPayment, listTransactions };
