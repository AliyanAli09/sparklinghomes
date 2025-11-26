import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const recreateAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    // Delete existing admin user
    const deleteResult = await User.deleteOne({ email: 'marcusbrandon294@gmail.com' });
    console.log('Deleted existing admin user:', deleteResult.deletedCount);

    // Create new admin user with plain text password
    const newAdmin = new User({
      firstName: 'Zane',
      lastName: 'Admin',
      email: 'marcusbrandon294@gmail.com',
      password: '123456', // This will be hashed by the pre-save middleware
      phone: '555-0123',
      role: 'admin',
      isAdmin: true,
      isVerified: true,
      isActive: true,
      adminPermissions: {
        canManageUsers: true,
        canManageMovers: true,
        canViewAnalytics: true,
        canManageBookings: true,
        canManageContent: true,
        canManageSettings: true
      }
    });

    // Save the user (password will be hashed automatically)
    await newAdmin.save();
    
    console.log('New admin user created successfully');
    console.log('Email:', newAdmin.email);
    console.log('Password:', '123456');
    console.log('Role:', newAdmin.role);
    console.log('Is Admin:', newAdmin.isAdmin);
    console.log('Is Verified:', newAdmin.isVerified);
    
    // Verify the password works
    const savedUser = await User.findOne({ email: 'marcusbrandon294@gmail.com' }).select('+password');
    const isPasswordCorrect = await savedUser.correctPassword('123456', savedUser.password);
    console.log('Password verification test:', isPasswordCorrect);
    
    process.exit(0);
  } catch (error) {
    console.error('Error recreating admin user:', error);
    process.exit(1);
  }
};

recreateAdmin();
