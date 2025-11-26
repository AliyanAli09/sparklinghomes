import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jobDistributionService from '../services/jobDistributionService.js';
import Booking from '../models/Booking.js';

// Load environment variables
dotenv.config({ path: '../.env' });

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Trigger job alerts for existing paid bookings
const triggerJobAlerts = async () => {
  try {
    console.log('🔍 Finding bookings with completed payments...');
    
    // Find all bookings that have paid deposits but no job alerts sent
    const paidBookings = await Booking.find({
      'deposit.paid': true,
      paymentStatus: 'deposit-paid',
      $or: [
        { 'jobAssignment.status': { $exists: false } },
        { 'jobAssignment.status': 'unassigned' }
      ]
    }).populate('customer', 'firstName lastName email');
    
    console.log(`📋 Found ${paidBookings.length} bookings with completed payments`);
    
    if (paidBookings.length === 0) {
      console.log('✅ No bookings need job alerts');
      return;
    }
    
    // Process each booking
    for (const booking of paidBookings) {
      console.log(`\n🚀 Processing booking: ${booking._id}`);
      console.log(`   Customer: ${booking.customer.firstName} ${booking.customer.lastName}`);
      console.log(`   From: ${booking.pickupAddress?.city}, ${booking.pickupAddress?.state}`);
      console.log(`   To: ${booking.dropoffAddress?.city}, ${booking.dropoffAddress?.state}`);
      console.log(`   Move Date: ${booking.moveDate}`);
      
      try {
        const result = await jobDistributionService.sendJobAlerts(booking._id);
        console.log(`   ✅ Job alerts sent: ${result.alertsSent} movers notified`);
        console.log(`   📝 Result: ${result.message}`);
      } catch (error) {
        console.error(`   ❌ Failed to send job alerts:`, error.message);
        console.error(`   🔍 Error details:`, {
          message: error.message,
          stack: error.stack
        });
      }
    }
    
    console.log('\n🎯 Script completed!');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await triggerJobAlerts();
  mongoose.connection.close();
  console.log('Database connection closed');
};

main();
