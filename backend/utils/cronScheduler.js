const Booking = require('../models/Booking');

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
  // Then run every 1 minute
  setInterval(runAutoSelection, 60 * 1000);
  console.log('[Auto-Select] Background Scheduler initialized (runs every 1 minute)');
};

module.exports = {
  startAutoSelectionScheduler,
  runAutoSelection
};
