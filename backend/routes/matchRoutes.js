const express = require('express');
const router = express.Router();
const {
  createOpenChallenge,
  getOpenChallenges,
  acceptChallenge,
  getTeamMatches,
  createSplitOrder,
  verifySplitPayment
} = require('../controllers/matchController');
const { protect } = require('../middleware/authMiddleware');

router.post('/challenge', protect, createOpenChallenge);
router.get('/board', getOpenChallenges);
router.post('/:id/accept', protect, acceptChallenge);
router.get('/team/:teamId', protect, getTeamMatches);
router.post('/:id/payment/create-order', protect, createSplitOrder);
router.post('/:id/payment/verify', protect, verifySplitPayment);

module.exports = router;
