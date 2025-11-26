import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { FiCreditCard, FiLock, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { authService } from '../services/auth';

// Stripe Elements configuration
const stripePromise = (() => {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!key || key === 'pk_test_dummy_key_for_development') {
    console.warn('VITE_STRIPE_PUBLISHABLE_KEY is not set or is dummy. Stripe payments will not work.');
    return null;
  }
  return loadStripe(key);
})();

// Add this helper function at the top of your component (after the imports)
const confirmPaymentWithRetry = async (confirmEndpoint, confirmHeaders, confirmBody, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const confirmResponse = await fetch(confirmEndpoint, {
        method: 'POST',
        headers: confirmHeaders,
        body: JSON.stringify(confirmBody)
      });

      if (confirmResponse.ok) {
        return confirmResponse;
      }

      // If it's the last attempt, throw the error
      if (attempt === maxRetries) {
        const errorData = await confirmResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to confirm payment after multiple attempts');
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      await new Promise(resolve => setTimeout(resolve, delay));
      
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      // Wait before retrying
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Card element options with improved mobile responsiveness
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#374151',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      '::placeholder': {
        color: '#9CA3AF',
      },
      iconColor: '#6B7280',
      lineHeight: '24px',
    },
    invalid: {
      color: '#DC2626',
      iconColor: '#DC2626',
    },
    complete: {
      color: '#059669',
      iconColor: '#059669',
    },
  },
  hideIcon: false,
};

// Separate element options for mobile layout
const separateElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#374151',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      '::placeholder': {
        color: '#9CA3AF',
      },
      iconColor: '#6B7280',
      lineHeight: '24px',
    },
    invalid: {
      color: '#DC2626',
      iconColor: '#DC2626',
    },
    complete: {
      color: '#059669',
      iconColor: '#059669',
    },
  },
};

