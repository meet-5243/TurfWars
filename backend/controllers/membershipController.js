const MembershipPlan = require('../models/MembershipPlan');
const UserMembership = require('../models/UserMembership');
const Turf = require('../models/Turf');
const Settlement = require('../models/Settlement');

// @desc    Get all active membership plans for a specific turf
// @route   GET /api/membership/turf/:turfId
// @access  Public
exports.getTurfPlans = async (req, res) => {
  try {
    const { turfId } = req.params;
    const plans = await MembershipPlan.find({ turf: turfId, status: 'active' }).sort({ price: 1 });
    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all plans (general listing or fallback)
// @route   GET /api/membership/plans
// @access  Public
exports.getPlans = async (req, res) => {
  try {
    const filter = { status: 'active' };
    if (req.query.turfId) {
      filter.turf = req.query.turfId;
    }
    const plans = await MembershipPlan.find(filter).populate('turf', 'name city location').sort({ price: 1 });
    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get owner's membership plans
// @route   GET /api/membership/owner/plans
// @access  Private (Owner / Admin)
exports.getOwnerPlans = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { owner: req.user._id };
    if (req.query.turfId) {
      filter.turf = req.query.turfId;
    }
    const plans = await MembershipPlan.find(filter)
      .populate('turf', 'name location city')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a membership plan for a turf (Owner/Admin)
// @route   POST /api/membership/owner/plans
// @access  Private (Owner / Admin)
exports.createOwnerPlan = async (req, res) => {
  try {
    const {
      turfId,
      name,
      description,
      price,
      durationDays,
      bookingDiscountPercent,
      pointsMultiplier,
      monthlyCouponLimit,
      earlySlotAccess,
      freeBookingLimit,
    } = req.body;

    if (!turfId || !name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Turf ID, plan name, and price are required' });
    }

    // Verify turf ownership unless admin
    const turf = await Turf.findById(turfId);
    if (!turf) {
      return res.status(404).json({ success: false, message: 'Turf not found' });
    }

    if (req.user.role !== 'admin' && turf.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You do not own this turf' });
    }

    // Check for existing plan with same name on this turf
    const existingPlan = await MembershipPlan.findOne({ turf: turfId, name: name.trim() });
    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: `A plan named "${name.trim()}" already exists for this turf. Please use a different name.`,
      });
    }

    const plan = await MembershipPlan.create({
      turf: turfId,
      owner: turf.owner,
      name: name.trim(),
      description,
      price: Number(price),
      durationDays: Number(durationDays) || 30,
      bookingDiscountPercent: Number(bookingDiscountPercent) || 0,
      pointsMultiplier: Number(pointsMultiplier) || 1,
      monthlyCouponLimit: Number(monthlyCouponLimit) || 0,
      earlySlotAccess: Boolean(earlySlotAccess),
      freeBookingLimit: Number(freeBookingLimit) || 0,
      status: 'active',
    });

    res.status(201).json({ success: true, data: plan, message: 'Membership plan created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a membership plan (Owner/Admin)
// @route   PUT /api/membership/owner/plans/:id
// @access  Private (Owner / Admin)
exports.updateOwnerPlan = async (req, res) => {
  try {
    const plan = await MembershipPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    if (req.user.role !== 'admin' && plan.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this plan' });
    }

    const updated = await MembershipPlan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: updated, message: 'Plan updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle a membership plan status (Owner/Admin)
// @route   PATCH /api/membership/owner/plans/:id/status
// @access  Private (Owner / Admin)
exports.toggleOwnerPlanStatus = async (req, res) => {
  try {
    const plan = await MembershipPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    if (req.user.role !== 'admin' && plan.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    plan.status = plan.status === 'active' ? 'inactive' : 'active';
    await plan.save();

    res.status(200).json({ success: true, data: plan, message: `Plan marked as ${plan.status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a membership plan (Owner/Admin)
// @route   DELETE /api/membership/owner/plans/:id
// @access  Private (Owner / Admin)
exports.deleteOwnerPlan = async (req, res) => {
  try {
    const plan = await MembershipPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    if (req.user.role !== 'admin' && plan.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Check if there are active memberships using this plan
    const activeCount = await UserMembership.countDocuments({ plan: plan._id, status: 'active' });
    if (activeCount > 0) {
      // Rather than deleting, mark inactive so existing subscribers can finish their tenure
      plan.status = 'inactive';
      await plan.save();
      return res.status(200).json({
        success: true,
        message: 'Plan has active subscribers. It has been deactivated instead of deleted.',
      });
    }

    await MembershipPlan.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user's membership (all active or by specific turf)
// @route   GET /api/membership/current
// @access  Private
exports.getCurrentMembership = async (req, res) => {
  try {
    const { turfId } = req.query;

    if (turfId) {
      const membership = await UserMembership.findOne({
        user: req.user._id,
        turf: turfId,
        status: 'active',
      }).populate('plan');

      return res.status(200).json({ success: true, data: membership });
    }

    // All active memberships for this user
    const memberships = await UserMembership.find({
      user: req.user._id,
      status: 'active',
    })
      .populate('plan')
      .populate('turf', 'name location city images');

    res.status(200).json({
      success: true,
      data: memberships[0] || null, // for backwards compatibility
      all: memberships,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Legacy Admin endpoints
exports.createPlan = exports.createOwnerPlan;
exports.updatePlan = exports.updateOwnerPlan;
exports.getAllPlansAdmin = async (req, res) => {
  try {
    const plans = await MembershipPlan.find().populate('turf', 'name location').sort({ price: 1 });
    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Purchase or upgrade a membership (placeholder until Phase 3)
// @route   POST /api/membership/purchase
// @access  Private
exports.purchaseMembership = async (req, res) => {
  try {
    const { planId, payFromWallet } = req.body;

    const plan = await MembershipPlan.findById(planId).populate('turf');
    if (!plan || plan.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Membership plan not found or inactive' });
    }

    // Handle wallet payment if requested
    if (payFromWallet) {
      const Wallet = require('../models/Wallet');
      let wallet = await Wallet.findOne({ user: req.user._id });
      if (!wallet) {
        wallet = await Wallet.create({ user: req.user._id, balance: 0, transactions: [] });
      }

      if (wallet.balance < plan.price) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient wallet balance. Please top up your wallet.',
        });
      }

      wallet.balance -= plan.price;
      wallet.transactions.push({
        type: 'DEBIT',
        amount: plan.price,
        description: `Membership Purchase: ${plan.name} (${plan.turf?.name || 'Turf'})`,
        referenceType: 'MEMBERSHIP',
      });
      await wallet.save();
    }

    const turfId = plan.turf?._id || plan.turf || null;
    const ownerId = plan.owner || plan.turf?.owner || null;

    // Check if user already has an active membership for this turf / plan
    const query = {
      user: req.user._id,
      status: 'active',
    };
    if (turfId) {
      query.turf = turfId;
    } else {
      query.plan = plan._id;
    }

    const activeMembership = await UserMembership.findOne(query);

    if (activeMembership) {
      if (activeMembership.plan.toString() === planId) {
        return res.status(400).json({ success: false, message: 'You already have this active membership' });
      }
      activeMembership.status = 'upgraded';
      activeMembership.endDate = new Date();
      await activeMembership.save();
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + (plan.durationDays || 30));

    const newMembership = await UserMembership.create({
      user: req.user._id,
      turf: turfId,
      owner: ownerId,
      plan: plan._id,
      startDate,
      endDate,
      status: 'active',
      purchaseAmount: plan.price,
    });

    // Record settlement: 100% membership money held by admin for 30-day payout to turf owner
    if (plan.price > 0 && ownerId) {
      const matureAt = new Date();
      matureAt.setDate(matureAt.getDate() + 30); // 30 days monthly payout window

      await Settlement.create({
        type: 'MEMBERSHIP',
        owner: ownerId,
        turf: turfId,
        membership: newMembership._id,
        plan: plan._id,
        bookingAmount: plan.price,
        originalAmount: plan.price,
        platformCommission: 0, // 100% goes to turf owner
        amountOwedToOwner: plan.price,
        status: 'pending_monthly_payout',
        matureAt,
        payoutNotes: `30-Day Monthly Membership settlement for ${plan.name}`,
      });
    }

    res.status(201).json({ success: true, data: newMembership, message: 'Membership activated successfully' });
  } catch (error) {
    console.error('Error in purchaseMembership:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

