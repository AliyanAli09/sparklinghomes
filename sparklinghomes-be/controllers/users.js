import { asyncHandler } from '../middleware/errorHandler.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find({}).select('-password');
  
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
export const getUser = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.resource
    }
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
export const updateUser = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phone: req.body.phone,
    address: req.body.address,
    isActive: req.body.isActive
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => 
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  const user = await User.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private
export const deleteUser = asyncHandler(async (req, res, next) => {
  await User.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// @desc    Upload user avatar
// @route   POST /api/users/upload-avatar
// @access  Private
export const uploadAvatar = asyncHandler(async (req, res, next) => {
  // This would handle avatar upload to Cloudinary
  // For now, return success message
  res.status(200).json({
    status: 'success',
    message: 'Avatar upload functionality will be implemented'
  });
});

// @desc    Get user bookings
// @route   GET /api/users/me/bookings
// @access  Private
export const getUserBookings = asyncHandler(async (req, res, next) => {
  const bookings = await Booking.find({ customer: req.user._id })
    .populate('mover', 'businessName firstName lastName rating')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: bookings.length,
    data: {
      bookings
    }
  });
});

// @desc    Get user reviews
// @route   GET /api/users/me/reviews
// @access  Private
export const getUserReviews = asyncHandler(async (req, res, next) => {
  const reviews = await Review.find({ 
    reviewer: req.user._id,
    reviewerType: 'User'
  }).populate('reviewee', 'businessName firstName lastName');

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews
    }
  });
});
