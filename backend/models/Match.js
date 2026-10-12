const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  title: {
    type: String, // e.g., "Looking for a 7v7 Cricket match"
    required: true
  },
  sport: {
    type: String,
    required: true,
    enum: ['cricket', 'football', 'tennis', 'badminton', 'basketball', 'volleyball']
  },
  teamA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true // The team issuing the challenge
  },
  teamB: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team', // The team accepting the challenge (null if it's an open board post)
    default: null
  },
  turf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Turf',
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  wager: {
    type: Number, // TurfPoints wagered
    default: 0
  },
  status: {
    type: String,
    enum: ['open', 'pending_acceptance', 'accepted', 'completed', 'cancelled'],
    default: 'open' // open = on the board, pending_acceptance = direct challenge issued, accepted = match is locked
  },
  // Split Payment Tracking
  bookingAmount: {
    type: Number,
    required: true
  },
  teamAPaid: {
    type: Boolean,
    default: false
  },
  teamBPaid: {
    type: Boolean,
    default: false
  },
  // Results
  result: {
    teamAScore: { type: Number, default: null },
    teamBScore: { type: Number, default: null },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    isVerified: { type: Boolean, default: false } // Becomes true when both captains agree on score
  }
}, { timestamps: true });

module.exports = mongoose.model('Match', matchSchema);
