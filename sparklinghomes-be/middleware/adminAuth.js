import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { catchAsync } from '../utils/catchAsync.js';

export const adminAuth = catchAsync(async (req, res, next) => {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No token provided.' 
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. User not found.' 
      });
    }

    // Check if user is admin
    if (!user.isAdmin && user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. Invalid token.' 
    });
  }
});

export const checkAdminPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user.adminPermissions[permission]) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${permission} permission required.`
      });
    }
    next();
  };
};
