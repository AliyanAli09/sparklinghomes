import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const checkAdminUser = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    // Find the admin user without selecting password first
    const adminUserBasic = await User.findOne({ email: 'mrzaneone@gmail.com' });
    if (!adminUserBasic) {
      console.log('Admin user not found');
      process.exit(1);
    }

    console.log('=== Admin User Basic Details ===');
    console.log('Email:', adminUserBasic.email);
    console.log('Role:', adminUserBasic.role);
    console.log('Is Admin:', adminUserBasic.isAdmin);
    console.log('Is Verified:', adminUserBasic.isVerified);
    console.log('Is Active:', adminUserBasic.isActive);
    console.log('Has password field:', adminUserBasic.password ? 'YES' : 'NO');
    console.log('Password length:', adminUserBasic.password ? adminUserBasic.password.length : 'N/A');
    console.log('Password hash:', adminUserBasic.password ? adminUserBasic.password.substring(0, 30) + '...' : 'N/A');

    // Now find with password selected
    const adminUserWithPassword = await User.findOne({ email: 'mrzaneone@gmail.com' }).select('+password');
    console.log('\n=== Admin User With Password ===');
    console.log('Has password field:', adminUserWithPassword.password ? 'YES' : 'NO');
    console.log('Password length:', adminUserWithPassword.password ? adminUserWithPassword.password.length : 'N/A');
    console.log('Password hash:', adminUserWithPassword.password ? adminUserWithPassword.password.substring(0, 30) + '...' : 'N/A');

    if (adminUserWithPassword.password) {
      // Test password comparison
      const testPassword = '123456';
      const isPasswordCorrect = await bcrypt.compare(testPassword, adminUserWithPassword.password);
      console.log('\n=== Password Test ===');
      console.log('Test password:', testPassword);
      console.log('Password matches:', isPasswordCorrect);

      // Test with the User model's correctPassword method
      const isCorrectViaMethod = await adminUserWithPassword.correctPassword(testPassword, adminUserWithPassword.password);
      console.log('Password matches via method:', isCorrectViaMethod);
    } else {
      console.log('\n=== ERROR: No password field found ===');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking admin user:', error);
    process.exit(1);
  }
};

checkAdminUser();
