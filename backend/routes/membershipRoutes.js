const express = require('express');
const {
  getPlans,
  getTurfPlans,
  getOwnerPlans,
  createOwnerPlan,
  updateOwnerPlan,
  toggleOwnerPlanStatus,
  deleteOwnerPlan,
  getCurrentMembership,
  purchaseMembership,
  createPlan,
  updatePlan,
  getAllPlansAdmin,
} = require('../controllers/membershipController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public / Player routes
router.get('/plans', getPlans);
router.get('/turf/:turfId', getTurfPlans);
router.get('/current', protect, getCurrentMembership);
router.post('/purchase', protect, purchaseMembership);

// Owner / Admin routes
router.get('/owner/plans', protect, requireRole('owner', 'admin'), getOwnerPlans);
router.post('/owner/plans', protect, requireRole('owner', 'admin'), createOwnerPlan);
router.put('/owner/plans/:id', protect, requireRole('owner', 'admin'), updateOwnerPlan);
router.patch('/owner/plans/:id/status', protect, requireRole('owner', 'admin'), toggleOwnerPlanStatus);
router.delete('/owner/plans/:id', protect, requireRole('owner', 'admin'), deleteOwnerPlan);

// Admin fallback routes
router.get('/admin/plans', protect, requireRole('admin', 'owner'), getAllPlansAdmin);
router.post('/admin/plans', protect, requireRole('admin', 'owner'), createPlan);
router.put('/admin/plans/:id', protect, requireRole('admin', 'owner'), updatePlan);

module.exports = router;
