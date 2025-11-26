import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiEye, FiEyeOff, FiMail, FiLock, FiUser, FiPhone, FiTruck, FiHome } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { serviceUtils } from '../services';

const Register = () => {
  const [formData, setFormData] = useState({
    userType: 'mover',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    // Mover specific fields
    businessName: '',
    licenseNumber: '',
    description: '',
    // Address
    street: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuth();

  // Check if registration type is specified in URL
  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'mover') {
      setFormData(prev => ({ ...prev, userType: 'mover' }));
    }
  }, [searchParams]);

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
      // Client-side validation
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.phone) {
        throw new Error('Please fill in all required fields');
      }

      if (!serviceUtils.isValidEmail(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      if (!serviceUtils.isValidPhone(formData.phone)) {
        throw new Error('Please enter a valid phone number');
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Additional validation for movers
      if (formData.userType === 'mover') {
        if (!formData.businessName || !formData.licenseNumber) {
          throw new Error('Business name and license number are required for movers');
        }
        if (!formData.street || !formData.city || !formData.state || !formData.zipCode) {
          throw new Error('Complete address information is required for movers');
        }
      }

      // Prepare data for API
      const registrationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode
        }
      };

      // Add mover-specific fields
      if (formData.userType === 'mover') {
        registrationData.businessName = formData.businessName;
        registrationData.licenseNumber = formData.licenseNumber;
        registrationData.description = formData.description;
        registrationData.services = ['local-moving']; // Default service
        registrationData.pricing = {
          hourlyRate: 100,
          minimumHours: 2,
          travelFee: 0
        };
        registrationData.teamSize = 2;
        registrationData.insuranceAmount = 100000;
      }

      // Attempt registration
      await register(registrationData, formData.userType === 'customer');
      
      // Redirect to appropriate dashboard
      const redirectPath = formData.userType === 'mover' ? '/mover/dashboard' : '/dashboard';
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(serviceUtils.formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const isCustomer = formData.userType === 'customer';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-xl w-full space-y-4">
          {/* Logo/Brand */}
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center mb-3">
              <FiTruck className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Join Book&Move
            </h2>
            <p className="mt-1 text-gray-600 text-sm">
              Create your account and start your moving journey
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
              {/* <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  I want to:
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
                          Book movers
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
                          Provide services
                        </span>
                      </div>
                    </div>
                  </label>
                </div>
              </div> */}

              {/* Business Name (Movers only) */}
              {!isCustomer && (
                <div className="space-y-1">
                  <label htmlFor="businessName" className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Business Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiHome className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      id="businessName"
                      name="businessName"
                      type="text"
                      required
                      value={formData.businessName}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                      placeholder="Your business name"
                    />
                  </div>
                </div>
              )}

              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="firstName" className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    First Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                      placeholder="First name"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="lastName" className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Last Name
                  </label>
                  <div className="relative">
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                      placeholder="Last name"
                    />
                  </div>
                </div>
              </div>

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

              {/* Phone */}
              <div className="space-y-1">
                <label htmlFor="phone" className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiPhone className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              {/* License Number (Movers only) */}
              {!isCustomer && (
                <div className="space-y-1">
                  <label htmlFor="licenseNumber" className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    License Number
                  </label>
                  <div className="relative">
                    <input
                      id="licenseNumber"
                      name="licenseNumber"
                      type="text"
                      required
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                      placeholder="Your business license number"
                    />
                  </div>
                </div>
              )}

              {/* Address Fields (Movers only) */}
              {!isCustomer && (
                <>
                  <div className="space-y-1">
                    <label htmlFor="street" className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Street Address
                    </label>
                    <input
                      id="street"
                      name="street"
                      type="text"
                      required
                      value={formData.street}
                      onChange={handleChange}
                      className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="city" className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        City
                      </label>
                      <input
                        id="city"
                        name="city"
                        type="text"
                        required
                        value={formData.city}
                        onChange={handleChange}
                        className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                        placeholder="City"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="state" className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        State
                      </label>
                      <input
                        id="state"
                        name="state"
                        type="text"
                        required
                        value={formData.state}
                        onChange={handleChange}
                        className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                        placeholder="State"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="zipCode" className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        ZIP Code
                      </label>
                      <input
                        id="zipCode"
                        name="zipCode"
                        type="text"
                        required
                        value={formData.zipCode}
                        onChange={handleChange}
                        className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                        placeholder="12345"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                      placeholder="Password"
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

                <div className="space-y-1">
                  <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="block w-full px-4 pr-10 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <FiEyeOff className="h-4 w-4" />
                      ) : (
                        <FiEye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start space-x-3 text-xs">
                <input
                  id="agree-terms"
                  name="agree-terms"
                  type="checkbox"
                  required
                  className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                />
                <label htmlFor="agree-terms" className="block text-gray-700">
                  I agree to the{' '}
                  <Link to="/terms" className="text-blue-600 hover:text-blue-500 font-medium">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-blue-600 hover:text-blue-500 font-medium">
                    Privacy Policy
                  </Link>
                </label>
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
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    'Create account'
                  )}
                </button>
              </div>
            </form>

            {/* Sign in link */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Sign in here
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
            <h3 className="text-2xl font-bold mb-3">Start Your Journey</h3>
            <p className="text-lg text-white/90 max-w-md">
              Whether you're moving or helping others move, we've got you covered
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

export default Register;
