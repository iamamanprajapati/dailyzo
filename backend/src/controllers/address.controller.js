const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const list = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, addresses: user.addresses });
});

const add = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (req.body.isDefault) user.addresses.forEach((a) => (a.isDefault = false));
  user.addresses.push(req.body);
  await user.save();
  res.status(201).json({ success: true, addresses: user.addresses });
});

const update = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const addr = user.addresses.id(req.params.id);
  if (!addr) {
    res.status(404);
    throw new Error('Address not found');
  }
  Object.assign(addr, req.body);
  if (req.body.isDefault) {
    user.addresses.forEach((a) => (a.isDefault = a._id.equals(addr._id)));
  }
  await user.save();
  res.json({ success: true, addresses: user.addresses });
});

const remove = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const addr = user.addresses.id(req.params.id);
  if (!addr) {
    res.status(404);
    throw new Error('Address not found');
  }
  addr.deleteOne();
  await user.save();
  res.json({ success: true, addresses: user.addresses });
});

module.exports = { list, add, update, remove };
