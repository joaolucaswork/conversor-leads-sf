import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert'; // For Snackbar content
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

// Page Imports
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from './store/authStore';
import { useSettingsStore } from './store/settingsStore'; // Import the new settings store

// Page Imports
import HomePage from './pages/HomePage';
import MappingPreviewPage from './pages/MappingPreviewPage';
import ProcessingHistoryPage from './pages/ProcessingHistoryPage'; // Import the new History page
// ... other page imports remain the same

// Placeholder Pages (can be moved to their own files in src/pages)
// const HomePage definition is in src/pages/HomePage.jsx
const SettingsPage = () => <h2>Settings Page (Public)</h2>; // Example: public page
const SalesforcePage = () => <h2>Salesforce Integration Page (Protected)</h2>;


// Basic theme, can be expanded
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  // Auth store
  const { isAuthenticated, isLoading: isAuthLoading, error: authError, initializeAuth, logout } = useAuthStore(state => ({
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    initializeAuth: state.initializeAuth,
    logout: state.logout,
  }));

  // Settings store
  const { 
    openAIApiKeyIsSet, 
    isLoadingApiKeyStatus, 
    checkOpenAIApiKeyPresence,
    showApiKeyMissingPrompt,
    closeApiKeyMissingPrompt,
    openApiKeyMissingPrompt
  } = useSettingsStore(state => ({
    openAIApiKeyIsSet: state.openAIApiKeyIsSet,
    isLoadingApiKeyStatus: state.isLoadingApiKeyStatus,
    checkOpenAIApiKeyPresence: state.checkOpenAIApiKeyPresence,
    showApiKeyMissingPrompt: state.showApiKeyMissingPrompt,
    closeApiKeyMissingPrompt: state.closeApiKeyMissingPrompt,
    openApiKeyMissingPrompt: state.openApiKeyMissingPrompt,
  }));

  useEffect(() => {
    // Initialize authentication state and API key presence when the app loads
    console.log('App.jsx: Initializing auth store...');
    initializeAuth();
    console.log('App.jsx: Checking for OpenAI API Key presence...');
    checkOpenAIApiKeyPresence();
  }, [initializeAuth, checkOpenAIApiKeyPresence]);

  // Setup global listeners for OAuth events from main process
  // This is an alternative to putting them in the store, or can complement it.
  // The authStore.js already sets these up, so this might be redundant if store is initialized early.
  // For safety, ensure they are only set up once. The listeners are in authStore and settingsStore.
  // No need for additional listeners here for OAuth callbacks as they are handled by stores.

  // Effect to prompt for OpenAI API key if logged in and key is not set
  useEffect(() => {
    if (isAuthenticated && !openAIApiKeyIsSet && !isAuthLoading && !isLoadingApiKeyStatus) {
      // Only show prompt if auth and settings checks are complete
      console.log('User logged in, OpenAI API key not set. Prompting.');
      openApiKeyMissingPrompt();
    }
  }, [isAuthenticated, openAIApiKeyIsSet, isAuthLoading, isLoadingApiKeyStatus, openApiKeyMissingPrompt]);


  if (isAuthLoading || isLoadingApiKeyStatus) { // Show loading if either auth or settings are loading
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Initializing Application...</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Electron Salesforce App
            </Typography>
            {isAuthenticated ? (
              <>
                <Button color="inherit" component={Link} to="/">Home</Button>
                <Button color="inherit" component={Link} to="/salesforce">Salesforce</Button>
                <Button color="inherit" component={Link} to="/history">History</Button> 
                <Button color="inherit" component={Link} to="/settings">Settings</Button>
                <Button color="inherit" onClick={logout}>Logout</Button>
              </>
            ) : (
              <>
                <Button color="inherit" component={Link} to="/login">Login</Button>
                {/* Show settings link even if not logged in, as some settings might be general */}
                <Button color="inherit" component={Link} to="/settings">Settings</Button> 
              </>
            )}
          </Toolbar>
        </AppBar>
        <Container sx={{ mt: 4 }}>
          {authError && <Alert severity="error" sx={{ mb: 2 }}>Auth Error: {typeof authError === 'object' ? JSON.stringify(authError) : authError}</Alert>}
          {/* Add settingsError display if needed */}
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/settings" element={<SettingsPage />} /> {/* SettingsPage is now public */}
            <Route path="/preview/:processingId" element={
              <ProtectedRoute>
                <MappingPreviewPage />
              </ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute>
                <ProcessingHistoryPage />
              </ProtectedRoute>
            } />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/salesforce"
              element={
                <ProtectedRoute>
                  <SalesforcePage />
                </ProtectedRoute>
              }
            />
            {/* Add other routes here */}
          </Routes>
        </Container>
        <Snackbar
          open={showApiKeyMissingPrompt}
          autoHideDuration={null} // Persistent until closed by user or key is set
          onClose={(event, reason) => {
            if (reason === 'clickaway') {
              return;
            }
            closeApiKeyMissingPrompt();
          }}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            severity="warning" 
            sx={{ width: '100%' }}
            action={
              <>
                <Button color="inherit" size="small" component={Link} to="/settings" onClick={closeApiKeyMissingPrompt}>
                  Go to Settings
                </Button>
                <IconButton
                  size="small"
                  aria-label="close"
                  color="inherit"
                  onClick={closeApiKeyMissingPrompt}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </>
            }
          >
            OpenAI API Key is not set. Please configure it in Settings to enable AI features.
          </Alert>
        </Snackbar>
      </Router>
    </ThemeProvider>
  );
}

export default App;
