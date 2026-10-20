const express = require('express');
const {
  getLiveAuctions,
  getAuctionById,
  placeBid,
  createAuction,
  settleAuction,
  adjustAuctionTime,
  deleteAuction,
} = require('../controllers/auctionController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public routes
router.get('/live', getLiveAuctions);
router.get('/:id', getAuctionById);

// Protected routes
router.post('/:id/settle', protect, settleAuction);
router.patch('/:id/time', protect, requireRole('owner', 'admin'), adjustAuctionTime);
router.delete('/:id', protect, requireRole('owner', 'admin'), deleteAuction);
router.post('/:id/bid', protect, placeBid);
router.post('/create', protect, requireRole('owner', 'admin'), createAuction);

module.exports = router;


