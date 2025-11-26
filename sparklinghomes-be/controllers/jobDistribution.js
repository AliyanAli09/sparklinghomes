import { catchAsync } from '../utils/catchAsync.js';
import jobDistributionService from '../services/jobDistributionService.js';
import JobAlert from '../models/JobAlert.js';
import Notification from '../models/Notification.js';

// @desc    Get available jobs for mover
// @route   GET /api/jobs/available
// @access  Private (Mover only)
export const getAvailableJobs = catchAsync(async (req, res) => {
  const jobs = await jobDistributionService.getAvailableJobsForMover(req.user._id);
  
  res.status(200).json({
    status: 'success',
    results: jobs.length,
    data: {
      jobs
    }
  });
});

// @desc    Get job alerts for mover
// @route   GET /api/jobs/alerts
// @access  Private (Mover only)
export const getJobAlerts = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  
  const query = { mover: req.user._id };
  if (status) {
    query.status = status;
  }
  
  const skip = (page - 1) * limit;
  
  const [jobAlerts, total] = await Promise.all([
    JobAlert.find(query)
      .populate({
        path: 'booking',
        select: 'pickupAddress dropoffAddress moveDate moveTime homeSize estimatedDuration servicesRequested customer customerInfo quote deposit paymentStatus status totalCost specialInstructions',
        populate: {
          path: 'customer',
          select: 'firstName lastName email phone'
        }
      })
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    JobAlert.countDocuments(query)
  ]);
  
  res.status(200).json({
    status: 'success',
    results: jobAlerts.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    },
    data: {
      jobAlerts
    }
  });
});

// @desc    Respond to job alert
// @route   POST /api/jobs/alerts/:id/respond
// @access  Private (Mover only)
export const respondToJobAlert = catchAsync(async (req, res) => {
  const { interested, message, estimatedPrice, estimatedTime } = req.body;
  
  // Verify the job alert belongs to this mover
  const jobAlert = await JobAlert.findById(req.params.id);
  if (!jobAlert || jobAlert.mover.toString() !== req.user._id.toString()) {
    return res.status(404).json({
      status: 'error',
      message: 'Job alert not found'
    });
  }
  
  const response = await jobDistributionService.handleMoverResponse(
    req.params.id,
    { interested, message, estimatedPrice, estimatedTime }
  );
  
  res.status(200).json({
    status: 'success',
    data: {
      jobAlert: response
    }
  });
});

// @desc    Mark job as completed
// @route   PUT /api/jobs/alerts/:id/complete
// @access  Private (Mover only)
export const markJobCompleted = catchAsync(async (req, res) => {
  // Verify the job alert belongs to this mover
  const jobAlert = await JobAlert.findById(req.params.id);
  if (!jobAlert || jobAlert.mover.toString() !== req.user._id.toString()) {
    return res.status(404).json({
      status: 'error',
      message: 'Job alert not found'
    });
  }
  
  if (jobAlert.status !== 'claimed') {
    return res.status(400).json({
      status: 'error',
      message: 'Job must be claimed before it can be marked as completed'
    });
  }
  
  const completedJobAlert = await jobDistributionService.markJobCompleted(req.params.id);
  
  res.status(200).json({
    status: 'success',
    data: {
      jobAlert: completedJobAlert
    }
  });
});

// @desc    Get mover's notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly = false } = req.query;
  
  const query = { recipient: req.user._id };
  if (unreadOnly === 'true') {
    query.read = false;
  }
  
  const skip = (page - 1) * limit;
  
  const [notifications, total] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Notification.countDocuments(query)
  ]);
  
  res.status(200).json({
    status: 'success',
    results: notifications.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    },
    data: {
      notifications
    }
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markNotificationRead = catchAsync(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    {
      _id: req.params.id,
      recipient: req.user._id
    },
    {
      read: true,
      readAt: new Date()
    },
    { new: true }
  );
  
  if (!notification) {
    return res.status(404).json({
      status: 'error',
      message: 'Notification not found'
    });
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      notification
    }
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllNotificationsRead = catchAsync(async (req, res) => {
  const result = await Notification.updateMany(
    { recipient: req.user._id, read: false },
    { read: true, readAt: new Date() }
  );
  
  res.status(200).json({
    status: 'success',
    message: `Marked ${result.modifiedCount} notifications as read`
  });
});

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = catchAsync(async (req, res) => {
  const count = await Notification.countDocuments({
    recipient: req.user._id,
    read: false
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      unreadCount: count
    }
  });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = catchAsync(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipient: req.user._id
  });
  
  if (!notification) {
    return res.status(404).json({
      status: 'error',
      message: 'Notification not found'
    });
  }
  
  res.status(200).json({
    status: 'success',
    message: 'Notification deleted successfully'
  });
});
