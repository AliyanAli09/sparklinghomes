import { useState, useEffect } from 'react';
import { FiPlus, FiCalendar, FiUser, FiStar, FiMapPin, FiTrendingUp, FiClock, FiCheckCircle, FiXCircle, FiAlertCircle, FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { bookingsService, serviceUtils } from '../services';

const Dashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    avgRating: 0
  });

  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const loadBookings = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        const response = await bookingsService.getUserBookings();
        console.log('🔍 API Response:', response);
        const userBookings = response.data?.bookings || [];
        console.log('🔍 User Bookings:', userBookings);
        
        setBookings(userBookings);
        
        // Debug: Log the first booking to see its structure
        if (userBookings.length > 0) {
          console.log('🔍 First booking structure:', userBookings[0]);
          console.log('🔍 Booking ID field:', userBookings[0]._id || userBookings[0].id);
          console.log('🔍 All booking IDs:', userBookings.map(b => ({ _id: b._id, id: b.id })));
        }
        
        // Calculate stats
        const completed = userBookings.filter(b => b.status === 'completed').length;
        const pending = userBookings.filter(b => ['quote-requested', 'quote-provided', 'confirmed'].includes(b.status)).length;
        
        setStats({
          total: userBookings.length,
          completed,
          pending,
          avgRating: completed > 0 ? 4.7 : 0 // This would come from user reviews in real app
        });
      } catch (err) {
        setError(serviceUtils.formatError(err));
        console.error('Failed to load bookings:', err);
        
        // Fallback to demo data if API fails
        setBookings([
          {
            _id: 'demo-1',
            id: 'demo-1', // Keep both for compatibility
            mover: { businessName: 'Swift Movers', rating: { average: 4.8 } },
            moveDate: '2024-02-15',
            status: 'confirmed',
            pickupAddress: { city: 'Austin', state: 'TX' },
            dropoffAddress: { city: 'Houston', state: 'TX' }
          }
        ]);
        setStats({ total: 1, completed: 0, pending: 1, avgRating: 0 });
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [isAuthenticated]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'quote-requested':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'quote-provided':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <FiCheckCircle className="w-4 h-4" />;
      case 'completed':
        return <FiCheckCircle className="w-4 h-4" />;
      case 'pending':
      case 'quote-requested':
      case 'quote-provided':
        return <FiClock className="w-4 h-4" />;
      case 'cancelled':
        return <FiXCircle className="w-4 h-4" />;
      default:
        return <FiClock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header Section */}
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                Welcome back, <span className="text-primary-600">{user?.firstName}!</span>
              </h1>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl">
                Manage your bookings, track progress, and stay updated on your upcoming moves
              </p>
            </div>
            <Link
              to="/book"
              className="inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <FiPlus className="mr-2 w-5 h-5" />
              <span className="hidden sm:inline">New Booking</span>
              <span className="sm:hidden">Book Now</span>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <FiCalendar className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                <FiCheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                <FiStar className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {stats.avgRating > 0 ? stats.avgRating : '--'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                <FiTrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-600 px-4 py-3 rounded-xl">
            <div className="flex items-center">
              <FiAlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          </div>
        )}

        {/* Recent Bookings */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-6 border-b border-gray-200/50">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Recent Bookings</h2>
            <p className="text-gray-600 mt-1">Track the status of your upcoming and completed moves</p>
          </div>
          
          {loading ? (
            <div className="p-6 sm:p-8">
              <div className="animate-pulse space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex space-x-4">
                    <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                    <div className="flex-1 space-y-3 py-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <FiCalendar className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No bookings yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Get started by creating your first booking. We'll connect you with professional movers in your area.
              </p>
              <Link
                to="/book"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <FiPlus className="mr-2 h-5 w-5" />
                Book Your First Move
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200/50">
              {bookings.map((booking) => (
                <div key={booking._id || booking.id} className="p-6 sm:p-8 hover:bg-gray-50/50 transition-colors duration-200">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shadow-lg">
                          <FiUser className="h-6 w-6 text-primary-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                          {booking.mover ? (
                            booking.mover.businessName
                          ) : (
                            <span className="text-gray-500 italic">Mover being assigned...</span>
                          )}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600">
                          <div className="flex items-center">
                            <FiCalendar className="mr-2 h-4 w-4 text-gray-400" />
                            <span className="font-medium">Date:</span>
                            <span className="ml-1">{booking.moveDate ? serviceUtils.formatDate(booking.moveDate) : 'Date TBD'}</span>
                          </div>
                          <div className="flex items-center">
                            <FiMapPin className="mr-2 h-4 w-4 text-gray-400" />
                            <span className="font-medium">Route:</span>
                            <span className="ml-1">{booking.pickupAddress?.city || 'TBD'} → {booking.dropoffAddress?.city || 'TBD'}</span>
                          </div>
                          {booking.mover ? (
                            <div className="flex items-center">
                              <FiStar className="mr-2 h-4 w-4 text-yellow-400" />
                              <span className="font-medium">Rating:</span>
                              <span className="ml-1">{booking.mover.rating?.average || '--'}</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-gray-400">
                              <FiUser className="mr-2 h-4 w-4" />
                              <span className="font-medium">Status:</span>
                              <span className="ml-1">Awaiting assignment</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 lg:flex-shrink-0">
                      <div className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-semibold border ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        <span className="ml-1.5">
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('-', ' ')}
                        </span>
                      </div>
                      <Link
                        to={`/bookings/${booking._id || booking.id}`}
                        className="inline-flex items-center px-4 py-2 text-primary-600 hover:text-primary-700 font-medium rounded-lg hover:bg-primary-50 transition-colors duration-200"
                      >
                        View Details
                        <FiArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/book"
            className="group bg-white/80 backdrop-blur-sm border border-white/20 p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <FiPlus className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 group-hover:text-primary-600 transition-colors duration-200">Book a Move</h3>
                <p className="text-gray-600 mt-1">Schedule your next move with professional movers</p>
              </div>
            </div>
          </Link>

          <Link
            to="/profile"
            className="group bg-white/80 backdrop-blur-sm border border-white/20 p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <FiUser className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">Update Profile</h3>
                <p className="text-gray-600 mt-1">Manage your account and preferences</p>
              </div>
            </div>
          </Link>

          <Link
            to="/reviews"
            className="group bg-white/80 backdrop-blur-sm border border-white/20 p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <FiStar className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 group-hover:text-amber-600 transition-colors duration-200">My Reviews</h3>
                <p className="text-gray-600 mt-1">View and manage your service reviews</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
