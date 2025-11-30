import { catchAsync } from '../utils/catchAsync.js';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Mover from '../models/Mover.js';
import jobDistributionService from '../services/jobDistributionService.js';
import { sendBookingConfirmationEmail } from '../utils/email.js';

// @desc    Create new booking
// @route   POST /api/bookings or POST /api/bookings/guest
// @access  Private (Customer only) or Public (Guest)
export const createBooking = catchAsync(async (req, res) => {
  const {
    customerInfo,
    moveDate,
    moveTime,
    estimatedDuration,
    pickupAddress,
    dropoffAddress,
    moveType,
    homeSize,
    items,
    servicesRequested,
    packingRequired,
    specialInstructions,
    accessNotes,
    quote
  } = req.body;

  let customerId = null;
  let customerDetails = null;

  // Handle guest booking (no authentication)
  if (req.route.path === '/guest' || !req.user) {
    if (!customerInfo) {
      return res.status(400).json({
        status: 'error',
        message: 'Customer information is required for guest bookings'
      });
    }

    // Create customer details object for guest booking
    customerDetails = {
      firstName: customerInfo.firstName,
      lastName: customerInfo.lastName,
      email: customerInfo.email,
      phone: customerInfo.phone,
      isGuest: true
    };
  } else {
    // Handle authenticated booking
    customerId = req.user._id;
  }

  // Create booking without mover (system will assign)
  const bookingData = {
    customer: customerId,
    customerInfo: customerDetails,
    moveDate,
    moveTime,
    estimatedDuration,
    pickupAddress,
    dropoffAddress,
    moveType,
    homeSize,
    items,
    servicesRequested,
    packingRequired,
    specialInstructions,
    accessNotes,
    quote,
    status: 'pending-assignment',
    'jobAssignment.status': 'unassigned',
    'deposit.amount': quote?.deposit ? quote.deposit * 100 : 9700 // Convert to cents, default $97
  };

  const booking = await Booking.create(bookingData);

  // Populate customer details if authenticated
  if (customerId) {
    await booking.populate('customer', 'firstName lastName email phone');
  }

  // Note: Booking confirmation email will be sent after deposit payment is confirmed

  res.status(201).json({
    status: 'success',
    data: {
      booking
    }
  });
});

// @desc    Get all bookings (Admin)
// @route   GET /api/bookings
// @access  Private (Admin only)
export const getBookings = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, status, customer, mover } = req.query;
  
  const query = {};
  if (status) query.status = status;
  if (customer) query.customer = customer;
  if (mover) query.mover = mover;
  
  const skip = (page - 1) * limit;
  
  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate('customer', 'firstName lastName email')
      .populate('mover', 'businessName firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Booking.countDocuments(query)
  ]);
  
  res.status(200).json({
    status: 'success',
    results: bookings.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    },
    data: {
      bookings
    }
  });
});

