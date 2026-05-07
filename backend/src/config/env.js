require('dotenv').config();

const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dailyzo',
  JWT_SECRET: process.env.JWT_SECRET || 'dailyzo_dev_secret_change_me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dailyzo_dev_refresh_secret_change_me',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@dailyzo.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin@123',
  ADMIN_NAME: process.env.ADMIN_NAME || 'Super Admin',
};

module.exports = env;
