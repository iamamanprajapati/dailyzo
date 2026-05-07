const env = require('../config/env');

let _client = null;

function getClient() {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) return null;
  if (_client) return _client;
  try {
    const Razorpay = require('razorpay');
    _client = new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
    return _client;
  } catch (err) {
    console.warn('[razorpay] SDK not installed yet — falling back to mock mode');
    return null;
  }
}

async function createOrder({ amount, currency = 'INR', receipt, notes }) {
  const client = getClient();
  if (!client) {
    return {
      id: `order_mock_${Date.now()}`,
      amount: Math.round(amount * 100),
      currency,
      receipt,
      mock: true,
    };
  }
  return client.orders.create({
    amount: Math.round(amount * 100),
    currency,
    receipt,
    notes,
  });
}

module.exports = { getClient, createOrder };
