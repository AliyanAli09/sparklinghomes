import User from '../models/User.js';
import Mover from '../models/Mover.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Review from '../models/Review.js';
import JobAlert from '../models/JobAlert.js';
import { catchAsync } from '../utils/catchAsync.js';

// Dashboard Overview
export const getDashboardStats = catchAsync(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalMovers = await Mover.countDocuments();
  const totalCustomers = await User.countDocuments({ role: 'customer' });
  const totalBookings = await Booking.countDocuments();
  const totalRevenue = await Payment.aggregate([
    { $match: { status: 'succeeded' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  // Get recent payments for dashboard
  const recentPayments = await Payment.find({ status: 'succeeded' })
    .populate('customer', 'firstName lastName email')
    .populate('mover', 'businessName')
    .populate('booking', 'pickupAddress deliveryAddress customerInfo deposit')
    .sort({ createdAt: -1 })
    .limit(5);

  const recentBookings = await Booking.find()
    .populate('customer', 'firstName lastName email')
    .populate('mover', 'businessName email phone firstName lastName')
    .sort({ createdAt: -1 })
    .limit(5)
    .select('customer customerInfo moveDate status deposit quote totalAmount createdAt mover');

  const pendingMoverVerifications = await Mover.countDocuments({ 
    status: 'pending' 
  });

  const monthlyStats = await Booking.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 },
        revenue: { $sum: '$totalAmount' }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 6 }
  ]);

  res.json({
    success: true,
    data: {
      overview: {
        totalUsers,
        totalMovers,
        totalCustomers,
        totalBookings,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingMoverVerifications
      },
      recentBookings,
      recentPayments,
      monthlyStats
    }
  });
});

// User Management
export const getAllUsers = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, role, search } = req.query;
  
  const query = {};
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total
      }
    }
  });
});

export const getUserById = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: user
  });
});

export const updateUser = catchAsync(async (req, res) => {
  const { firstName, lastName, email, phone, role, isVerified, isBlocked, adminPermissions } = req.body;
  
  // Build update object with only provided fields
  const updateData = {};
  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (email !== undefined) updateData.email = email;
  if (phone !== undefined) updateData.phone = phone;
  if (role !== undefined) updateData.role = role;
  if (isVerified !== undefined) updateData.isVerified = isVerified;
  if (isBlocked !== undefined) updateData.isBlocked = isBlocked;
  if (adminPermissions !== undefined) updateData.adminPermissions = adminPermissions;
  
  const user = await User.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: user
  });
});

export const deleteUser = catchAsync(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

export const createAdmin = catchAsync(async (req, res) => {
  const { firstName, lastName, email, password, phone, adminPermissions } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  // Create admin user
  const admin = await User.create({
    firstName,
    lastName,
    email,
    password,
    phone,
    role: 'admin',
    isAdmin: true,
    isVerified: true,
    isActive: true,
    adminPermissions: adminPermissions || {
      canManageUsers: true,
      canManageMovers: true,
      canViewAnalytics: true,
      canManageBookings: true,
      canManageContent: true,
      canManageSettings: true
    }
  });

  // Remove password from response
  const adminResponse = admin.toObject();
  delete adminResponse.password;

  res.status(201).json({
    success: true,
    data: adminResponse
  });
});

// Mover Management
export const getAllMovers = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, verificationStatus, search } = req.query;
  
  const query = {};
  if (verificationStatus && verificationStatus !== 'all') {
    query.status = verificationStatus; // Map verificationStatus query param to status field
  }
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { businessName: { $regex: search, $options: 'i' } }
    ];
  }

  const movers = await Mover.find(query)
    .select('-password -verificationToken -passwordResetToken')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Mover.countDocuments(query);

  res.json({
    success: true,
    data: {
      movers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalMovers: total
      }
    }
  });
});

export const getMoverDetails = catchAsync(async (req, res) => {
  const mover = await Mover.findById(req.params.id)
    .select('-password -verificationToken -passwordResetToken');

  if (!mover) {
    return res.status(404).json({
      success: false,
      message: 'Mover not found'
    });
  }

  res.json({
    success: true,
    data: mover
  });
});

export const deleteMover = catchAsync(async (req, res) => {
  const mover = await Mover.findByIdAndDelete(req.params.id);

  if (!mover) {
    return res.status(404).json({
      success: false,
      message: 'Mover not found'
    });
  }

  res.json({
    success: true,
    message: 'Mover deleted successfully'
  });
});

