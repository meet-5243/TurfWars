const express = require('express');
const {
  getPointsBalance,
  getPointsHistory,
  getCoupons,
  validateCoupon
} = require('../controllers/loyaltyController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/points/balance', protect, getPointsBalance);
router.get('/points/history', protect, getPointsHistory);

router.get('/coupons', protect, getCoupons);
router.post('/coupons/validate', protect, validateCoupon);

module.exports = router;
