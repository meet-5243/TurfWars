const mongoose = require('mongoose');

const membershipPlanBenefitSchema = new mongoose.Schema({
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipPlan', required: true },
  benefit: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipBenefit', required: true },
  value: { type: mongoose.Schema.Types.Mixed }, // Can be boolean, number, string depending on benefit type
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('MembershipPlanBenefit', membershipPlanBenefitSchema);
