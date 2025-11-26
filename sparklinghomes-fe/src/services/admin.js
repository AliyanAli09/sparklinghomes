import api from './api';

const adminService = {
  // Get all users (with admin filter)
  getAllUsers: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add pagination
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.role) queryParams.append('role', params.role);
    if (params.search) queryParams.append('search', params.search);
    
    const response = await api.get(`/admin/users?${queryParams.toString()}`);
    return response;
  },

  // Get user by ID
  getUserById: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response;
  },

  // Create new admin user
  createAdmin: async (adminData) => {
    const response = await api.post('/admin/users', {
      ...adminData,
      role: 'admin',
      isAdmin: true,
      isVerified: true,
      isActive: true
    });
    return response;
  },

  // Update user
  updateUser: async (userId, userData) => {
    const response = await api.put(`/admin/users/${userId}`, userData);
    return response;
  },

  // Delete user
  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response;
  },

  // Get dashboard stats
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard');
    return response;
  },

  // Get all movers
  getAllMovers: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.verificationStatus) queryParams.append('verificationStatus', params.verificationStatus);
    if (params.search) queryParams.append('search', params.search);
    
    const response = await api.get(`/admin/movers?${queryParams.toString()}`);
    return response;
  },

  // Get verified movers for assignment
  getVerifiedMovers: async () => {
    const response = await api.get('/admin/movers/verified');
    return response;
  },

  // Get mover details
  getMoverDetails: async (moverId) => {
    const response = await api.get(`/admin/movers/${moverId}`);
    return response;
  },

  // Verify mover
  verifyMover: async (moverId, verificationData) => {
    const response = await api.put(`/admin/movers/${moverId}/verify`, verificationData);
    return response;
  },

  // Get all bookings
  getAllBookings: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);
    
    const response = await api.get(`/admin/bookings?${queryParams.toString()}`);
    return response;
  },

  // Get booking details
  getBookingDetails: async (bookingId) => {
    const response = await api.get(`/admin/bookings/${bookingId}`);
    return response;
  },

  // Update booking status
  updateBookingStatus: async (bookingId, statusData) => {
    const response = await api.put(`/admin/bookings/${bookingId}/status`, statusData);
    return response;
  },

  // Update booking (comprehensive)
  updateBooking: async (bookingId, bookingData) => {
    const response = await api.put(`/admin/bookings/${bookingId}`, bookingData);
    return response;
  },

  // Get all payments
  getAllPayments: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    if (params.type) queryParams.append('type', params.type);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    
    const response = await api.get(`/admin/payments?${queryParams.toString()}`);
    return response;
  },

  // Get payment details
  getPaymentDetails: async (paymentId) => {
    const response = await api.get(`/admin/payments/${paymentId}`);
    return response;
  },

  // Get analytics
  getAnalytics: async (days = '30') => {
    const response = await api.get(`/admin/analytics?days=${days}`);
    return response;
  },

  // Get platform settings
  getPlatformSettings: async () => {
    const response = await api.get('/admin/settings');
    return response;
  },

  // Update platform settings
  updatePlatformSettings: async (settings) => {
    const response = await api.put('/admin/settings', settings);
    return response;
  },

  // Sync all subscriptions
  syncAllSubscriptions: async () => {
    const response = await api.post('/admin/subscriptions/sync-all');
    return response;
  },

  // Get subscription sync status
  getSubscriptionSyncStatus: async () => {
    const response = await api.get('/admin/subscriptions/sync-status');
    return response;
  },

  // Get cron status
  getCronStatus: async () => {
    const response = await api.get('/admin/cron-status');
    return response;
  },

  // Trigger job alerts
  triggerJobAlerts: async () => {
    const response = await api.post('/admin/trigger-job-alerts');
    return response;
  },

  // Start cron jobs
  startCronJobs: async () => {
    const response = await api.post('/admin/cron/start');
    return response;
  },

  // Stop cron jobs
  stopCronJobs: async () => {
    const response = await api.post('/admin/cron/stop');
    return response;
  }
};

export default adminService;
