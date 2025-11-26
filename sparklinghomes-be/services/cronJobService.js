import cron from 'node-cron';
import jobDistributionService from './jobDistributionService.js';
import Booking from '../models/Booking.js';
import Mover from '../models/Mover.js';
import JobAlert from '../models/JobAlert.js';

class CronJobService {
  constructor() {
    this.jobs = [];
    this.isRunning = false;
  }

  // Initialize all cron jobs
  async init() {
    if (this.isRunning) {
      console.log('⚠️ Cron jobs already running');
      return;
    }

    console.log('🚀 Starting cron jobs...');
    
    // Run job distribution immediately on startup
    console.log('🚀 Running job distribution immediately on startup...');
    await this.processNewBookingsForJobAlerts();
    
    // Job Distribution Cron - Every 2 minutes
    const jobDistributionCron = cron.schedule('*/2 * * * *', async () => {
      await this.processNewBookingsForJobAlerts();
    }, {
      scheduled: false,
      timezone: "America/New_York"
    });

    // Expired Job Alerts Cleanup - Every 15 minutes
    const expiredAlertsCleanup = cron.schedule('*/15 * * * *', async () => {
      //await this.cleanupExpiredJobAlerts();
    }, {
      scheduled: false,
      timezone: "America/New_York"
    });

    // Process Expired Assignments - Every 30 minutes
    const expiredAssignmentsCron = cron.schedule('*/30 * * * *', async () => {
      //await this.processExpiredAssignments();
    }, {
      scheduled: false,
      timezone: "America/New_York"
    });

    // Unpaid Bookings Cleanup - Every thirty minutes
    const unpaidBookingsCleanup = cron.schedule('*/30 * * * *', async () => {
      await this.cleanupUnpaidBookings();
    }, {
      scheduled: false,
      timezone: "America/New_York"
    });

    // Long-Distance Bookings Processing - Every 5 minutes
    const longDistanceProcessing = cron.schedule('*/5 * * * *', async () => {
      await this.processLongDistanceBookings();
    }, {
      scheduled: false,
      timezone: "America/New_York"
    });

    this.jobs = [
      { name: 'Job Distribution', cron: jobDistributionCron },
      { name: 'Expired Alerts Cleanup', cron: expiredAlertsCleanup },
      { name: 'Expired Assignments', cron: expiredAssignmentsCron },
      { name: 'Unpaid Bookings Cleanup', cron: unpaidBookingsCleanup },
      { name: 'Long-Distance Processing', cron: longDistanceProcessing }
    ];

    // Start all cron jobs
    this.jobs.forEach(job => {
      job.cron.start();
      console.log(`✅ Started cron job: ${job.name}`);
    });

    this.isRunning = true;
    console.log('🎯 All cron jobs started successfully!');
  }

