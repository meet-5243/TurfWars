const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const Settlement = require('../models/Settlement');
const UserMembership = require('../models/UserMembership');
const MembershipPlan = require('../models/MembershipPlan');
const Wallet = require('../models/Wallet');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_SsI2LJqhZvVWVM',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'IQhLNh0Zi3dwQ0wmQoNOmtdP',
});

// @desc    Create Razorpay Order for a Booking
// @route   POST /api/payments/create-booking-order
// @access  Private
const createBookingOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Booking is already paid' });
    }

    const amountInPaise = Math.round(booking.amount * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_booking_${booking._id}`,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Razorpay Payment Signature for Booking
// @route   POST /api/payments/verify-payment
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET || 'IQhLNh0Zi3dwQ0wmQoNOmtdP';

    // Create expected signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const expectedSignature = hmac.digest('hex');

    if (expectedSignature === razorpay_signature) {
      // Payment is verified
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }

      booking.paymentStatus = 'paid';
      booking.bookingStatus = 'confirmed'; // Auto confirm on successful payment
      await booking.save();

      // Create a settlement record for the turf owner (5% platform fee, 95% to owner)
      const platformCommissionPercent = 5;
      const commissionAmount = (booking.originalAmount * platformCommissionPercent) / 100;
      const amountOwed = booking.originalAmount - commissionAmount;

      await Settlement.create({
        owner: booking.owner,
        booking: booking._id,
        bookingAmount: booking.amount,
        originalAmount: booking.originalAmount,
        platformCommission: commissionAmount,
        amountOwedToOwner: amountOwed,
      });

      // Reject all other overlapping pending bookings
      await Booking.updateMany(
        {
          _id: { $ne: booking._id },
          turf: booking.turf,
          date: booking.date,
          bookingStatus: 'pending',
          startTime: { $lt: booking.endTime },
          endTime: { $gt: booking.startTime },
        },
        {
          bookingStatus: 'rejected',
        }
      );

      // --- AWARD TURFPOINTS ---
      let activeMembership = await UserMembership.findOne({
        user: booking.user,
        turf: booking.turf,
        status: 'active',
      }).populate('plan');

      if (!activeMembership) {
        activeMembership = await UserMembership.findOne({
          user: booking.user,
          turf: null,
          status: 'active',
        }).populate('plan');
      }


      let multiplier = 1;
      if (activeMembership && activeMembership.plan) {
        multiplier = activeMembership.plan.pointsMultiplier || 1;
      }

      const basePoints = Math.floor(booking.amount / 100);
      const earnedPoints = basePoints * multiplier;

      if (earnedPoints > 0) {
        const TurfPointTransaction = require('../models/TurfPointTransaction');
        const existingTx = await TurfPointTransaction.findOne({ referenceId: booking._id, transactionType: 'EARN' });
        if (!existingTx) {
          await TurfPointTransaction.create({
            user: booking.user,
            points: earnedPoints,
            transactionType: 'EARN',
            referenceType: 'BOOKING',
            referenceId: booking._id,
            description: `Earned points for booking ${booking._id}`,
          });
        }
      }
      // --- AWARD TURFPOINTS END ---

      res.status(200).json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Pay a booking using wallet balance
// @route   POST /api/payments/pay-booking-from-wallet
// @access  Private
const payBookingFromWallet = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking || booking.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Booking is already paid' });
    }

    // Find or create wallet
    let wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ user: req.user._id, balance: 0, transactions: [] });
    }

    if (wallet.balance < booking.amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance. Please top up your wallet or pay via Razorpay.',
      });
    }

    // Deduct from wallet
    wallet.balance -= booking.amount;
    wallet.transactions.push({
      type: 'DEBIT',
      amount: booking.amount,
      description: 'Turf Booking Payment',
      referenceType: 'BOOKING',
      referenceId: booking._id,
    });
    await wallet.save();

    // Mark booking as paid and confirmed
    booking.paymentStatus = 'paid';
    booking.bookingStatus = 'confirmed';
    await booking.save();

    // Create settlement record
    const platformCommissionPercent = 5;
    const commissionAmount = (booking.originalAmount * platformCommissionPercent) / 100;
    const amountOwed = booking.originalAmount - commissionAmount;

    await Settlement.create({
      owner: booking.owner,
      booking: booking._id,
      bookingAmount: booking.amount,
      originalAmount: booking.originalAmount,
      platformCommission: commissionAmount,
      amountOwedToOwner: amountOwed,
    });

    // Reject overlapping pending bookings
    await Booking.updateMany(
      {
        _id: { $ne: booking._id },
        turf: booking.turf,
        date: booking.date,
        bookingStatus: 'pending',
        startTime: { $lt: booking.endTime },
        endTime: { $gt: booking.startTime },
      },
      { bookingStatus: 'rejected' }
    );

    // Award TurfPoints
    let activeMembership = await UserMembership.findOne({
      user: booking.user,
      turf: booking.turf,
      status: 'active',
    }).populate('plan');

    if (!activeMembership) {
      activeMembership = await UserMembership.findOne({
        user: booking.user,
        turf: null,
        status: 'active',
      }).populate('plan');
    }


    let multiplier = 1;
    if (activeMembership && activeMembership.plan) {
      multiplier = activeMembership.plan.pointsMultiplier || 1;
    }

    const basePoints = Math.floor(booking.amount / 100);
    const earnedPoints = basePoints * multiplier;

    if (earnedPoints > 0) {
      const TurfPointTransaction = require('../models/TurfPointTransaction');
      const existingTx = await TurfPointTransaction.findOne({
        referenceId: booking._id,
        transactionType: 'EARN',
      });
      if (!existingTx) {
        await TurfPointTransaction.create({
          user: booking.user,
          points: earnedPoints,
          transactionType: 'EARN',
          referenceType: 'BOOKING',
          referenceId: booking._id,
          description: `Earned points for booking ${booking._id}`,
        });
      }
    }

    res.status(200).json({ success: true, message: 'Booking paid from wallet successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Razorpay Order for purchasing a Membership Plan
// @route   POST /api/payments/create-membership-order
// @access  Private
const createMembershipOrder = async (req, res) => {
  try {
    const { planId } = req.body;
    const plan = await MembershipPlan.findById(planId).populate('turf');

    if (!plan || plan.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Membership plan not found or inactive' });
    }

    const amountInPaise = Math.round(plan.price * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_mem_${req.user._id}_${Date.now()}`,
      notes: {
        planId: plan._id.toString(),
        userId: req.user._id.toString(),
        turfId: plan.turf?._id ? plan.turf._id.toString() : plan.turf.toString(),
      },
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        plan: {
          _id: plan._id,
          name: plan.name,
          price: plan.price,
          turfName: plan.turf?.name || 'Turf',
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Razorpay Payment for Membership and activate membership
// @route   POST /api/payments/verify-membership-payment
// @access  Private
const verifyMembershipPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET || 'IQhLNh0Zi3dwQ0wmQoNOmtdP';

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const expectedSignature = hmac.digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    const plan = await MembershipPlan.findById(planId).populate('turf');
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Membership plan not found' });
    }

    const turfId = plan.turf?._id || plan.turf || null;
    const ownerId = plan.owner || plan.turf?.owner || null;

    // Check if user already has an active membership for this turf or plan
    const query = {
      user: req.user._id,
      status: 'active',
    };
    if (turfId) {
      query.turf = turfId;
    } else {
      query.plan = plan._id;
    }

    const activeMembership = await UserMembership.findOne(query);

    if (activeMembership) {
      activeMembership.status = 'upgraded';
      activeMembership.endDate = new Date();
      await activeMembership.save();
    }


    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + (plan.durationDays || 30));

    const newMembership = await UserMembership.create({
      user: req.user._id,
      turf: turfId,
      owner: ownerId,
      plan: plan._id,
      startDate,
      endDate,
      status: 'active',
      purchaseAmount: plan.price,
    });

    // Record settlement: 100% membership money held by admin for 30-day payout to turf owner
    if (plan.price > 0 && ownerId) {
      const matureAt = new Date();
      matureAt.setDate(matureAt.getDate() + 30); // 30 days monthly payout window

      await Settlement.create({
        type: 'MEMBERSHIP',
        owner: ownerId,
        turf: turfId,
        membership: newMembership._id,
        plan: plan._id,
        bookingAmount: plan.price,
        originalAmount: plan.price,
        platformCommission: 0, // 100% goes to turf owner
        amountOwedToOwner: plan.price,
        status: 'pending_monthly_payout',
        matureAt,
        payoutNotes: `30-Day Monthly Membership settlement for ${plan.name}`,
      });
    }

    res.status(201).json({
      success: true,
      data: newMembership,
      message: `${plan.name} membership activated successfully!`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createBookingOrder,
  verifyPayment,
  payBookingFromWallet,
  createMembershipOrder,
  verifyMembershipPayment,
};
