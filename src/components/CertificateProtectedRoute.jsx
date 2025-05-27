import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  Box,
  CircularProgress
} from '@mui/material';
import ProductionAdminAuth from './ProductionAdminAuth';
import { isElectron, isBrowser } from '../utils/environment';

/**
 * Protected route component that requires both authentication and admin access
 * Production-compatible version that works on Heroku
 */
const CertificateProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore(state => ({
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
  }));
  const location = useLocation();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Use ProductionAdminAuth for all environments
  // It will handle the appropriate authentication method based on environment
  return (
    <ProductionAdminAuth>
      {children}
    </ProductionAdminAuth>
  );
};

export default CertificateProtectedRoute;
