const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    turf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Turf',
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String, // format YYYY-MM-DD
      required: [true, 'Please provide booking date (YYYY-MM-DD)'],
    },
    startTime: {
      type: String, // format HH:MM
      required: [true, 'Please provide start time (HH:MM)'],
    },
    endTime: {
      type: String, // format HH:MM
      required: [true, 'Please provide end time (HH:MM)'],
    },
    amount: {
      type: Number,
      required: true,
    },
    bookingStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'rejected'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid'],
      default: 'unpaid',
    },
    isBid: {
      type: Boolean,
      default: false,
    },
    bidAmount: {
      type: Number,
      default: 0,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    isAutoSelected: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
