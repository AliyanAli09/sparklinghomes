import jwt from 'jsonwebtoken';

// Generate JWT token
export const signToken = (id, userType = 'customer') => {
  return jwt.sign({ id, userType }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Create and send token response
export const createSendToken = (user, statusCode, res, userType = 'customer', additionalData = {}) => {
  const token = signToken(user._id, userType);
  
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };

  res.cookie('token', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
      userType,
      ...additionalData
    }
  });
};
