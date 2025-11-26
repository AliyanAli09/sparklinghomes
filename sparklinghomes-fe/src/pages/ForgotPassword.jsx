import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiTruck, FiArrowLeft } from 'react-icons/fi';
import { authService } from '../services/auth.js';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!email) {
        throw new Error('Please enter your email address');
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      await authService.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Left Side - Success Message */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-sm w-full space-y-4">
            {/* Logo/Brand */}
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-green-600 rounded-xl flex items-center justify-center mb-3">
                <FiMail className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Check Your Email
              </h2>
              <p className="mt-1 text-gray-600 text-sm">
                We've sent password reset instructions to:
              </p>
              <p className="mt-2 text-sm font-medium text-gray-900">{email}</p>
            </div>

            {/* Success Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="text-center space-y-4">
                <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                  <FiMail className="h-8 w-8 text-green-600" />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Reset Email Sent
                  </h3>
                  <p className="text-sm text-gray-600">
                    Click the link in the email to reset your password. 
                    The link will expire in 1 hour for security.
                  </p>
                </div>

                <div className="pt-4 space-y-3">
                  <Link
                    to="/login"
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <FiArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Link>
                  
                  <button
                    onClick={() => setSuccess(false)}
                    className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Send Another Email
                  </button>
                </div>
              </div>
            </div>

            {/* Help Text */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  onClick={() => setSuccess(false)}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  try again
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Decorative */}
        <div className="hidden lg:flex flex-1 relative overflow-hidden">
          <div className="absolute inset-0 bg-green-600"></div>
          <div className="relative z-10 flex items-center justify-center w-full">
            <div className="text-center text-white">
              <div className="mb-6">
                <FiTruck className="mx-auto h-20 w-20 text-white/80" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Password Reset</h3>
              <p className="text-lg text-white/90 max-w-md">
                We'll help you get back into your account securely
              </p>
            </div>
          </div>
          
          {/* Floating elements */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-green-400/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-green-400/20 rounded-full blur-lg"></div>
          <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-green-300/20 rounded-full blur-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-sm w-full space-y-4">
          {/* Logo/Brand */}
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center mb-3">
              <FiTruck className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Forgot Password?
            </h2>
            <p className="mt-1 text-gray-600 text-sm">
              No worries! Enter your email and we'll send you reset instructions
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sending...</span>
                    </div>
                  ) : (
                    'Send Reset Instructions'
                  )}
                </button>
              </div>
            </form>

            {/* Back to login link */}
            <div className="mt-4 text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                <FiArrowLeft className="h-4 w-4 mr-1" />
                Back to Login
              </Link>
            </div>
          </div>

          {/* Help Text */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Remember your password?{' '}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Decorative */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600"></div>
        <div className="relative z-10 flex items-center justify-center w-full">
          <div className="text-center text-white">
            <div className="mb-6">
              <FiTruck className="mx-auto h-20 w-20 text-white/80" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Moving Made Simple</h3>
            <p className="text-lg text-white/90 max-w-md">
              Connect with trusted movers or grow your business with our platform
            </p>
          </div>
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-400/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-400/20 rounded-full blur-lg"></div>
        <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-blue-300/20 rounded-full blur-lg"></div>
      </div>
    </div>
  );
};

export default ForgotPassword;
