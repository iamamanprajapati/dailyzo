const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

const apiLimiter = rateLimit({ windowMs: 60_000, max: 300, standardHeaders: true, legacyHeaders: false });
app.use('/api', apiLimiter);

app.get('/', (req, res) => {
  res.json({ name: 'Dailyzo API', version: '1.0.0', status: 'ok', env: env.NODE_ENV });
});
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/cart', require('./routes/cart.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/addresses', require('./routes/address.routes'));
app.use('/api/delivery', require('./routes/delivery.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/coupons', require('./routes/coupon.routes'));
app.use('/api/uploads', require('./routes/upload.routes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
