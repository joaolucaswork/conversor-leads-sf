import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import { electronAPI, isElectron, isBrowser, getEnvironmentInfo } from '../utils/environment';
import { useAuthStore } from '../store/authStore';

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore(state => ({
    isAuthenticated: state.isAuthenticated
  }));
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect away from login
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/'); // Redirect to home page after successful authentication
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      // Log environment info for debugging
      console.log('Environment info:', getEnvironmentInfo());

      if (isBrowser()) {
        // Browser mode - use optimized OAuth flow
        const { generateBrowserOAuthUrl, openOAuthPopup } = await import('../utils/browserOAuth');

        console.log('Login: Starting browser OAuth flow...');
        const authUrl = await generateBrowserOAuthUrl();

        if (authUrl) {
          console.log('Login: Opening OAuth popup...');

          try {
            // Open popup and wait for result
            const tokenData = await openOAuthPopup(authUrl);

            console.log('Login: OAuth popup completed successfully');

            // Update auth store with successful login
            login(tokenData);

            // Navigate to home page
            navigate('/');

          } catch (popupError) {
            console.error('Login: OAuth popup failed:', popupError);
            throw popupError;
          }
        } else {
          throw new Error('Failed to generate OAuth URL.');
        }
      } else {
        // Electron mode - use existing implementation
        const authUrl = await electronAPI.getSalesforceAuthUrl();
        if (authUrl) {
          electronAPI.sendSalesforceOpenAuthWindow(authUrl);
          setLoading(false); // Reset loading state after opening auth window
        } else {
          throw new Error('Failed to get Salesforce authorization URL.');
        }
      }
    } catch (err) {
      console.error('Login Error:', err);

      // Provide environment-specific error messages
      let errorMessage = err.message || 'An unexpected error occurred during login.';
      if (isBrowser() && err.message.includes('Popup blocked')) {
        errorMessage = 'Popup blocked. Please allow popups for this site and try again.';
      } else if (isBrowser() && err.message.includes('OAuth popup was closed')) {
        errorMessage = 'Login was cancelled. Please try again.';
      }

      setError(errorMessage);
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
    <Container maxWidth="xs" sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography component="h1" variant="h5">
        {t('login.title')}
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
        {loading ? t('login.loggingIn') : t('login.loginButton')}
      </Button>

      <Typography variant="body2" color="text.secondary" align="center">
        {t('login.description')}
      </Typography>
    </Container>
  );
};

export default LoginPage;
