import mongoose from 'mongoose';
import dotenv from 'dotenv';
import stripe from '../config/stripe.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import Mover from '../models/Mover.js';
import Booking from '../models/Booking.js';

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

const syncMissingPayments = async () => {
  try {
    console.log('\n🔄 Syncing missing payments from Stripe...\n');
    
    // Get all payment intents from Stripe (last 30 days)
    const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
    
    console.log('📅 Fetching payment intents from Stripe (last 30 days)...');
    const paymentIntents = await stripe.paymentIntents.list({
      created: { gte: thirtyDaysAgo },
      limit: 100
    });
    
    console.log(`📊 Found ${paymentIntents.data.length} payment intents in Stripe`);
    
    let syncedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const paymentIntent of paymentIntents.data) {
      try {
        // Check if payment already exists in local database
        const existingPayment = await Payment.findOne({
          stripePaymentIntentId: paymentIntent.id
        });
        
        if (existingPayment) {
          console.log(`⏭️  Skipping ${paymentIntent.id} - already exists`);
          skippedCount++;
          continue;
        }
        
        // Only process succeeded payments
        if (paymentIntent.status !== 'succeeded') {
          console.log(`⏭️  Skipping ${paymentIntent.id} - status: ${paymentIntent.status}`);
          skippedCount++;
          continue;
        }
        
        // Extract metadata
        const { userId, userType, paymentType, bookingId } = paymentIntent.metadata || {};
        
        if (!userId || !userType || !paymentType) {
          console.log(`⚠️  Skipping ${paymentIntent.id} - missing metadata`);
          skippedCount++;
          continue;
        }
        
        // Find the user
        let user;
        if (userType === 'customer') {
          user = await User.findById(userId);
        } else if (userType === 'mover') {
          user = await Mover.findById(userId);
        }
        
        if (!user) {
          console.log(`⚠️  Skipping ${paymentIntent.id} - user not found: ${userId}`);
          skippedCount++;
          continue;
        }
        
        // Create payment record
        const paymentData = {
          userId: userId,
          userType: userType,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          type: paymentType,
          status: 'succeeded',
          stripePaymentIntentId: paymentIntent.id,
          stripeCustomerId: paymentIntent.customer,
          metadata: paymentIntent.metadata,
          customer: userType === 'customer' ? userId : undefined,
          mover: userType === 'mover' ? userId : undefined,
          booking: bookingId && bookingId !== 'pending' ? bookingId : undefined
        };
        
        const payment = await Payment.create(paymentData);
        
        // Update booking if this is a booking deposit
        if (paymentType === 'booking-deposit' && bookingId && bookingId !== 'pending') {
          await Booking.findByIdAndUpdate(bookingId, {
            'deposit.paid': true,
            'deposit.paidAt': new Date(),
            'deposit.paymentIntentId': paymentIntent.id,
            paymentStatus: 'deposit-paid'
          });
          console.log(`✅ Updated booking ${bookingId} with deposit payment`);
        }
        
        console.log(`✅ Synced payment ${paymentIntent.id} - $${(paymentIntent.amount / 100).toFixed(2)}`);
        syncedCount++;
        
      } catch (error) {
        console.error(`❌ Error syncing payment ${paymentIntent.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Sync Summary:');
    console.log(`  ✅ Synced: ${syncedCount}`);
    console.log(`  ⏭️  Skipped: ${skippedCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    
    // Check total revenue after sync
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'succeeded' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    console.log(`\n💰 Total Revenue after sync: $${(totalRevenue[0]?.total || 0) / 100}`);
    
  } catch (error) {
    console.error('❌ Error syncing payments:', error);
  }
};

const main = async () => {
  try {
    await connectDB();
    await syncMissingPayments();
    
    console.log('\n✅ Payment sync completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
};

main();
