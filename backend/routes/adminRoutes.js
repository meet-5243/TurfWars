const express = require('express');
const { getSettlements } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/settlements', protect, requireRole('admin'), getSettlements);

module.exports = router;
