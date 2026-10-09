const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected for Seeding...');

    const adminExists = await User.findOne({ email: 'admin@turfwars.com' });

    if (adminExists) {
      console.log('Admin user already exists!');
      process.exit();
    }

    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@turfwars.com',
      password: 'AdminPassword123!', // This will be hashed by the User model pre-save hook
      phone: '9999999999',
      role: 'admin',
    });

    console.log('Admin created successfully:');
    console.log(`Email: ${admin.email}`);
    console.log(`Password: AdminPassword123!`);
    
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
