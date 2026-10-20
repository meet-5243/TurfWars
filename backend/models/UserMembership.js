const mongoose = require('mongoose');

const userMembershipSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  turf: { type: mongoose.Schema.Types.ObjectId, ref: 'Turf', default: null },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipPlan', required: true },

  startDate: { type: Date, required: true, default: Date.now },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'expired', 'cancelled', 'pending', 'upgraded', 'downgraded'], default: 'active' },
  autoRenew: { type: Boolean, default: false },
  purchaseAmount: { type: Number, default: 0 }
}, { timestamps: true });

// Index for rapid lookup of active membership for a specific user and turf
userMembershipSchema.index({ user: 1, turf: 1, status: 1 });

module.exports = mongoose.model('UserMembership', userMembershipSchema);

