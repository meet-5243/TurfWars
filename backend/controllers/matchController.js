const Match = require('../models/Match');
const Team = require('../models/Team');
const Turf = require('../models/Turf');

// @desc    Create an Open Challenge
// @route   POST /api/matches/challenge
// @access  Private (Captain only)
const createOpenChallenge = async (req, res) => {
  try {
    const { title, teamAId, turfId, date, startTime, endTime, wager } = req.body;

    // Verify Team A exists and user is captain
    const team = await Team.findById(teamAId);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    if (team.captain.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the team captain can issue challenges.' });
    }

    // Get turf details to calculate booking amount
    const turf = await Turf.findById(turfId);
    if (!turf) return res.status(404).json({ success: false, message: 'Turf not found' });

    // Calculate hours (simplified)
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const hours = (endH + endM/60) - (startH + startM/60);
    const bookingAmount = hours * turf.pricePerHour;

    const match = await Match.create({
      title,
      sport: team.sport,
      teamA: team._id,
      turf: turf._id,
      date,
      startTime,
      endTime,
      wager: wager || 0,
      bookingAmount,
      status: 'open'
    });

    res.status(201).json({ success: true, data: match });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all open challenges on the board
// @route   GET /api/matches/board
// @access  Public
const getOpenChallenges = async (req, res) => {
  try {
    const matches = await Match.find({ status: 'open' })
      .populate('teamA', 'name logo stats rating')
      .populate('turf', 'name location pricePerHour')
      .sort('date startTime');

    res.status(200).json({ success: true, data: matches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Accept an open challenge
// @route   POST /api/matches/:id/accept
// @access  Private (Captain only)
const acceptChallenge = async (req, res) => {
  try {
    const { teamBId } = req.body;
    const matchId = req.params.id;

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    if (match.status !== 'open') return res.status(400).json({ success: false, message: 'This challenge is no longer open.' });

    // Verify Team B exists and user is captain
    const teamB = await Team.findById(teamBId);
    if (!teamB) return res.status(404).json({ success: false, message: 'Your team was not found.' });
    if (teamB.captain.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the team captain can accept challenges.' });
    }

    // Cannot challenge yourself
    if (match.teamA.toString() === teamB._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot accept your own team\'s challenge.' });
    }

    // Accept it
    match.teamB = teamB._id;
    match.status = 'accepted';
    await match.save();

    res.status(200).json({ success: true, message: 'Challenge Accepted! Prepare for battle.', data: match });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Matches for a specific team
// @route   GET /api/matches/team/:teamId
// @access  Private
const getTeamMatches = async (req, res) => {
  try {
    const matches = await Match.find({
      $or: [{ teamA: req.params.teamId }, { teamB: req.params.teamId }]
    })
    .populate('teamA', 'name logo')
    .populate('teamB', 'name logo')
    .populate('turf', 'name location')
    .sort('-createdAt');

    res.status(200).json({ success: true, data: matches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_SsI2LJqhZvVWVM',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'IQhLNh0Zi3dwQ0wmQoNOmtdP'
});

// @desc    Create Razorpay Order for Split Payment
const createSplitOrder = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    
    // Half amount in paise
    const halfAmountPaise = (match.bookingAmount / 2) * 100;

    const options = {
      amount: halfAmountPaise,
      currency: 'INR',
      receipt: `match_${match._id.toString().substring(0, 8)}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Razorpay Split Payment
const verifySplitPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, teamId } = req.body;
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET || 'IQhLNh0Zi3dwQ0wmQoNOmtdP';
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Mark who paid
    if (match.teamA.toString() === teamId) match.teamAPaid = true;
    if (match.teamB.toString() === teamId) match.teamBPaid = true;

    await match.save();

    // If BOTH paid, lock the turf slot by creating a confirmed booking!
    if (match.teamAPaid && match.teamBPaid) {
      const turf = await Turf.findById(match.turf);
      
      const newBooking = await Booking.create({
        user: req.user._id, // User who made the final payment (can be either captain)
        turf: match.turf,
        owner: turf.owner,
        date: match.date,
        startTime: match.startTime,
        endTime: match.endTime,
        amount: match.bookingAmount,
        bookingStatus: 'confirmed',
        paymentStatus: 'paid',
        paymentId: razorpay_payment_id,
        isBid: false
      });

      // Reject all other overlapping pending bookings/bids
      await Booking.updateMany(
        {
          _id: { $ne: newBooking._id },
          turf: match.turf,
          date: match.date,
          bookingStatus: 'pending',
          startTime: { $lt: match.endTime },
          endTime: { $gt: match.startTime },
        },
        { bookingStatus: 'rejected' }
      );
    }

    res.status(200).json({ success: true, message: 'Payment successful!', match });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOpenChallenge,
  getOpenChallenges,
  acceptChallenge,
  getTeamMatches,
  createSplitOrder,
  verifySplitPayment
};
