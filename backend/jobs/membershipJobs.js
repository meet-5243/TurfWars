const UserMembership = require('../models/UserMembership');
const Coupon = require('../models/Coupon');
const TurfPointTransaction = require('../models/TurfPointTransaction');
const Settlement = require('../models/Settlement');
const Wallet = require('../models/Wallet');

const generateMonthlyCoupons = (length = 8) => {
  return Math.random().toString(36).substring(2, length + 2).toUpperCase();
};

const runMonthlyMembershipPayouts = async () => {
  try {
    const now = new Date();
    // Find membership settlements that are pending monthly payout and reached their maturity date (30 days)
    const dueSettlements = await Settlement.find({
      type: 'MEMBERSHIP',
      status: 'pending_monthly_payout',
      matureAt: { $lte: now },
      owner: { $ne: null }
    }).populate('plan').populate('turf').populate('owner');

    let settledCount = 0;
    let totalPaidOut = 0;

    for (const settlement of dueSettlements) {
      if (!settlement.owner) continue;

      const payoutAmount = settlement.amountOwedToOwner || settlement.originalAmount || 0;
      if (payoutAmount <= 0) continue;

      // Credit the turf owner's wallet
      let ownerWallet = await Wallet.findOne({ user: settlement.owner._id });
      if (!ownerWallet) {
        ownerWallet = await Wallet.create({ user: settlement.owner._id, balance: 0, transactions: [] });
      }

      ownerWallet.balance += payoutAmount;
      ownerWallet.transactions.push({
        type: 'CREDIT',
        amount: payoutAmount,
        description: `Monthly Membership Payout: ${settlement.plan?.name || 'Turf Pass'} (${settlement.turf?.name || 'Turf'})`,
        referenceType: 'PAYOUT',
        referenceId: settlement._id,
      });
      await ownerWallet.save();

      // Mark settlement as settled
      settlement.status = 'settled';
      settlement.settledAt = new Date();
      settlement.payoutNotes = `Settled 100% (₹${payoutAmount}) to owner wallet via automated monthly cron payout`;
      await settlement.save();

      settledCount++;
      totalPaidOut += payoutAmount;
      console.log(`[Settlement Cron] Paid out ₹${payoutAmount} to owner ${settlement.owner.name || settlement.owner._id} for membership settlement ${settlement._id}`);
    }

    if (settledCount > 0) {
      console.log(`[Settlement Cron] Processed ${settledCount} monthly membership payouts totaling ₹${totalPaidOut}`);
    }

    return { success: true, count: settledCount, total: totalPaidOut };
  } catch (error) {
    console.error('Error in runMonthlyMembershipPayouts:', error);
    return { success: false, error: error.message };
  }
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
    }

    // 2. Generate monthly coupons
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

    // 3. Process automated monthly membership payouts to turf owners
    await runMonthlyMembershipPayouts();

  } catch (error) {
    console.error('Error in membership job:', error);
  }
};

const startMembershipScheduler = () => {
  // Run once on startup
  runMembershipExpiryAndCoupons();
  // Then run every 24 hours (24 * 60 * 60 * 1000)
  setInterval(runMembershipExpiryAndCoupons, 24 * 60 * 60 * 1000);
  console.log('[Membership] Background Scheduler initialized (runs every 24 hours)');
};

module.exports = {
  startMembershipScheduler,
  runMembershipExpiryAndCoupons,
  runMonthlyMembershipPayouts,
};
