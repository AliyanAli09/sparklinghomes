import { useState, useEffect } from 'react';
import { FiUsers, FiHome, FiCalendar, FiDollarSign, FiTrendingUp, FiSettings, FiShield, FiBarChart2, FiAlertCircle, FiUser } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout.jsx';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) throw new Error('Network error');
      
      const data = await response.json();
      setStats(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };



  const navigateToSection = (section) => {
    // Map section names to actual routes
    const routeMap = {
      'movers': 'movers',
      'users': 'users', 
      'admins': 'admins',
      'bookings': 'bookings',
      'analytics': 'analytics',
      'settings': 'settings'
    };
    
    const route = routeMap[section];
    if (route) {
      navigate(`/admin/${route}`);
    }
  };

  const formatDepositAmount = (depositAmount) => {
    // Handle both old format (might be stored as dollars) and new format (cents)
    if (!depositAmount) return '0.00';
    
    // If amount is less than 1000, assume it's already in dollars
    // If amount is 1000 or more, assume it's in cents and convert
    const amount = depositAmount < 1000 ? depositAmount : depositAmount / 100;
    return amount.toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-red-600">Error: {error}</p>
          <button 
            onClick={fetchDashboardStats}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout
      title="Admin Dashboard"
      subtitle="Welcome back"
    >
      <div className="max-w-7xl mx-auto">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiUsers className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.overview?.totalUsers || 0}</p>
              </div>
            </div>
          </div> */}

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiHome className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Cleaners</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.overview?.totalMovers || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FiCalendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.overview?.totalBookings || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FiDollarSign className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${((stats?.overview?.totalRevenue || 0) / 100).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div
            onClick={() => navigateToSection('movers')}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Cleaner Management</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Manage cleaner accounts & verifications
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FiHome className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

         {/*  <div 
            onClick={() => navigateToSection('users')}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Customer Management</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Manage customer accounts
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FiUsers className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div> */}

          <div 
            onClick={() => navigate('/admin/payments')}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Payment Management</h3>
                <p className="text-sm text-gray-600 mt-1">
                  View all payments & revenue
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FiDollarSign className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div 
            onClick={() => navigateToSection('admins')}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Admin Management</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Manage platform administrators
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiShield className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div 
            onClick={() => navigateToSection('bookings')}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Booking Management</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Monitor all bookings
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiCalendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div 
            onClick={() => navigateToSection('analytics')}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Platform insights & reports
                </p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <FiBarChart2 className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>

        {/*   <div 
            onClick={() => navigateToSection('settings')}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Platform Settings</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Configure platform parameters
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <FiSettings className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </div> */}

         {/*  <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Quick Actions</h3>
                <p className="text-sm opacity-90 mt-1">
                  Common admin tasks
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <FiTrendingUp className="h-6 w-6" />
              </div>
            </div>
          </div> */}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
          </div>
          <div className="p-6">
            {stats?.recentBookings?.length > 0 ? (
              <div className="space-y-4">
                {stats.recentBookings.map((booking) => (
                  <div key={booking._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <FiUser className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {booking.customer?.firstName || booking.customerInfo?.firstName} {booking.customer?.lastName || booking.customerInfo?.lastName}
                            {booking.customerInfo && !booking.customer && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Guest
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(booking.moveDate).toLocaleDateString()} • {booking.status}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ${formatDepositAmount(booking.deposit?.amount || 0)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {booking.deposit?.paid ? 'Paid' : 'Pending'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recent bookings</p>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
              <button 
                onClick={() => navigate('/admin/payments')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View all
              </button>
            </div>
          </div>
          <div className="p-6">
            {stats?.recentPayments?.length > 0 ? (
              <div className="space-y-4">
                {stats.recentPayments.map((payment) => (
                  <div key={payment._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                        <FiDollarSign className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {payment.customer ? 
                            `${payment.customer.firstName} ${payment.customer.lastName}` :
                            payment.mover ? payment.mover.businessName : 
                            payment.booking?.customerInfo ? `${payment.booking.customerInfo.firstName} ${payment.booking.customerInfo.lastName}` :
                            'Guest'
                          }
                          {payment.booking?.customerInfo && !payment.customer && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Guest
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600">
                          {payment.type === 'booking-deposit' ? 'Booking Deposit' :
                           payment.type === 'mover-subscription' ? 'Cleaner Subscription' : payment.type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ${(payment.amount / 100).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recent payments</p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
