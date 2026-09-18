const TurfPointTransaction = require('../models/TurfPointTransaction');
const Coupon = require('../models/Coupon');

// @desc    Get user's TurfPoints balance
// @route   GET /api/loyalty/points/balance
// @access  Private
exports.getPointsBalance = async (req, res) => {
  try {
    const transactions = await TurfPointTransaction.find({ user: req.user._id });
    
    // In a real production app, it might be better to cache this in the User model 
    // or run an aggregation pipeline, but iterating/reducing is fine for now
    const balance = transactions.reduce((acc, curr) => acc + curr.points, 0);

    res.status(200).json({ success: true, data: { balance } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's TurfPoints history
// @route   GET /api/loyalty/points/history
// @access  Private
exports.getPointsHistory = async (req, res) => {
  try {
    const history = await TurfPointTransaction.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's available coupons
// @route   GET /api/loyalty/coupons
// @access  Private
exports.getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({ 
      user: req.user._id,
      status: 'active',
      validUntil: { $gte: new Date() }
    }).sort({ validUntil: 1 });

    res.status(200).json({ success: true, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Validate a coupon code
// @route   POST /api/loyalty/coupons/validate
// @access  Private
exports.validateCoupon = async (req, res) => {
  try {
    const { couponCode, bookingAmount } = req.body;

    const coupon = await Coupon.findOne({ 
      couponCode, 
      user: req.user._id,
      status: 'active'
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive coupon' });
    }

    if (new Date() > new Date(coupon.validUntil)) {
      return res.status(400).json({ success: false, message: 'Coupon has expired' });
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    }

    if (bookingAmount && bookingAmount < coupon.minimumBookingAmount) {
      return res.status(400).json({ 
        success: false, 
        message: `Minimum booking amount of ₹${coupon.minimumBookingAmount} required` 
      });
    }

    // Calculate potential discount
    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = (bookingAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else if (coupon.discountType === 'FIXED_AMOUNT') {
      discount = coupon.discountValue;
    } else if (coupon.discountType === 'FREE_BOOKING') {
      discount = bookingAmount;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    }

    // Ensure discount doesn't exceed booking amount
    if (discount > bookingAmount) {
      discount = bookingAmount;
    }

    res.status(200).json({ 
      success: true, 
      data: {
        coupon,
        calculatedDiscount: discount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
