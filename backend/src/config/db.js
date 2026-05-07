const mongoose = require('mongoose');
const env = require('./env');

async function connectDB() {
  mongoose.set('strictQuery', true);
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 10_000,
    });
    console.log(`[mongo] connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error('[mongo] connection error:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
