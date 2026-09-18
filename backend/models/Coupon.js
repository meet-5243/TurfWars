const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  membership: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMembership' },
  couponCode: { type: String, required: true, unique: true },
  discountType: { type: String, enum: ['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_BOOKING'], required: true },
  discountValue: { type: Number, required: true },
  maxDiscount: { type: Number },
  minimumBookingAmount: { type: Number, default: 0 },
  validFrom: { type: Date, required: true, default: Date.now },
  validUntil: { type: Date, required: true },
  usageLimit: { type: Number, default: 1 },
  usedCount: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'used', 'expired', 'revoked'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
