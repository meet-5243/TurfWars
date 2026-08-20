const Turf = require('../models/Turf');
const Booking = require('../models/Booking');

// @desc    List all active turfs (public)
// @route   GET /api/turfs
// @access  Public
const getTurfs = async (req, res) => {
  try {
    const turfs = await Turf.find({ isActive: true }).populate('owner', 'name email phone');
    return res.json({ success: true, data: turfs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single turf details (public)
// @route   GET /api/turfs/:id
// @access  Public
const getTurfById = async (req, res) => {
  try {
    const turf = await Turf.findById(req.params.id).populate('owner', 'name email phone');
    if (!turf) {
      return res.status(404).json({ success: false, message: 'Turf not found' });
    }
    return res.json({ success: true, data: turf });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    List turfs belonging to the logged-in owner
// @route   GET /api/turfs/owner/mine
// @access  Private/Owner
const getOwnerTurfs = async (req, res) => {
  try {
    const turfs = await Turf.find({ owner: req.user._id });
    return res.json({ success: true, data: turfs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new turf
// @route   POST /api/turfs
// @access  Private/Owner
const createTurf = async (req, res) => {
  const { name, location, city, pricePerHour, sport, images, amenities, capacity, isActive, maintenanceDates } = req.body;

  try {
    const turf = await Turf.create({
      owner: req.user._id,
      name,
      location,
      city,
      pricePerHour,
      sport,
      images: images || [],
      amenities: amenities || [],
      capacity: capacity || 10,
      isActive: isActive !== undefined ? isActive : true,
      maintenanceDates: maintenanceDates || [],
    });

    return res.status(201).json({ success: true, data: turf });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a turf
// @route   PUT /api/turfs/:id
// @access  Private/Owner
const updateTurf = async (req, res) => {
  try {
    let turf = await Turf.findById(req.params.id);

    if (!turf) {
      return res.status(404).json({ success: false, message: 'Turf not found' });
    }

    // Check if user owns the turf
    if (turf.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this turf' });
    }

    turf = await Turf.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    return res.json({ success: true, data: turf });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a turf
// @route   DELETE /api/turfs/:id
// @access  Private/Owner
const deleteTurf = async (req, res) => {
  try {
    const turf = await Turf.findById(req.params.id);

    if (!turf) {
      return res.status(404).json({ success: false, message: 'Turf not found' });
    }

    // Check if user owns the turf
    if (turf.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this turf' });
    }

    // Check if there are active bookings (pending or confirmed) for this turf
    const activeBooking = await Booking.findOne({
      turf: req.params.id,
      bookingStatus: { $in: ['pending', 'confirmed'] },
    });

    if (activeBooking) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete turf with active or pending bookings. You can deactivate it by editing the turf and setting Status to inactive.',
      });
    }

    await Turf.findByIdAndDelete(req.params.id);

    return res.json({ success: true, message: 'Turf deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTurfs,
  getTurfById,
  getOwnerTurfs,
  createTurf,
  updateTurf,
  deleteTurf,
};
