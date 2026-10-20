const express = require('express');
const {
  createBookingOrder,
  verifyPayment,
  payBookingFromWallet,
  createMembershipOrder,
  verifyMembershipPayment,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Booking payment routes
router.post('/create-booking-order', protect, createBookingOrder);
router.post('/verify-payment', protect, verifyPayment);
router.post('/pay-booking-from-wallet', protect, payBookingFromWallet);

// Membership payment routes
router.post('/create-membership-order', protect, createMembershipOrder);
router.post('/verify-membership-payment', protect, verifyMembershipPayment);

module.exports = router;
