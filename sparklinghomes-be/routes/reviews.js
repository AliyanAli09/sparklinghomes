import express from 'express';
import {
  createReview,
  createGuestReview,
  getReviews,
  getReview,
  updateReview,
  deleteReview,
  markHelpful,
  reportReview,
  respondToReview
} from '../controllers/reviews.js';
import { protect, restrictTo, checkOwnership } from '../middleware/auth.js';
import Review from '../models/Review.js';

const router = express.Router();

// Public routes
router.get('/', getReviews);
router.get('/:id', getReview);
router.post('/guest', createGuestReview);

// Protected routes
router.use(protect);

// Create review (after completing a booking)
router.post('/', createReview);

// Review interactions
router.post('/:id/helpful', markHelpful);
router.post('/:id/report', reportReview);
router.post('/:id/respond', respondToReview);

// Owner/admin routes
router.put('/:id', checkOwnership(Review), updateReview);
router.delete('/:id', checkOwnership(Review), deleteReview);

export default router;
