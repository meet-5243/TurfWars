const express = require('express');
const { check, validationResult } = require('express-validator');
const {
  getTurfs,
  getTurfById,
  getOwnerTurfs,
  createTurf,
  updateTurf,
  deleteTurf,
} = require('../controllers/turfController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors.array().map(err => err.msg).join(', ');
    return res.status(400).json({ success: false, message: errorMsg });
  }
  next();
};

// Public Routes
router.get('/', getTurfs);
router.get('/:id', getTurfById);

// Owner Specific Routes (protected)
router.get('/owner/mine', protect, requireRole('owner'), getOwnerTurfs);

router.post(
  '/',
  [
    protect,
    requireRole('owner'),
    check('name', 'Turf name is required').not().isEmpty(),
    check('location', 'Location is required').not().isEmpty(),
    check('city', 'City is required').not().isEmpty(),
    check('pricePerHour', 'Price per hour must be a valid number').isNumeric({ min: 0 }),
    check('sport', 'Sport must be cricket or pickle ball').isIn([
      'cricket',
      'pickle ball',
    ]),
    check('capacity', 'Capacity must be a positive integer').isInt({ min: 1 }),
    validate,
  ],
  createTurf
);

router.put(
  '/:id',
  [
    protect,
    requireRole('owner'),
    check('pricePerHour', 'Price per hour must be a valid number').optional().isNumeric({ min: 0 }),
    check('sport', 'Sport must be cricket or pickle ball')
      .optional()
      .isIn(['cricket', 'pickle ball']),
    check('capacity', 'Capacity must be a positive integer').optional().isInt({ min: 1 }),
    validate,
  ],
  updateTurf
);

router.delete('/:id', protect, requireRole('owner'), deleteTurf);

module.exports = router;
