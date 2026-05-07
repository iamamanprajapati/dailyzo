const mongoose = require('mongoose');

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'packed',
  'assigned',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'refunded',
];

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    image: { type: String },
    unit: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    mrp: { type: Number, required: true },
    lineTotal: { type: Number, required: true },
  },
  { _id: false },
);

const timelineEntrySchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    note: { type: String },
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [orderItemSchema],
    address: {
      label: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      landmark: String,
      location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] },
      },
    },
    subtotal: { type: Number, required: true },
    mrpTotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponCode: { type: String },
    couponDiscount: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    taxes: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['cod', 'upi', 'card', 'wallet', 'razorpay'],
      default: 'cod',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    timeline: [timelineEntrySchema],
    deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    deliveryEtaMins: { type: Number, default: 10 },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String },
    deliveryType: { type: String, enum: ['now', 'later'], default: 'now' },
    scheduledFor: { type: Date },
    notes: { type: String },
  },
  { timestamps: true },
);

orderSchema.statics.STATUSES = ORDER_STATUSES;

orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    this.orderNumber = `DZ-${ts}-${rand}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
