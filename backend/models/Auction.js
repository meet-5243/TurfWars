const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  bidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bidRate: {
    type: Number, // Bid rate per hour
    required: true,
  },
  totalAmount: {
    type: Number, // bidRate * hours
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const auctionSchema = new mongoose.Schema(
  {
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
      type: String, // 'YYYY-MM-DD'
      required: true,
    },
    startTime: {
      type: String, // 'HH:mm'
      required: true,
    },
    endTime: {
      type: String, // 'HH:mm'
      required: true,
    },
    durationHours: {
      type: Number,
      default: 1,
    },
    auctionType: {
      type: String,
      enum: ['FORWARD', 'REVERSE'],
      required: true, // FORWARD: Fri-Sun (bids >= base), REVERSE: Mon-Thu (bids <= base)
    },
    basePrice: {
      type: Number, // Base hourly price from turf
      required: true,
    },
    minBidIncrement: {
      type: Number,
      default: 50,
    },
    currentLeadingBid: {
      type: Number, // Total amount
      default: 0,
    },
    currentLeadingBidRate: {
      type: Number, // Per hour rate
      default: 0,
    },
    currentLeadingBidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    bids: [bidSchema],
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled', 'expired'],
      default: 'active',
    },
    startsAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    antiSnipingExtensions: {
      type: Number,
      default: 0,
    },
    winningBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

// Indexes for fast lookup of live arena rooms
auctionSchema.index({ status: 1, expiresAt: 1 });
auctionSchema.index({ turf: 1, date: 1, startTime: 1 });

module.exports = mongoose.model('Auction', auctionSchema);
