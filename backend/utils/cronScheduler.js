const Booking = require('../models/Booking');
const Auction = require('../models/Auction');
const Settlement = require('../models/Settlement');
const UserMembership = require('../models/UserMembership');
const TurfPointTransaction = require('../models/TurfPointTransaction');
const Wallet = require('../models/Wallet');

const settleAuctionItem = async (auction) => {
  if (!auction || auction.status !== 'active') return null;

  // If there are bids and a leading bidder
  if (auction.currentLeadingBidder && auction.currentLeadingBid > 0) {
    const winningAmount = auction.currentLeadingBid;
    const hourlyRate = auction.currentLeadingBidRate;

    // 1. Create Confirmed & Paid Booking
    const newBooking = await Booking.create({
      user: auction.currentLeadingBidder,
      turf: auction.turf,
      owner: auction.owner,
      date: auction.date,
      startTime: auction.startTime,
      endTime: auction.endTime,
      amount: winningAmount,
      originalAmount: winningAmount,
      bookingStatus: 'confirmed',
      paymentStatus: 'paid',
      isBid: true,
      bidAmount: hourlyRate,
      isAutoSelected: true,
    });

    // 2. Reject all other overlapping pending bookings/bids for that slot
    await Booking.updateMany(
      {
        _id: { $ne: newBooking._id },
        turf: auction.turf,
        date: auction.date,
        bookingStatus: 'pending',
        startTime: { $lt: auction.endTime },
        endTime: { $gt: auction.startTime },
      },
      { bookingStatus: 'rejected' }
    );

    // 3. Create Settlement (5% admin, 95% owner)
    const platformCommission = (winningAmount * 5) / 100;
    const amountOwedToOwner = winningAmount - platformCommission;

    await Settlement.create({
      type: 'BOOKING',
      owner: auction.owner,
      turf: auction.turf,
      booking: newBooking._id,
      bookingAmount: winningAmount,
      originalAmount: winningAmount,
      platformCommission,
      amountOwedToOwner,
      status: 'pending',
      payoutNotes: `Live Arena Auction Won (${auction.auctionType} Auction: ₹${hourlyRate}/hr)`,
    });

    // 4. Update the locked wallet transaction description
    const winnerWallet = await Wallet.findOne({ user: auction.currentLeadingBidder });
    if (winnerWallet) {
      const lockTx = winnerWallet.transactions.find(
        (t) => t.referenceId && t.referenceId.toString() === auction._id.toString() && t.type === 'DEBIT'
      );
      if (lockTx) {
        lockTx.description = `Auction Won: Confirmed Booking #${newBooking._id}`;
        lockTx.referenceType = 'BOOKING';
        lockTx.referenceId = newBooking._id;
        await winnerWallet.save();
      }
    }

    // 5. Award TurfPoints
    const basePoints = Math.floor(winningAmount / 100);
    if (basePoints > 0) {
      let multiplier = 1;
      const activeMembership = await UserMembership.findOne({
        user: auction.currentLeadingBidder,
        turf: auction.turf,
        status: 'active',
      }).populate('plan');

      if (activeMembership && activeMembership.plan) {
        multiplier = activeMembership.plan.pointsMultiplier || 1;
      }

      await TurfPointTransaction.create({
        user: auction.currentLeadingBidder,
        points: basePoints * multiplier,
        transactionType: 'EARN',
        referenceType: 'BOOKING',
        referenceId: newBooking._id,
        description: `Earned points for winning auction booking ${newBooking._id}`,
      });
    }

    // 6. Mark Auction completed
    auction.status = 'completed';
    auction.winningBooking = newBooking._id;
    auction.notes = `Concluded. Won by user ${auction.currentLeadingBidder}`;
    await auction.save();

    console.log(`[Auction Cron] Auction ${auction._id} concluded! Winner: ${auction.currentLeadingBidder}, Amount: ₹${winningAmount}`);
    return { success: true, winner: auction.currentLeadingBidder, booking: newBooking._id };
  } else {
    // No bids placed
    auction.status = 'expired';
    auction.notes = 'Expired with zero bids';
    await auction.save();
    console.log(`[Auction Cron] Auction ${auction._id} expired with no bids.`);
    return { success: true, expired: true };
  }
};

