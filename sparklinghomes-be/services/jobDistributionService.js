import Mover from '../models/Mover.js';
import Booking from '../models/Booking.js';
import JobAlert from '../models/JobAlert.js';
import Notification from '../models/Notification.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendJobAlertEmail, sendJobClaimedEmail, sendBookingCompletedEmail, sendBookingCompletedCleanerEmail } from '../utils/email.js';

class JobDistributionService {
  // Find eligible movers for a job
  async findEligibleMovers(booking) {
    const { pickupAddress, dropoffAddress, servicesRequested, moveDate } = booking;
    
    console.log('📍 Looking for movers for:', {
      pickupAddress,
      dropoffAddress,
      servicesRequested,
      moveDate
    });
    
    console.log('🎯 ZIP Code matching criteria:', {
      pickupZip: pickupAddress?.zipCode,
      dropoffZip: dropoffAddress?.zipCode,
      pickupCity: pickupAddress?.city,
      pickupState: pickupAddress?.state,
      dropoffCity: dropoffAddress?.city,
      dropoffState: dropoffAddress?.state
    });
    
    // Build query for eligible movers
    let query = {
      status: 'approved',
      isActive: true,
      subscriptionStatus: 'active',
      'subscriptionExpiresAt': { $gt: new Date() }
    };
    
    // Simple ZIP code matching only
    const locationQuery = {
      $or: [
        { 'serviceAreas.zipCode': pickupAddress.zipCode },
        { 'serviceAreas.zipCode': dropoffAddress.zipCode },
        { 'address.zipCode': pickupAddress.zipCode },
        { 'address.zipCode': dropoffAddress.zipCode }
      ]
    };
    
    // Simple query - just combine base query with ZIP code matching
    query = {
      ...query,
      ...locationQuery
    };
    
    // Find movers and sort by rating and distance
    console.log('🔍 Final query for eligible movers:', JSON.stringify(query, null, 2));
    
    const movers = await Mover.find(query)
      .select('_id businessName rating serviceAreas pricing availability address services email phone')
      .sort({ 'rating.average': -1, 'rating.count': -1 })
      .limit(20); // Limit to top 20 movers
    
    console.log(`🎯 Found ${movers.length} eligible movers:`);
    movers.forEach(m => {
      console.log(`  - ${m.businessName}:`);
      console.log(`    Business Address: ${m.address?.city}, ${m.address?.state} ${m.address?.zipCode}`);
      console.log(`    Service Areas: ${m.serviceAreas?.map(sa => `${sa.city || 'N/A'}, ${sa.state || 'N/A'} ${sa.zipCode || 'N/A'}`).join('; ') || 'Not defined'}`);
      console.log(`    Services: ${m.services?.join(', ') || 'Not defined'}`);
      console.log(`    Rating: ${m.rating?.average || 'N/A'} (${m.rating?.count || 0} reviews)`);
    });
    
    return movers;
  }
  
