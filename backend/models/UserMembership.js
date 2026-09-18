const mongoose = require('mongoose');

const userMembershipSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipPlan', required: true },
  startDate: { type: Date, required: true, default: Date.now },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'expired', 'cancelled', 'pending', 'upgraded', 'downgraded'], default: 'active' },
  autoRenew: { type: Boolean, default: false },
  purchaseAmount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('UserMembership', userMembershipSchema);
