const UserMembership = require('../models/UserMembership');
const Coupon = require('../models/Coupon');
const TurfPointTransaction = require('../models/TurfPointTransaction');

const generateMonthlyCoupons = (length = 8) => {
  return Math.random().toString(36).substring(2, length + 2).toUpperCase();
};

const runMembershipExpiryAndCoupons = async () => {
  try {
    const now = new Date();
    
    // 1. Expire memberships
    const expiredMemberships = await UserMembership.find({
      status: 'active',
      endDate: { $lt: now }
    });

    for (const membership of expiredMemberships) {
      membership.status = 'expired';
      await membership.save();
      console.log(`[Membership Job] Expired membership ${membership._id} for user ${membership.user}`);
      // In a real app, send notification here
    }

    // 2. Generate monthly coupons
    // A simplistic approach: If membership is active, and they haven't received coupons for this month...
    // To simplify for this demo, we'll check if any coupon was created for them in the last 30 days.
    // Ideally, we track lastCouponDate on UserMembership.
    
    const activeMemberships = await UserMembership.find({ status: 'active' }).populate('plan');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const membership of activeMemberships) {
      if (!membership.plan || membership.plan.monthlyCouponLimit <= 0) continue;

      const recentCoupons = await Coupon.countDocuments({
        membership: membership._id,
        createdAt: { $gte: thirtyDaysAgo }
      });

      if (recentCoupons < membership.plan.monthlyCouponLimit) {
        const couponsToGenerate = membership.plan.monthlyCouponLimit - recentCoupons;
        
        for (let i = 0; i < couponsToGenerate; i++) {
          const validUntil = new Date();
          validUntil.setDate(validUntil.getDate() + 30); // Valid for 30 days

          await Coupon.create({
            user: membership.user,
            membership: membership._id,
            couponCode: `MEM-${generateMonthlyCoupons(6)}`,
            discountType: 'PERCENTAGE',
            discountValue: 10, // Defaulting to 10% for demo
            maxDiscount: 200,
            validUntil
          });
        }
        console.log(`[Membership Job] Generated ${couponsToGenerate} coupons for membership ${membership._id}`);
      }
    }

  } catch (error) {
    console.error('Error in membership job:', error);
  }
};

const startMembershipScheduler = () => {
  // Run once on startup
  runMembershipExpiryAndCoupons();
  // Then run every 24 hours (24 * 60 * 60 * 1000)
  // For testing purposes, you could reduce this.
  setInterval(runMembershipExpiryAndCoupons, 24 * 60 * 60 * 1000);
  console.log('[Membership] Background Scheduler initialized (runs every 24 hours)');
};

module.exports = {
  startMembershipScheduler,
  runMembershipExpiryAndCoupons
};
