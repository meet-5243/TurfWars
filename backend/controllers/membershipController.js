const MembershipPlan = require('../models/MembershipPlan');
const UserMembership = require('../models/UserMembership');

// @desc    Get all active membership plans
// @route   GET /api/membership/plans
// @access  Public or User
exports.getPlans = async (req, res) => {
  try {
    const plans = await MembershipPlan.find({ status: 'active' }).sort({ price: 1 });
    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user's membership
// @route   GET /api/membership/current
// @access  Private
exports.getCurrentMembership = async (req, res) => {
  try {
    const membership = await UserMembership.findOne({ 
      user: req.user._id,
      status: 'active'
    }).populate('plan');
    
    res.status(200).json({ success: true, data: membership });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Purchase or upgrade a membership
// @route   POST /api/membership/purchase
// @access  Private
exports.purchaseMembership = async (req, res) => {
  try {
    const { planId } = req.body;
    
    const plan = await MembershipPlan.findById(planId);
    if (!plan || plan.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Membership plan not found or inactive' });
    }

    // Check if user already has an active membership
    const activeMembership = await UserMembership.findOne({
      user: req.user._id,
      status: 'active'
    });

    if (activeMembership) {
      if (activeMembership.plan.toString() === planId) {
        return res.status(400).json({ success: false, message: 'You already have this active membership' });
      }
      
      // Upgrade or downgrade logic (basic implementation)
      // Mark old as upgraded/downgraded based on price, here we just say 'upgraded' for simplicity or 'cancelled'
      // A full implementation would check prices
      activeMembership.status = 'upgraded';
      activeMembership.endDate = new Date();
      await activeMembership.save();
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.durationDays);

    const newMembership = await UserMembership.create({
      user: req.user._id,
      plan: plan._id,
      startDate,
      endDate,
      status: 'active',
      purchaseAmount: plan.price
    });

    // We should ideally create a TurfPoint transaction here if they get bonus points, etc.
    
    res.status(201).json({ success: true, data: newMembership, message: 'Membership activated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a membership plan (Admin)
// @route   POST /api/admin/membership-plans
// @access  Private/Admin
exports.createPlan = async (req, res) => {
  try {
    const plan = await MembershipPlan.create(req.body);
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a membership plan (Admin)
// @route   PUT /api/admin/membership-plans/:id
// @access  Private/Admin
exports.updatePlan = async (req, res) => {
  try {
    const plan = await MembershipPlan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all plans including inactive (Admin)
// @route   GET /api/admin/membership-plans
// @access  Private/Admin
exports.getAllPlansAdmin = async (req, res) => {
  try {
    const plans = await MembershipPlan.find().sort({ price: 1 });
    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
