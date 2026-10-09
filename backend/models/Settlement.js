const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
  },
  bookingAmount: {
    type: Number, // The amount the user actually paid
    required: true,
  },
  originalAmount: {
    type: Number, // The full original booking amount without membership discount
    required: true,
  },
  platformCommission: {
    type: Number, // e.g., 10%
    default: 0,
  },
  amountOwedToOwner: {
    type: Number, // The final amount the platform needs to pay the owner
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'settled'],
    default: 'pending',
  },
  settledAt: {
    type: Date,
  },
  settledBy: {
    type: mongoose.Schema.Types.ObjectId, // The admin who marked it settled
    ref: 'User',
  },
}, { timestamps: true });

module.exports = mongoose.model('Settlement', settlementSchema);
