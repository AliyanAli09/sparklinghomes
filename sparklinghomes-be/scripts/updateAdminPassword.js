import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const updateAdminPassword = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    // Find the admin user
    const adminUser = await User.findOne({ email: 'mrzaneone@gmail.com' });
    if (!adminUser) {
      console.log('Admin user not found');
      process.exit(1);
    }

    console.log('Found admin user:', adminUser.email);
    console.log('Current role:', adminUser.role);
    console.log('Is Admin:', adminUser.isAdmin);

    // Hash the new password
    const newPassword = '123456';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update the password directly (bypassing the pre-save middleware)
    adminUser.password = hashedPassword;
    adminUser.isVerified = true; // Ensure admin is verified
    await adminUser.save({ validateBeforeSave: false });

    console.log('Admin password updated successfully');
    console.log('New password:', newPassword);
    console.log('Password hash:', hashedPassword.substring(0, 20) + '...');
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating admin password:', error);
    process.exit(1);
  }
};

updateAdminPassword();
