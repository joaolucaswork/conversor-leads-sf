import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Container,
  Paper
} from '@mui/material';
import {
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
  Lock as LockIcon
} from '@mui/icons-material';

const ProductionAdminAuth = ({ children, onAuthSuccess }) => {
  const [adminToken, setAdminToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if already authenticated on component mount
  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      // Check if admin session exists
      const adminSession = localStorage.getItem('admin_session');
      if (adminSession) {
        // Verify the session with the backend
        const response = await fetch('/api/v1/admin/verify', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'X-Admin-Token': adminSession
          }
        });

        if (response.ok) {
          setIsAuthenticated(true);
          if (onAuthSuccess) onAuthSuccess();
        } else {
          // Clear invalid session
          localStorage.removeItem('admin_session');
        }
      }
    } catch (error) {
      console.error('Error checking admin authentication:', error);
      localStorage.removeItem('admin_session');
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Attempt to authenticate with admin token
      const response = await fetch('/api/v1/admin/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          admin_token: adminToken
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Store admin session
        localStorage.setItem('admin_session', result.session_token || adminToken);
        setIsAuthenticated(true);
        
        if (onAuthSuccess) onAuthSuccess();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Invalid admin credentials');
      }
    } catch (error) {
      console.error('Admin authentication error:', error);
      setError('Failed to authenticate. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    setIsAuthenticated(false);
    setAdminToken('');
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  // Show admin login form if not authenticated
  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <AdminIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            
            <Typography component="h1" variant="h5" gutterBottom>
              Admin Panel Access
            </Typography>
            
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
              This section requires administrative privileges. Please enter your admin access token.
            </Typography>

            <Alert severity="info" sx={{ width: '100%', mb: 3 }}>
              <Typography variant="body2">
                <strong>Production Environment:</strong> Client certificate authentication is not available on Heroku. 
                Please use your admin access token to proceed.
              </Typography>
            </Alert>

            <Box component="form" onSubmit={handleAdminLogin} sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Admin Access Token"
                type="password"
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
                margin="normal"
                required
                disabled={isLoading}
                placeholder="Enter your admin access token"
                InputProps={{
                  startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />

              {error && (
                <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={isLoading || !adminToken.trim()}
                startIcon={isLoading ? <CircularProgress size={20} /> : <SecurityIcon />}
              >
                {isLoading ? 'Authenticating...' : 'Access Admin Panel'}
              </Button>
            </Box>

            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1, width: '100%' }}>
              <Typography variant="subtitle2" gutterBottom>
                Need Access?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Contact your system administrator to obtain an admin access token. 
                This token is required to access administrative features in the production environment.
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    );
  }

  // Show admin content if authenticated
  return (
    <Box>
      {/* Admin header with logout option */}
      <Box sx={{ mb: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AdminIcon sx={{ mr: 1, color: 'success.dark' }} />
            <Typography variant="body2" color="success.dark">
              Admin Panel Access Granted
            </Typography>
          </Box>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>
      </Box>
      
      {/* Render protected admin content */}
      {children}
    </Box>
  );
};

export default ProductionAdminAuth;