// @desc    Get booking by ID
// @route   GET /api/bookings/:id or /api/bookings/guest/:id
// @access  Private or Public (for guest bookings)
export const getBooking = catchAsync(async (req, res) => {
  // Validate ObjectId early to avoid internal errors
  const isGuestRoute = req.route.path === '/guest/:id';
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      status: 'error',
      message: isGuestRoute ? 'Invalid booking link' : 'Invalid booking ID'
    });
  }

  const booking = await Booking.findById(req.params.id)
    .populate('customer', 'firstName lastName email phone')
    .populate('mover', 'businessName firstName lastName email phone rating')
    .populate('messages.sender', 'firstName lastName businessName');
  
  if (!booking) {
    return res.status(404).json({
      status: 'error',
      message: 'Booking not found'
    });
  }
  
  // Check if this is a guest booking route
  if (isGuestRoute) {
    // For guest bookings, only allow access if it's a guest booking
    if (!booking.customerInfo || !booking.customerInfo.isGuest) {
      return res.status(403).json({
        status: 'error',
        message: 'This booking requires authentication'
      });
    }
  } else {
    // For authenticated routes, check user access
    if (req.user.role !== 'admin' && 
        req.user._id.toString() !== booking.customer?._id.toString() &&
        (!req.user.role === 'mover' || req.user._id.toString() !== booking.mover?._id.toString())) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }
  }
  res.status(200).json({
    status: 'success',
    data: {
      booking
    }
  });
});

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private
export const updateBooking = catchAsync(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  
  if (!booking) {
    return res.status(404).json({
      status: 'error',
      message: 'Booking not found'
    });
  }
  
  // Check if user has access to update this booking
  if (req.user.role !== 'admin' && 
      req.user._id.toString() !== booking.customer._id.toString() &&
      (!req.user.role === 'mover' || req.user._id.toString() !== booking.mover?.toString())) {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied'
    });
  }
  
  // Only allow certain fields to be updated based on user role
  const allowedUpdates = {};
  
  if (req.user.role === 'admin') {
    // Admin can update everything
    Object.assign(allowedUpdates, req.body);
  } else if (req.user.role === 'mover' && req.user._id.toString() === booking.mover?.toString()) {
    // Mover can update quote and status
    if (req.body.quote) allowedUpdates.quote = req.body.quote;
    if (req.body.status) allowedUpdates.status = req.body.status;
    if (req.body.actualStartTime) allowedUpdates.actualStartTime = req.body.actualStartTime;
    if (req.body.actualEndTime) allowedUpdates.actualEndTime = req.body.actualEndTime;
    if (req.body.actualDuration) allowedUpdates.actualDuration = req.body.actualDuration;
    if (req.body.finalCost) allowedUpdates.finalCost = req.body.finalCost;
    if (req.body.completionNotes) allowedUpdates.completionNotes = req.body.completionNotes;
  } else {
    // Customer can only update certain fields
    if (req.body.specialInstructions) allowedUpdates.specialInstructions = req.body.specialInstructions;
    if (req.body.accessNotes) allowedUpdates.accessNotes = req.body.accessNotes;
    if (req.body.moveDate) allowedUpdates.moveDate = req.body.moveDate;
    if (req.body.moveTime) allowedUpdates.moveTime = req.body.moveTime;
  }
  
  const updatedBooking = await Booking.findByIdAndUpdate(
    req.params.id,
    allowedUpdates,
    { new: true, runValidators: true }
  ).populate('customer', 'firstName lastName email phone')
   .populate('mover', 'businessName firstName lastName email phone rating');
  
  res.status(200).json({
    status: 'success',
    data: {
      booking: updatedBooking
    }
  });
});

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private (Admin or customer)
export const deleteBooking = catchAsync(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  
  if (!booking) {
    return res.status(404).json({
      status: 'error',
      message: 'Booking not found'
    });
  }
  
  // Check if user has access to delete this booking
  if (req.user.role !== 'admin' && 
      req.user._id.toString() !== booking.customer._id.toString()) {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied'
    });
  }
  
  await Booking.findByIdAndDelete(req.params.id);
  
  res.status(200).json({
    status: 'success',
    message: 'Booking deleted successfully'
  });
});

// @desc    Get user bookings (Customer)
// @route   GET /api/users/me/bookings
// @access  Private (Customer only)
export const getUserBookings = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  
  const query = { customer: req.user._id };
  if (status) query.status = status;
  
  const skip = (page - 1) * limit;
  
  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate('mover', 'businessName firstName lastName rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Booking.countDocuments(query)
  ]);
  
  res.status(200).json({
    status: 'success',
    results: bookings.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    },
    data: {
      bookings
    }
  });
});

// @desc    Get mover bookings (Mover)
// @route   GET /api/movers/me/bookings
// @access  Private (Mover only)
export const getMoverBookings = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  
  const query = { mover: req.user._id };
  if (status) query.status = status;
  
  const skip = (page - 1) * limit;
  
  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate('customer', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Booking.countDocuments(query)
  ]);
  
  res.status(200).json({
    status: 'success',
    results: bookings.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    },
    data: {
      bookings
    }
  });
});

