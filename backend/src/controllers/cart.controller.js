const asyncHandler = require('express-async-handler');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
    cart = await Cart.findById(cart._id).populate('items.product');
  }
  return cart;
}

const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  res.json({ success: true, cart });
});

const addItem = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  if (!productId) {
    res.status(400);
    throw new Error('productId is required');
  }
  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    res.status(404);
    throw new Error('Product not available');
  }

  const cart = await getOrCreateCart(req.user._id);
  const existing = cart.items.find((i) => i.product._id.toString() === productId);
  const desiredQty = (existing ? existing.quantity : 0) + Number(quantity);

  if (product.stock <= 0) {
    res.status(400);
    throw new Error('This item is sold out');
  }
  if (desiredQty > product.stock) {
    res.status(400);
    throw new Error(`Only ${product.stock} left in stock`);
  }

  if (existing) {
    existing.quantity = desiredQty;
  } else {
    cart.items.push({
      product: product._id,
      quantity: Number(quantity),
      priceSnapshot: product.price,
      mrpSnapshot: product.mrp,
    });
  }
  await cart.save();
  const fresh = await Cart.findById(cart._id).populate('items.product');
  res.json({ success: true, cart: fresh });
});

const updateItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find((i) => i.product._id.toString() === productId);
  if (!item) {
    res.status(404);
    throw new Error('Item not in cart');
  }
  if (quantity <= 0) {
    cart.items = cart.items.filter((i) => i.product._id.toString() !== productId);
  } else {
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      res.status(404);
      throw new Error('Product not available');
    }
    if (product.stock <= 0) {
      res.status(400);
      throw new Error('This item is sold out');
    }
    if (Number(quantity) > product.stock) {
      res.status(400);
      throw new Error(`Only ${product.stock} left in stock`);
    }
    item.quantity = Number(quantity);
  }
  await cart.save();
  const fresh = await Cart.findById(cart._id).populate('items.product');
  res.json({ success: true, cart: fresh });
});

const removeItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = cart.items.filter((i) => i.product._id.toString() !== req.params.productId);
  await cart.save();
  const fresh = await Cart.findById(cart._id).populate('items.product');
  res.json({ success: true, cart: fresh });
});

const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  cart.couponCode = null;
  await cart.save();
  res.json({ success: true, cart });
});

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
