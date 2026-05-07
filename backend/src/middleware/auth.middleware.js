const asyncHandler = require('express-async-handler');
const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    res.status(401);
    throw new Error('Not authorized — token missing');
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    res.status(401);
    throw new Error('Not authorized — invalid or expired token');
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    res.status(401);
    throw new Error('Not authorized — user not found or disabled');
  }

  req.user = user;
  next();
});

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    res.status(403);
    throw new Error(`Forbidden — requires role: ${roles.join(', ')}`);
  }
  next();
};

module.exports = { protect, authorize };