// @desc    Provide quote (Mover only)
// @route   POST /api/bookings/:id/quote
// @access  Private (Mover only)
export const provideQuote = catchAsync(async (req, res) => {
  const { quote } = req.body;
  
  const booking = await Booking.findById(req.params.id);
  
  if (!booking) {
    return res.status(404).json({
      status: 'error',
      message: 'Booking not found'
    });
  }
  
  if (booking.mover?.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied'
    });
  }
  
  if (booking.status !== 'quote-requested') {
    return res.status(400).json({
      status: 'error',
      message: 'Booking is not in quote-requested status'
    });
  }
  
  // Update booking with quote
  booking.quote = quote;
  booking.status = 'quote-provided';
  
  await booking.save();
  
  // Notify customer
  await jobDistributionService.createNotification({
    recipient: booking.customer._id,
    recipientType: 'User',
    type: 'quote-provided',
    title: 'Quote Received!',
    message: `Your mover has provided a quote for your move. Please review and accept or request changes.`,
    relatedId: booking._id,
    relatedModel: 'Booking',
    priority: 'high'
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      booking
    }
  });
});

// @desc    Accept quote (Customer only)
// @route   POST /api/bookings/:id/accept-quote
// @access  Private (Customer only)
export const acceptQuote = catchAsync(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  
  if (!booking) {
    return res.status(404).json({
      status: 'error',
      message: 'Booking not found'
    });
  }
  
  if (booking.customer._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied'
    });
  }
  
  if (booking.status !== 'quote-provided') {
    return res.status(400).json({
      status: 'error',
      message: 'No quote provided yet'
    });
  }
  
  // Update booking status
  booking.status = 'quote-accepted';
  
  await booking.save();
  
  // Notify mover
  await jobDistributionService.createNotification({
    recipient: booking.mover._id,
    recipientType: 'Mover',
    type: 'quote-accepted',
    title: 'Quote Accepted!',
    message: `Your quote has been accepted! Please contact the customer to confirm final details.`,
    relatedId: booking._id,
    relatedModel: 'Booking',
    priority: 'high'
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      booking
    }
  });
});

// @desc    Complete booking (Mover only)
// @route   POST /api/bookings/:id/complete
// @access  Private (Mover only)
export const completeBooking = catchAsync(async (req, res) => {
  const { actualDuration, finalCost, completionNotes } = req.body;
  
  const booking = await Booking.findById(req.params.id);
  
  if (!booking) {
    return res.status(404).json({
      status: 'error',
      message: 'Booking not found'
    });
  }
  
  if (booking.mover?.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied'
    });
  }
  
  if (!['quote-accepted', 'confirmed', 'in-progress'].includes(booking.status)) {
    return res.status(400).json({
      status: 'error',
      message: 'Booking cannot be completed in current status'
    });
  }
  
  // Update booking
  booking.status = 'completed';
  booking.actualEndTime = new Date();
  booking.actualDuration = actualDuration;
  booking.finalCost = finalCost;
  booking.completionNotes = completionNotes;
  
  await booking.save();
  
  // Notify customer
  await jobDistributionService.createNotification({
    recipient: booking.customer._id,
    recipientType: 'User',
    type: 'job-completed',
    title: 'Move Completed!',
    message: `Your move has been completed successfully. Please leave a review for your mover.`,
    relatedId: booking._id,
    relatedModel: 'Booking',
    priority: 'medium'
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      booking
    }
  });
});

// @desc    Get booking messages
// @route   GET /api/bookings/:id/messages
// @access  Private
export const getBookingMessages = catchAsync(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  
  if (!booking) {
    return res.status(404).json({
      status: 'error',
      message: 'Booking not found'
    });
  }
  
  // Check if user has access to this booking
  if (req.user.role !== 'admin' && 
      req.user._id.toString() !== booking.customer._id.toString() &&
      (!req.user.role === 'mover' || req.user._id.toString() !== booking.mover?.toString())) {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied'
    });
  }
  
  res.status(200).json({
    status: 'success',
    results: booking.messages.length,
    data: {
      messages: booking.messages
    }
  });
});

