const Settlement = require('../models/Settlement');
const { runMonthlyMembershipPayouts } = require('../jobs/membershipJobs');

// @desc    Get all admin commission earnings & history
// @route   GET /api/admin/settlements
// @access  Private/Admin
const getSettlements = async (req, res) => {
  try {
    const settlements = await Settlement.find()
      .populate('owner', 'name email phone')
      .populate('turf', 'name location city')
      .populate('plan', 'name price durationDays')
      .populate({
        path: 'membership',
        populate: {
          path: 'user',
          select: 'name email phone',
        },
      })
      .populate({
        path: 'booking',
        populate: [
          { path: 'turf', select: 'name location city' },
          { path: 'user', select: 'name email phone' },
        ],
      })
      .sort({ createdAt: -1 });

    let adminTotalBalance = 0; // 5% cuts from bookings
    let heldMembershipFunds = 0; // 100% held membership money waiting for 30-day payout
    let settledMembershipFunds = 0; // Membership funds already released to owners
    let totalBookingsVolume = 0;
    let totalMembershipsVolume = 0;
    let pendingPayoutCount = 0;

    settlements.forEach((s) => {
      if (s.type === 'MEMBERSHIP') {
        totalMembershipsVolume += s.originalAmount || 0;
        if (s.status === 'pending_monthly_payout') {
          heldMembershipFunds += s.amountOwedToOwner || 0;
          pendingPayoutCount++;
        } else if (s.status === 'settled') {
          settledMembershipFunds += s.amountOwedToOwner || 0;
        }
      } else {
        // BOOKING
        totalBookingsVolume += s.originalAmount || 0;
        adminTotalBalance += s.platformCommission || 0;
      }
    });

    res.status(200).json({
      success: true,
      data: settlements,
      stats: {
        adminTotalBalance,
        heldMembershipFunds,
        settledMembershipFunds,
        totalBookingsVolume,
        totalMembershipsVolume,
        pendingPayoutCount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Trigger automated monthly membership payouts manually
// @route   POST /api/admin/settlements/trigger-payouts
// @access  Private/Admin
const triggerPayouts = async (req, res) => {
  try {
    const result = await runMonthlyMembershipPayouts();
    res.status(200).json({
      success: true,
      data: result,
      message: `Processed ${result.count || 0} matured payout(s) totaling ₹${result.total || 0}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSettlements,
  triggerPayouts,
};

