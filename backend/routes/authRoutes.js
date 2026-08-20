const express = require('express');
const { check, validationResult } = require('express-validator');
const { registerUser, loginUser, getUserProfile, updateUserProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation formatting middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors.array().map(err => err.msg).join(', ');
    return res.status(400).json({ success: false, message: errorMsg });
  }
  next();
};

router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please enter a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters long').isLength({ min: 6 }),
    check('phone', 'Phone number is required').not().isEmpty(),
    check('role', 'Role must be user or owner').isIn(['user', 'owner']),
    validate,
  ],
  registerUser
);

router.post(
  '/login',
  [
    check('email', 'Please enter a valid email').isEmail(),
    check('password', 'Password is required').exists(),
    validate,
  ],
  loginUser
);

router.get('/profile', protect, getUserProfile);
router.put(
  '/profile',
  protect,
  [
    check('name', 'Name cannot be empty').optional().not().isEmpty(),
    check('email', 'Please enter a valid email').optional().isEmail(),
    check('password', 'Password must be at least 6 characters long').optional().isLength({ min: 6 }),
    check('phone', 'Phone number cannot be empty').optional().not().isEmpty(),
    validate,
  ],
  updateUserProfile
);

module.exports = router;
