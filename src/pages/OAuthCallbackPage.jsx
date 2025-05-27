import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Typography,
  Alert,
  Container,
  Paper
} from '@mui/material';
import { useAuthStore } from '../store/authStore';
import { isElectron, isBrowser } from '../utils/environment';
import { processOAuthCallback } from '../utils/browserOAuth';

// CRITICAL: Process OAuth code IMMEDIATELY when module loads to prevent expiration
// This runs before React renders anything, minimizing delays
let immediateProcessingResult = null;

if (typeof window !== 'undefined' && isBrowser()) {
  console.log('OAuth Callback: CRITICAL - Starting immediate processing on page load');

  // Process OAuth callback immediately without waiting for React
  processOAuthCallback()
    .then((result) => {
      console.log('OAuth Callback: Immediate processing successful');
      immediateProcessingResult = { success: true, data: result };
    })
    .catch((error) => {
      console.error('OAuth Callback: Immediate processing failed:', error);
      immediateProcessingResult = { success: false, error: error.message };
    });
}
const OAuthCallbackPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing OAuth callback...');

  const { loginError, loginSuccess } = useAuthStore(state => ({
    loginError: state.loginError,
    loginSuccess: state.loginSuccess
  }));

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Check if immediate processing already completed
        if (immediateProcessingResult) {
          if (immediateProcessingResult.success) {
            console.log('OAuth Callback: Using immediate processing success result');
            setMessage('Authentication successful!');
            setStatus('success');
            loginSuccess(immediateProcessingResult.data.data);

            // Handle popup or navigation immediately
            if (window.opener && window.opener !== window) {
              console.log('OAuth Callback: Closing popup after immediate success');
              window.close();
              return;
            } else {
              console.log('OAuth Callback: Navigating to home after immediate success');
              navigate('/');
              return;
            }
          } else {
            console.error('OAuth Callback: Using immediate processing error result:', immediateProcessingResult.error);
            setStatus('error');
            setMessage(`Authentication failed: ${immediateProcessingResult.error}`);
            loginError(immediateProcessingResult.error);

            // Handle popup or navigation
            if (window.opener && window.opener !== window) {
              window.opener.postMessage({
                type: 'OAUTH_ERROR',
                error: { error: immediateProcessingResult.error }
              }, window.location.origin);
              window.close();
              return;
            } else {
              setTimeout(() => navigate('/login'), 3000);
              return;
            }
          }
        }

        // If immediate processing hasn't completed yet, wait for it
        if (isBrowser()) {
          console.log('OAuth Callback: Waiting for immediate processing to complete...');
          setMessage('Processing authentication...');

          // Wait for immediate processing to complete
          const checkProcessing = setInterval(() => {
            if (immediateProcessingResult) {
              clearInterval(checkProcessing);

              if (immediateProcessingResult.success) {
                console.log('OAuth Callback: Immediate processing completed successfully');
                setMessage('Authentication successful!');
                setStatus('success');
                loginSuccess(immediateProcessingResult.data.data);

                // Handle popup or navigation immediately
                if (window.opener && window.opener !== window) {
                  console.log('OAuth Callback: Closing popup after success');
                  window.close();
                } else {
                  console.log('OAuth Callback: Navigating to home');
                  navigate('/');
                }
              } else {
                console.error('OAuth Callback: Immediate processing failed:', immediateProcessingResult.error);
                setStatus('error');
                setMessage(`Authentication failed: ${immediateProcessingResult.error}`);
                loginError(immediateProcessingResult.error);

                // Handle popup or navigation
                if (window.opener && window.opener !== window) {
                  window.opener.postMessage({
                    type: 'OAUTH_ERROR',
                    error: { error: immediateProcessingResult.error }
                  }, window.location.origin);
                  window.close();
                } else {
                  setTimeout(() => navigate('/login'), 3000);
                }
              }
            }
          }, 100); // Check every 100ms

          // Timeout after 10 seconds
          setTimeout(() => {
            clearInterval(checkProcessing);
            if (!immediateProcessingResult) {
              console.error('OAuth Callback: Immediate processing timeout');
              setStatus('error');
              setMessage('Authentication timeout. Please try again.');
              loginError('Authentication timeout');

              if (window.opener && window.opener !== window) {
                window.opener.postMessage({
                  type: 'OAUTH_ERROR',
                  error: { error: 'Authentication timeout' }
                }, window.location.origin);
                window.close();
              } else {
                setTimeout(() => navigate('/login'), 3000);
              }
            }
          }, 10000);
        } else {
          // Electron mode - the main process should handle the token exchange
          setMessage('Authentication successful! Processing...');
          setStatus('success');
          setTimeout(() => navigate('/'), 2000);
        }

      } catch (err) {
        console.error('Error processing OAuth callback:', err);
        setStatus('error');
        setMessage(err.message || 'An error occurred during authentication');
        loginError(err.message || 'Authentication failed');

        // Redirect to login page after showing error
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    processCallback();
  }, [navigate, loginError, loginSuccess]);

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <CircularProgress size={24} sx={{ mr: 2 }} />;
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            OAuth Authentication
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
          {getStatusIcon()}
          <Typography variant="h6">
            {status === 'processing' && 'Processing...'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Error'}
          </Typography>
        </Box>

        <Alert severity={getStatusColor()} sx={{ mb: 3 }}>
          {message}
        </Alert>

        {status === 'processing' && (
          <Typography variant="body2" color="text.secondary">
            Please wait while we complete your authentication...
          </Typography>
        )}

        {status === 'success' && (
          <Typography variant="body2" color="text.secondary">
            You will be redirected to the application shortly.
          </Typography>
        )}

        {status === 'error' && (
          <Typography variant="body2" color="text.secondary">
            You will be redirected to the login page shortly.
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default OAuthCallbackPage;
