import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore'; // Adjust path as needed
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, initializeAuth } = useAuthStore(state => ({
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    initializeAuth: state.initializeAuth,
  }));
  const location = useLocation();

  useEffect(() => {
    // Call initializeAuth only if it hasn't been called or if loading state is true by default
    // This ensures that on first load of any protected route, auth state is checked.
    // The authStore itself should prevent multiple initializations if not needed.
    if (isLoading) { // Assuming isLoading is true before initializeAuth completes
        console.log('ProtectedRoute: Initializing auth state...');
        initializeAuth();
    }
  }, [initializeAuth, isLoading]);

  if (isLoading) {
    // Show a loading spinner while checking auth status
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    // User not authenticated, redirect to login page
    // Pass the current location so that login page can redirect back after successful login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, render the requested component
  return children;
};

export default ProtectedRoute;
