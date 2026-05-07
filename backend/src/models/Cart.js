const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    priceSnapshot: { type: Number, required: true },
    mrpSnapshot: { type: Number, required: true },
  },
  { _id: true, timestamps: true },
);

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    items: [cartItemSchema],
    couponCode: { type: String, default: null },
  },
  { timestamps: true },
);

cartSchema.virtual('subtotal').get(function () {
  return this.items.reduce((sum, i) => sum + i.priceSnapshot * i.quantity, 0);
});

cartSchema.virtual('mrpTotal').get(function () {
  return this.items.reduce((sum, i) => sum + i.mrpSnapshot * i.quantity, 0);
});

cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Cart', cartSchema);
