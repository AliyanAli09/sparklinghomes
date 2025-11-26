import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { FiCreditCard, FiLock, FiCheckCircle, FiXCircle, FiInfo } from 'react-icons/fi';

const SubscriptionForm = ({ 
  moverId, 
  onSuccess, 
  onError, 
  className = '' 
}) => {
  const [stripe, setStripe] = useState(null);
  const [elements, setElements] = useState(null);
  const [cardElement, setCardElement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const initializeStripe = async () => {
      const stripeInstance = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
      setStripe(stripeInstance);
    };
    initializeStripe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!stripe) {
      setError('Stripe not loaded');
      setLoading(false);
      return;
    }

    try {
      // Create payment method
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message);
      }

      // Create subscription
      const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          moverId,
          paymentMethodId: paymentMethod.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create subscription');
      }

      const data = await response.json();
      
      if (data.data?.clientSecret) {
        // Confirm payment
        const { error: confirmError } = await stripe.confirmCardPayment(
          data.data.clientSecret,
          {
            payment_method: {
              card: cardElement,
            }
          }
        );

        if (confirmError) {
          throw new Error(confirmError.message);
        }

        // Confirm payment on backend
        await fetch(`${import.meta.env.VITE_API_URL}/payments/confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            paymentIntentId: data.data.subscription.id
          })
        });

        setSuccess(true);
        onSuccess?.(data.data);
      }
    } catch (err) {
      setError(err.message);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-6 text-center ${className}`}>
        <FiCheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-800 mb-2">Subscription Activated!</h3>
        <p className="text-green-600">
          Your monthly subscription has been activated successfully. You now have access to all job alerts and can claim bookings in your service area.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Monthly Subscription</h3>
        
        {/* Subscription Benefits */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <FiInfo className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-2">What you get with your subscription:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Access to real-time job alerts in your service area</li>
                <li>• Ability to claim and accept bookings</li>
                <li>• Customer contact information for confirmed jobs</li>
                <li>• Professional profile visibility to customers</li>
                <li>• Monthly billing at $150</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Monthly Subscription Fee</span>
            <span className="text-lg font-semibold text-gray-900">$150.00</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Billed monthly, cancel anytime</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Information
          </label>
          <div className="border border-gray-300 rounded-md p-3 bg-white">
            <div className="flex items-center space-x-2 text-gray-500">
              <FiCreditCard className="h-5 w-5" />
              <span className="text-sm">Secure payment powered by Stripe</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-center">
              <FiXCircle className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !stripe}
          className="w-full bg-primary-600 text-white py-3 px-4 rounded-md font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : (
            'Start Subscription - $150/month'
          )}
        </button>

        <div className="flex items-center justify-center text-xs text-gray-500">
          <FiLock className="h-4 w-4 mr-1" />
          Your payment information is secure and encrypted
        </div>

        <div className="text-xs text-gray-500 text-center">
          By subscribing, you agree to our terms of service and privacy policy. 
          You can cancel your subscription at any time.
        </div>
      </form>
    </div>
  );
};

export default SubscriptionForm;
