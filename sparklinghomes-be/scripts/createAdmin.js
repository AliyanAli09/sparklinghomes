import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@booknmove.com',
      password: hashedPassword,
      phone: '+1234567890',
      role: 'admin',
      isAdmin: true,
      isVerified: true,
      adminPermissions: {
        canManageUsers: true,
        canManageMovers: true,
        canViewAnalytics: true,
        canManageBookings: true,
        canManageContent: true,
        canManageSettings: true
      }
    });

    await adminUser.save();
    console.log('Admin user created successfully');
    console.log('Email: admin@booknmove.com');
    console.log('Password: admin123');
    console.log('Please change the password after first login!');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdminUser();
