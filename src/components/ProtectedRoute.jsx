import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore'; // Adjust path as needed
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore(state => ({
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
  }));
  const location = useLocation();

  // Remove the duplicate initialization call - App.jsx already handles this

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
