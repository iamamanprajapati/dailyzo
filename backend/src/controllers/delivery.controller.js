const asyncHandler = require('express-async-handler');
const DeliveryPartner = require('../models/DeliveryPartner');
const User = require('../models/User');
const Order = require('../models/Order');

const listPartners = asyncHandler(async (req, res) => {
  const partners = await DeliveryPartner.find().populate('user', 'name email phone avatar isActive');
  res.json({ success: true, count: partners.length, partners });
});

const createPartner = asyncHandler(async (req, res) => {
  const { name, email, phone, password, vehicleType, vehicleNumber, licenseNumber } = req.body;
  if (!name || !phone || !password) {
    res.status(400);
    throw new Error('name, phone and password are required');
  }
  const existing = await User.findOne({ phone });
  if (existing) {
    res.status(409);
    throw new Error('User with this phone already exists');
  }
  const user = await User.create({ name, email, phone, password, role: 'delivery' });
  const partner = await DeliveryPartner.create({
    user: user._id,
    vehicleType,
    vehicleNumber,
    licenseNumber,
  });
  res.status(201).json({ success: true, partner: await partner.populate('user', 'name email phone') });
});

const updatePartner = asyncHandler(async (req, res) => {
  const partner = await DeliveryPartner.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('user');
  if (!partner) {
    res.status(404);
    throw new Error('Partner not found');
  }
  res.json({ success: true, partner });
});

const deletePartner = asyncHandler(async (req, res) => {
  const partner = await DeliveryPartner.findById(req.params.id);
  if (!partner) {
    res.status(404);
    throw new Error('Partner not found');
  }
  await User.findByIdAndUpdate(partner.user, { isActive: false });
  await partner.deleteOne();
  res.json({ success: true, message: 'Partner deactivated' });
});

const updateLocation = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    res.status(400);
    throw new Error('lat and lng (numbers) required');
  }
  const partner = await DeliveryPartner.findOneAndUpdate(
    { user: req.user._id },
    {
      currentLocation: { type: 'Point', coordinates: [lng, lat] },
      lastSeenAt: new Date(),
    },
    { new: true, upsert: true },
  );

  const io = req.app.get('io');
  if (io && partner.activeOrder) {
    io.to(`order:${partner.activeOrder}`).emit('partner:location', {
      orderId: partner.activeOrder,
      partnerId: req.user._id,
      lat,
      lng,
      at: Date.now(),
    });
    io.to('admin').emit('partner:location', { partnerId: req.user._id, lat, lng });
  }

  res.json({ success: true, partner });
});

const setAvailability = asyncHandler(async (req, res) => {
  const { isAvailable, isOnDuty } = req.body;
  const partner = await DeliveryPartner.findOneAndUpdate(
    { user: req.user._id },
    { ...(typeof isAvailable === 'boolean' && { isAvailable }), ...(typeof isOnDuty === 'boolean' && { isOnDuty }) },
    { new: true, upsert: true },
  );
  res.json({ success: true, partner });
});

const myProfile = asyncHandler(async (req, res) => {
  const partner = await DeliveryPartner.findOne({ user: req.user._id }).populate('user');
  res.json({ success: true, partner });
});

const availablePartners = asyncHandler(async (req, res) => {
  const partners = await DeliveryPartner.find({ isAvailable: true })
    .populate('user', 'name phone avatar')
    .limit(50);
  res.json({ success: true, count: partners.length, partners });
});

module.exports = {
  listPartners,
  createPartner,
  updatePartner,
  deletePartner,
  updateLocation,
  setAvailability,
  myProfile,
  availablePartners,
};
