const mongoose = require('mongoose');

const deliveryPartnerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    vehicleType: { type: String, enum: ['bike', 'scooter', 'cycle', 'ev'], default: 'bike' },
    vehicleNumber: { type: String, trim: true },
    licenseNumber: { type: String, trim: true },
    aadharNumber: { type: String, trim: true },
    isAvailable: { type: Boolean, default: true, index: true },
    isOnDuty: { type: Boolean, default: false, index: true },
    currentLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    lastSeenAt: { type: Date, default: Date.now },
    rating: { type: Number, default: 5, min: 0, max: 5 },
    completedOrders: { type: Number, default: 0 },
    earnings: { type: Number, default: 0 },
    activeOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  },
  { timestamps: true },
);

deliveryPartnerSchema.index({ currentLocation: '2dsphere' });

module.exports = mongoose.model('DeliveryPartner', deliveryPartnerSchema);
