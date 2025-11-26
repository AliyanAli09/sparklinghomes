import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = authService.getToken();
        const storedUserData = authService.getStoredUserData();
        
        if (token && storedUserData) {
          // Verify token is still valid by making a request
          const response = await authService.getCurrentUser();
          setUser(response.data.user);
          setUserType(response.data.userType);
          setIsAuthenticated(true);
        }
      } catch (error) {
        // Token is invalid or expired
        console.error('Auth initialization error:', error);
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email, password, userType = 'customer') => {
    try {
      const response = await authService.login(email, password, userType);
      setUser(response.data.user);
      setUserType(response.data.userType);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Register function
  const register = async (userData, isCustomer = true) => {
    try {
      let response;
      if (isCustomer) {
        response = await authService.registerUser(userData);
      } else {
        response = await authService.registerMover(userData);
      }
      
      setUser(response.data.user);
      setUserType(response.data.userType);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setUserType(null);
      setIsAuthenticated(false);
    }
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);
      setUser(response.data.user);
      return response;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  // Update password function
  const updatePassword = async (currentPassword, newPassword) => {
    try {
      const response = await authService.updatePassword(currentPassword, newPassword);
      return response;
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Check if user is customer
  const isCustomer = () => {
    return userType === 'customer';
  };

  // Check if user is mover
  const isMover = () => {
    return userType === 'mover';
  };

  // Check if user is admin
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const value = {
    user,
    userType,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    updatePassword,
    hasRole,
    isCustomer,
    isMover,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
