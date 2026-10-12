const express = require('express');
const { createBookingOrder, verifyPayment, payBookingFromWallet } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/create-booking-order', protect, createBookingOrder);
router.post('/verify-payment', protect, verifyPayment);
router.post('/pay-booking-from-wallet', protect, payBookingFromWallet);

module.exports = router;
