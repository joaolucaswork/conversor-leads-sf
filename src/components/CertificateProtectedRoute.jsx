import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  Box,
  CircularProgress,
  Alert,
  Typography,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Security as SecurityIcon,
  Download as DownloadIcon,
  VpnKey as CertIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

/**
 * Protected route component that requires both authentication and client certificate
 * Used specifically for admin panel access
 */
const CertificateProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore(state => ({
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
  }));
  const location = useLocation();
  const [certificateStatus, setCertificateStatus] = useState('checking');
  const [certificateError, setCertificateError] = useState(null);

  // Check for client certificate availability
  useEffect(() => {
    const checkCertificate = async () => {
      try {
        // In a real implementation, this would check if the browser has a client certificate
        // For now, we'll simulate the check and provide instructions
        
        // Check if we're in development mode
        const isDevelopment = import.meta.env.MODE === 'development';
        
        if (isDevelopment) {
          console.log('🔧 Development mode: Certificate check bypassed');
          setCertificateStatus('available');
          return;
        }

        // Check if client certificate is available
        // This is a simplified check - in production, the server would validate the actual certificate
        const hasCertificate = await checkClientCertificate();
        
        if (hasCertificate) {
          setCertificateStatus('available');
        } else {
          setCertificateStatus('missing');
          setCertificateError('Client certificate required for admin access');
        }
      } catch (error) {
        console.error('Certificate check failed:', error);
        setCertificateStatus('error');
        setCertificateError(error.message);
      }
    };

    if (isAuthenticated && !isLoading) {
      checkCertificate();
    }
  }, [isAuthenticated, isLoading]);

  // Simulate client certificate check
  const checkClientCertificate = async () => {
    // In a real implementation, this would:
    // 1. Make a test request to a certificate-protected endpoint
    // 2. Check if the browser prompts for certificate selection
    // 3. Validate the certificate with the server
    
    // For demo purposes, we'll check if certificates exist
    try {
      const response = await fetch('/certificates/admin-client.p12', { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  };

  const handleDownloadCertificate = () => {
    // In production, this would download the certificate bundle
    const link = document.createElement('a');
    link.href = '/certificates/admin-client.p12';
    link.download = 'admin-client.p12';
    link.click();
  };

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

  if (certificateStatus === 'checking') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Box textAlign="center">
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="body1">Checking certificate authentication...</Typography>
        </Box>
      </Box>
    );
  }

  if (certificateStatus === 'missing' || certificateStatus === 'error') {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, p: 3 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Certificate Authentication Required
          </Typography>
          <Typography variant="body2">
            Access to the Admin Panel requires a valid client certificate for security.
          </Typography>
        </Alert>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <CertIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Certificate Installation Instructions
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Follow these steps to install the admin certificate and gain access:
            </Typography>

            <List>
              <ListItem>
                <ListItemIcon>
                  <DownloadIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="1. Download Certificate Bundle"
                  secondary="Download the admin-client.p12 certificate file"
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleDownloadCertificate}
                  startIcon={<DownloadIcon />}
                >
                  Download
                </Button>
              </ListItem>

              <Divider />

              <ListItem>
                <ListItemIcon>
                  <CertIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="2. Install Certificate"
                  secondary="Import the certificate into your browser or system keystore"
                />
              </ListItem>

              <Divider />

              <ListItem>
                <ListItemIcon>
                  <WarningIcon color="warning" />
                </ListItemIcon>
                <ListItemText
                  primary="3. Certificate Password"
                  secondary="Use password: admin123 when prompted during installation"
                />
              </ListItem>

              <Divider />

              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="4. Refresh Page"
                  secondary="After installation, refresh this page to access the admin panel"
                />
              </ListItem>
            </List>

            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Browser-Specific Instructions:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Chrome/Edge:</strong> Settings → Privacy and Security → Manage Certificates → Import<br />
                <strong>Firefox:</strong> Settings → Privacy & Security → Certificates → View Certificates → Import<br />
                <strong>Safari:</strong> Double-click the .p12 file to import into Keychain Access
              </Typography>
            </Box>

            {certificateError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Error:</strong> {certificateError}
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Certificate is available, render the protected content
  return children;
};

export default CertificateProtectedRoute;
