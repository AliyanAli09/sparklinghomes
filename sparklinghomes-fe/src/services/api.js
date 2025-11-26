import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  withCredentials: true, // Include cookies for authentication
  headers: {
    'Content-Type': 'application/json',
  },
});

// Debug logging
console.log('🔧 API Configuration:');
console.log('  Base URL:', import.meta.env.VITE_API_URL || 'http://localhost:5000/api');
console.log('  Environment:', import.meta.env.MODE);
console.log('  VITE_API_URL:', import.meta.env.VITE_API_URL);

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Debug logging for requests
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    console.log('  Base URL:', config.baseURL);
    console.log('  Full URL:', `${config.baseURL}${config.url}`);
    console.log('  Headers:', config.headers);
    if (config.data) {
      console.log('  Request Data:', config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Debug logging for successful responses
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    console.log('  Status:', response.status);
    console.log('  Data:', response.data);
    
    return response.data;
  },
  (error) => {
    // Enhanced error logging
    console.error('❌ API Error Response:');
    console.error('  URL:', error.config?.url);
    console.error('  Method:', error.config?.method);
    console.error('  Base URL:', error.config?.baseURL);
    console.error('  Full URL:', error.config?.baseURL + error.config?.url);
    
    if (error.response) {
      // Server responded with error status
      const { status, data, headers } = error.response;
      console.error('  Status:', status);
      console.error('  Status Text:', error.response.statusText);
      console.error('  Response Data:', data);
      console.error('  Response Headers:', headers);
      
      if (status === 404) {
        console.error('  🚨 404 Error - Route not found!');
        console.error('  This usually means:');
        console.error('    1. Backend server is not running');
        console.error('    2. API endpoint does not exist');
        console.error('    3. Wrong base URL configuration');
        console.error('    4. CORS issue');
      }
      
      if (status === 401) {
        // Unauthorized - clear token and redirect to appropriate login
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        console.log('  🔐 Unauthorized - redirecting to login');
        
        // Check if we're on an admin route and redirect accordingly
        if (window.location.pathname.startsWith('/admin')) {
          window.location.href = '/admin/login';
        } else {
          window.location.href = '/login';
        }
      }
      
      // Return the error message from server
      return Promise.reject(new Error(data.message || `HTTP ${status}: ${error.response.statusText}`));
    } else if (error.request) {
      // Network error
      console.error('  🌐 Network Error - No response received');
      console.error('  Request:', error.request);
      console.error('  This usually means:');
      console.error('    1. Backend server is not running');
      console.error('    2. Network connectivity issue');
      console.error('    3. CORS blocking the request');
      console.error('    4. Wrong port or URL');
      
      return Promise.reject(new Error('Network error. Please check your connection and ensure the backend server is running.'));
    } else {
      // Something else happened
      console.error('  💥 Unexpected Error:', error.message);
      return Promise.reject(new Error('An unexpected error occurred.'));
    }
  }
);

export default api;
