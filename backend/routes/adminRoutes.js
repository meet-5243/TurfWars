const express = require('express');
const { getSettlements, triggerPayouts } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/settlements', protect, requireRole('admin'), getSettlements);
router.post('/settlements/trigger-payouts', protect, requireRole('admin'), triggerPayouts);

module.exports = router;

