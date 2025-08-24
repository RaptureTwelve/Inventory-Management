import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { selectIsAuthenticated } from '../app/features/authSlice';

const ProtectedRoute = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const role = useSelector(state => state.auth.role); 
  const location = useLocation();

  // Temporarily bypass authentication for development
  // TODO: Re-enable authentication in production
  // if (!isAuthenticated) {
  //   return <Navigate to="/login" replace state={{ from: location }} />;
  // }

  if (location.pathname === '/') {
    // Default to dashboard for development
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;