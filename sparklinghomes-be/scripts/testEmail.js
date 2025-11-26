import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { sendBookingConfirmationEmail } from '../utils/email.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';

dotenv.config();

const testEmail = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    // Get a recent booking with payment
    const booking = await Booking.findById('6925fa4d64f53be9ea46550f');

    if (!booking) {
      console.log('Booking not found');
      process.exit(1);
    }

    console.log('\n📧 Testing email send:');
    console.log('Booking ID:', booking._id.toString());
    console.log('Customer Email:', booking.customerInfo.email);
    console.log('Customer Name:', booking.customerInfo.firstName, booking.customerInfo.lastName);
    console.log('Service Date:', booking.moveDate);
    console.log('Address:', booking.pickupAddress.street);

    // Check if payment exists
    const payment = await Payment.findOne({ booking: booking._id });
    console.log('\n💳 Payment Status:');
    console.log('Payment exists:', !!payment);
    if (payment) {
      console.log('Payment Type:', payment.type);
      console.log('Payment Status:', payment.status);
      console.log('Email Sent Flag:', payment.emailSent || false);
    }

    // Try sending the email
    console.log('\n📤 Sending booking confirmation email...');
    await sendBookingConfirmationEmail(booking);
    console.log('✅ Email sent successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
};

testEmail();
