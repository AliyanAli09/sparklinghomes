import api from './api';

// Authentication service
export const authService = {
  // Register new user
  registerUser: async (userData) => {
    const response = await api.post('/auth/register/user', userData);
    
    if (response.token) {
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('userData', JSON.stringify(response.data));
    }
    
    return response;
  },

  // Register new mover
  registerMover: async (moverData) => {
    const response = await api.post('/auth/register/mover', moverData);
    
    if (response.token) {
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('userData', JSON.stringify(response.data));
    }
    
    return response;
  },

  // Login user or mover
  login: async (email, password, userType = 'customer') => {
    const response = await api.post('/auth/login', {
      email,
      password,
      userType
    });
    
    if (response.token) {
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('userData', JSON.stringify(response.data));
    }
    
    return response;
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Even if logout fails on server, clear local storage
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    }
  },

  // Get current user
  getCurrentUser: async () => {
    return await api.get('/auth/me');
  },

  // Update profile
  updateProfile: async (profileData) => {
    return await api.put('/auth/update-profile', profileData);
  },

  // Update password
  updatePassword: async (currentPassword, newPassword) => {
    return await api.put('/auth/update-password', {
      currentPassword,
      newPassword
    });
  },

  // Forgot password
  forgotPassword: async (email) => {
    return await api.post('/auth/forgot-password', { email });
  },

  // Reset password
  resetPassword: async (token, newPassword) => {
    return await api.post(`/auth/reset-password/${token}`, {
      password: newPassword
    });
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('authToken');
    return !!token;
  },

  // Get stored user data
  getStoredUserData: () => {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  },

  // Get auth token
  getToken: () => {
    return localStorage.getItem('authToken');
  }
};