export const verifyMover = catchAsync(async (req, res) => {
  const { verificationStatus, verificationNotes } = req.body;
  
  const mover = await Mover.findByIdAndUpdate(
    req.params.id,
    { 
      status: verificationStatus, // Using status field from Mover model
      verificationNotes,
      verifiedAt: verificationStatus === 'approved' ? new Date() : null,
      verifiedBy: req.user._id
    },
    { new: true, runValidators: true }
  );

  if (!mover) {
    return res.status(404).json({
      success: false,
      message: 'Mover not found'
    });
  }

  res.json({
    success: true,
    data: mover
  });
});

export const getVerifiedMovers = catchAsync(async (req, res) => {
  const movers = await Mover.find({
    isVerified: true,
    status: 'approved',
    isActive: true
  })
  .select('businessName firstName lastName email phone')
  .sort({ businessName: 1 });

  res.json({
    success: true,
    data: movers
  });
});

// Booking Management
export const getAllBookings = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  
  const query = {};
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { bookingId: { $regex: search, $options: 'i' } }
    ];
  }

  const bookings = await Booking.find(query)
    .populate('customer', 'firstName lastName email')
    .populate('mover', 'businessName email phone firstName lastName')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Booking.countDocuments(query);

  res.json({
    success: true,
    data: {
      bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalBookings: total
      }
    }
  });
});

export const getBookingDetails = catchAsync(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('customer', 'firstName lastName email phone')
    .populate('mover', 'businessName email phone firstName lastName')
    .populate('reviews');

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  res.json({
    success: true,
    data: booking
  });
});

export const deleteBooking = catchAsync(async (req, res) => {
  const booking = await Booking.findByIdAndDelete(req.params.id);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  res.json({
    success: true,
    message: 'Booking deleted successfully'
  });
});


export const updateBookingStatus = catchAsync(async (req, res) => {
  const { status, adminNotes } = req.body;
  
  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    { 
      status, 
      adminNotes,
      updatedBy: req.user._id,
      updatedAt: new Date()
    },
    { new: true, runValidators: true }
  );

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  res.json({
    success: true,
    data: booking
  });
});

export const updateBooking = catchAsync(async (req, res) => {
  const { moverId, moveDate, moveTime, status, adminNotes } = req.body;
  
  // Build update object
  const updateData = {
    updatedBy: req.user._id,
    updatedAt: new Date()
  };
  console.log('moverId', moverId);
  let mover;
  if (moverId) {
    // Verify the mover exists and is verified
    mover = await Mover.findById(moverId);
    if (!mover) {
      return res.status(404).json({
        success: false,
        message: 'Mover not found'
      });
    }
    
    if (!mover.isVerified || mover.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only verified and approved movers can be assigned to bookings'
      });
    }
    
    updateData.mover = moverId;
    updateData['jobAssignment.status'] = 'assigned';
    updateData['jobAssignment.assignedAt'] = new Date();
    updateData['jobAssignment.assignedBy'] = req.user._id;
    
    // If assigning a mover, update status to confirmed
    if (!status) {
      updateData.status = 'confirmed';
    }
  }
  
  if (moveDate) {
    updateData.moveDate = new Date(moveDate);
  }
  
  if (moveTime) {
    updateData.moveTime = moveTime;
  }
  
  if (status) {
    updateData.status = status;
  }
  
  if (adminNotes) {
    updateData.adminNotes = adminNotes;
  }
  
  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate('customer', 'firstName lastName email phone')
   .populate('mover', 'businessName email phone firstName lastName');
  
  const jobAlert = new JobAlert({
    booking: req.params.id,
    mover: mover._id,
    status: 'claimed',
    expiresAt: new Date(Date.now() + 324 * 60 * 60 * 1000) // Expires in 324 hours
  });
  jobAlert.response = {
    interested: true,
    responseTime: new Date(),
    message: 'Admin assigned the job',
    estimatedTime: 0
  };
  jobAlert.respondedAt = new Date();
  
  await jobAlert.save();

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Send email notifications if mover was assigned
  if (moverId && booking.mover) {
    try {
      const { sendJobClaimedEmail } = await import('../utils/email.js');

      const jobAmount = booking.quote?.subtotal - (booking.deposit?.amount / 100);
      
      // Email data for customer notification
      const customerEmailData = {
        customerName: booking.customer?.firstName || booking.customerInfo?.firstName,
        customerEmail: booking.customer?.email || booking.customerInfo?.email,
        bookingId: booking._id,
        moverName: booking.mover.businessName,
        moverEmail: booking.mover.email,
        moverPhone: booking.mover.phone,
        moveDate: new Date(booking.moveDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        fromLocation: `${booking.pickupAddress.city}, ${booking.pickupAddress.state}`,
        toLocation: `${booking.dropoffAddress.city}, ${booking.dropoffAddress.state}`,
        jobAmount: jobAmount || 'To be determined'
      };
      
      // Send email to customer
      await sendJobClaimedEmail(customerEmailData);
      
      // TODO: Send email to mover with booking details
      // This would require a new email template for mover assignment
      
    } catch (emailError) {
      console.error('Failed to send assignment emails:', emailError);
      // Don't fail the request if email fails
    }
  }

  res.json({
    success: true,
    data: booking
  });
});

