import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiEye, FiEyeOff, FiMail, FiLock, FiTruck, FiUser } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { serviceUtils } from '../services';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'mover'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  // Get redirect path from location state (will be updated after successful login)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form
      if (!formData.email || !formData.password) {
        throw new Error('Please fill in all fields');
      }

      if (!serviceUtils.isValidEmail(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Attempt login
      const response = await login(formData.email, formData.password, formData.userType);
      
      // Determine redirect path based on actual userType from response
      const redirectPath = location.state?.from?.pathname || 
        (response.data.userType === 'mover' ? '/mover/dashboard' : 
         response.data.userType === 'admin' ? '/admin/dashboard' : '/dashboard');
      
      // Redirect to intended page or appropriate dashboard
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(serviceUtils.formatError(err));
    } finally {
      setLoading(false);
    }
  };

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
              Welcome Back
            </h2>
            <p className="mt-1 text-gray-600 text-sm">
              Sign in to your Book&Move account
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
              {/* User Type Selection */}
             {/*  <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  I am a:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`relative cursor-pointer transition-all duration-200 ${
                    formData.userType === 'customer' 
                      ? 'ring-2 ring-blue-500 ring-offset-1' 
                      : 'hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="userType"
                      value="customer"
                      checked={formData.userType === 'customer'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className={`p-2 rounded-lg border-2 transition-all duration-200 ${
                      formData.userType === 'customer'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <FiUser className={`h-4 w-4 ${
                          formData.userType === 'customer' ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <span className={`text-sm font-medium ${
                          formData.userType === 'customer' ? 'text-blue-900' : 'text-gray-700'
                        }`}>
                          Customer
                        </span>
                      </div>
                    </div>
                  </label>
                  
                  <label className={`relative cursor-pointer transition-all duration-200 ${
                    formData.userType === 'mover' 
                      ? 'ring-2 ring-blue-500 ring-offset-1' 
                      : 'hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="userType"
                      value="mover"
                      checked={formData.userType === 'mover'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className={`p-2 rounded-lg border-2 transition-all duration-200 ${
                      formData.userType === 'mover'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <FiTruck className={`h-4 w-4 ${
                          formData.userType === 'mover' ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <span className={`text-sm font-medium ${
                          formData.userType === 'mover' ? 'text-blue-900' : 'text-gray-700'
                        }`}>
                          Mover
                        </span>
                      </div>
                    </div>
                  </label>
                </div>
              </div> */}

              {/* Email */}
              <div className="space-y-1">
                <label htmlFor="email" className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label htmlFor="password" className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-4 w-4" />
                    ) : (
                      <FiEye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-gray-700">
                    Remember me
                  </label>
                </div>

                <div>
                  <Link
                    to="/forgot-password"
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Forgot password?
                  </Link>
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
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>
            </form>

            {/* Sign up link */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-600">
                Don't have an account?{' '}
                <Link
                  to="/mover/register"
                  className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Sign up here
                </Link>
              </p>
            </div>
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
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-400/20 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-blue-300/20 rounded-full blur-lg"></div>
      </div>
    </div>
  );
};

export default Login;