  // Send job alerts to eligible movers
  async sendJobAlerts(bookingId) {
    console.log('🚀 sendJobAlerts called for booking:', bookingId);
    
    const booking = await Booking.findById(bookingId)
      .populate('customer', 'firstName lastName email phone');
    
    console.log('📋 Found booking:', {
      id: booking?._id,
      status: booking?.status,
      canBeAssigned: booking?.canBeAssigned,
      pickupAddress: booking?.pickupAddress,
      dropoffAddress: booking?.dropoffAddress,
      servicesRequested: booking?.servicesRequested
    });
    
    if (!booking || !booking.canBeAssigned) {
      throw new Error('Booking not eligible for job alerts');
    }
    
    console.log('🔍 Finding eligible movers...');
    const eligibleMovers = await this.findEligibleMovers(booking);
    
    if (eligibleMovers.length === 0) {
      // No eligible movers found - mark as unassignable
      await Booking.findByIdAndUpdate(bookingId, {
        'jobAssignment.status': 'unassigned',
        'jobAssignment.expiresAt': new Date(Date.now() + 24 * 60 * 60 * 1000) // Extend by 24 hours
      });
      
      // Only notify customer if customer exists
      if (booking.customer && booking.customer._id) {
        await this.createNotification({
          recipient: booking.customer._id,
          recipientType: 'User',
          type: 'system-alert',
          title: 'No Movers Available',
          message: 'We couldn\'t find available movers in your area for your requested date. We\'ll keep looking and notify you when movers become available.',
          relatedId: bookingId,
          relatedModel: 'Booking',
          priority: 'medium'
        });
      }
      
      return { alertsSent: 0, message: 'No eligible movers found' };
    }
    
    // Create job alerts for each eligible mover
    const jobAlerts = [];
    const notifications = [];
    
    for (const mover of eligibleMovers) {
      // Skip if mover is null or doesn't have an ID
      if (!mover || !mover._id) {
        console.warn('⚠️ Skipping null or invalid mover:', mover);
        continue;
      }
      
      // Create job alert
      const jobAlert = new JobAlert({
        booking: bookingId,
        mover: mover._id,
        status: 'sent',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expires in 24 hours
      });
      
      // Create notification
      const notification = new Notification({
        recipient: mover._id,
        recipientType: 'Mover',
        type: 'job-alert',
        title: 'New Job Alert!',
        message: `New moving job in ${booking.pickupAddress.city}, ${booking.pickupAddress.state} on ${new Date(booking.moveDate).toLocaleDateString()}`,
        relatedId: bookingId,
        relatedModel: 'Booking',
        priority: 'high',
        metadata: {
          moveDate: booking.moveDate,
          pickupCity: booking.pickupAddress.city,
          pickupState: booking.pickupAddress.state,
          homeSize: booking.homeSize,
          estimatedDuration: booking.estimatedDuration
        }
      });
      
      jobAlerts.push(jobAlert);
      notifications.push(notification);
    }
    
    // Save all job alerts and notifications
    await JobAlert.insertMany(jobAlerts);
    await Notification.insertMany(notifications);
    
    // Update booking status
    await Booking.findByIdAndUpdate(bookingId, {
      'jobAssignment.status': 'alerted',
      'jobAssignment.alertsSent': eligibleMovers.length,
      'jobAssignment.lastAlertSent': new Date()
    });
    
    // Send email notifications to movers
    for (const mover of eligibleMovers) {
      try {
        await sendJobAlertEmail(booking, mover);
        console.log(`✅ Job alert email sent to mover: ${mover.email}`);
      } catch (emailError) {
        console.error(`❌ Failed to send job alert email to ${mover.email}:`, emailError);
        // Continue with other movers even if one fails
      }
    }
    
    return {
      alertsSent: eligibleMovers.length,
      moversNotified: eligibleMovers.map(m => m._id),
      message: `Job alerts sent to ${eligibleMovers.length} movers`
    };
  }
  
  // Handle mover response to job alert
  async handleMoverResponse(jobAlertId, response) {
    const jobAlert = await JobAlert.findById(jobAlertId)
      .populate({
        path: 'booking',
        select: 'customer customerInfo mover status jobAssignment quote',
        populate: {
          path: 'customer',
          select: 'firstName lastName email phone'
        }
      })
      .populate('mover', 'businessName email phone');
    
    if (!jobAlert) {
      throw new Error('Job alert not found');
    }
    
    if (jobAlert.status !== 'sent') {
      throw new Error('Job alert already responded to');
    }
    
    const { interested, message, estimatedTime } = response;
    
    // Update job alert
    jobAlert.status = interested ? 'claimed' : 'not-interested';
    jobAlert.response = {
      interested,
      responseTime: new Date(),
      message,
      estimatedTime
    };
    jobAlert.respondedAt = new Date();
    
    await jobAlert.save();
    
    if (interested) {
      // Mover claimed the job - assign it to them
      await this.assignJobToMover(jobAlert.booking._id, jobAlert.mover._id);
      
      // Determine customer details
      const customerId = jobAlert.booking.customer?._id || jobAlert.booking.customer;
      const customerName = jobAlert.booking.customer?.firstName 
        ? `${jobAlert.booking.customer.firstName} ${jobAlert.booking.customer.lastName}`
        : jobAlert.booking.customerInfo?.firstName 
        ? `${jobAlert.booking.customerInfo.firstName} ${jobAlert.booking.customerInfo.lastName}`
        : 'Customer';
      
      const customerEmail = jobAlert.booking.customer?.email || jobAlert.booking.customerInfo?.email;
      
      // Only create customer notification if we have a valid customer ID
      if (customerId) {
        await this.createNotification({
          recipient: customerId,
          recipientType: 'User',
          type: 'job-claimed',
          title: 'Mover Assigned!',
          message: `${jobAlert.mover.businessName} has claimed your job and will contact you within 24 hours to confirm details.`,
          relatedId: jobAlert.booking._id,
          relatedModel: 'Booking',
          priority: 'high'
        });
      } else {
        console.warn('⚠️ Could not create customer notification - no valid customer ID found for booking:', jobAlert.booking._id);
      }
      
      // Send email to customer with mover details
      if (customerEmail) {
        try {
          const jobAmount = jobAlert.booking?.quote?.subtotal - (jobAlert.booking?.deposit?.amount / 100);
          await sendJobClaimedEmail({
            customerName,
            customerEmail,
            moverName: jobAlert.mover?.businessName || 'Professional Mover',
            moverEmail: jobAlert.mover?.email || '',
            moverPhone: jobAlert.mover?.phone || '',
            moverMessage: message || '',
            estimatedTime: estimatedTime || '',
            jobAmount: jobAmount,
            bookingId: jobAlert.booking._id
          });
          console.log('✅ Job claimed email sent to customer:', customerEmail);
        } catch (emailError) {
          console.error('❌ Failed to send job claimed email to customer:', emailError);
          // Continue with process even if email fails
        }
      } else {
        console.warn('⚠️ Could not send job claimed email - no customer email found');
      }
      
      // Notify mover
      if (jobAlert.mover && jobAlert.mover._id) {
        await this.createNotification({
          recipient: jobAlert.mover._id,
          recipientType: 'Mover',
          type: 'job-claimed',
          title: 'Job Claimed Successfully!',
          message: `You have successfully claimed this job. Please contact the customer within 24 hours to confirm details.`,
          relatedId: jobAlert.booking._id,
          relatedModel: 'Booking',
          priority: 'high'
        });
      } else {
        console.warn('⚠️ Could not create mover notification - no valid mover ID found for job alert:', jobAlertId);
      }
    }
    
    return jobAlert;
  }
  
