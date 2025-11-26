// Service exports
export { authService } from './auth';
export { moversService } from './movers';
export { bookingsService } from './bookings';
export { reviewsService } from './reviews';
export { paymentService } from './payment';
export { jobDistributionService } from './jobDistribution';
export { default as adminService } from './admin';
export { default as api } from './api';

// API Configuration
export const getApiUrl = (endpoint = '') => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return endpoint ? `${baseUrl}${endpoint}` : baseUrl;
};

// Service utilities
export const serviceUtils = {
  // Format API errors for display
  formatError: (error) => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      // Convert common network error messages to user-friendly format
      if (error.message.includes('Failed to fetch') || 
          error.message.includes('Network Error') ||
          error.message.includes('network error') ||
          error.message.includes('fetch')) {
        return 'Network error';
      }
      return error.message;
    }
    return 'An unexpected error occurred';
  },

  // Debounce function
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Format phone number for display
  formatPhoneNumber: (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  },

  // Format currency
  formatCurrency: (amount, currency = 'USD') => {
    if (!amount && amount !== 0) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  },

  // Format date for display
  formatDate: (date, options = {}) => {
    if (!date) return '';
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    };
    return new Date(date).toLocaleDateString('en-US', defaultOptions);
  },

  // Format date and time
  formatDateTime: (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Calculate distance between two coordinates (simplified)
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 10) / 10; // Round to 1 decimal
  },

  // Validate email format
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate phone number format
  isValidPhone: (phone) => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  },

  // Generate star rating array for display
  generateStarRating: (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push('full');
    }
    
    if (hasHalfStar) {
      stars.push('half');
    }
    
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push('empty');
    }
    
    return stars;
  },

  // Get services options
  getServicesOptions: () => [
   
    'packing',
    'unpacking',
    'furniture-disassembly',
    'furniture-assembly',
    'piano-moving',
    'cleaning',
    'storage'
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

  // Get move type options
  getMoveTypeOptions: () => [
    'local',
    'long-distance',
    'commercial',
    'residential'
  ]
};
