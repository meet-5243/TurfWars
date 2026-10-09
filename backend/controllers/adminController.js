const Settlement = require('../models/Settlement');

// @desc    Get all settlements (Admin only)
// @route   GET /api/admin/settlements
// @access  Private/Admin
const getSettlements = async (req, res) => {
  try {
    const settlements = await Settlement.find()
      .populate('owner', 'name email phone')
      .populate({
        path: 'booking',
        populate: {
          path: 'turf',
          select: 'name location',
        }
      })
      .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, data: settlements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark settlement as paid/settled
// @route   PUT /api/admin/settlements/:id/settle
// @access  Private/Admin
const markSettled = async (req, res) => {
  try {
    const settlement = await Settlement.findById(req.params.id);
    if (!settlement) {
      return res.status(404).json({ success: false, message: 'Settlement not found' });
    }

    if (settlement.status === 'settled') {
      return res.status(400).json({ success: false, message: 'Already settled' });
    }

    settlement.status = 'settled';
    settlement.settledAt = new Date();
    settlement.settledBy = req.user._id;

    await settlement.save();

    res.status(200).json({ success: true, data: settlement, message: 'Settlement marked as paid to owner' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSettlements,
  markSettled,
};