  // Mark job as completed
  async markJobCompleted(jobAlertId) {
    const jobAlert = await JobAlert.findById(jobAlertId)
      .populate({
        path: 'booking',
        select: 'customer customerInfo mover status moveDate pickupAddress dropoffAddress quote',
        populate: {
          path: 'customer',
          select: 'firstName lastName email phone'
        }
      })
      .populate('mover', 'businessName email phone');
    
    if (!jobAlert) {
      throw new Error('Job alert not found');
    }
    
    if (jobAlert.status !== 'claimed') {
      throw new Error('Job must be claimed before it can be marked as completed');
    }
    
    // Update job alert status
    jobAlert.status = 'completed';
    jobAlert.completedAt = new Date();
    
    await jobAlert.save();
    
    // Update booking status to completed
    if (jobAlert.booking) {
      jobAlert.booking.status = 'completed';
      await jobAlert.booking.save();
    }
    
    // Prepare completion data for emails
    const customerId = jobAlert.booking?.customer?._id || jobAlert.booking?.customer;
    const customerName = jobAlert.booking?.customer?.firstName 
      ? `${jobAlert.booking.customer.firstName} ${jobAlert.booking.customer.lastName}`
      : jobAlert.booking?.customerInfo?.firstName 
      ? `${jobAlert.booking.customerInfo.firstName} ${jobAlert.booking.customerInfo.lastName}`
      : 'Customer';
    
    const customerEmail = jobAlert.booking?.customer?.email || jobAlert.booking?.customerInfo?.email;
    const moverName = jobAlert.mover?.businessName || 'Mover';
    const moverEmail = jobAlert.mover?.email;
    
    // Prepare completion email data with proper null checks
    const completionData = {
      bookingId: jobAlert.booking._id,
      customerName,
      customerEmail,
      moverName,
      moverEmail,
      moverPhone: jobAlert.mover?.phone || '',
      moveDate: jobAlert.booking?.moveDate ? new Date(jobAlert.booking.moveDate).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }) : 'Date not specified',
      completionDate: new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      fromLocation: (jobAlert.booking?.pickupAddress?.city && jobAlert.booking?.pickupAddress?.state) ? 
        `${jobAlert.booking.pickupAddress.city}, ${jobAlert.booking.pickupAddress.state}` : 'Location not specified',
      toLocation: (jobAlert.booking?.dropoffAddress?.city && jobAlert.booking?.dropoffAddress?.state) ? 
        `${jobAlert.booking.dropoffAddress.city}, ${jobAlert.booking.dropoffAddress.state}` : 'Location not specified',
      paymentAmount: jobAlert.booking?.quote?.subtotal || null
    };
    
    // Send completion emails
    if (customerEmail) {
      try {
        await sendBookingCompletedEmail(completionData);
        console.log('✅ Booking completion email sent to customer:', customerEmail);
      } catch (emailError) {
        console.error('❌ Failed to send booking completion email to customer:', emailError);
      }
    }
    
    if (moverEmail) {
      try {
        await sendBookingCompletedCleanerEmail(completionData);
        console.log('✅ Booking completion email sent to cleaner:', moverEmail);
      } catch (emailError) {
        console.error('❌ Failed to send booking completion email to cleaner:', emailError);
      }
    }
    
    // Notify customer about job completion
    if (customerId) {
      await this.createNotification({
        recipient: customerId,
        recipientType: 'User',
        type: 'job-completed',
        title: 'Move Completed!',
        message: `${jobAlert.mover.businessName} has completed your move. We hope everything went smoothly!`,
        relatedId: jobAlert.booking._id,
        relatedModel: 'Booking',
        priority: 'medium'
      });
    }
    
    // Notify mover about successful completion
    if (jobAlert.mover && jobAlert.mover._id) {
      await this.createNotification({
        recipient: jobAlert.mover._id,
        recipientType: 'Mover',
        type: 'job-completed',
        title: 'Job Completed Successfully!',
        message: `You have successfully completed this moving job. Great work!`,
        relatedId: jobAlert.booking._id,
        relatedModel: 'Booking',
        priority: 'low'
      });
    }
    
    console.log('✅ Job marked as completed:', jobAlertId);
    return jobAlert;
  }
  
  // Assign job to a specific mover
  async assignJobToMover(bookingId, moverId) {
    const [booking, mover] = await Promise.all([
      Booking.findById(bookingId),
      Mover.findById(moverId)
    ]);
    
    if (!booking || !mover) {
      throw new Error('Booking or mover not found');
    }
    
    // Update booking
    booking.mover = moverId;
    booking.status = 'in-progress';
    booking.jobAssignment.status = 'assigned';
    booking.jobAssignment.assignedAt = new Date();
    booking.jobAssignment.assignedByType = 'system';
    // Note: assignedBy is undefined for system assignments since it expects ObjectId
    
    await booking.save();
    
    // Cancel other pending job alerts for this booking
    await JobAlert.updateMany(
      { 
        booking: bookingId, 
        status: 'sent',
        mover: { $ne: moverId }
      },
      { status: 'not-interested' }
    );
    
    return booking;
  }
  
  // Process expired job assignments
  async processExpiredAssignments() {
    const expiredBookings = await Booking.find({
      'jobAssignment.expiresAt': { $lt: new Date() },
      'jobAssignment.status': { $in: ['unassigned', 'alerted'] }
    });
    
    for (const booking of expiredBookings) {
      if (booking.jobAssignment.status === 'alerted') {
        // Try to send alerts to more movers
        await this.sendJobAlerts(booking._id);
      } else {
        // Mark as expired and notify customer
        await Booking.findByIdAndUpdate(booking._id, {
          'jobAssignment.status': 'expired'
        });
        
        await this.createNotification({
          recipient: booking.customer._id,
          recipientType: 'User',
          type: 'system-alert',
          title: 'Job Assignment Expired',
          message: 'We couldn\'t find a mover for your job within the expected timeframe. Please try adjusting your requirements or contact support.',
          relatedId: booking._id,
          relatedModel: 'Booking',
          priority: 'high'
        });
      }
    }
    
    return expiredBookings.length;
  }
  
  // Create notification helper
  async createNotification(notificationData) {
    const notification = new Notification(notificationData);
    await notification.save();
    return notification;
  }
  
  // Get available jobs for a mover
  async getAvailableJobsForMover(moverId) {
    const mover = await Mover.findById(moverId);
    if (!mover || mover.subscriptionStatus !== 'active') {
      return [];
    }
    
    // Find jobs in mover's service areas
    const serviceAreaQuery = {
      $or: mover.serviceAreas.map(area => ({
        $or: [
          { 'pickupAddress.zipCode': area.zipCode },
          { 'dropoffAddress.zipCode': area.zipCode },
          {
            'pickupAddress.city': { $regex: area.city, $options: 'i' },
            'pickupAddress.state': area.state
          },
          {
            'dropoffAddress.city': { $regex: area.city, $options: 'i' },
            'dropoffAddress.state': area.state
          }
        ]
      }))
    };
    
    const jobs = await Booking.find({
      ...serviceAreaQuery,
      status: 'pending-assignment',
      'jobAssignment.status': 'unassigned',
      'deposit.paid': true,
      moveDate: { $gte: new Date() }
    }).populate('customer', 'firstName lastName');
    
    return jobs;
  }
}

export default new JobDistributionService();