  // Stop all cron jobs
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Cron jobs are not running');
      return;
    }

    this.jobs.forEach(job => {
      job.cron.stop();
      console.log(`🛑 Stopped cron job: ${job.name}`);
    });

    this.isRunning = false;
    console.log('🔴 All cron jobs stopped');
  }

  // Process new bookings that need job alerts
  async processNewBookingsForJobAlerts() {
    const startTime = new Date();
    try {
      console.log(`\n🔍 [CRON ${startTime.toISOString()}] Checking for new bookings that need job alerts...`);
      
      // Find bookings that:
      // 1. Have paid deposits
      // 2. Don't have job alerts sent yet OR are unassigned
      // 3. Move date is in the future
      // 4. Are eligible for assignment
      // 5. Are NOT long-distance moves (long-distance handled separately)
      const eligibleBookings = await Booking.find({
        'deposit.paid': true,
        paymentStatus: 'deposit-paid',
        moveDate: { $gte: new Date() }, // Future moves only
        status: { $in: ['confirmed', 'pending-assignment'] },
        moveType: { $ne: 'long-distance' }, // Exclude long-distance bookings
        $or: [
          { 'jobAssignment.status': { $exists: false } },
          { 'jobAssignment.status': 'unassigned' },
          { 
            'jobAssignment.status': 'alerted',
            'jobAssignment.lastAlertSent': { 
              $lt: new Date(Date.now() - 2 * 60 * 60 * 1000) // Re-alert after 2 hours
            }
          }
        ]
      }).populate('customer', 'firstName lastName email');

      console.log(`📋 [CRON] Found ${eligibleBookings.length} bookings needing job alerts`);

      if (eligibleBookings.length === 0) {
        console.log('✅ [CRON] No bookings need job alerts at this time');
        return;
      }

      let alertsSent = 0;
      let errors = 0;

      // Process each booking
      for (const booking of eligibleBookings) {
        try {
          console.log(`\n🚀 [CRON] Processing booking: ${booking._id}`);
          console.log(`   Customer: ${booking.customer?.firstName} ${booking.customer?.lastName} (${booking.customerInfo?.firstName} ${booking.customerInfo?.lastName})`);
          console.log(`   From: ${booking.pickupAddress?.city}, ${booking.pickupAddress?.state} (${booking.pickupAddress?.zipCode})`);
          console.log(`   To: ${booking.dropoffAddress?.city}, ${booking.dropoffAddress?.state} (${booking.dropoffAddress?.zipCode})`);
          console.log(`   Move Date: ${booking.moveDate}`);
          console.log(`   Services: ${booking.servicesRequested?.join(', ')}`);

          // Check if we already sent alerts recently (avoid spam)
          const recentAlerts = await JobAlert.find({
            booking: booking._id,
            sentAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // Last 30 minutes
          });

          if (recentAlerts.length > 0) {
            console.log(`   ⏭️ Skipping - alerts sent recently (${recentAlerts.length} alerts in last 30 min)`);
            continue;
          }

          // Send job alerts using the existing service (which now has improved ZIP code matching)
          const result = await jobDistributionService.sendJobAlerts(booking._id);
          console.log(`   ✅ Job alerts sent: ${result.alertsSent} movers notified`);
          console.log(`   📝 Result: ${result.message}`);
          
          alertsSent += result.alertsSent || 0;

        } catch (error) {
          console.error(`   ❌ Failed to process booking ${booking._id}:`, error.message);
          errors++;
        }
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      console.log(`\n🎯 [CRON ${endTime.toISOString()}] Job alerts processing completed:`);
      console.log(`   📊 Bookings processed: ${eligibleBookings.length}`);
      console.log(`   ✅ Total alerts sent: ${alertsSent}`);
      console.log(`   ❌ Errors: ${errors}`);
      console.log(`   ⏱️ Duration: ${duration}ms`);

    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      console.error(`❌ [CRON ${endTime.toISOString()}] Error in processNewBookingsForJobAlerts (${duration}ms):`, error);
    }
  }

  // Cleanup expired job alerts
  async cleanupExpiredJobAlerts() {
    const startTime = new Date();
    try {
      console.log(`\n🧹 [CRON ${startTime.toISOString()}] Cleaning up expired job alerts...`);
      
      const expiredAlerts = await JobAlert.find({
        expiresAt: { $lt: new Date() },
        status: 'sent'
      });

      if (expiredAlerts.length > 0) {
        await JobAlert.updateMany(
          {
            expiresAt: { $lt: new Date() },
            status: 'sent'
          },
          { status: 'expired' }
        );

        console.log(`🗑️ [CRON ${new Date().toISOString()}] Cleaned up ${expiredAlerts.length} expired job alerts`);
      } else {
        console.log(`✅ [CRON ${new Date().toISOString()}] No expired job alerts to clean up`);
      }

    } catch (error) {
      console.error(`❌ [CRON ${new Date().toISOString()}] Error in cleanupExpiredJobAlerts:`, error);
    }
  }

  // Process expired assignments
  async processExpiredAssignments() {
    const startTime = new Date();
    try {
      console.log(`\n⏰ [CRON ${startTime.toISOString()}] Processing expired job assignments...`);
      
      const processedCount = await jobDistributionService.processExpiredAssignments();
      
      if (processedCount > 0) {
        console.log(`🔄 [CRON ${new Date().toISOString()}] Processed ${processedCount} expired assignments`);
      } else {
        console.log(`✅ [CRON ${new Date().toISOString()}] No expired assignments to process`);
      }

    } catch (error) {
      console.error(`❌ [CRON ${new Date().toISOString()}] Error in processExpiredAssignments:`, error);
    }
  }

  // Cleanup unpaid bookings after 10 minutes
  async cleanupUnpaidBookings() {
    try {
      console.log(`🧹 [CRON ${new Date().toISOString()}] Cleaning up unpaid bookings...`);
      
      // Find bookings that are unpaid and older than 10 minutes
      // Exclude long-distance bookings as they don't require immediate payment
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const unpaidBookings = await Booking.find({
        paymentStatus: { $ne: 'deposit-paid' },
        createdAt: { $lt: thirtyMinutesAgo },
        status: { $in: ['pending', 'confirmed'] },
        moveType: { $ne: 'long-distance' } // Exclude long-distance bookings
      }).populate('customer', 'firstName lastName email');

      console.log(`📋 [CRON] Found ${unpaidBookings.length} unpaid bookings to clean up`);

      if (unpaidBookings.length === 0) {
        console.log(`✅ [CRON ${new Date().toISOString()}] No unpaid bookings to clean up`);
        return;
      }

      const { sendEmail, emailTemplates } = await import('../utils/email.js');

      for (const booking of unpaidBookings) {
        try {
          // Send cancellation email to customer
          const customerEmail = booking.customer?.email || booking.customerInfo?.email;
          if (customerEmail) {
            await sendEmail(customerEmail, emailTemplates.bookingCancellation, {
              customerName: booking.customer ? `${booking.customer.firstName} ${booking.customer.lastName}` : `${booking.customerInfo.firstName} ${booking.customerInfo.lastName}`,
              bookingId: booking._id,
              reason: 'Payment was not completed within 10 minutes',
              moveDate: booking.moveDate,
              pickupAddress: booking.pickupAddress,
              dropoffAddress: booking.dropoffAddress
            });
            console.log(`📧 Sent cancellation email to: ${customerEmail}`);
          }

          // Delete the booking
          await Booking.findByIdAndDelete(booking._id);
          console.log(`🗑️ Deleted unpaid booking: ${booking._id}`);

        } catch (error) {
          console.error(`❌ Failed to cleanup booking ${booking._id}:`, error);
        }
      }

      console.log(`✅ [CRON ${new Date().toISOString()}] Cleaned up ${unpaidBookings.length} unpaid bookings`);

    } catch (error) {
      console.error(`❌ [CRON ${new Date().toISOString()}] Error in cleanupUnpaidBookings:`, error);
    }
  }

  // Process long-distance bookings
  async processLongDistanceBookings() {
    const startTime = new Date();
    try {
      console.log(`\n🚚 [CRON ${startTime.toISOString()}] Processing long-distance bookings...`);
      
      // Find long-distance bookings that need processing
      const longDistanceBookings = await Booking.find({
        moveType: 'long-distance',
        status: { $in: ['pending', 'confirmed', 'pending-assignment'] },
        moveDate: { $gte: new Date() }, // Future moves only
        $or: [
          { 'longDistanceProcessed': { $exists: false } },
          { 'longDistanceProcessed': false }
        ]
      }).populate('customer', 'firstName lastName email');

      console.log(`📋 [CRON] Found ${longDistanceBookings.length} long-distance bookings to process`);

      if (longDistanceBookings.length === 0) {
        console.log('✅ [CRON] No long-distance bookings need processing at this time');
        return;
      }

      const { sendEmail, emailTemplates } = await import('../utils/email.js');
      let processedCount = 0;
      let errors = 0;

      for (const booking of longDistanceBookings) {
        try {
          console.log(`\n🚚 [CRON] Processing long-distance booking: ${booking._id}`);
          console.log(`   Customer: ${booking.customer?.firstName} ${booking.customer?.lastName} (${booking.customerInfo?.firstName} ${booking.customerInfo?.lastName})`);
          console.log(`   From: ${booking.pickupAddress?.city}, ${booking.pickupAddress?.state} (${booking.pickupAddress?.zipCode})`);
          console.log(`   To: ${booking.dropoffAddress?.city}, ${booking.dropoffAddress?.state} (${booking.dropoffAddress?.zipCode})`);
          console.log(`   Move Date: ${booking.moveDate}`);

          // Send long-distance booking confirmation to customer
          const customerEmail = booking.customer?.email || booking.customerInfo?.email;
          if (customerEmail) {
            await sendEmail(customerEmail, emailTemplates.longDistanceBookingConfirmation, {
              customerName: booking.customer ? `${booking.customer.firstName} ${booking.customer.lastName}` : `${booking.customerInfo.firstName} ${booking.customerInfo.lastName}`,
              bookingId: booking._id,
              moveDate: booking.moveDate,
              pickupAddress: booking.pickupAddress,
              dropoffAddress: booking.dropoffAddress,
              homeSize: booking.homeSize,
              servicesRequested: booking.servicesRequested
            });
            console.log(`📧 Sent long-distance confirmation email to customer: ${customerEmail}`);
          }

          // Send notification to support team
          await sendEmail('support@bookandmove.com', emailTemplates.longDistanceBookingNotification, {
            customerName: booking.customer ? `${booking.customer.firstName} ${booking.customer.lastName}` : `${booking.customerInfo.firstName} ${booking.customerInfo.lastName}`,
            customerEmail: customerEmail,
            customerPhone: booking.customer?.phone || booking.customerInfo?.phone,
            bookingId: booking._id,
            moveDate: booking.moveDate,
            pickupAddress: booking.pickupAddress,
            dropoffAddress: booking.dropoffAddress,
            homeSize: booking.homeSize,
            servicesRequested: booking.servicesRequested,
            items: booking.items
          });
          console.log(`📧 Sent long-distance notification email to support team`);

          // Mark booking as processed
          await Booking.findByIdAndUpdate(booking._id, {
            longDistanceProcessed: true,
            status: 'pending-assignment' // Set appropriate status
          });

          processedCount++;
          console.log(`✅ Processed long-distance booking: ${booking._id}`);

        } catch (error) {
          console.error(`❌ Failed to process long-distance booking ${booking._id}:`, error.message);
          errors++;
        }
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      console.log(`\n🎯 [CRON ${endTime.toISOString()}] Long-distance bookings processing completed:`);
      console.log(`   📊 Bookings processed: ${processedCount}`);
      console.log(`   ❌ Errors: ${errors}`);
      console.log(`   ⏱️ Duration: ${duration}ms`);

    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      console.error(`❌ [CRON ${endTime.toISOString()}] Error in processLongDistanceBookings (${duration}ms):`, error);
    }
  }

  // Get status of all cron jobs
  getStatus() {
    return {
      isRunning: this.isRunning,
      jobs: this.jobs.map(job => ({
        name: job.name,
        running: job.cron.running
      }))
    };
  }
}

export default new CronJobService();
