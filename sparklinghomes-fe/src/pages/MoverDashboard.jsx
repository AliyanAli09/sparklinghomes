import { useState, useEffect } from 'react';
import { FiHome, FiCalendar, FiAlertCircle, FiCheckCircle, FiClock, FiDollarSign, FiShield, FiUser, FiCheck } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const MoverDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [moverData, setMoverData] = useState(null);

  useEffect(() => {
    fetchMoverData();
  }, []);

  const fetchMoverData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/movers/me`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) throw new Error('Network error');

      const data = await response.json();
      setMoverData(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };



  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending Verification', icon: FiClock },
      approved: { color: 'bg-green-100 text-green-800', text: 'Verified', icon: FiCheckCircle },
      suspended: { color: 'bg-orange-100 text-orange-800', text: 'Suspended', icon: FiAlertCircle },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rejected', icon: FiAlertCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${config.color}`}>
        <Icon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
        <span className="hidden sm:inline">{config.text}</span>
        <span className="sm:hidden">{config.text.split(' ')[0]}</span>
      </span>
    );
  };

  const getSubscriptionBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', text: 'Active', icon: FiCheckCircle },
      inactive: { color: 'bg-gray-100 text-gray-800', text: 'Inactive', icon: FiAlertCircle },
      expired: { color: 'bg-red-100 text-red-800', text: 'Expired', icon: FiAlertCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending', icon: FiClock }
    };

    const config = statusConfig[status] || statusConfig.inactive;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${config.color}`}>
        <Icon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
            onClick={fetchMoverData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isVerified = moverData?.status === 'approved';
  const hasActiveSubscription = moverData?.subscriptionStatus === 'active';
  const canAccessJobs = isVerified && hasActiveSubscription;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 sm:py-4 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <FiHome className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Cleaner Dashboard</h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate">Welcome back, {user?.firstName}</p>
              </div>
            </div>
            <div className="flex items-center justify-end sm:justify-start">
              <button
                onClick={handleLogout}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
         {/* Process Overview - Only show when not verified */}
         {!isVerified && (
           <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl shadow-sm p-6 border border-blue-200 mb-8">
             <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">How to Get Started with Book&Move</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="text-center">
                 <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                   <span className="text-2xl font-bold text-yellow-600">1</span>
                 </div>
                 <h3 className="font-medium text-gray-900 mb-2">Complete Verification</h3>
                 <p className="text-sm text-gray-600">
                   Submit business credentials, insurance, and service areas for admin review
                 </p>
               </div>
               
               <div className="text-center">
                 <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                   <span className="text-2xl font-bold text-blue-600">2</span>
                 </div>
                 <h3 className="font-medium text-gray-900 mb-2">Activate Subscription</h3>
                 <p className="text-sm text-gray-600">
                   Pay $97/month to access job calendar and receive real-time alerts
                 </p>
               </div>
               
               <div className="text-center">
                 <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                   <span className="text-2xl font-bold text-green-600">3</span>
                 </div>
                 <h3 className="font-medium text-gray-900 mb-2">Start Earning</h3>
                 <p className="text-sm text-gray-600">
                   Receive job alerts in your area and claim bookings instantly
                 </p>
               </div>
             </div>
           </div>
         )}

         {/* Status Overview */}
         <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Account Status</h2>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {getStatusBadge(moverData?.status || 'pending')}
              {getSubscriptionBadge(moverData?.subscriptionStatus || 'inactive')}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6">
            <div className="text-center p-3 sm:p-0">
              <div className="h-12 w-12 sm:h-16 sm:w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <FiUser className="h-5 w-5 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Business Name</h3>
              <p className="text-xs sm:text-sm text-gray-600 break-words">{moverData?.businessName || 'N/A'}</p>
            </div>
            
            
          </div>
        </div>

                 {/* Action Cards */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
           {/* Profile Management */}
           <div 
             onClick={() => navigate('/mover/profile')}
             className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
           >
             <div className="flex items-center justify-between">
               <div className="flex-1">
                 <h3 className="text-lg font-semibold text-gray-900">Profile Management</h3>
                 <p className="text-sm text-gray-600 mt-1">Update your business information and credentials</p>
               </div>
               <div className="p-3 bg-blue-100 rounded-lg ml-4">
                 <FiUser className="h-6 w-6 text-blue-600" />
               </div>
             </div>
           </div>

           {/* Job Access */}
           <div 
             onClick={canAccessJobs ? () => navigate('/mover/jobs') : undefined}
             className={`rounded-xl shadow-sm p-6 border ${
               canAccessJobs 
                 ? 'bg-white border-gray-200 hover:shadow-md transition-shadow cursor-pointer' 
                 : 'bg-gray-50 border-gray-200'
             }`}
           >
             <div className="flex items-center justify-between">
               <div className="flex-1">
                 <h3 className="text-lg font-semibold text-gray-900">Job Access</h3>
                 <p className="text-sm text-gray-600 mt-1">
                   {canAccessJobs 
                     ? 'Access available cleaning jobs in your service areas' 
                     : 'Complete verification to access job opportunities'
                   }
                 </p>
               </div>
               <div className={`p-3 rounded-lg ml-4 ${
                 canAccessJobs ? 'bg-green-100' : 'bg-gray-100'
               }`}>
                 <FiCalendar className={`h-6 w-6 ${
                   canAccessJobs ? 'text-green-600' : 'text-gray-400'
                 }`} />
               </div>
             </div>
             
             {!canAccessJobs && (
               <div className="mt-4 space-y-2">
                 {!isVerified && (
                   <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                     <div className="flex items-center space-x-2">
                       <FiClock className="h-4 w-4 text-yellow-600" />
                       <span className="font-medium">Verification Pending</span>
                     </div>
                   </div>
                 )}
                 {isVerified && !hasActiveSubscription && (
                   <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                     <div className="flex items-center space-x-2">
                       <FiDollarSign className="h-4 w-4 text-blue-600" />
                       <span className="font-medium">Subscription Required</span>
                     </div>
                   </div>
                 )}
               </div>
             )}
           </div>

           {/* Subscription Management */}
           <div 
             onClick={() => navigate(hasActiveSubscription ? '/mover/subscription' : '/mover/payment')}
             className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
           >
             <div className="flex items-center justify-between">
               <div className="flex-1">
                 <h3 className="text-lg font-semibold text-gray-900">Subscription</h3>
                 <p className="text-sm text-gray-600 mt-1">
                   {hasActiveSubscription 
                     ? 'Manage your monthly subscription plan' 
                     : 'Activate your monthly subscription plan'
                   }
                 </p>
                 {hasActiveSubscription && (
                   <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-200">
                     <div className="flex items-center justify-between">
                       <span className="font-medium">Current Plan</span>
                       <span className="text-green-600 font-semibold">$97/month</span>
                     </div>
                   </div>
                 )}
               </div>
               <div className="p-3 bg-green-100 rounded-lg ml-4">
                 <FiDollarSign className="h-6 w-6 text-green-600" />
               </div>
             </div>
           </div>
         </div>

                 {/* Verification Status */}
         {!isVerified && (
           <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
             <div className="flex items-start space-x-3">
               <FiClock className="h-6 w-6 text-yellow-600 mt-0.5" />
               <div className="flex-1">
                 <h3 className="text-lg font-medium text-yellow-900">Account Verification Required</h3>
                 <p className="text-sm text-yellow-700 mt-1 mb-4">
                   To start receiving job opportunities, you need to complete your account verification. 
                   This process typically takes 1-3 business days after submission.
                 </p>
                 
                 <div className="bg-white rounded-lg p-4 border border-yellow-200">
                   <h4 className="font-medium text-yellow-900 mb-3">Step 1: Complete Your Profile</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-800">
                     <div className="space-y-2">
                       <div className="flex items-center space-x-2">
                         <FiCheck className="h-4 w-4 text-yellow-600" />
                         <span>Service Area & Availability</span>
                       </div>
                       <div className="flex items-center space-x-2">
                         <FiCheck className="h-4 w-4 text-yellow-600" />
                         <span>Vehicle Information</span>
                       </div>
                       <div className="flex items-center space-x-2">
                         <FiCheck className="h-4 w-4 text-yellow-600" />
                         <span>Proof of Insurance</span>
                       </div>
                     </div>
                     <div className="space-y-2">
                       <div className="flex items-center space-x-2">
                         <FiCheck className="h-4 w-4 text-yellow-600" />
                         <span>Business Credentials</span>
                       </div>
                       <div className="flex items-center space-x-2">
                         <FiCheck className="h-4 w-4 text-yellow-600" />
                         <span>License Verification</span>
                       </div>
                       <div className="flex items-center space-x-2">
                         <FiCheck className="h-4 w-4 text-yellow-600" />
                         <span>Background Check</span>
                       </div>
                     </div>
                   </div>
                 </div>
                 
                                   <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    
                    <button 
                      onClick={() => navigate('/mover/onboard')}
                      className="px-6 py-3 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 transition-colors duration-200"
                    >
                      Start Getting Jobs
                    </button>
                  </div>
               </div>
             </div>
           </div>
         )}

                 {/* Subscription Required */}
         {isVerified && !hasActiveSubscription && (
           <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
             <div className="flex items-start space-x-3">
               <FiDollarSign className="h-6 w-6 text-blue-600 mt-0.5" />
               <div className="flex-1">
                 <h3 className="text-lg font-medium text-blue-900">Step 2: Activate Monthly Subscription</h3>
                 <p className="text-sm text-blue-700 mt-1 mb-4">
                   Great news! Your account has been verified. Now you need to activate your monthly subscription 
                   to start receiving job opportunities and earning money.
                 </p>
                 
                 <div className="bg-white rounded-lg p-4 border border-blue-200 mb-4">
                   <h4 className="font-medium text-blue-900 mb-3">What Your $97/month Subscription Includes:</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                     <div className="space-y-2">
                       <div className="flex items-center space-x-2">
                         <FiCheck className="h-4 w-4 text-blue-600" />
                         <span>Access to job calendar</span>
                       </div>
                       <div className="flex items-center space-x-2">
                         <FiCheck className="h-4 w-4 text-blue-600" />
                         <span>Real-time job alerts</span>
                       </div>
                       <div className="flex items-center space-x-2">
                         <FiCheck className="h-4 w-4 text-blue-600" />
                         <span>Claim bookings instantly</span>
                       </div>
                     </div>
                     <div className="space-y-2">
                       <div className="flex items-center space-x-2">
                         <FiCheck className="h-4 w-4 text-blue-600" />
                         <span>Professional profile</span>
                       </div>
                       <div className="flex items-center space-x-2">
                         <FiCheck className="h-4 w-4 text-blue-600" />
                         <span>Customer reviews</span>
                       </div>
                       <div className="flex items-center space-x-2">
                         <FiCheck className="h-4 w-4 text-blue-600" />
                         <span>Priority support</span>
                       </div>
                     </div>
                   </div>
                 </div>
                 
                 <button 
                   onClick={() => navigate('/mover/payment')}
                   className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                 >
                   Activate Subscription - $97/month
                 </button>
               </div>
             </div>
           </div>
         )}

                 {/* Job Access Available */}
         {canAccessJobs && (
           <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
             <div className="flex items-start space-x-3">
               <FiCheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
               <div className="flex-1">
                 <h3 className="text-lg font-medium text-green-900">Step 3: You're Ready to Work!</h3>
                 <p className="text-sm text-green-700 mt-1 mb-4">
                   Congratulations! Your account is fully verified and your subscription is active. 
                   You can now start receiving job opportunities and earning money.
                 </p>
                 
                 <div className="bg-white rounded-lg p-4 border border-green-200 mb-4">
                   <h4 className="font-medium text-green-900 mb-3">How Job Alerts Work:</h4>
                   <div className="space-y-3 text-sm text-green-800">
                     <div className="flex items-start space-x-3">
                       <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                       <div>
                         <strong>Automatic Job Detection:</strong> When a customer submits a cleaning job in your service area, 
                         you'll automatically receive a text/email alert with complete job details.
                       </div>
                     </div>
                     <div className="flex items-start space-x-3">
                       <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                       <div>
                         <strong>Job Details Include:</strong> Pickup/drop-off addresses, move date, size, special items, 
                         and customer contact information.
                       </div>
                     </div>
                     <div className="flex items-start space-x-3">
                       <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                       <div>
                         <strong>Your Choice:</strong> You can choose to accept the job and contact the customer directly, 
                         or ignore it if it doesn't fit your schedule.
                       </div>
                     </div>
                   </div>
                 </div>
                 
                                   <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={() => navigate('/mover/jobs')}
                      className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors duration-200"
                    >
                      View Available Jobs
                    </button>
                    <button 
                      onClick={() => navigate('/mover/profile')}
                      className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors duration-200"
                    >
                      Update Service Areas
                    </button>
                  </div>
               </div>
             </div>
           </div>
         )}
      </div>
    </div>
  );
};

export default MoverDashboard;

