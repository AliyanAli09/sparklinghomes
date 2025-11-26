import { asyncHandler } from './errorHandler.js';
import Mover from '../models/Mover.js';

// Middleware to check if mover is verified for job access
export const requireVerifiedMover = asyncHandler(async (req, res, next) => {
  // Check if user is a mover
  if (req.userType !== 'mover') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Mover account required.'
    });
  }

  // Get mover details
  const mover = await Mover.findById(req.user._id);
  if (!mover) {
    return res.status(404).json({
      success: false,
      message: 'Mover not found'
    });
  }

  // Check if mover is verified
  if (mover.status !== 'approved') {
    return res.status(403).json({
      success: false,
      message: 'Your account is pending verification. You cannot access job offers yet.',
      verificationStatus: mover.status,
      isVerified: false
    });
  }

  // Check if mover has active subscription
  if (mover.subscriptionStatus !== 'active') {
    return res.status(403).json({
      success: false,
      message: 'Active subscription required to access job offers.',
      subscriptionStatus: mover.subscriptionStatus,
      isVerified: true
    });
  }

  // Mover is verified and has active subscription
  req.mover = mover;
  next();
});

// Middleware to check mover status but allow access (for profile updates, etc.)
export const checkMoverStatus = asyncHandler(async (req, res, next) => {
  if (req.userType !== 'mover') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Mover account required.'
    });
  }

  const mover = await Mover.findById(req.user._id);
  if (!mover) {
    return res.status(404).json({
      success: false,
      message: 'Mover not found'
    });
  }

  // Add mover status to request for conditional logic
  req.moverStatus = mover.status;
  req.isVerified = mover.status === 'approved';
  req.hasActiveSubscription = mover.subscriptionStatus === 'active';
  req.mover = mover;
  
  next();
});
