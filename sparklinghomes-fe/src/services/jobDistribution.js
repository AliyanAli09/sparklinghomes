import api from './api';

// Job Distribution service
export const jobDistributionService = {
  // Get available jobs for mover
  getAvailableJobs: async () => {
    return await api.get('/jobs/available');
  },

  // Get job alerts for mover
  getJobAlerts: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });
    
    return await api.get(`/jobs/alerts?${queryParams.toString()}`);
  },

  // Respond to job alert
  respondToJobAlert: async (alertId, responseData) => {
    return await api.post(`/jobs/alerts/${alertId}/respond`, responseData);
  },

  // Mark job as completed
  markJobCompleted: async (alertId) => {
    return await api.put(`/jobs/alerts/${alertId}/complete`);
  },

  // Get notifications
  getNotifications: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });
    
    return await api.get(`/jobs/notifications?${queryParams.toString()}`);
  },

  // Mark notification as read
  markNotificationRead: async (notificationId) => {
    return await api.put(`/jobs/notifications/${notificationId}/read`);
  },

  // Mark all notifications as read
  markAllNotificationsRead: async () => {
    return await api.put('/jobs/notifications/read-all');
  },

  // Get unread notification count
  getUnreadCount: async () => {
    return await api.get('/jobs/notifications/unread-count');
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    return await api.delete(`/jobs/notifications/${notificationId}`);
  }
};