// Analytics
export const getAnalytics = catchAsync(async (req, res) => {
  const { days = '30' } = req.query;
  
  let dateFilter = {};
  const now = new Date();
  
  // Handle the days parameter from frontend
  if (days !== 'all') {
    const daysNum = parseInt(days);
    if (!isNaN(daysNum)) {
      dateFilter = { createdAt: { $gte: new Date(now.getTime() - daysNum * 24 * 60 * 60 * 1000) } };
    }
  }
  // If days === 'all', no date filter (show all time)

  const bookingGrowth = await Booking.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  const revenueData = await Payment.aggregate([
    { $match: { status: 'succeeded', ...dateFilter } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        revenue: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  const topServices = await Booking.aggregate([
    { $match: dateFilter },
    { $unwind: '$servicesRequested' },
    {
      $group: {
        _id: '$servicesRequested',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  const geographicData = await Booking.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: '$pickupAddress.state',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  res.json({
    success: true,
    data: {
      bookingGrowth,
      revenueData,
      topServices,
      geographicData
    }
  });
});

// Platform Settings
export const getPlatformSettings = catchAsync(async (req, res) => {
  // This would typically come from a settings collection or environment variables
  const settings = {
    platformFee: process.env.PLATFORM_FEE || 0.15,
    minimumBookingAmount: process.env.MIN_BOOKING_AMOUNT || 50,
    maxBookingAdvance: process.env.MAX_BOOKING_ADVANCE || 30,
    supportEmail: process.env.SUPPORT_EMAIL || 'SUPPORT@BOOKANDMOVE.COM',
    supportPhone: process.env.SUPPORT_PHONE || '+1-800-BOOK-MOVE'
  };

  res.json({
    success: true,
    data: settings
  });
});

export const updatePlatformSettings = catchAsync(async (req, res) => {
  const { platformFee, minimumBookingAmount, maxBookingAdvance } = req.body;
  
  // In a real implementation, you'd save these to a database
  // For now, we'll just validate and return success
  
  if (platformFee < 0 || platformFee > 1) {
    return res.status(400).json({
      success: false,
      message: 'Platform fee must be between 0 and 1'
    });
  }

  if (minimumBookingAmount < 0) {
    return res.status(400).json({
      success: false,
      message: 'Minimum booking amount must be positive'
    });
  }

  res.json({
    success: true,
    message: 'Platform settings updated successfully'
  });
});

// Payment Management
export const getAllPayments = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, status, type, startDate, endDate } = req.query;
  
  const query = {};
  if (status) query.status = status;
  if (type) query.type = type;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;
  
  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate('customer', 'firstName lastName email')
      .populate('mover', 'businessName email')
      .populate('booking', 'pickupAddress deliveryAddress totalAmount customerInfo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Payment.countDocuments(query)
  ]);

  // Calculate total revenue for the filtered results
  const totalRevenue = await Payment.aggregate([
    { $match: query },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  res.json({
    success: true,
    data: {
      payments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalPayments: total,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    }
  });
});

export const getPaymentDetails = catchAsync(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate('customer', 'firstName lastName email phone')
    .populate('mover', 'businessName email phone')
    .populate('booking', 'pickupAddress deliveryAddress totalAmount services customerInfo');

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  res.json({
    success: true,
    data: payment
  });
});
