import express from 'express';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  uploadAvatar,
  getUserBookings,
  getUserReviews
} from '../controllers/users.js';
import { protect, restrictTo, checkOwnership } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Admin only routes
router.get('/', restrictTo('admin'), getUsers);

// User routes
router.get('/me/bookings', getUserBookings);
router.get('/me/reviews', getUserReviews);
router.post('/upload-avatar', uploadAvatar);

// Routes with ownership check
router.get('/:id', checkOwnership(User), getUser);
router.put('/:id', checkOwnership(User), updateUser);
router.delete('/:id', checkOwnership(User), deleteUser);

export default router;
