const express = require('express');
const {
  getPlans,
  getCurrentMembership,
  purchaseMembership,
  createPlan,
  updatePlan,
  getAllPlansAdmin
} = require('../controllers/membershipController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public / User routes
router.get('/plans', getPlans);
router.get('/current', protect, getCurrentMembership);
router.post('/purchase', protect, purchaseMembership);

// Admin routes (assuming 'owner' or 'admin' can manage plans, will use 'admin' and 'owner' for now)
router.get('/admin/plans', protect, requireRole('admin', 'owner'), getAllPlansAdmin);
router.post('/admin/plans', protect, requireRole('admin', 'owner'), createPlan);
router.put('/admin/plans/:id', protect, requireRole('admin', 'owner'), updatePlan);

module.exports = router;
