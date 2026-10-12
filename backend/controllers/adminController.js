const Settlement = require('../models/Settlement');

// @desc    Get all admin commission earnings & history
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
      .populate({
        path: 'booking',
        populate: {
          path: 'user',
          select: 'name email',
        }
      })
      .sort({ createdAt: -1 });

    // Admin just gets their 5% slice. 
    let adminTotalBalance = 0;
    
    settlements.forEach(s => {
      adminTotalBalance += s.platformCommission || 0;
    });

    res.status(200).json({ 
      success: true, 
      data: settlements,
      stats: {
        adminTotalBalance
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSettlements,
};
