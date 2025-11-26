import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const checkPayments = async () => {
  try {
    console.log('\n🔍 Checking Payment Records...\n');
    
    // Check total payments
    const totalPayments = await Payment.countDocuments();
    console.log(`📊 Total Payments: ${totalPayments}`);
    
    // Check payments by status
    const paymentsByStatus = await Payment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📈 Payments by Status:');
    paymentsByStatus.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count} payments, $${(stat.totalAmount / 100).toFixed(2)} total`);
    });
    
    // Check payments by type
    const paymentsByType = await Payment.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n🏷️  Payments by Type:');
    paymentsByType.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count} payments, $${(stat.totalAmount / 100).toFixed(2)} total`);
    });
    
    // Check recent payments
    const recentPayments = await Payment.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('customer', 'firstName lastName email')
      .populate('mover', 'businessName email');
    
    console.log('\n🕒 Recent Payments (Last 10):');
    recentPayments.forEach((payment, index) => {
      const customerName = payment.customer ? 
        `${payment.customer.firstName} ${payment.customer.lastName}` :
        payment.mover ? payment.mover.businessName : 'Unknown';
      
      console.log(`  ${index + 1}. $${(payment.amount / 100).toFixed(2)} - ${payment.type} - ${customerName} - ${payment.status}`);
    });
    
    // Check total revenue calculation
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'succeeded' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    console.log(`\n💰 Total Revenue (succeeded payments): $${(totalRevenue[0]?.total || 0) / 100}`);
    
    // Check if there are any payments without proper user references
    const orphanedPayments = await Payment.find({
      $or: [
        { customer: { $exists: false } },
        { customer: null },
        { mover: { $exists: false } },
        { mover: null }
      ]
    });
    
    if (orphanedPayments.length > 0) {
      console.log(`\n⚠️  Found ${orphanedPayments.length} payments without proper user references:`);
      orphanedPayments.forEach(payment => {
        console.log(`  Payment ID: ${payment._id}, Amount: $${(payment.amount / 100).toFixed(2)}, Type: ${payment.type}`);
      });
    }
    
    // Check bookings with deposits
    const bookingsWithDeposits = await Booking.find({
      'deposit.paid': true
    }).populate('customer', 'firstName lastName');
    
    console.log(`\n📋 Bookings with Paid Deposits: ${bookingsWithDeposits.length}`);
    bookingsWithDeposits.forEach(booking => {
      console.log(`  ${booking.customer.firstName} ${booking.customer.lastName}: $${(booking.deposit.amount / 100).toFixed(2)}`);
    });
    
    // Check for any Stripe payment intents that might not have been recorded
    console.log('\n🔍 Checking for potential missing payment records...');
    
    // This would require Stripe API access to check for payment intents
    // For now, we'll check if there are any discrepancies
    
    const totalAmountInPayments = await Payment.aggregate([
      { $match: { status: 'succeeded' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const totalAmountInBookings = await Booking.aggregate([
      { $match: { 'deposit.paid': true } },
      { $group: { _id: null, total: { $sum: '$deposit.amount' } } }
    ]);
    
    const paymentsTotal = totalAmountInPayments[0]?.total || 0;
    const bookingsTotal = totalAmountInBookings[0]?.total || 0;
    
    console.log(`\n📊 Amount Comparison:`);
    console.log(`  Total in Payments: $${(paymentsTotal / 100).toFixed(2)}`);
    console.log(`  Total in Bookings: $${(bookingsTotal / 100).toFixed(2)}`);
    console.log(`  Difference: $${Math.abs(paymentsTotal - bookingsTotal) / 100}`);
    
    if (Math.abs(paymentsTotal - bookingsTotal) > 0) {
      console.log('\n⚠️  There might be a discrepancy between payments and bookings!');
    }
    
  } catch (error) {
    console.error('❌ Error checking payments:', error);
  }
};

const main = async () => {
  try {
    await connectDB();
    await checkPayments();
    
    console.log('\n✅ Payment check completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
};

main();
