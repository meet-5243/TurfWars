const mongoose = require('mongoose');

const turfSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a turf name'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Please add the location details'],
    },
    city: {
      type: String,
      required: [true, 'Please specify the city'],
      trim: true,
    },
    pricePerHour: {
      type: Number,
      required: [true, 'Please specify the price per hour'],
      min: [0, 'Price cannot be negative'],
    },
    sport: {
      type: String,
      required: [true, 'Please select a sport'],
      enum: ['cricket', 'pickle ball'],
    },
    images: {
      type: [String],
      default: [],
    },
    amenities: {
      type: [String],
      default: [],
    },
    capacity: {
      type: Number,
      required: [true, 'Please specify slot maximum capacity (number of players)'],
      min: [1, 'Capacity must be at least 1'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    maintenanceDates: {
      type: [String],
      default: [],
    },
    bookingMode: {
      type: String,
      enum: ['simple', 'auction'],
      default: 'simple',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Turf', turfSchema);
