const express = require('express');
const { getSettlements, markSettled } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/settlements', protect, requireRole('admin'), getSettlements);
router.put('/settlements/:id/settle', protect, requireRole('admin'), markSettled);

module.exports = router;
