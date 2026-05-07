const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

const dashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const today = startOfDay(now);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 29);

  const [
    todayOrders,
    weekOrders,
    monthOrders,
    totalOrders,
    pendingOrders,
    activeOrders,
    todayRevenueAgg,
    monthRevenueAgg,
    totalRevenueAgg,
    customers,
    deliveryPartners,
    lowStock,
    revenueSeries,
    statusBreakdown,
    topProducts,
  ] = await Promise.all([
    Order.countDocuments({ createdAt: { $gte: today } }),
    Order.countDocuments({ createdAt: { $gte: weekAgo } }),
    Order.countDocuments({ createdAt: { $gte: monthAgo } }),
    Order.countDocuments({}),
    Order.countDocuments({ status: 'pending' }),
    Order.countDocuments({ status: { $in: ['confirmed', 'packed', 'assigned', 'out_for_delivery'] } }),
    Order.aggregate([
      { $match: { createdAt: { $gte: today }, paymentStatus: 'paid' } },
      { $group: { _id: null, sum: { $sum: '$total' } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: monthAgo }, paymentStatus: 'paid' } },
      { $group: { _id: null, sum: { $sum: '$total' } } },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, sum: { $sum: '$total' } } },
    ]),
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'delivery' }),
    Product.find({ stock: { $lte: 5 }, isActive: true }).select('name stock unit images').limit(10),
    Order.aggregate([
      { $match: { createdAt: { $gte: monthAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$total', 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          image: { $first: '$items.image' },
          unitsSold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.lineTotal' },
        },
      },
      { $sort: { unitsSold: -1 } },
      { $limit: 10 },
    ]),
  ]);

  res.json({
    success: true,
    kpis: {
      todayOrders,
      weekOrders,
      monthOrders,
      totalOrders,
      pendingOrders,
      activeOrders,
      todayRevenue: todayRevenueAgg[0]?.sum || 0,
      monthRevenue: monthRevenueAgg[0]?.sum || 0,
      totalRevenue: totalRevenueAgg[0]?.sum || 0,
      customers,
      deliveryPartners,
    },
    lowStock,
    revenueSeries,
    statusBreakdown,
    topProducts,
  });
});

const customers = asyncHandler(async (req, res) => {
  const list = await User.find({ role: 'customer' }).sort('-createdAt').limit(500);
  res.json({ success: true, count: list.length, customers: list });
});

const recentTransactions = asyncHandler(async (req, res) => {
  const txns = await Transaction.find()
    .sort('-createdAt')
    .limit(50)
    .populate('user', 'name email')
    .populate('order', 'orderNumber total');
  res.json({ success: true, count: txns.length, transactions: txns });
});

module.exports = { dashboard, customers, recentTransactions };
