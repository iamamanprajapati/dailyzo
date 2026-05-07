const asyncHandler = require('express-async-handler');
const Coupon = require('../models/Coupon');

const list = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort('-createdAt');
  res.json({ success: true, coupons });
});

const create = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create({ ...req.body, code: (req.body.code || '').toUpperCase() });
  res.status(201).json({ success: true, coupon });
});

const update = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (updates.code) updates.code = updates.code.toUpperCase();
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, updates, { new: true });
  res.json({ success: true, coupon });
});

const remove = asyncHandler(async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

/** Active coupons for logged-in customers (mobile app). */
const listAvailable = asyncHandler(async (req, res) => {
  const now = Date.now();
  const raw = await Coupon.find({ isActive: true })
    .sort('-createdAt')
    .select('code description type value minOrderValue maxDiscount validFrom validTill')
    .lean();

  const coupons = raw.filter((c) => {
    if (c.validFrom && new Date(c.validFrom).getTime() > now) return false;
    if (c.validTill && new Date(c.validTill).getTime() < now) return false;
    return true;
  });

  res.json({ success: true, coupons });
});

const validate = asyncHandler(async (req, res) => {
  const { code, subtotal = 0 } = req.body;
  const coupon = await Coupon.findOne({ code: (code || '').toUpperCase(), isActive: true });
  if (!coupon) {
    res.status(404);
    throw new Error('Invalid coupon');
  }
  if (coupon.validTill && new Date() > coupon.validTill) {
    res.status(400);
    throw new Error('Coupon expired');
  }
  if (subtotal < coupon.minOrderValue) {
    res.status(400);
    throw new Error(`Minimum order ₹${coupon.minOrderValue} required`);
  }
  let discount = coupon.type === 'flat' ? coupon.value : Math.round((subtotal * coupon.value) / 100);
  if (coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
  res.json({ success: true, coupon, discount });
});

module.exports = { list, listAvailable, create, update, remove, validate };
