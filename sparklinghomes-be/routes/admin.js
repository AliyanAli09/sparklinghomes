import express from 'express';
import { adminAuth, checkAdminPermission } from '../middleware/adminAuth.js';
import {
  // Dashboard
  getDashboardStats,
  
  // User Management
  getAllUsers,
  getUserById,
  createAdmin,
  updateUser,
  deleteUser,
  
  // Mover Management
  getAllMovers,
  getMoverDetails,
  verifyMover,
  getVerifiedMovers,
  deleteMover,
  
  // Booking Management
  getAllBookings,
  getBookingDetails,
  updateBookingStatus,
  updateBooking,
  deleteBooking,
  
  // Payment Management
  getAllPayments,
  getPaymentDetails,
  
  // Analytics
  getAnalytics,
  
  // Platform Settings
  getPlatformSettings,
  updatePlatformSettings
} from '../controllers/admin.js';

const router = express.Router();

// Apply admin authentication to all routes
router.use(adminAuth);

// Dashboard Overview
router.get('/dashboard', checkAdminPermission('canViewAnalytics'), getDashboardStats);

// User Management
router.get('/users', checkAdminPermission('canManageUsers'), getAllUsers);
router.get('/users/:id', checkAdminPermission('canManageUsers'), getUserById);
router.post('/users', checkAdminPermission('canManageUsers'), createAdmin);
router.put('/users/:id', checkAdminPermission('canManageUsers'), updateUser);
router.delete('/users/:id', checkAdminPermission('canManageUsers'), deleteUser);

// Mover Management
router.get('/movers', checkAdminPermission('canManageMovers'), getAllMovers);
router.get('/movers/verified', checkAdminPermission('canManageBookings'), getVerifiedMovers);
router.get('/movers/:id', checkAdminPermission('canManageMovers'), getMoverDetails);
router.put('/movers/:id/verify', checkAdminPermission('canManageMovers'), verifyMover);
router.delete('/movers/:id', checkAdminPermission('canManageMovers'), deleteMover);

// Booking Management
router.get('/bookings', checkAdminPermission('canManageBookings'), getAllBookings);
router.get('/bookings/:id', checkAdminPermission('canManageBookings'), getBookingDetails);
router.put('/bookings/:id/status', checkAdminPermission('canManageBookings'), updateBookingStatus);
router.put('/bookings/:id', checkAdminPermission('canManageBookings'), updateBooking);
router.delete('/bookings/:id', checkAdminPermission('canManageBookings'), deleteBooking);

// Payment Management
router.get('/payments', checkAdminPermission('canViewAnalytics'), getAllPayments);
router.get('/payments/:id', checkAdminPermission('canViewAnalytics'), getPaymentDetails);

// Analytics
router.get('/analytics', checkAdminPermission('canViewAnalytics'), getAnalytics);

// Platform Settings
router.get('/settings', checkAdminPermission('canManageSettings'), getPlatformSettings);
router.put('/settings', checkAdminPermission('canManageSettings'), updatePlatformSettings);

// Subscription Management
router.post('/subscriptions/sync-all', checkAdminPermission('canManageMovers'), async (req, res) => {
  try {
    const subscriptionSyncService = (await import('../services/subscriptionSyncService.js')).default;
    await subscriptionSyncService.syncAllSubscriptions();
    
    res.json({
      success: true,
      message: 'All subscription statuses synced successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to sync subscriptions',
      error: error.message
    });
  }
});

router.get('/subscriptions/sync-status', checkAdminPermission('canManageMovers'), async (req, res) => {
  try {
    const subscriptionSyncService = (await import('../services/subscriptionSyncService.js')).default;
    const status = subscriptionSyncService.getStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get sync service status',
      error: error.message
    });
  }
});

// Job Distribution & Cron Management
router.get('/cron-status', checkAdminPermission('canViewAnalytics'), async (req, res) => {
  try {
    const cronJobService = (await import('../services/cronJobService.js')).default;
    const status = cronJobService.getStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get cron job status',
      error: error.message
    });
  }
});

router.post('/trigger-job-alerts', checkAdminPermission('canManageBookings'), async (req, res) => {
  try {
    const cronJobService = (await import('../services/cronJobService.js')).default;
    await cronJobService.processNewBookingsForJobAlerts();
    
    res.json({
      success: true,
      message: 'Job alerts triggered successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to trigger job alerts',
      error: error.message
    });
  }
});

router.post('/cron/start', checkAdminPermission('canEditSettings'), async (req, res) => {
  try {
    const cronJobService = (await import('../services/cronJobService.js')).default;
    cronJobService.init();
    
    res.json({
      success: true,
      message: 'Cron jobs started successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to start cron jobs',
      error: error.message
    });
  }
});

router.post('/cron/stop', checkAdminPermission('canEditSettings'), async (req, res) => {
  try {
    const cronJobService = (await import('../services/cronJobService.js')).default;
    cronJobService.stop();
    
    res.json({
      success: true,
      message: 'Cron jobs stopped successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to stop cron jobs',
      error: error.message
    });
  }
});

export default router;
