import api from './api';

// Reviews service
export const reviewsService = {
  // Create new review
  createReview: async (reviewData) => {
    return await api.post('/reviews', reviewData);
  },

  // Create guest review (no auth required)
  createGuestReview: async (reviewData) => {
    return await api.post('/reviews/guest', reviewData);
  },

  // Get reviews with filters
  getReviews: async (filters = {}) => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        params.append(key, value);
      }
    });
    
    return await api.get(`/reviews?${params.toString()}`);
  },

  // Get review by ID
  getReview: async (reviewId) => {
    return await api.get(`/reviews/${reviewId}`);
  },

  // Update review (owner only)
  updateReview: async (reviewId, updateData) => {
    return await api.put(`/reviews/${reviewId}`, updateData);
  },

  // Delete review (owner/admin only)
  deleteReview: async (reviewId) => {
    return await api.delete(`/reviews/${reviewId}`);
  },

  // Mark review as helpful
  markHelpful: async (reviewId) => {
    return await api.post(`/reviews/${reviewId}/helpful`);
  },

  // Report review
  reportReview: async (reviewId, reason) => {
    return await api.post(`/reviews/${reviewId}/report`, { reason });
  },

  // Respond to review (reviewee only)
  respondToReview: async (reviewId, comment) => {
    return await api.post(`/reviews/${reviewId}/respond`, { comment });
  },

  // Get user reviews
  getUserReviews: async () => {
    return await api.get('/users/me/reviews');
  },

  // Get mover reviews
  getMoverReviews: async (moverId, filters = {}) => {
    const params = new URLSearchParams({
      reviewee: moverId,
      revieweeType: 'Mover',
      ...filters
    });
    
    return await api.get(`/reviews?${params.toString()}`);
  },

  // Get detailed rating categories
  getRatingCategories: () => [
    { key: 'punctuality', label: 'Punctuality' },
    { key: 'professionalism', label: 'Professionalism' },
    { key: 'care', label: 'Care of Belongings' },
    { key: 'communication', label: 'Communication' },
    { key: 'value', label: 'Value for Money' }
  ],

  // Get review categories
  getReviewCategories: () => [
    { key: 'excellent-service', label: 'Excellent Service', positive: true },
    { key: 'on-time', label: 'On Time', positive: true },
    { key: 'careful-handling', label: 'Careful Handling', positive: true },
    { key: 'professional', label: 'Professional', positive: true },
    { key: 'good-communication', label: 'Good Communication', positive: true },
    { key: 'fair-pricing', label: 'Fair Pricing', positive: true },
    { key: 'would-recommend', label: 'Would Recommend', positive: true },
    { key: 'late-arrival', label: 'Late Arrival', positive: false },
    { key: 'damaged-items', label: 'Damaged Items', positive: false },
    { key: 'unprofessional', label: 'Unprofessional', positive: false },
    { key: 'poor-communication', label: 'Poor Communication', positive: false },
    { key: 'overpriced', label: 'Overpriced', positive: false },
    { key: 'would-not-recommend', label: 'Would Not Recommend', positive: false }
  ],

  // Get report reasons
  getReportReasons: () => [
    'inappropriate',
    'spam',
    'fake',
    'offensive',
    'irrelevant'
  ],

  // Calculate overall rating from detailed ratings
  calculateOverallRating: (detailedRating) => {
    const ratings = Object.values(detailedRating).filter(rating => rating != null);
    if (ratings.length === 0) return 0;
    
    const sum = ratings.reduce((total, rating) => total + rating, 0);
    return Math.round((sum / ratings.length) * 10) / 10;
  },

  // Validate review data
  validateReviewData: (reviewData) => {
    const errors = {};
    
    if (!reviewData.bookingId) {
      errors.bookingId = 'Booking ID is required';
    }
    
    if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
      errors.rating = 'Rating must be between 1 and 5';
    }
    
    if (!reviewData.comment || reviewData.comment.trim().length < 10) {
      errors.comment = 'Comment must be at least 10 characters';
    }
    
    if (reviewData.comment && reviewData.comment.length > 1000) {
      errors.comment = 'Comment cannot exceed 1000 characters';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};
