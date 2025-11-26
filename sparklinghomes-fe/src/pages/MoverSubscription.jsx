import { useState, useEffect } from 'react';
import { FiCreditCard, FiCalendar, FiShield, FiCheck, FiAlertCircle, FiDollarSign } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../services';

const MoverSubscription = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch(getApiUrl('/movers/me'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) throw new Error('Network error');

      const data = await response.json();
      setSubscriptionData(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (window.confirm('Are you sure you want to cancel your subscription? You will lose access to job opportunities immediately.')) {
      try {
        const response = await fetch(getApiUrl('/payments/subscription/cancel'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reason: 'User requested cancellation' })
        });

        if (response.ok) {
          alert('Subscription cancelled successfully');
          navigate('/mover/dashboard');
        } else {
          throw new Error('Failed to cancel subscription');
        }
      } catch (error) {
        alert('Failed to cancel subscription: ' + error.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subscription details...</p>
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
            onClick={fetchSubscriptionData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isActive = subscriptionData?.subscriptionStatus === 'active';
  const expiresAt = subscriptionData?.subscriptionExpiresAt;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-green-600 rounded-lg flex items-center justify-center">
                <FiCreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
                <p className="text-sm text-gray-500">Manage your monthly subscription</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/mover/dashboard')}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Subscription Status */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Current Subscription</h2>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <FiCheck className={`h-4 w-4 mr-2 ${isActive ? 'text-green-600' : 'text-red-600'}`} />
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiDollarSign className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900">Monthly Plan</h3>
              <p className="text-sm text-gray-600">$150/month</p>
            </div>
            
            <div className="text-center">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiCalendar className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900">Next Billing</h3>
              <p className="text-sm text-gray-600">
                {expiresAt ? new Date(expiresAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            
            <div className="text-center">
              <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiShield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-900">Status</h3>
              <p className="text-sm text-gray-600">
                {isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </div>

        {/* Subscription Benefits */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Included</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <FiCheck className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Job Calendar Access</h4>
                <p className="text-sm text-gray-600">View all available moving jobs in your area</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <FiCheck className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Real-time Alerts</h4>
                <p className="text-sm text-gray-600">Get instant notifications for new job opportunities</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <FiCheck className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Instant Booking Claims</h4>
                <p className="text-sm text-gray-600">Claim and manage bookings immediately</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <FiCheck className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Professional Profile</h4>
                <p className="text-sm text-gray-600">Showcase your business to customers</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <FiCheck className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Customer Reviews</h4>
                <p className="text-sm text-gray-600">Build your reputation with customer feedback</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <FiCheck className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Priority Support</h4>
                <p className="text-sm text-gray-600">Get help when you need it most</p>
              </div>
            </div>
          </div>
        </div>

        {/* Billing Information */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Information</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-600">Plan Name</span>
              <span className="font-medium text-gray-900">Monthly Professional Plan</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-600">Amount</span>
              <span className="font-medium text-gray-900">$150.00 USD</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-600">Billing Cycle</span>
              <span className="font-medium text-gray-900">Monthly</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-600">Next Billing Date</span>
              <span className="font-medium text-gray-900">
                {expiresAt ? new Date(expiresAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-medium text-gray-900">Card ending in ****</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Actions</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Cancel Subscription</h4>
                <p className="text-sm text-gray-600">
                  Cancel your subscription and lose access to job opportunities
                </p>
              </div>
              <button
                onClick={handleCancelSubscription}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Cancel Subscription
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <h4 className="font-medium text-blue-900">Need Help?</h4>
                <p className="text-sm text-blue-700">
                  Contact our support team for assistance with your subscription
                </p>
              </div>
              <button
                onClick={() => window.open('mailto:SUPPORT@BOOKANDMOVE.COM', '_blank')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoverSubscription;
