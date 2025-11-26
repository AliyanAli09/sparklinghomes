import { asyncHandler } from '../middleware/errorHandler.js';
import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import Mover from '../models/Mover.js';

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private
export const createReview = asyncHandler(async (req, res, next) => {
  const { bookingId, rating, comment, detailedRating, categories, title } = req.body;
  
  // Check if booking exists and is completed
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return res.status(404).json({
      status: 'error',
      message: 'Booking not found'
    });
  }

  if (booking.status !== 'completed') {
    return res.status(400).json({
      status: 'error',
      message: 'Can only review completed bookings'
    });
  }

  // Determine reviewer and reviewee
  let reviewer, reviewee, reviewerType, revieweeType;
  
  if (req.userType === 'customer') {
    if (booking.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only review your own bookings'
      });
    }
    
    if (booking.customerReviewed) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already reviewed this booking'
      });
    }
    
    reviewer = booking.customer;
    reviewee = booking.mover;
    reviewerType = 'User';
    revieweeType = 'Mover';
  } else {
    if (booking.mover.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only review your own bookings'
      });
    }
    
    if (booking.moverReviewed) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already reviewed this booking'
      });
    }
    
    reviewer = booking.mover;
    reviewee = booking.customer;
    reviewerType = 'Mover';
    revieweeType = 'User';
  }

  // Create review
  const review = await Review.create({
    booking: bookingId,
    reviewer,
    reviewerType,
    reviewee,
    revieweeType,
    rating,
    comment,
    detailedRating,
    categories,
    title,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Update booking to mark as reviewed
  if (req.userType === 'customer') {
    booking.customerReviewed = true;
  } else {
    booking.moverReviewed = true;
  }
  await booking.save();

  // Populate the review
  await review.populate('reviewer reviewee booking');

  res.status(201).json({
    status: 'success',
    data: {
      review
    }
  });
});

// @desc    Get reviews
// @route   GET /api/reviews
// @access  Public
export const getReviews = asyncHandler(async (req, res, next) => {
  const {
    reviewee,
    revieweeType,
    rating,
    sortBy = 'createdAt',
    page = 1,
    limit = 10
  } = req.query;

  // Build query
  let query = { isVisible: true };
  
  if (reviewee) query.reviewee = reviewee;
  if (revieweeType) query.revieweeType = revieweeType;
  if (rating) query.rating = rating;

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Sort options
  let sortOptions = {};
  switch (sortBy) {
    case 'rating-high':
      sortOptions = { rating: -1, createdAt: -1 };
      break;
    case 'rating-low':
      sortOptions = { rating: 1, createdAt: -1 };
      break;
    case 'helpful':
      sortOptions = { 'helpfulVotes.count': -1, createdAt: -1 };
      break;
    default:
      sortOptions = { createdAt: -1 };
  }

  const reviews = await Review.find(query)
    .populate('reviewer', 'firstName lastName')
    .populate('reviewee', 'firstName lastName businessName')
    .sort(sortOptions)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Review.countDocuments(query);

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    data: {
      reviews
    }
  });
});

