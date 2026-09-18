const mongoose = require('mongoose');

const membershipPlanSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Bronze, Silver, Gold, etc.
  description: { type: String },
  price: { type: Number, required: true, default: 0 },
  durationDays: { type: Number, required: true, default: 90 }, // Default 3 months
  bookingDiscountPercent: { type: Number, default: 0 },
  pointsMultiplier: { type: Number, default: 1 },
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

module.exports = mongoose.model('MembershipPlan', membershipPlanSchema);
