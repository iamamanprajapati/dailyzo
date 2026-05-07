const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: 'text' },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    brand: { type: String, trim: true },
    description: { type: String },
    images: [{ type: String }],
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    unit: { type: String, default: '1 pc' },
    weight: { type: String },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String, unique: true, sparse: true, index: true },
    tags: [{ type: String, lowercase: true, trim: true }],
    isVeg: { type: Boolean, default: true },
    isOrganic: { type: Boolean, default: false },
    isBestseller: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    deliveryEtaMins: { type: Number, default: 10 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productSchema.pre('save', function (next) {
  if (this.mrp > 0 && this.price >= 0) {
    this.discountPercent = Math.round(((this.mrp - this.price) / this.mrp) * 100);
  }
  next();
});

productSchema.index({ name: 'text', brand: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
