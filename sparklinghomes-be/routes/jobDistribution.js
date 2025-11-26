import express from 'express';
import {
  getAvailableJobs,
  getJobAlerts,
  respondToJobAlert,
  markJobCompleted,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
  deleteNotification
} from '../controllers/jobDistribution.js';
import { protect, restrictToUserType } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Job-related routes (mover only)
router.get('/available', restrictToUserType('mover'), getAvailableJobs);
router.get('/alerts', restrictToUserType('mover'), getJobAlerts);
router.post('/alerts/:id/respond', restrictToUserType('mover'), respondToJobAlert);
router.put('/alerts/:id/complete', restrictToUserType('mover'), markJobCompleted);

// Notification routes (all authenticated users)
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);
router.put('/notifications/read-all', markAllNotificationsRead);
router.get('/notifications/unread-count', getUnreadCount);
router.delete('/notifications/:id', deleteNotification);

export default router;
