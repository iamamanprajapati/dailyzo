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
  const filter = req.user.role === 'admin' ? {} : { user: req.user._id };
  const txns = await Transaction.find(filter).sort('-createdAt').limit(200).populate('user', 'name email');
  res.json({ success: true, count: txns.length, transactions: txns });
});

module.exports = { createPaymentOrder, verifyPayment, listTransactions };
