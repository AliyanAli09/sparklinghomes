import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const createAdminZane = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'support@bookandmove.com' });
    if (existingAdmin) {
      console.log('Admin user with email support@bookandmove.com already exists');
      console.log('User ID:', existingAdmin._id);
      console.log('Role:', existingAdmin.role);
      console.log('Is Admin:', existingAdmin.isAdmin);
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = 'Ndibtsjs#1';
    
    const adminUser = new User({
      firstName: 'Zane',
      lastName: 'Admin',
      email: 'support@bookandmove.com',
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
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: support@bookandmove.com');
    console.log('🔑 Password: 123456');
    console.log('🆔 User ID:', adminUser._id);
    console.log('👤 Role: admin');
    console.log('🛡️ Is Admin: true');
    console.log('');
    console.log('⚠️  IMPORTANT: Change the password after first login!');
    console.log('🚀 You can now login at /admin/login');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdminZane();
