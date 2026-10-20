const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  type: {
    type: String,
    enum: ['BOOKING', 'MEMBERSHIP'],
    default: 'BOOKING',
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
  },
  membership: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserMembership',
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MembershipPlan',
  },
  turf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Turf',
  },
  bookingAmount: {
    type: Number, // The amount the user actually paid
    required: true,
  },
  originalAmount: {
    type: Number, // The full original booking or membership amount
    required: true,
  },
  platformCommission: {
    type: Number, // e.g., 5% on bookings, 0% on memberships
    default: 0,
  },
  amountOwedToOwner: {
    type: Number, // The final amount the platform needs to pay the owner (95% for bookings, 100% for memberships)
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'pending_monthly_payout', 'settled'],
    default: 'pending',
  },
  matureAt: {
    type: Date, // Scheduled date for monthly membership payout release
  },
  settledAt: {
    type: Date,
  },
  settledBy: {
    type: mongoose.Schema.Types.ObjectId, // The admin or system who marked it settled
    ref: 'User',
  },
  payoutNotes: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('Settlement', settlementSchema);
