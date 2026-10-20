const mongoose = require('mongoose');

const membershipPlanSchema = new mongoose.Schema({
  turf: { type: mongoose.Schema.Types.ObjectId, ref: 'Turf', default: null },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  name: { type: String, required: true, trim: true }, // Bronze, Silver, Gold, Monthly Pass, etc.
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  durationDays: { type: Number, required: true, default: 30 }, // Default 1 month / 30 days
  bookingDiscountPercent: { type: Number, default: 10, min: 0, max: 100 },
  pointsMultiplier: { type: Number, default: 1, min: 1 },
  monthlyCouponLimit: { type: Number, default: 0 },
  matchmakingPriority: { type: Number, default: 1 },
  freeBookingLimit: { type: Number, default: 0 },
  freeBookingMaxValue: { type: Number, default: 0 },
  tournamentDiscountPercent: { type: Number, default: 0 },
  auctionAccess: { type: Boolean, default: false },
  earlySlotAccess: { type: Boolean, default: false },
  recurringBookingAccess: { type: Boolean, default: false },
  teamBenefits: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

// Compound index so a turf cannot have duplicate plan names, but different turfs can share names like "Gold"
membershipPlanSchema.index({ turf: 1, name: 1 }, { unique: true, sparse: true });


module.exports = mongoose.model('MembershipPlan', membershipPlanSchema);

