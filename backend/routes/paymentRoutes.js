const express = require('express');
const { createBookingOrder, verifyPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/create-booking-order', protect, createBookingOrder);
router.post('/verify-payment', protect, verifyPayment);

module.exports = router;
