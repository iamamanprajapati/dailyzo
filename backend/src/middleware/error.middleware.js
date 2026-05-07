const env = require('../config/env');

function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Not found — ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) {
  let status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Server error';

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    status = 404;
    message = 'Resource not found';
  }
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value for ${field}`;
  }
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }

  res.status(status).json({
    success: false,
    message,
    stack: env.NODE_ENV === 'production' ? undefined : err.stack,
  });
}

module.exports = { notFound, errorHandler };
