import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
// Assuming you will have an authStore
// import { useAuthStore } from '../store/authStore'; // Adjust path as needed

const LoginPage = () => {
  const navigate = useNavigate();
  // const { login, isAuthenticated } = useAuthStore(state => ({ login: state.login, isAuthenticated: state.isAuthenticated }));
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect away from login
  // useEffect(() => {
  //   if (isAuthenticated) {
  //     navigate('/'); // Or to a designated post-login page
  //   }
  // }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      if (!window.electronAPI || !window.electronAPI.salesforceGetAuthUrl || !window.electronAPI.sendSalesforceOpenAuthWindow) {
        throw new Error('Salesforce API functions are not available. Is preload script working?');
      }
      const authUrl = await window.electronAPI.salesforceGetAuthUrl();
      if (authUrl) {
        // The main process will open the auth window and handle the callback.
        // The main window (e.g., App.jsx or authStore) should listen for 'salesforce:oauth-callback' or 'salesforce:oauth-error'.
        window.electronAPI.sendSalesforceOpenAuthWindow(authUrl);
        // setLoading(false); // Main process handles the rest of the flow.
        // Potentially show a message "Authentication window opened..."
      } else {
        throw new Error('Failed to get Salesforce authorization URL from main process.');
      }
    } catch (err) {
      console.error('Login Error:', err);
      setError(err.message || 'An unexpected error occurred during login.');
      setLoading(false);
    }
  };

  // This component itself doesn't handle the callback directly.
  // The main application (e.g., App.jsx or a store) should set up listeners for
  // 'salesforce:oauth-callback' and 'salesforce:oauth-error' exposed via preload.
  // Example (would be in your main app component or auth store):
  /*
  useEffect(() => {
    const handleOAuthCallback = async (code) => {
      console.log('Received OAuth code in renderer:', code);
      setLoading(true); // Show loading indicator in the main app
      try {
        const result = await window.electronAPI.salesforceExchangeCode(code);
        if (result && result.success) {
          // login(result.data); // Update auth store with token data
          navigate('/'); // Navigate to home or dashboard
        } else {
          setError(result?.error || 'Failed to exchange token.');
        }
      } catch (err) {
        setError(err.message || 'Error exchanging token.');
      } finally {
        setLoading(false);
      }
    };

    const handleOAuthError = (errorDetails) => {
      console.error('Salesforce OAuth Error in renderer:', errorDetails);
      setError(errorDetails.error_description || errorDetails.error || 'Salesforce authentication failed.');
      setLoading(false);
    };

    if (window.electronAPI && window.electronAPI.onSalesforceOAuthCallback) {
      window.electronAPI.onSalesforceOAuthCallback(handleOAuthCallback);
      window.electronAPI.onSalesforceOAuthError(handleOAuthError);
    }

    return () => {
      if (window.electronAPI && window.electronAPI.removeSalesforceOAuthListeners) {
        window.electronAPI.removeSalesforceOAuthListeners();
      }
    };
  }, [navigate, login]); // Add 'login' from authStore if used
  */

  return (
    <Container maxWidth="xs" sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography component="h1" variant="h5">
        Salesforce Login
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
          {error}
        </Alert>
      )}
      <Button
        type="button"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        onClick={handleLogin}
        disabled={loading}
      >
        {loading ? 'Opening Salesforce...' : 'Login with Salesforce'}
      </Button>
      <Typography variant="body2" color="text.secondary" align="center">
        Clicking "Login" will open a Salesforce authentication window. Please complete the login there.
      </Typography>
    </Container>
  );
};

export default LoginPage;
