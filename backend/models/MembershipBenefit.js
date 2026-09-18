const mongoose = require('mongoose');

const membershipBenefitSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true }, // e.g., 'EARLY_SLOT_ACCESS'
  description: { type: String },
  benefitType: { type: String }, // 'discount', 'access', 'limit'
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('MembershipBenefit', membershipBenefitSchema);