// Inner component that uses Stripe hooks
const PaymentFormInner = ({ 
  amount, 
  onSuccess, 
  onError, 
  description, 
  paymentType = 'booking-deposit',
  bookingId = null,
  moverId = null,
  className = '',
  guestEmail = null // For guest bookings
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size for responsive card elements
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!stripe || !elements) {
      setError('Stripe not loaded');
      setLoading(false);
      return;
    }

    // Debug: Check authentication
    const token = authService.getToken();
    const isGuest = !token && guestEmail;
    
    console.log('🔐 PaymentForm Debug:');
    console.log('  Token exists:', !!token);
    console.log('  Is guest payment:', isGuest);
    console.log('  Guest email:', guestEmail);
    console.log('  Token length:', token ? token.length : 0);
    console.log('  Token preview:', token ? `${token.substring(0, 20)}...` : 'none');
    console.log('  Is authenticated:', authService.isAuthenticated());
    console.log('  User data:', authService.getStoredUserData());

    if (!token && !isGuest) {
      setError('Authentication required. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      let paymentIntent;
      
      if (paymentType === 'booking-deposit') {
        // Create payment intent for booking deposit
        const endpoint = isGuest 
          ? `${import.meta.env.VITE_API_URL}/payments/guest-booking-deposit`
          : `${import.meta.env.VITE_API_URL}/payments/booking-deposit`;
          
        const headers = {
          'Content-Type': 'application/json'
        };
        
        // Add authorization header only for authenticated users
        if (!isGuest && token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const requestBody = {
          bookingId,
          amount
        };
        
        // Add guest email for guest payments
        if (isGuest && guestEmail) {
          requestBody.guestEmail = guestEmail;
        }
        
        console.log('💳 Payment request:', {
          endpoint,
          headers,
          body: requestBody,
          isGuest
        });
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }

        const data = await response.json();
        paymentIntent = data.data;
      } else if (paymentType === 'mover-subscription') {
        // Create payment method for subscription
        const cardElement = isMobile 
          ? elements.getElement(CardNumberElement)
          : elements.getElement(CardElement);
          
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
            'Authorization': `Bearer ${authService.getToken()}`
          },
          body: JSON.stringify({
            moverId,
            paymentMethodId: paymentMethod.id
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create subscription');
        }

        const data = await response.json();
        paymentIntent = data.data;
      }

      if (paymentIntent?.clientSecret) {
        // Confirm payment
        const cardElement = isMobile 
          ? elements.getElement(CardNumberElement)
          : elements.getElement(CardElement);
          
        const { error: confirmError, paymentIntent: confirmedIntent } = await stripe.confirmCardPayment(
          paymentIntent.clientSecret,
          {
            payment_method: {
              card: cardElement,
            }
          }
        );

        if (confirmError) {
          throw new Error(confirmError.message);
        }

        if (confirmedIntent.status === 'succeeded') {
          // Confirm payment on backend
          setConfirming(true);
          const confirmEndpoint = isGuest 
            ? `${import.meta.env.VITE_API_URL}/payments/guest-confirm`
            : `${import.meta.env.VITE_API_URL}/payments/confirm`;
            
          const confirmHeaders = {
            'Content-Type': 'application/json'
          };
          
          // Add authorization header only for authenticated users
          if (!isGuest && token) {
            confirmHeaders['Authorization'] = `Bearer ${token}`;
          }
          
          const confirmBody = {
            paymentIntentId: confirmedIntent.id,
            paymentType: paymentType,
            bookingId: bookingId
          };
          
          // Add guest email for guest payments
          if (isGuest && guestEmail) {
            confirmBody.guestEmail = guestEmail;
          }
          
          console.log('✅ Confirming payment:', {
            endpoint: confirmEndpoint,
            headers: confirmHeaders,
            body: confirmBody,
            isGuest
          });
          
          try {
            await confirmPaymentWithRetry(confirmEndpoint, confirmHeaders, confirmBody);
            setSuccess(true);
            onSuccess?.(confirmedIntent);
          } catch (confirmError) {
            console.warn('Payment succeeded on Stripe but backend confirmation failed:', confirmError);
            
            // Show a different success message since payment went through
            setSuccess(true);
            onSuccess?.(confirmedIntent);
            
            // You might want to show a different message or handle this case specially
            // The webhook will eventually confirm this payment on your backend
          } finally {
            setConfirming(false);
          }
        } else {
          throw new Error('Payment was not successful');
        }
      }
    } catch (err) {
      setError(err.message);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  // Check if Stripe is properly initialized
  if (!stripe || !elements) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center ${className}`}>
        <FiXCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Payment System Loading</h3>
        <p className="text-yellow-600">
          Please wait while we initialize the payment system...
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-6 text-center ${className}`}>
        <FiCheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-800 mb-2">Payment Successful!</h3>
        <p className="text-green-600">
          {paymentType === 'booking-deposit' 
            ? 'Your booking deposit has been processed successfully.'
            : 'Your subscription has been activated successfully.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Details</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">
              {paymentType === 'booking-deposit' ? 'Booking Deposit' : 'Monthly Subscription'}
            </span>
            <span className="text-lg font-semibold text-gray-900">
              {formatAmount(amount)}
            </span>
          </div>
          {description && (
            <p className="text-sm text-gray-500 mt-2">{description}</p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Responsive Card Information */}
        {isMobile ? (
          // Mobile Layout - Separate Fields
          <>
            {/* Card Number Field - Full Width with Icons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
               
                Card Number
              </label>
              <div className="border border-gray-300 rounded-md p-4 bg-white focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-colors duration-200">
                <CardNumberElement options={separateElementOptions} />
              </div>
            </div>

            {/* Expiry and CVC Fields - Stacked on Mobile */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date
                </label>
                <div className="border border-gray-300 rounded-md p-4 bg-white focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-colors duration-200">
                  <CardExpiryElement options={separateElementOptions} />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Security Code (CVC)
                </label>
                <div className="border border-gray-300 rounded-md p-4 bg-white focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-colors duration-200">
                  <CardCvcElement options={separateElementOptions} />
                </div>
              </div>
            </div>
          </>
        ) : (
          // Desktop Layout - Single Field with Icons
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
             
              Card Information
            </label>
            <div className="border border-gray-300 rounded-md p-4 bg-white focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-colors duration-200">
              <CardElement options={cardElementOptions} />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter your card number, expiry date, and CVC
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-center">
              <FiXCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !stripe}
          className="w-full bg-primary-600 text-white py-3 px-4 rounded-md font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {(loading || confirming) ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              {confirming ? 'Confirming payment...' : 'Processing...'}
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <FiLock className="h-4 w-4 mr-2" />
              Pay {formatAmount(amount)}
            </div>
          )}
        </button>

        {/* Security and Stripe Branding */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-center text-xs text-gray-500">
            <FiLock className="h-4 w-4 mr-1" />
            Your payment information is secure and encrypted
          </div>
          
          {/* Powered by Stripe */}
          <div className="flex items-center justify-center">
            <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-full border">
              <span className="mr-2">Powered by</span>
              <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQQGluJhW7I1NYU7jF77E-9K9I46_ib_DUNHw&s" alt="Stripe" className="h-4" />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

// Wrapper component that provides Stripe Elements
const PaymentForm = (props) => {
  // Check if Stripe is available
  if (!stripePromise) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <FiXCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Payment System Unavailable</h3>
        <p className="text-yellow-600 mb-4">
          Stripe payment system is not configured. Please contact support.
        </p>
        <div className="text-sm text-yellow-700">
          <p>For now, you can complete your booking and we'll contact you about payment options.</p>
        </div>
      </div>
    );
  }

  // Add error boundary for Stripe initialization
  try {
    return (
      <Elements stripe={stripePromise}>
        <PaymentFormInner {...props} />
      </Elements>
    );
  } catch (error) {
    console.error('Stripe initialization error:', error);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <FiXCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Payment System Error</h3>
        <p className="text-red-600">
          Unable to initialize payment system. Please try refreshing the page.
        </p>
      </div>
    );
  }
};

export default PaymentForm;