// @desc    Get single review
// @route   GET /api/reviews/:id
// @access  Public
export const getReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id)
    .populate('reviewer', 'firstName lastName')
    .populate('reviewee', 'firstName lastName businessName')
    .populate('booking', 'moveDate homeSize');

  if (!review) {
    return res.status(404).json({
      status: 'error',
      message: 'Review not found'
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      review
    }
  });
});

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
export const updateReview = asyncHandler(async (req, res, next) => {
  const review = req.resource;
  
  // Only allow updating within 24 hours of creation
  const hoursSinceCreation = (new Date() - review.createdAt) / (1000 * 60 * 60);
  if (hoursSinceCreation > 24) {
    return res.status(400).json({
      status: 'error',
      message: 'Reviews can only be edited within 24 hours of creation'
    });
  }

  const allowedFields = ['rating', 'comment', 'detailedRating', 'categories', 'title'];
  const updateData = {};
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  const updatedReview = await Review.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate('reviewer reviewee');

  res.status(200).json({
    status: 'success',
    data: {
      review: updatedReview
    }
  });
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
export const deleteReview = asyncHandler(async (req, res, next) => {
  await Review.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// @desc    Mark review as helpful
// @route   POST /api/reviews/:id/helpful
// @access  Private
export const markHelpful = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  
  if (!review) {
    return res.status(404).json({
      status: 'error',
      message: 'Review not found'
    });
  }

  await review.markHelpful(req.user._id);

  res.status(200).json({
    status: 'success',
    data: {
      helpfulVotes: review.helpfulVotes
    }
  });
});

// @desc    Report review
// @route   POST /api/reviews/:id/report
// @access  Private
export const reportReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  
  if (!review) {
    return res.status(404).json({
      status: 'error',
      message: 'Review not found'
    });
  }

  const flag = {
    reason: req.body.reason,
    flaggedBy: req.user._id,
    flaggedAt: new Date()
  };

  review.moderationFlags.push(flag);
  await review.save();

  res.status(200).json({
    status: 'success',
    message: 'Review reported successfully'
  });
});

// @desc    Respond to review
// @route   POST /api/reviews/:id/respond
// @access  Private
export const respondToReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  
  if (!review) {
    return res.status(404).json({
      status: 'error',
      message: 'Review not found'
    });
  }

  // Only the reviewee can respond
  if (review.reviewee.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      status: 'error',
      message: 'You can only respond to reviews about you'
    });
  }

  // Check if already responded
  if (review.response.comment) {
    return res.status(400).json({
      status: 'error',
      message: 'You have already responded to this review'
    });
  }

  review.response = {
    comment: req.body.comment,
    respondedAt: new Date(),
    respondedBy: req.user._id
  };

  await review.save();

  res.status(200).json({
    status: 'success',
    data: {
      response: review.response
    }
  });
});

// @desc    Create guest review
// @route   POST /api/reviews/guest
// @access  Public
export const createGuestReview = asyncHandler(async (req, res, next) => {
  try {
    const { bookingId, rating, comment, detailedRating, categories, title, customerName, customerEmail } = req.body;
    
    // Validate bookingId format
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid booking ID'
      });
    }

    // Check if booking exists and is completed
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({
        status: 'error',
        message: 'Can only review completed bookings'
      });
    }

    // Verify this is a guest booking
    if (!booking.customerInfo || !booking.customerInfo.isGuest) {
      return res.status(403).json({
        status: 'error',
        message: 'This booking requires authentication to review'
      });
    }

    // Verify customer email matches
    if (booking.customerInfo.email !== customerEmail) {
      return res.status(403).json({
        status: 'error',
        message: 'Email does not match booking'
      });
    }

    // Check if already reviewed
    if (booking.customerReviewed) {
      return res.status(400).json({
        status: 'error',
        message: 'This booking has already been reviewed'
      });
    }

    if (!booking.mover) {
      return res.status(400).json({
        status: 'error',
        message: 'No mover assigned to this booking'
      });
    }

    // Create review
    const review = await Review.create({
      booking: bookingId,
      reviewer: null, // No authenticated reviewer for guest reviews
      reviewerType: 'User',
      reviewee: booking.mover,
      revieweeType: 'Mover',
      rating,
      comment,
      detailedRating,
      categories,
      title,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      // Store guest information
      guestReviewer: {
        name: customerName,
        email: customerEmail
      }
    });

    // Update booking to mark as reviewed
    booking.customerReviewed = true;
    await booking.save();

    // Populate the review
    await review.populate('reviewee booking');

    res.status(201).json({
      status: 'success',
      data: {
        review
      }
    });
  } catch (error) {
    // Log the detailed error server-side
    console.error('❌ Error creating guest review:', error);
    
    // Send user-friendly message to frontend
    return res.status(500).json({
      status: 'error',
      message: 'Unable to submit review. Please try again later.'
    });
  }
});
