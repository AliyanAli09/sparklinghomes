import express from 'express';
import {
  createBooking,
  getBookings,
  getBooking,
  updateBooking,
  deleteBooking,
  provideQuote,
  acceptQuote,
  cancelBooking,
  completeBooking,
  uploadBookingPhotos,
  addMessage,
  getBookingMessages
} from '../controllers/bookings.js';
import { protect, restrictTo, restrictToUserType, checkOwnership } from '../middleware/auth.js';
import Booking from '../models/Booking.js';

const router = express.Router();

// Guest booking routes (no auth required)
router.post('/guest', createBooking);
router.get('/guest/:id', getBooking);

// All other routes require authentication
router.use(protect);

// Admin routes
router.get('/', restrictTo('admin'), getBookings);

// Create booking (customers only)
router.post('/', restrictToUserType('customer'), createBooking);

// Booking-specific routes
router.get('/:id', checkOwnership(Booking), getBooking);
router.put('/:id', checkOwnership(Booking), updateBooking);
router.delete('/:id', checkOwnership(Booking), deleteBooking);

// Quote management
router.post('/:id/quote', restrictToUserType('mover'), checkOwnership(Booking), provideQuote);
router.post('/:id/accept-quote', restrictToUserType('customer'), checkOwnership(Booking), acceptQuote);

// Booking lifecycle
router.post('/:id/cancel', checkOwnership(Booking), cancelBooking);
router.post('/:id/complete', restrictToUserType('mover'), checkOwnership(Booking), completeBooking);

// Communication
router.get('/:id/messages', checkOwnership(Booking), getBookingMessages);
router.post('/:id/messages', checkOwnership(Booking), addMessage);

// Photo uploads
router.post('/:id/photos', checkOwnership(Booking), uploadBookingPhotos);

export default router;
