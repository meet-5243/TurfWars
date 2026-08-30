const express = require('express');
const { check, validationResult } = require('express-validator');
const {
  createBooking,
  getUserBookings,
  getOwnerBookings,
  verifyPayment,
  updateBookingStatus,
  getTurfBookingsByDate,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors.array().map(err => err.msg).join(', ');
    return res.status(400).json({ success: false, message: errorMsg });
  }
  next();
};

// Public route to fetch bookings by turf and date
router.get('/turf/:turfId', getTurfBookingsByDate);

// User only routes
router.post(
  '/',
  [
    protect,
    requireRole('user'),
    check('turf', 'Turf ID is required').isMongoId(),
    check('date', 'Date must be in format YYYY-MM-DD').matches(/^\d{4}-\d{2}-\d{2}$/),
    check('startTime', 'Start time must be in HH:MM format').matches(/^\d{2}:\d{2}$/),
    check('endTime', 'End time must be in HH:MM format').matches(/^\d{2}:\d{2}$/),
    validate,
  ],
  createBooking
);

router.get('/mine', protect, requireRole('user'), getUserBookings);

// Owner only routes
router.get('/owner', protect, requireRole('owner'), getOwnerBookings);

router.patch('/:id/verify-payment', protect, requireRole('owner'), verifyPayment);

router.patch(
  '/:id/status',
  [
    protect,
    requireRole('owner'),
    check('status', 'Status must be confirmed or cancelled').isIn(['confirmed', 'cancelled']),
    validate,
  ],
  updateBookingStatus
);

module.exports = router;
