import api from './api';

export const paymentService = {
  // Create booking deposit payment intent
  createBookingDeposit: async (bookingId, amount) => {
    const response = await api.post('/payments/booking-deposit', {
      bookingId,
      amount
    });
    // The API interceptor already returns response.data, so response IS the data
    return response;
  },

  // Create mover subscription
  createSubscription: async (moverId, paymentMethodId) => {
    const response = await api.post('/payments/subscription', {
      moverId,
      paymentMethodId
    });
    // The API interceptor already returns response.data, so response IS the data
    return response;
  },

  // Confirm payment
  confirmPayment: async (paymentIntentId) => {
    const response = await api.post('/payments/confirm', {
      paymentIntentId
    });
    // The API interceptor already returns response.data, so response IS the data
    return response;
  },

  // Get payment history
  getPaymentHistory: async (page = 1, limit = 10) => {
    const response = await api.get('/payments/history', {
      params: { page, limit }
    });
    // The API interceptor already returns response.data, so response IS the data
    return response;
  },

  // Get mover subscription
  getSubscription: async () => {
    const response = await api.get('/payments/subscription');
    // The API interceptor already returns response.data, so response IS the data
    return response;
  },

  // Cancel subscription
  cancelSubscription: async (reason) => {
    const response = await api.post('/payments/subscription/cancel', {
      reason
    });
    // The API interceptor already returns response.data, so response IS the data
    return response;
  },

  // Create Stripe checkout session for mover subscription
  createCheckoutSession: async (plan, amount, successUrl, cancelUrl) => {
    const response = await api.post('/payments/create-checkout-session', {
      plan,
      amount,
      successUrl,
      cancelUrl
    });
    
    // The API interceptor already returns response.data, so response IS the data
    return response;
  },

  // Manually sync subscription status from Stripe
  syncSubscription: async (moverId = null) => {
    const endpoint = moverId ? `/payments/subscription/sync/${moverId}` : '/payments/subscription/sync';
    const response = await api.post(endpoint);
    return response;
  },

  // Manually sync subscription status from Stripe by email
  syncSubscriptionByEmail: async (email) => {
    const response = await api.post('/payments/subscription/sync/email', { email });
    return response;
  },

  // Get subscription sync service status
  getSyncServiceStatus: async () => {
    const response = await api.get('/payments/subscription/sync/status');
    return response;
  }
};

export default paymentService;
