const mongoose = require('mongoose');
const dotenv = require('dotenv');
const MembershipPlan = require('./models/MembershipPlan');

dotenv.config();

const plans = [
  {
    name: 'Bronze',
    description: 'Perfect for occasional players. Basic benefits.',
    price: 0,
    durationDays: 365,
    bookingDiscountPercent: 2,
    pointsMultiplier: 1,
    monthlyCouponLimit: 0,
    matchmakingPriority: 1
  },
  {
    name: 'Silver',
    description: 'For regular players. Get more value.',
    price: 299,
    durationDays: 90,
    bookingDiscountPercent: 5,
    pointsMultiplier: 2,
    monthlyCouponLimit: 1,
    matchmakingPriority: 2,
    earlySlotAccess: true,
    auctionAccess: true
  },
  {
    name: 'Gold',
    description: 'Our most popular plan. Maximum value and priority.',
    price: 699,
    durationDays: 90,
    bookingDiscountPercent: 10,
    pointsMultiplier: 3,
    monthlyCouponLimit: 3,
    matchmakingPriority: 3,
    earlySlotAccess: true,
    auctionAccess: true,
    tournamentDiscountPercent: 10
  },
  {
    name: 'Platinum',
    description: 'For serious players and team captains.',
    price: 1299,
    durationDays: 90,
    bookingDiscountPercent: 15,
    pointsMultiplier: 4,
    monthlyCouponLimit: 5,
    matchmakingPriority: 4,
    earlySlotAccess: true,
    auctionAccess: true,
    tournamentDiscountPercent: 20,
    recurringBookingAccess: true,
    teamBenefits: true
  },
  {
    name: 'Diamond',
    description: 'Ultimate power user experience.',
    price: 2499,
    durationDays: 90,
    bookingDiscountPercent: 20,
    pointsMultiplier: 5,
    monthlyCouponLimit: 6,
    matchmakingPriority: 5,
    earlySlotAccess: true,
    auctionAccess: true,
    tournamentDiscountPercent: 30,
    recurringBookingAccess: true,
    teamBenefits: true,
    freeBookingLimit: 1,
    freeBookingMaxValue: 300
  }
];

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('MongoDB Connected');
  await MembershipPlan.deleteMany();
  await MembershipPlan.insertMany(plans);
  console.log('Membership plans seeded successfully!');
  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