// @desc    Add message to booking
// @route   POST /api/bookings/:id/messages
// @access  Private
export const addMessage = catchAsync(async (req, res) => {
  const { message } = req.body;
  
  const booking = await Booking.findById(req.params.id);
  
  if (!booking) {
    return res.status(404).json({
      status: 'error',
      message: 'Booking not found'
    });
  }
  
  // Check if user has access to this booking
  if (req.user.role !== 'admin' && 
      req.user._id.toString() !== booking.customer._id.toString() &&
      (!req.user.role === 'mover' || req.user._id.toString() !== booking.mover?.toString())) {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied'
    });
  }
  
  // Add message
  booking.messages.push({
    sender: req.user._id,
    senderType: req.user.role === 'mover' ? 'Mover' : 'User',
    message,
    timestamp: new Date()
  });
  
  await booking.save();
  
  // Notify the other party
  const recipientId = req.user._id.toString() === booking.customer._id.toString() 
    ? booking.mover?._id 
    : booking.customer._id;
  
  if (recipientId) {
    await jobDistributionService.createNotification({
      recipient: recipientId,
      recipientType: req.user.role === 'mover' ? 'User' : 'Mover',
      type: 'system-alert',
      title: 'New Message',
      message: `You have a new message about your move.`,
      relatedId: booking._id,
      relatedModel: 'Booking',
      priority: 'medium'
    });
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      message: booking.messages[booking.messages.length - 1]
    }
  });
});

// @desc    Cancel booking
// @route   POST /api/bookings/:id/cancel
// @access  Private
export const cancelBooking = catchAsync(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  
  if (!booking) {
    return res.status(404).json({
      status: 'error',
      message: 'Booking not found'
    });
  }
  
  // Check if user has access to this booking
  if (req.user.role !== 'admin' && 
      req.user._id.toString() !== booking.customer._id.toString() &&
      (!req.user.role === 'mover' || req.user._id.toString() !== booking.mover?.toString())) {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied'
    });
  }
  
  // Only allow cancellation if booking is not completed
  if (booking.status === 'completed') {
    return res.status(400).json({
      status: 'error',
      message: 'Cannot cancel completed booking'
    });
  }
  
  // Update booking status
  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  booking.cancelledBy = req.user._id;
  
  await booking.save();
  
  // Notify the other party
  const recipientId = req.user._id.toString() === booking.customer._id.toString() 
    ? booking.mover?._id 
    : booking.customer._id;
  
  if (recipientId) {
    await jobDistributionService.createNotification({
      recipient: recipientId,
      recipientType: req.user.role === 'mover' ? 'User' : 'Mover',
      type: 'system-alert',
      title: 'Booking Cancelled',
      message: `A booking has been cancelled.`,
      relatedId: booking._id,
      relatedModel: 'Booking',
      priority: 'high'
    });
  }
  
  res.status(200).json({
    status: 'success',
    message: 'Booking cancelled successfully',
    data: {
      booking
    }
  });
});

// @desc    Upload photos for booking
// @route   POST /api/bookings/:id/photos
// @access  Private
export const uploadBookingPhotos = catchAsync(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  
  if (!booking) {
    return res.status(404).json({
      status: 'error',
      message: 'Booking not found'
    });
  }
  
  // Check if user has access to this booking
  if (req.user.role !== 'admin' && 
      req.user._id.toString() !== booking.customer._id.toString() &&
      (!req.user.role === 'mover' || req.user._id.toString() !== booking.mover?.toString())) {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied'
    });
  }
  
  // This would typically handle file uploads
  // For now, we'll just return a success message
  // In a real implementation, you'd use multer and cloudinary here
  
  res.status(200).json({
    status: 'success',
    message: 'Photo upload endpoint ready for implementation',
    data: {
      bookingId: booking._id
    }
  });
});
