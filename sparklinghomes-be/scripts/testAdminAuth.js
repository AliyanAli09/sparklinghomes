import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const testAdminAuth = async () => {
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
    console.log('User ID:', adminUser._id);
    console.log('Role:', adminUser.role);
    console.log('Is Admin:', adminUser.isAdmin);

    // Create a JWT token (same way as the auth controller)
    const token = jwt.sign({ id: adminUser._id, userType: 'admin' }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    console.log('\nGenerated JWT token:', token.substring(0, 50) + '...');

    // Test the token by decoding it
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);

    // Test the admin middleware logic
    console.log('\n=== Testing Admin Middleware Logic ===');
    
    // Simulate what the middleware does
    const user = await User.findById(decoded.id);
    console.log('User found by decoded.id:', user ? 'YES' : 'NO');
    
    if (user) {
      console.log('User role:', user.role);
      console.log('User isAdmin:', user.isAdmin);
      console.log('Admin check passed:', user.isAdmin && user.role === 'admin');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error testing admin auth:', error);
    process.exit(1);
  }
};

testAdminAuth();
