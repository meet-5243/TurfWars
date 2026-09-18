const mongoose = require('mongoose');

const turfPointTransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  points: { type: Number, required: true }, // positive for earn, negative for redeem
  transactionType: { 
    type: String, 
    enum: ['EARN', 'REDEEM', 'BONUS', 'EXPIRED', 'REFUND_REVERSAL', 'ADMIN_ADJUSTMENT'],
    required: true 
  },
  referenceType: { type: String, enum: ['BOOKING', 'REVIEW', 'BIRTHDAY', 'ADMIN', 'SYSTEM'] },
  referenceId: { type: mongoose.Schema.Types.ObjectId }, // e.g. booking ID
  description: { type: String },
  expiryDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('TurfPointTransaction', turfPointTransactionSchema);
