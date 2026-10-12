const express = require('express');
const { getWallet, createTopupOrder, verifyTopup, payFromWallet } = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.get('/', protect, getWallet);
router.post('/topup/create-order', protect, createTopupOrder);
router.post('/topup/verify', protect, verifyTopup);
router.post('/pay', protect, payFromWallet);

module.exports = router;
