import { asyncHandler } from '../middleware/errorHandler.js';
import { createSendToken } from '../utils/jwt.js';
import User from '../models/User.js';
import Mover from '../models/Mover.js';
import { sendPasswordResetEmail, sendPasswordResetConfirmationEmail, sendWelcomeEmail, sendWelcomeCleanerEmail } from '../utils/email.js';
import crypto from 'crypto';

// @desc    Register user
// @route   POST /api/auth/register/user
// @access  Public
export const registerUser = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, phone, address } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      status: 'error',
      message: 'User with this email already exists'
    });
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phone,
    address
  });

  // Send welcome email
  try {
    await sendWelcomeEmail(user);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    // Don't fail registration if email fails
  }

  createSendToken(user, 201, res, 'customer');
});

// @desc    Register mover
// @route   POST /api/auth/register/mover
// @access  Public
export const registerMover = asyncHandler(async (req, res, next) => {
  const {
    businessName,
    licenseNumber,
    firstName,
    lastName,
    email,
    password,
    phone,
    address,
    services,
    pricing,
    teamSize,
    insuranceAmount,
    description
  } = req.body;

  // Check if mover already exists
  const existingMover = await Mover.findOne({ 
    $or: [{ email }, { licenseNumber }] 
  });
  
  if (existingMover) {
    return res.status(400).json({
      status: 'error',
      message: 'Mover with this email already exists'
    });
  }

  // Create mover
  const mover = await Mover.create({
    businessName,
    licenseNumber,
    firstName,
    lastName,
    email,
    password,
    phone,
    address,
    services,
    pricing,
    teamSize,
    insuranceAmount,
    description,
    status: 'pending' // Requires admin approval
  });

  // Send welcome email
  try {
    await sendWelcomeCleanerEmail(mover);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    // Don't fail registration if email fails
  }

  createSendToken(mover, 201, res, 'mover');
});

// @desc    Login user/mover
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res, next) => {
  const { email, password, userType = 'customer' } = req.body;

  // Check if email and password are provided
  if (!email || !password) {
    return res.status(400).json({
      status: 'error',
      message: 'Please provide email and password'
    });
  }

  // Find user based on type
  let user;
  if (userType === 'mover') {
    user = await Mover.findOne({ email }).select('+password');
  } else if (userType === 'admin') {
    // Admin users are stored in the User collection
    user = await User.findOne({ email }).select('+password');
    
    // Verify user is actually an admin
    if (!user || user.role !== 'admin' || !user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin privileges required.'
      });
    }
  } else {
    user = await User.findOne({ email }).select('+password');
  }

  // Check if user exists and password is correct
  if (!user || !(await user.correctPassword(password, user.password))) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid email or password'
    });
  }

  // Check if account is active
  if (!user.isActive) {
    return res.status(401).json({
      status: 'error',
      message: 'Your account has been deactivated'
    });
  }

  // For admin users, also check if they are verified
  if (userType === 'admin' && !user.isVerified) {
    return res.status(401).json({
      status: 'error',
      message: 'Admin account requires verification'
    });
  }

  // For movers, allow login regardless of status but include status in response
  if (userType === 'mover') {
    // Allow login but include verification status
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    
    return createSendToken(user, 200, res, userType, { 
      verificationStatus: user.status,
      isVerified: user.status === 'approved'
    });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  createSendToken(user, 200, res, userType);
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
export const logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
      userType: req.userType
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phone: req.body.phone,
    address: req.body.address
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => 
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  let updatedUser;
  if (req.userType === 'mover') {
    updatedUser = await Mover.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });
  } else {
    updatedUser = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
export const updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  let user;
  if (req.userType === 'mover') {
    user = await Mover.findById(req.user._id).select('+password');
  } else {
    user = await User.findById(req.user._id).select('+password');
  }

  // Check if current password is correct
  if (!(await user.correctPassword(currentPassword, user.password))) {
    return res.status(401).json({
      status: 'error',
      message: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  createSendToken(user, 200, res, req.userType);
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      status: 'error',
      message: 'Please provide an email address'
    });
  }

  // Check both User and Mover models
  let user = await User.findOne({ email });
  let userType = 'customer';
  
  if (!user) {
    user = await Mover.findOne({ email });
    userType = 'mover';
  }

  if (!user) {
    return res.status(404).json({
      status: 'error',
      message: 'User with this email not found'
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save({ validateBeforeSave: false });

  // Send reset email with proper user data structure
  try {
    await sendPasswordResetEmail({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    }, resetToken);
    res.status(200).json({
      status: 'success',
      message: 'Password reset instructions sent to your email'
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return res.status(500).json({
      status: 'error',
      message: 'Failed to send password reset email'
    });
  }
});

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = asyncHandler(async (req, res, next) => {
  const resetPasswordToken = req.params.token;
  const { password } = req.body;

  if (!resetPasswordToken || !password) {
    return res.status(400).json({
      status: 'error',
      message: 'Please provide a token and new password'
    });
  }

  // Check both User and Mover models
  let user = await User.findOne({
    passwordResetToken: crypto.createHash('sha256').update(resetPasswordToken).digest('hex'),
    passwordResetExpires: { $gt: Date.now() }
  });
  
  let userType = 'customer';
  
  if (!user) {
    user = await Mover.findOne({
      passwordResetToken: crypto.createHash('sha256').update(resetPasswordToken).digest('hex'),
      passwordResetExpires: { $gt: Date.now() }
    });
    userType = 'mover';
  }

  if (!user) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid or expired token'
    });
  }

  // Update password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Send confirmation email
  try {
    await sendPasswordResetConfirmationEmail({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    });
    res.status(200).json({
      status: 'success',
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Failed to send password reset confirmation email:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to send password reset confirmation email'
    });
  }
});
