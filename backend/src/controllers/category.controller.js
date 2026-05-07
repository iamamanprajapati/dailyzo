const asyncHandler = require('express-async-handler');
const Category = require('../models/Category');
const slugify = require('../utils/slugify');

const list = asyncHandler(async (req, res) => {
  const { parent, isActive, q, all } = req.query;
  const filter = {};
  if (parent === 'null') filter.parent = null;
  else if (parent) filter.parent = parent;

  // By default, only return active categories (storefront / mobile app).
  // Admin dashboards opt out by passing `?all=true` (or explicit ?isActive=false).
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  } else if (all !== 'true') {
    filter.isActive = true;
  }

  if (q) filter.name = { $regex: q, $options: 'i' };

  const categories = await Category.find(filter).sort({ order: 1, name: 1 });
  res.json({ success: true, count: categories.length, categories });
});

const getOne = asyncHandler(async (req, res) => {
  const cat = await Category.findOne({
    $or: [{ _id: req.params.id }, { slug: req.params.id }],
  }).catch(() => Category.findOne({ slug: req.params.id }));
  if (!cat) {
    res.status(404);
    throw new Error('Category not found');
  }
  res.json({ success: true, category: cat });
});

const create = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) {
    res.status(400);
    throw new Error('name is required');
  }
  const payload = { ...req.body, slug: slugify(req.body.slug || name) };
  const cat = await Category.create(payload);
  res.status(201).json({ success: true, category: cat });
});

const update = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (updates.name && !updates.slug) updates.slug = slugify(updates.name);
  const cat = await Category.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!cat) {
    res.status(404);
    throw new Error('Category not found');
  }
  res.json({ success: true, category: cat });
});

const remove = asyncHandler(async (req, res) => {
  const cat = await Category.findByIdAndDelete(req.params.id);
  if (!cat) {
    res.status(404);
    throw new Error('Category not found');
  }
  res.json({ success: true, message: 'Category deleted' });
});

module.exports = { list, getOne, create, update, remove };
