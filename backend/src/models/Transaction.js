const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', index: true },
    type: { type: String, enum: ['payment', 'refund', 'wallet_credit', 'wallet_debit'], required: true },
    method: { type: String, enum: ['cod', 'upi', 'card', 'wallet', 'razorpay'], default: 'cod' },
    status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending', index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    gatewayOrderId: { type: String },
    gatewayPaymentId: { type: String },
    gatewaySignature: { type: String },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Transaction', transactionSchema);
