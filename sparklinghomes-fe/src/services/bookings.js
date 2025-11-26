import api from './api';
import axios from 'axios';

// Create a separate axios instance for guest bookings (no auth required)
const guestApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Bookings service
export const bookingsService = {
  // Create new booking (guest - no auth required)
  createBooking: async (bookingData) => {
    console.log('📤 Sending booking data to backend:', bookingData);
    const response = await guestApi.post('/bookings/guest', bookingData);
    console.log('📥 Raw backend response:', response);
    console.log('📥 Response status:', response.status);
    console.log('📥 Response data:', response.data);
    return response;
  },

  // Get booking by ID
  getBooking: async (bookingId) => {
    return await api.get(`/bookings/${bookingId}`);
  },

  // Get guest booking by ID (no auth required)
  getGuestBooking: async (bookingId) => {
    return await guestApi.get(`/bookings/guest/${bookingId}`);
  },

  // Update booking
  updateBooking: async (bookingId, updateData) => {
    return await api.put(`/bookings/${bookingId}`, updateData);
  },

  // Delete booking
  deleteBooking: async (bookingId) => {
    return await api.delete(`/bookings/${bookingId}`);
  },

  // Get user bookings (customer)
  getUserBookings: async () => {
    return await api.get('/users/me/bookings');
  },

  // Get mover bookings (mover)
  getMoverBookings: async () => {
    return await api.get('/movers/me/bookings');
  },

  // Provide quote (mover only)
  provideQuote: async (bookingId, quoteData) => {
    return await api.post(`/bookings/${bookingId}/quote`, { quote: quoteData });
  },

  // Accept quote (customer only)
  acceptQuote: async (bookingId) => {
    return await api.post(`/bookings/${bookingId}/accept-quote`);
  },

  // Cancel booking
  cancelBooking: async (bookingId, reason) => {
    return await api.post(`/bookings/${bookingId}/cancel`, { reason });
  },

  // Complete booking (mover only)
  completeBooking: async (bookingId, completionData) => {
    return await api.post(`/bookings/${bookingId}/complete`, completionData);
  },

  // Get booking messages
  getBookingMessages: async (bookingId) => {
    return await api.get(`/bookings/${bookingId}/messages`);
  },

  // Add message to booking
  addMessage: async (bookingId, message) => {
    return await api.post(`/bookings/${bookingId}/messages`, { message });
  },

  // Upload booking photos
  uploadBookingPhotos: async (bookingId, photos, type = 'before') => {
    const formData = new FormData();
    photos.forEach((photo) => {
      formData.append('photos', photo);
    });
    formData.append('type', type); // 'before' or 'after'
    
    return await api.post(`/bookings/${bookingId}/photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Get all bookings (admin only)
  getAllBookings: async () => {
    return await api.get('/bookings');
  },

  // Calculate quote estimate (utility function)
  calculateQuoteEstimate: (hourlyRate, estimatedHours, additionalFees = []) => {
    const laborCost = hourlyRate * estimatedHours;
    const additionalTotal = additionalFees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
    const subtotal = laborCost + additionalTotal;
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + tax;
    
    return {
      hourlyRate,
      estimatedHours,
      laborCost,
      additionalFees,
      subtotal,
      tax,
      total,
      currency: 'USD'
    };
  },

  // Get booking status options
  getStatusOptions: () => [
    'quote-requested',
    'quote-provided',
    'quote-accepted',
    'confirmed',
    'in-progress',
    'completed',
    'cancelled',
    'disputed'
  ],

  // Get move type options
  getMoveTypeOptions: () => [
    'local',
    'long-distance',
    'commercial',
    'residential'
  ],

  // Get home size options
  getHomeSizeOptions: () => [
    'studio',
    '1-bedroom',
    '2-bedroom',
    '3-bedroom',
    '4-bedroom',
    '5+-bedroom',
    'office',
    'warehouse',
    'other'
  ],

  // Get services options
  getServicesOptions: () => [

    'packing',
    'unpacking',
    'furniture-disassembly',
    'furniture-assembly',
    'piano-moving',
    'cleaning',
    'storage'
  ]
};