const settleExpiredAuctions = async () => {
  try {
    const now = new Date();
    const expiredAuctions = await Auction.find({
      status: 'active',
      expiresAt: { $lte: now },
    });

    for (const auction of expiredAuctions) {
      await settleAuctionItem(auction);
    }
  } catch (error) {
    console.error('Error settling expired auctions:', error);
  }
};

const runAutoSelection = async () => {
  try {
    const now = new Date();
    
    // Find all pending bookings/bids
    const pendingBids = await Booking.find({
      bookingStatus: 'pending',
      isBid: true
    });

    if (pendingBids.length === 0) return;

    // Group the pending bids by slot: turf_date_startTime_endTime
    const slotsMap = {};
    for (const bid of pendingBids) {
      if (!bid.date || !bid.startTime) continue;
      
      const [year, month, day] = bid.date.split('-');
      const [hour, minute] = bid.startTime.split(':');
      const slotStart = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));

      // Calculate time difference in minutes
      const diffMs = slotStart.getTime() - now.getTime();
      const diffMins = diffMs / (60 * 1000);

      // If we are within 45 minutes of the slot start time (or past it, if still pending)
      if (diffMins <= 45) {
        const slotKey = `${bid.turf.toString()}_${bid.date}_${bid.startTime}_${bid.endTime}`;
        if (!slotsMap[slotKey]) {
          slotsMap[slotKey] = [];
        }
        slotsMap[slotKey].push(bid);
      }
    }

    // Process each slot
    for (const slotKey of Object.keys(slotsMap)) {
      const bidsInSlot = slotsMap[slotKey];
      if (bidsInSlot.length === 0) continue;

      const sampleBid = bidsInSlot[0];
      
      // Check if there is already a confirmed booking for this slot (could be simple booking or an accepted bid)
      const existingConfirmed = await Booking.findOne({
        turf: sampleBid.turf,
        date: sampleBid.date,
        startTime: sampleBid.startTime,
        endTime: sampleBid.endTime,
        bookingStatus: 'confirmed'
      });

      if (existingConfirmed) {
        // Someone is already confirmed for this slot
        continue;
      }

      // Find the highest bid
      // Sort bidsInSlot: bidAmount descending, createdAt ascending (oldest first as tie breaker)
      bidsInSlot.sort((a, b) => {
        if (b.bidAmount !== a.bidAmount) {
          return b.bidAmount - a.bidAmount; // highest bidAmount first
        }
        return new Date(a.createdAt) - new Date(b.createdAt);
      });

      const winningBid = bidsInSlot[0];

      // Update the winning bid to confirmed and mark as auto-selected
      winningBid.bookingStatus = 'confirmed';
      winningBid.isAutoSelected = true;
      await winningBid.save();

      console.log(`[Auto-Select] Winning bid ${winningBid._id} automatically confirmed for slot ${winningBid.date} ${winningBid.startTime} (₹${winningBid.amount})`);

      // Reject all other bids/bookings overlapping this slot
      await Booking.updateMany(
        {
          _id: { $ne: winningBid._id },
          turf: winningBid.turf,
          date: winningBid.date,
          bookingStatus: 'pending',
          startTime: { $lt: winningBid.endTime },
          endTime: { $gt: winningBid.startTime }
        },
        {
          bookingStatus: 'rejected'
        }
      );
    }
  } catch (error) {
    console.error('Error in auto selection job:', error);
  }
};

const startAutoSelectionScheduler = () => {
  // Run once immediately on startup
  runAutoSelection();
  settleExpiredAuctions();
  // Then run every 30 seconds
  setInterval(() => {
    runAutoSelection();
    settleExpiredAuctions();
  }, 30 * 1000);
  console.log('[Scheduler] Live Arena & Auto-Selection Scheduler initialized (runs every 30s)');
};

module.exports = {
  startAutoSelectionScheduler,
  runAutoSelection,
  settleExpiredAuctions,
  settleAuctionItem,
};
