import jwt from 'jsonwebtoken';
import { asyncHandler } from './errorHandler.js';
import User from '../models/User.js';
import Mover from '../models/Mover.js';

// Protect routes - require authentication
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check for token in cookies
  if (!token && req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user or mover based on userType
    let currentUser;
    if (decoded.userType === 'mover') {
      currentUser = await Mover.findById(decoded.id).select('-password');
    } else {
      currentUser = await User.findById(decoded.id).select('-password');
    }

    if (!currentUser) {
      return res.status(401).json({
        status: 'error',
        message: 'The user belonging to this token no longer exists'
      });
    }

    // Check if user is active
    if (!currentUser.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Your account has been deactivated'
      });
    }

    // Grant access to protected route
    req.user = currentUser;
    req.userType = decoded.userType;
    
    console.log('🔐 protect middleware:');
    console.log('  decoded.userType:', decoded.userType);
    console.log('  req.userType:', req.userType);
    console.log('  req.user.role:', req.user.role);
    console.log('  req.user._id:', req.user._id);
    
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Not authorized to access this route'
    });
  }
});

// Restrict to specific roles
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

// Restrict to specific user types
export const restrictToUserType = (...userTypes) => {
  return (req, res, next) => {
    // Flatten the userTypes array to handle both string and array inputs
    const flattenedUserTypes = userTypes.flat();
    
    console.log('🔒 restrictToUserType middleware:');
    console.log('  Required userTypes:', flattenedUserTypes);
    console.log('  req.userType:', req.userType);
    console.log('  req.user.role:', req.user?.role);
    console.log('  req.user:', req.user);
    
    if (!flattenedUserTypes.includes(req.userType)) {
      console.log('❌ Access denied - userType not in allowed types');
      return res.status(403).json({
        status: 'error',
        message: 'This action is not allowed for your account type'
      });
    }
    
    console.log('✅ Access granted');
    next();
  };
};

// Check if user owns resource or is admin
export const checkOwnership = (Model, paramName = 'id') => {
  return asyncHandler(async (req, res, next) => {
    const resource = await Model.findById(req.params[paramName]);
    
    if (!resource) {
      return res.status(404).json({
        status: 'error',
        message: 'Resource not found'
      });
    }

    // Allow if user is admin
    if (req.user.role === 'admin') {
      req.resource = resource;
      return next();
    }

    // Check ownership based on user type
    let isOwner = false;
    
    if (req.userType === 'mover') {
      isOwner = resource.mover?.toString() === req.user._id.toString() ||
                resource._id.toString() === req.user._id.toString();
    } else {
      isOwner = resource.customer?.toString() === req.user._id.toString() ||
                resource._id.toString() === req.user._id.toString();
    }

    if (!isOwner) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only access your own resources'
      });
    }

    req.resource = resource;
    next();
  });
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      let currentUser;
      if (decoded.userType === 'mover') {
        currentUser = await Mover.findById(decoded.id).select('-password');
      } else {
        currentUser = await User.findById(decoded.id).select('-password');
      }

      if (currentUser && currentUser.isActive) {
        req.user = currentUser;
        req.userType = decoded.userType;
      }
    } catch (error) {
      // Token invalid but we don't fail - just continue without user
    }
  }

  next();
});
