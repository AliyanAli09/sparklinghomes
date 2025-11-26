import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ 
  children, 
  requireAuth = true, 
  allowedUserTypes = [], 
  allowedRoles = [],
  redirectTo = '/login' 
}) => {
  const { isAuthenticated, loading, userType, user } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If user is authenticated but route requires no auth (e.g., login page)
  if (!requireAuth && isAuthenticated) {
    // Redirect based on user type
    const defaultRedirect = userType === 'mover' ? '/mover/dashboard' : '/dashboard';
    return <Navigate to={defaultRedirect} replace />;
  }

  // Check user type restrictions
  if (allowedUserTypes.length > 0 && !allowedUserTypes.includes(userType)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check role restrictions
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
