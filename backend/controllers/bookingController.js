const Booking = require('../models/Booking');
const Turf = require('../models/Turf');

// Helper to convert time "HH:MM" to minutes for validations
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private/User
const createBooking = async (req, res) => {
  const { turf: turfId, date, startTime, endTime, bidAmount } = req.body;

  try {
    // 1. Find turf
    const turf = await Turf.findById(turfId);
    if (!turf) {
      return res.status(404).json({ success: false, message: 'Turf not found' });
    }

    if (!turf.isActive) {
      return res.status(400).json({ success: false, message: 'This turf is currently inactive' });
    }

    // Check if the requested date is a maintenance date
    if (turf.maintenanceDates && turf.maintenanceDates.includes(date)) {
      return res.status(400).json({
        success: false,
        message: 'This turf is under maintenance on the requested date. Please select another date.',
      });
    }

    // 2. Validate time range
    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);

    if (startMins >= endMins) {
      return res.status(400).json({ success: false, message: 'End time must be after start time' });
    }

    const hours = (endMins - startMins) / 60;

    // 3. Check for overlapping bookings (confirmed bookings always block)
    const confirmedBooking = await Booking.findOne({
      turf: turfId,
      date,
      bookingStatus: 'confirmed',
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });

    if (confirmedBooking) {
      return res.status(400).json({
        success: false,
        message: 'This slot is already booked and confirmed. Please choose a different date or time.',
      });
    }

    // Determine booking mode logic
    const isAuctionMode = turf.bookingMode === 'auction';
    let finalAmount = turf.pricePerHour * hours;
    let finalIsBid = false;
    let finalBidAmount = 0;

    if (isAuctionMode) {
      if (bidAmount === undefined || bidAmount === null || isNaN(bidAmount) || bidAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Please provide a valid bid amount per hour.' });
      }

      const bidRate = Number(bidAmount);
      
      // Determine auction type based on selected booking date
      const bookingDate = new Date(date);
      const dayOfWeek = bookingDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const isForwardAuction = [0, 5, 6].includes(dayOfWeek); // Friday, Saturday, Sunday

      if (isForwardAuction) {
        // Forward Auction: Bid must be >= base rate and higher than current highest bid
        if (bidRate < turf.pricePerHour) {
          return res.status(400).json({
            success: false,
            message: `In a Friday-Sunday Forward Auction, your bid must be at least the base price of ₹${turf.pricePerHour}/hr.`,
          });
        }

        // Find current highest pending bid on this slot
        const overlappingBids = await Booking.find({
          turf: turfId,
          date,
          bookingStatus: 'pending',
          startTime: { $lt: endTime },
          endTime: { $gt: startTime },
        });

        const currentHighestBid = overlappingBids.reduce((max, b) => Math.max(max, b.bidAmount || 0), 0);

        if (currentHighestBid > 0 && bidRate <= currentHighestBid) {
          return res.status(400).json({
            success: false,
            message: `Your bid must be higher than the current highest bid of ₹${currentHighestBid}/hr on this slot.`,
          });
        }
      } else {
        // Reverse Auction: Bid must be <= base rate
        if (bidRate > turf.pricePerHour) {
          return res.status(400).json({
            success: false,
            message: `In a Monday-Thursday Reverse Auction, your bid must be less than or equal to the base price of ₹${turf.pricePerHour}/hr.`,
          });
        }
      }

      finalIsBid = true;
      finalBidAmount = bidRate;
      finalAmount = bidRate * hours;
    } else {
      // Simple mode: Check for any overlapping pending bookings
      const pendingBooking = await Booking.findOne({
        turf: turfId,
        date,
        bookingStatus: 'pending',
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
      });

      if (pendingBooking) {
        return res.status(400).json({
          success: false,
          message: 'This slot has a pending booking request. Please choose a different date or time.',
        });
      }
    }

    // 4. Create booking
    const booking = await Booking.create({
      user: req.user._id,
      turf: turfId,
      owner: turf.owner, // denormalized for direct queries
      date,
      startTime,
      endTime,
      amount: finalAmount,
      bookingStatus: 'pending',
      paymentStatus: 'unpaid',
      isBid: finalIsBid,
      bidAmount: finalBidAmount,
    });

    return res.status(201).json({ success: true, data: booking });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get logged-in user's bookings
// @route   GET /api/bookings/mine
// @access  Private/User
const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('turf', 'name location city sport pricePerHour')
      .populate('owner', 'name phone email')
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: bookings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all bookings across all of the owner's turfs
// @route   GET /api/bookings/owner
// @access  Private/Owner
const getOwnerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ owner: req.user._id })
      .populate('turf', 'name location city sport pricePerHour')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: bookings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark booking payment as verified (paid)
// @route   PATCH /api/bookings/:id/verify-payment
// @access  Private/Owner
const verifyPayment = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check if the booking belongs to this owner's turf
    if (booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to verify payment for this booking' });
    }

    booking.paymentStatus = 'paid';
    booking.verifiedBy = req.user._id;
    booking.verifiedAt = new Date();
    
    // Automatically confirm the booking as well if payment is verified
    booking.bookingStatus = 'confirmed';

    await booking.save();

    // Reject all other overlapping pending bookings/bids
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

    return res.json({ success: true, data: booking });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Confirm or cancel/reject a booking
// @route   PATCH /api/bookings/:id/status
// @access  Private/Owner
const updateBookingStatus = async (req, res) => {
  const { status } = req.body;

  if (!['confirmed', 'cancelled', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value. Must be confirmed, cancelled, or rejected.' });
  }

  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check if the booking belongs to this owner's turf
    if (booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to change status for this booking' });
    }

    booking.bookingStatus = status;
    await booking.save();

    if (status === 'confirmed') {
      // Reject all other overlapping pending bookings/bids
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
    }

    return res.json({ success: true, data: booking });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all active bookings/bids for a turf on a specific date (public)
// @route   GET /api/bookings/turf/:turfId
// @access  Public
const getTurfBookingsByDate = async (req, res) => {
  const { turfId } = req.params;
  const { date } = req.query; // format YYYY-MM-DD

  if (!date) {
    return res.status(400).json({ success: false, message: 'Please provide a date query parameter (YYYY-MM-DD)' });
  }

  try {
    const bookings = await Booking.find({
      turf: turfId,
      date,
      bookingStatus: { $nin: ['cancelled', 'rejected'] },
    }).select('startTime endTime bookingStatus isBid bidAmount');

    return res.json({ success: true, data: bookings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getOwnerBookings,
  verifyPayment,
  updateBookingStatus,
  getTurfBookingsByDate,
};
