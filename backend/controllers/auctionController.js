const Auction = require('../models/Auction');
const Turf = require('../models/Turf');
const Wallet = require('../models/Wallet');
const Booking = require('../models/Booking');

// Helper: Convert "HH:mm" to minutes
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// Helper: Determine default auction type based on date string (YYYY-MM-DD)
const getAuctionTypeForDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const day = new Date(y, m - 1, d).getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
  return [0, 5, 6].includes(day) ? 'FORWARD' : 'REVERSE';
};

// @desc    Get all active live arena auctions
// @route   GET /api/auctions/live
// @access  Public
const getLiveAuctions = async (req, res) => {
  try {
    const now = new Date();

    // Find active auctions where expiresAt > now
    let auctions = await Auction.find({
      status: 'active',
      expiresAt: { $gt: now },
    })
      .populate('turf', 'name location city images sport pricePerHour bookingMode')
      .populate('owner', 'name email phone')
      .populate('currentLeadingBidder', 'name email')
      .populate('bids.bidder', 'name email')
      .sort({ expiresAt: 1 });

    // Seed a live demo auction for testing if none exist
    if (auctions.length === 0) {
      const auctionTurf = await Turf.findOne({ isActive: true });
      if (auctionTurf) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const auctionType = getAuctionTypeForDate(dateStr);

        // 30-minute live auction session
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

        const demoAuction = await Auction.create({
          turf: auctionTurf._id,
          owner: auctionTurf.owner,
          date: dateStr,
          startTime: '19:00',
          endTime: '20:00',
          durationHours: 1,
          auctionType,
          basePrice: auctionTurf.pricePerHour || 1000,
          currentLeadingBidRate: auctionType === 'FORWARD' ? auctionTurf.pricePerHour : auctionTurf.pricePerHour,
          currentLeadingBid: auctionTurf.pricePerHour,
          expiresAt,
          notes: `Official Arena Match Slot (${auctionType} Bidding)`,
        });

        const populated = await Auction.findById(demoAuction._id)
          .populate('turf', 'name location city images sport pricePerHour bookingMode')
          .populate('owner', 'name email phone')
          .populate('currentLeadingBidder', 'name email');

        auctions = [populated];
      }
    }

    // Attach remaining seconds to each auction
    const enriched = auctions.map((a) => {
      const remainingMs = Math.max(0, new Date(a.expiresAt).getTime() - Date.now());
      return {
        ...a.toObject(),
        remainingSeconds: Math.floor(remainingMs / 1000),
      };
    });

    res.status(200).json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    console.error('Error in getLiveAuctions:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single auction arena room details
// @route   GET /api/auctions/:id
// @access  Public
const getAuctionById = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('turf')
      .populate('owner', 'name email phone')
      .populate('currentLeadingBidder', 'name email')
      .populate('bids.bidder', 'name email');

    if (!auction) {
      return res.status(404).json({ success: false, message: 'Auction room not found' });
    }

    const remainingMs = Math.max(0, new Date(auction.expiresAt).getTime() - Date.now());
    const remainingSeconds = Math.floor(remainingMs / 1000);

    res.status(200).json({
      success: true,
      data: {
        ...auction.toObject(),
        remainingSeconds,
        isExpired: remainingSeconds <= 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Place a bid in the live arena with Wallet Bid-Locking
// @route   POST /api/auctions/:id/bid
// @access  Private
const placeBid = async (req, res) => {
  try {
    const { bidRate } = req.body; // Hourly bid rate entered by user
    const rate = Number(bidRate);

    if (!rate || isNaN(rate) || rate <= 0) {
      return res.status(400).json({ success: false, message: 'Please enter a valid bid rate per hour' });
    }

    const auction = await Auction.findById(req.params.id).populate('turf');
    if (!auction) {
      return res.status(404).json({ success: false, message: 'Auction room not found' });
    }

    if (auction.status !== 'active') {
      return res.status(400).json({ success: false, message: `Auction is ${auction.status}` });
    }

    const now = new Date();
    if (now >= new Date(auction.expiresAt)) {
      auction.status = 'expired';
      await auction.save();
      return res.status(400).json({ success: false, message: 'Auction countdown has ended' });
    }

    // Cannot bid on own turf
    if (auction.owner.toString() === req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You cannot bid on your own turf' });
    }

    const hours = auction.durationHours || 1;
    const isForward = auction.auctionType === 'FORWARD';
    const minIncrement = auction.minBidIncrement || 50;

    // Validate bid rate according to auction rules
    if (isForward) {
      // FORWARD AUCTION (Fri-Sun)
      if (rate < auction.basePrice) {
        return res.status(400).json({
          success: false,
          message: `In a Forward Auction, your bid must be at least the base price of ₹${auction.basePrice}/hr`,
        });
      }

      if (auction.currentLeadingBidRate > 0) {
        const requiredMin = auction.currentLeadingBidRate + minIncrement;
        if (rate < requiredMin) {
          return res.status(400).json({
            success: false,
            message: `Your bid must be at least ₹${requiredMin}/hr (current highest is ₹${auction.currentLeadingBidRate} + ₹${minIncrement} min increment)`,
          });
        }
      }
    } else {
      // REVERSE AUCTION (Mon-Thu)
      if (rate > auction.basePrice) {
        return res.status(400).json({
          success: false,
          message: `In a Reverse Auction, your bid must be less than or equal to the base rate of ₹${auction.basePrice}/hr`,
        });
      }

      if (auction.currentLeadingBidRate > 0) {
        const requiredMax = auction.currentLeadingBidRate - minIncrement;
        if (rate > requiredMax) {
          return res.status(400).json({
            success: false,
            message: `Your bid must be at most ₹${requiredMax}/hr to outbid current lowest bid of ₹${auction.currentLeadingBidRate}/hr`,
          });
        }
      }
    }

    const totalNewLockAmount = rate * hours;

    // Retrieve or create bidder's wallet
    let bidderWallet = await Wallet.findOne({ user: req.user._id });
    if (!bidderWallet) {
      bidderWallet = await Wallet.create({ user: req.user._id, balance: 0, transactions: [] });
    }

    const isSelfRebidding =
      auction.currentLeadingBidder &&
      auction.currentLeadingBidder.toString() === req.user._id.toString();

    let amountToDeduct = totalNewLockAmount;
    if (isSelfRebidding) {
      // Only deduct the differential if increasing own forward bid
      amountToDeduct = totalNewLockAmount - (auction.currentLeadingBid || 0);
    }

    if (amountToDeduct > 0 && bidderWallet.balance < amountToDeduct) {
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. You need ₹${amountToDeduct} to place this bid. Current balance: ₹${bidderWallet.balance}. Please top up your wallet.`,
        walletShortfall: amountToDeduct - bidderWallet.balance,
      });
    }

    // 1. REFUND PREVIOUS OUTBID PLAYER (if someone else was leading)
    if (auction.currentLeadingBidder && !isSelfRebidding) {
      const previousBidderId = auction.currentLeadingBidder;
      const previousRefundAmount = auction.currentLeadingBid;

      if (previousRefundAmount > 0) {
        let previousWallet = await Wallet.findOne({ user: previousBidderId });
        if (previousWallet) {
          previousWallet.balance += previousRefundAmount;
          previousWallet.transactions.push({
            type: 'CREDIT',
            amount: previousRefundAmount,
            description: `Arena Outbid Refund: Outbid on ${auction.turf?.name || 'Turf'} (${auction.date} ${auction.startTime})`,
            referenceType: 'AUCTION_OUTBID_REFUND',
            referenceId: auction._id,
          });
          await previousWallet.save();
        }
      }
    }

    // 2. LOCK NEW BID AMOUNT FROM BIDDER'S WALLET
    if (amountToDeduct > 0) {
      bidderWallet.balance -= amountToDeduct;
      bidderWallet.transactions.push({
        type: 'DEBIT',
        amount: amountToDeduct,
        description: `Arena Bid Lock: Leading bid for ${auction.turf?.name || 'Turf'} (${rate}/hr)`,
        referenceType: 'AUCTION_BID_LOCK',
        referenceId: auction._id,
      });
      await bidderWallet.save();
    } else if (amountToDeduct < 0) {
      // In reverse auction, self-rebid lower results in a partial refund
      const refundDiff = Math.abs(amountToDeduct);
      bidderWallet.balance += refundDiff;
      bidderWallet.transactions.push({
        type: 'CREDIT',
        amount: refundDiff,
        description: `Arena Bid Adjustment: Adjusted reverse bid on ${auction.turf?.name || 'Turf'}`,
        referenceType: 'AUCTION_BID_ADJUSTMENT',
        referenceId: auction._id,
      });
      await bidderWallet.save();
    }

    // 3. ANTI-SNIPING EXTENSION
    // If bid arrives in last 60 seconds, extend countdown by 45 seconds
    const timeRemainingMs = new Date(auction.expiresAt).getTime() - Date.now();
    let extendedBySeconds = 0;
    if (timeRemainingMs < 60 * 1000) {
      auction.expiresAt = new Date(new Date(auction.expiresAt).getTime() + 45 * 1000);
      auction.antiSnipingExtensions = (auction.antiSnipingExtensions || 0) + 1;
      extendedBySeconds = 45;
    }

    // 4. UPDATE AUCTION STATE
    auction.currentLeadingBidRate = rate;
    auction.currentLeadingBid = totalNewLockAmount;
    auction.currentLeadingBidder = req.user._id;
    auction.bids.push({
      bidder: req.user._id,
      bidRate: rate,
      totalAmount: totalNewLockAmount,
      createdAt: new Date(),
    });

    await auction.save();

    const populatedAuction = await Auction.findById(auction._id)
      .populate('turf', 'name location city images sport pricePerHour')
      .populate('currentLeadingBidder', 'name email')
      .populate('bids.bidder', 'name email');

    res.status(200).json({
      success: true,
      message: `Your bid of ₹${rate}/hr (Total: ₹${totalNewLockAmount}) is now the leading bid! Funds locked in escrow.`,
      data: populatedAuction,
      extendedBySeconds,
      walletBalance: bidderWallet.balance,
    });
  } catch (error) {
    console.error('Error placing bid in arena:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new live auction arena session (Owner/Admin)
// @route   POST /api/auctions/create
// @access  Private (Owner/Admin)
const createAuction = async (req, res) => {
  try {
    const { turfId, date, startTime, endTime, basePrice, durationMinutes, auctionTypeOverride } = req.body;

    if (!turfId || !date || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'Turf, date, startTime, and endTime are required' });
    }

    const turf = await Turf.findById(turfId);
    if (!turf) {
      return res.status(404).json({ success: false, message: 'Turf not found' });
    }

    if (req.user.role !== 'admin' && turf.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to create an auction for this turf' });
    }

    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);
    if (startMins >= endMins) {
      return res.status(400).json({ success: false, message: 'End time must be after start time' });
    }

    const hours = (endMins - startMins) / 60;
    const auctionType = auctionTypeOverride || getAuctionTypeForDate(date);
    const hourlyBase = Number(basePrice) || turf.pricePerHour || 1000;

    // Default duration: 30 minutes from now or custom
    const durMins = Number(durationMinutes) || 30;
    const expiresAt = new Date(Date.now() + durMins * 60 * 1000);

    const auction = await Auction.create({
      turf: turfId,
      owner: turf.owner,
      date,
      startTime,
      endTime,
      durationHours: hours,
      auctionType,
      basePrice: hourlyBase,
      currentLeadingBidRate: hourlyBase,
      currentLeadingBid: hourlyBase * hours,
      expiresAt,
      notes: `Custom Arena Match Slot (${auctionType} Bidding)`,
    });

    res.status(201).json({
      success: true,
      data: auction,
      message: 'Auction session launched successfully!',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Manually or client-triggered settlement when countdown hits zero
// @route   POST /api/auctions/:id/settle
// @access  Public
const settleAuction = async (req, res) => {
  try {
    const { settleAuctionItem } = require('../utils/cronScheduler');
    const auction = await Auction.findById(req.params.id);
    if (!auction) {
      return res.status(404).json({ success: false, message: 'Auction not found' });
    }

    if (auction.status !== 'active') {
      const populated = await Auction.findById(auction._id)
        .populate('turf', 'name location city images sport pricePerHour')
        .populate('currentLeadingBidder', 'name email')
        .populate('winningBooking');

      return res.status(200).json({
        success: true,
        message: `Auction is already ${auction.status}`,
        data: populated,
      });
    }

    const now = new Date();
    // Allow owner or admin to conclude/settle early
    const isOwnerOrAdmin =
      req.user &&
      (auction.owner.toString() === req.user._id.toString() || req.user.role === 'admin');

    if (!isOwnerOrAdmin && now < new Date(auction.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'Auction countdown has not expired yet',
        remainingSeconds: Math.max(0, Math.floor((new Date(auction.expiresAt).getTime() - now.getTime()) / 1000)),
      });
    }

    const result = await settleAuctionItem(auction);
    const updated = await Auction.findById(auction._id)
      .populate('turf', 'name location city images sport pricePerHour')
      .populate('currentLeadingBidder', 'name email')
      .populate('winningBooking');

    res.status(200).json({
      success: true,
      message: 'Auction finalized successfully',
      result,
      data: updated,
    });
  } catch (error) {
    console.error('Error settling auction:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Set or reset arena countdown timing (Owner/Admin)
// @route   PATCH /api/auctions/:id/time
// @access  Private (Owner/Admin)
const adjustAuctionTime = async (req, res) => {
  try {
    const { addMinutes, resetMinutes } = req.body;
    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      return res.status(404).json({ success: false, message: 'Auction not found' });
    }

    if (req.user.role !== 'admin' && auction.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this auction' });
    }

    if (resetMinutes !== undefined && resetMinutes !== null) {
      auction.expiresAt = new Date(Date.now() + Number(resetMinutes) * 60 * 1000);
      auction.status = 'active';
    } else if (addMinutes) {
      const baseTime = new Date(auction.expiresAt) > new Date() ? new Date(auction.expiresAt) : new Date();
      auction.expiresAt = new Date(baseTime.getTime() + Number(addMinutes) * 60 * 1000);
      auction.status = 'active';
    }

    await auction.save();

    const populated = await Auction.findById(auction._id)
      .populate('turf', 'name location city images sport pricePerHour')
      .populate('currentLeadingBidder', 'name email')
      .populate('bids.bidder', 'name email');

    res.status(200).json({
      success: true,
      message: 'Auction timer updated successfully',
      data: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel or delete an arena auction with refund (Owner/Admin)
// @route   DELETE /api/auctions/:id
// @access  Private (Owner/Admin)
const deleteAuction = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id).populate('turf');

    if (!auction) {
      return res.status(404).json({ success: false, message: 'Auction not found' });
    }

    if (req.user.role !== 'admin' && auction.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this auction' });
    }

    // If there is an active leading bid, refund the bidder's locked wallet money
    if (auction.currentLeadingBidder && auction.currentLeadingBid > 0 && auction.status === 'active') {
      let bidderWallet = await Wallet.findOne({ user: auction.currentLeadingBidder });
      if (bidderWallet) {
        bidderWallet.balance += auction.currentLeadingBid;
        bidderWallet.transactions.push({
          type: 'CREDIT',
          amount: auction.currentLeadingBid,
          description: `Arena Cancelled by Owner: Refund for ${auction.turf?.name || 'Turf'} slot`,
          referenceType: 'AUCTION_CANCELLED_REFUND',
          referenceId: auction._id,
        });
        await bidderWallet.save();
      }
    }

    await Auction.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Arena auction cancelled and deleted. Any locked funds were refunded.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLiveAuctions,
  getAuctionById,
  placeBid,
  createAuction,
  settleAuction,
  adjustAuctionTime,
  deleteAuction,
};
