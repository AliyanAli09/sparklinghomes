import { useState, useEffect } from 'react';
import { FiCreditCard, FiShield, FiCheck, FiAlertCircle, FiExternalLink } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { paymentService } from '../services';

const MoverPayment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleStripeCheckout = async () => {
    setLoading(true);
    setError('');

    try {
      // Create Stripe Checkout Session using payment service
      const response = await paymentService.createCheckoutSession(
        'mover-monthly',
        9700, // $97.00 in cents
        `${window.location.origin}/mover/payment?success=true`,
        `${window.location.origin}/mover/payment?canceled=true`
      );

      if (!response || !response.sessionUrl) {
        throw new Error('Invalid response from payment service');
      }

      const { sessionUrl } = response;
      
      // Redirect to Stripe Checkout
      window.location.href = sessionUrl;
    } catch (err) {
      setError(err.message || 'Failed to create checkout session');
      setLoading(false);
    }
  };

  // Check for success/cancel parameters in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setSuccess('Payment successful! Syncing subscription status...');
      
      // Sync subscription status from Stripe
      const syncSubscription = async () => {
        try {
          // First try to sync by email (for first-time activation)
          const user = JSON.parse(localStorage.getItem('userData'));
          if (user && user.email) {
            try {
              await paymentService.syncSubscriptionByEmail(user.email);
              setSuccess('Payment successful! Your subscription is now active.');
              setTimeout(() => {
                navigate('/mover/dashboard');
              }, 3000);
              return;
            } catch (emailError) {
              console.log('Email sync failed, trying regular sync:', emailError);
            }
          }
          
          // Fallback to regular sync
          await paymentService.syncSubscription();
          setSuccess('Payment successful! Your subscription is now active.');
          setTimeout(() => {
            navigate('/mover/dashboard');
          }, 3000);
        } catch (error) {
          console.error('Failed to sync subscription:', error);
          setSuccess('Payment successful! Redirecting to dashboard...');
          setTimeout(() => {
            navigate('/mover/dashboard');
          }, 3000);
        }
      };
      
      syncSubscription();
    } else if (urlParams.get('canceled') === 'true') {
      setError('Payment was canceled. You can try again anytime.');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-green-600 rounded-lg flex items-center justify-center">
                <FiCreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Complete Your Subscription</h1>
                <p className="text-sm text-gray-500">Set up your monthly payment to access jobs</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Information</h2>
              
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <FiAlertCircle className="h-5 w-5 text-red-600" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {success && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <FiCheck className="h-5 w-5 text-green-600" />
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                </div>
              )}

                             <div className="space-y-6">
                 <div className="text-center">
                   <div className="mb-4">
                     <FiShield className="h-12 w-12 text-green-600 mx-auto" />
                   </div>
                   <h3 className="text-lg font-medium text-gray-900 mb-2">
                     Secure Payment with Stripe
                   </h3>
                   <p className="text-sm text-gray-600">
                     Your payment information is securely processed by Stripe. We never store your card details.
                   </p>
                 </div>

                 <div className="bg-gray-50 p-4 rounded-lg">
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-sm font-medium text-gray-700">Monthly Subscription</span>
                     <span className="text-lg font-bold text-gray-900">$97.00</span>
                   </div>
                   <div className="text-xs text-gray-500">
                     Billed monthly • Cancel anytime
                   </div>
                 </div>

                 <button
                   onClick={handleStripeCheckout}
                   disabled={loading}
                   className="w-full bg-green-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                 >
                   {loading ? (
                     <>
                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                       <span>Creating Checkout Session...</span>
                     </>
                   ) : (
                     <>
                       <FiCreditCard className="h-5 w-5" />
                       <span>Subscribe with Stripe - $97/month</span>
                     </>
                   )}
                 </button>

                 <div className="text-center">
                   <p className="text-xs text-gray-500">
                     By clicking subscribe, you agree to our{' '}
                     <a href="/terms" className="text-green-600 hover:text-green-700 underline">
                       Terms of Service
                     </a>{' '}
                     and{' '}
                     <a href="/privacy" className="text-green-600 hover:text-green-700 underline">
                       Privacy Policy
                     </a>
                   </p>
                 </div>
               </div>
            </div>
          </div>

          {/* Subscription Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Details</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Monthly Plan</span>
                  <span className="font-semibold text-gray-900">$97/month</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Billing Cycle</span>
                  <span className="text-gray-900">Monthly</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Next Billing</span>
                  <span className="text-gray-900">30 days</span>
                </div>
              </div>

              <div className="border-t border-gray-200 mt-6 pt-6">
                <h4 className="font-medium text-gray-900 mb-3">What's Included:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <FiCheck className="h-4 w-4 text-green-600" />
                    <span>Access to job calendar</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <FiCheck className="h-4 w-4 text-green-600" />
                    <span>Real-time job alerts</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <FiCheck className="h-4 w-4 text-green-600" />
                    <span>Claim bookings instantly</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <FiCheck className="h-4 w-4 text-green-600" />
                    <span>Professional profile</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <FiCheck className="h-4 w-4 text-green-600" />
                    <span>Customer reviews</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <FiShield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-medium text-blue-900">Secure Payment</h5>
                    <p className="text-sm text-blue-700 mt-1">
                      Your payment information is encrypted and secure. You can cancel your subscription at any time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoverPayment;
