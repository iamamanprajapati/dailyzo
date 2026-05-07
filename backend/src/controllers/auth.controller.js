const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const DeliveryPartner = require('../models/DeliveryPartner');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');

function tokensFor(user) {
  const payload = { id: user._id.toString(), role: user.role };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role = 'customer' } = req.body;

  if (!name || (!email && !phone) || !password) {
    res.status(400);
    throw new Error('name, password and one of email/phone are required');
  }
  if (!['customer', 'delivery'].includes(role)) {
    res.status(400);
    throw new Error('role must be customer or delivery for self-registration');
  }

  const existing = await User.findOne({ $or: [{ email }, { phone }].filter((q) => Object.values(q)[0]) });
  if (existing) {
    res.status(409);
    throw new Error('User already exists with this email/phone');
  }

  const user = await User.create({ name, email, phone, password, role });

  if (role === 'delivery') {
    await DeliveryPartner.create({ user: user._id });
  }

  res.status(201).json({ success: true, user, ...tokensFor(user) });
});

const login = asyncHandler(async (req, res) => {
  const { email, phone, password } = req.body;
  if ((!email && !phone) || !password) {
    res.status(400);
    throw new Error('email/phone and password are required');
  }
  const query = email ? { email: email.toLowerCase() } : { phone };
  const user = await User.findOne(query).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid credentials');
  }
  if (!user.isActive) {
    res.status(403);
    throw new Error('Account is disabled');
  }

  user.lastLoginAt = new Date();
  await user.save();

  res.json({ success: true, user, ...tokensFor(user) });
});

const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase(), role: 'admin' }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid admin credentials');
  }
  user.lastLoginAt = new Date();
  await user.save();
  res.json({ success: true, user, ...tokensFor(user) });
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400);
    throw new Error('refreshToken required');
  }
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    res.status(401);
    throw new Error('Invalid refresh token');
  }
  const user = await User.findById(decoded.id);
  if (!user) {
    res.status(401);
    throw new Error('User not found');
  }
  res.json({ success: true, ...tokensFor(user) });
});

// Mock OTP — useful for the mobile app flow without an SMS provider
const sendOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    res.status(400);
    throw new Error('phone required');
  }
  res.json({ success: true, message: 'OTP sent (mock)', otp: '123456' });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { phone, otp, name } = req.body;
  if (!phone || !otp) {
    res.status(400);
    throw new Error('phone and otp required');
  }
  if (otp !== '123456') {
    res.status(401);
    throw new Error('Invalid OTP');
  }
  let user = await User.findOne({ phone });
  if (!user) {
    user = await User.create({ phone, name: name || `User-${phone.slice(-4)}`, role: 'customer' });
  }
  user.lastLoginAt = new Date();
  await user.save();
  res.json({ success: true, user, ...tokensFor(user) });
});

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = { register, login, adminLogin, refresh, sendOtp, verifyOtp, me };
