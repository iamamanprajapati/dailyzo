const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Category = require('../models/Category');
const slugify = require('../utils/slugify');

const list = asyncHandler(async (req, res) => {
  const {
    q,
    category,
    subcategory,
    minPrice,
    maxPrice,
    isVeg,
    isOrganic,
    isBestseller,
    isFeatured,
    page = 1,
    limit = 24,
    sort = '-createdAt',
    all,
    inStock,
  } = req.query;

  // Default = storefront view (only active products + only products in active categories).
  // Admin dashboards pass ?all=true to see disabled products and products in inactive categories.
  const isAdminView = all === 'true';

  const filter = {};
  if (!isAdminView) filter.isActive = true;
  if (q) filter.$text = { $search: q };
  if (subcategory) filter.subcategory = subcategory;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (isVeg !== undefined) filter.isVeg = isVeg === 'true';
  if (isOrganic !== undefined) filter.isOrganic = isOrganic === 'true';
  if (isBestseller !== undefined) filter.isBestseller = isBestseller === 'true';
  if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';
  if (inStock === 'true') filter.stock = { $gt: 0 };

  if (category) {
    filter.category = category;
  } else if (!isAdminView) {
    // Hide products belonging to inactive categories from the storefront.
    const activeCategoryIds = await Category.find({ isActive: true }).distinct('_id');
    filter.category = { $in: activeCategoryIds };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Product.find(filter).populate('category', 'name slug isActive').sort(sort).skip(skip).limit(Number(limit)),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    page: Number(page),
    limit: Number(limit),
    total,
    pages: Math.ceil(total / Number(limit)),
    products: items,
  });
});

const getOne = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
  const product = await Product.findOne(
    isObjectId ? { $or: [{ _id: id }, { slug: id }] } : { slug: id },
  ).populate('category', 'name slug');
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ success: true, product });
});

const create = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (!body.slug && body.name) body.slug = slugify(body.name);
  const product = await Product.create(body);
  res.status(201).json({ success: true, product });
});

const update = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (updates.name && !updates.slug) updates.slug = slugify(updates.name);
  const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ success: true, product });
});

const remove = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ success: true, message: 'Product deleted' });
});

const updateStock = asyncHandler(async (req, res) => {
  const { delta, set } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  if (typeof set === 'number') product.stock = Math.max(0, set);
  else if (typeof delta === 'number') product.stock = Math.max(0, product.stock + delta);
  await product.save();
  res.json({ success: true, product });
});

module.exports = { list, getOne, create, update, remove, updateStock };
