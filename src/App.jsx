import React, { useEffect } from 'react';
import { HashRouter, BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ptBR, enUS } from '@mui/material/locale';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert'; // For Snackbar content
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import useTheme from '@mui/material/styles/useTheme';
import useMediaQuery from '@mui/material/useMediaQuery';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Import i18n configuration
import './i18n/config';
import { useTranslation } from 'react-i18next';

// Page Imports
import LoginPage from './pages/LoginPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import ProtectedRoute from './components/ProtectedRoute';
import CertificateProtectedRoute from './components/CertificateProtectedRoute';
import UserProfileHeader from './components/UserProfileHeader';
import SalesforceStatusBar from './components/SalesforceStatusBar';
import { useAuthStore, setupOAuthListeners } from './store/authStore';
import { useSettingsStore } from './store/settingsStore'; // Import the new settings store
import { useLanguageStore } from './store/languageStore'; // Import the language store
import { isElectron, isBrowser, logEnvironmentInfo } from './utils/environment';

// Page Imports
import HomePage from './pages/HomePage';
import MappingPreviewPage from './pages/MappingPreviewPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import FileDataViewerPage from './pages/FileDataViewerPage';

import SettingsPage from './pages/SettingsPage'; // Import the real SettingsPage component

// ... other page imports remain the same


// BackButton component that uses router hooks
const BackButton = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation();

  // Only show back button when NOT on home page and NOT on file viewer page
  const isHomePage = location.pathname === '/';
  const isFileViewerPage = location.pathname.startsWith('/file-viewer/');

  if (isHomePage || isFileViewerPage) {
    return null;
  }

  const handleBack = () => {
    // Use browser's back functionality
    navigate(-1);
  };

  return (
    <Tooltip title={t('common.back', { defaultValue: 'Back' })}>
      <IconButton
        onClick={handleBack}
        sx={{
          minHeight: { xs: 44, sm: 40 }, // Material Design touch target minimum
          minWidth: { xs: 44, sm: 40 },
          color: 'text.primary',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
          '&:focus': {
            backgroundColor: 'action.focus',
          },
          // Material Design ripple effect
          '&:active': {
            backgroundColor: 'action.selected',
          },
        }}
        size={isMobile ? 'medium' : 'small'}
        aria-label={t('common.back', { defaultValue: 'Back' })}
      >
        <ArrowBackIcon fontSize={isMobile ? 'medium' : 'small'} />
      </IconButton>
    </Tooltip>
  );
};

// Create theme with locale support
const createAppTheme = (language) => {
  const locale = language === 'pt' ? ptBR : enUS;
  return createTheme({
    palette: {
      mode: 'dark',
    },
  }, locale);
};

function App() {
  // Translation hook
  const { t } = useTranslation();

  // Navigation dropdown will handle its own state internally

  // Auth store
  const { isAuthenticated, isLoading: isAuthLoading, error: authError, initializeAuth } = useAuthStore(state => ({
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    initializeAuth: state.initializeAuth,
  }));

  // Choose router based on environment
  // Electron uses HashRouter for file:// protocol compatibility
  // Browser uses BrowserRouter for proper OAuth callback handling
  const Router = isElectron() ? HashRouter : BrowserRouter;

  // Debug authentication state changes
  useEffect(() => {
    console.log("App.jsx: Authentication state changed:", {
      isAuthenticated,
      isAuthLoading,
      hasError: !!authError
    });
  }, [isAuthenticated, isAuthLoading, authError]);

  // Settings store
  const {
    openAIApiKeyIsSet,
    isLoadingApiKeyStatus,
    checkOpenAIApiKeyPresence,
    showApiKeyMissingPrompt,
    closeApiKeyMissingPrompt,
    openApiKeyMissingPrompt,
    loadDeveloperMode
  } = useSettingsStore(state => ({
    openAIApiKeyIsSet: state.openAIApiKeyIsSet,
    isLoadingApiKeyStatus: state.isLoadingApiKeyStatus,
    checkOpenAIApiKeyPresence: state.checkOpenAIApiKeyPresence,
    showApiKeyMissingPrompt: state.showApiKeyMissingPrompt,
    closeApiKeyMissingPrompt: state.closeApiKeyMissingPrompt,
    openApiKeyMissingPrompt: state.openApiKeyMissingPrompt,
    loadDeveloperMode: state.loadDeveloperMode,
  }));

  // Language store
  const { currentLanguage, initializeLanguage } = useLanguageStore(state => ({
    currentLanguage: state.currentLanguage,
    initializeLanguage: state.initializeLanguage,
  }));

  // Create theme based on current language
  const theme = createAppTheme(currentLanguage);

  useEffect(() => {
    // Log environment information for debugging
    logEnvironmentInfo();

    // Initialize language first
    console.log('App.jsx: Initializing language...');
    initializeLanguage();

    // Initialize authentication state and API key presence when the app loads
    console.log('App.jsx: Initializing auth store...');
    initializeAuth();

    // Load developer mode setting
    console.log('App.jsx: Loading developer mode setting...');
    loadDeveloperMode();

    // Check API key in all environments, but handle browser mode gracefully
    console.log('App.jsx: Checking for OpenAI API Key presence...');
    checkOpenAIApiKeyPresence();

    // Ensure OAuth listeners are set up (retry in case electronAPI wasn't available during module load)
    console.log('App.jsx: Setting up OAuth listeners...');
    setupOAuthListeners();
  }, [initializeAuth, checkOpenAIApiKeyPresence, initializeLanguage, loadDeveloperMode]);

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
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>{t('app.loading')}</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex' }}>
          {/* Main Content Area */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100vh',
            }}
          >
            {/* Top header area with same background as main app */}
            <Box
              sx={{
                backgroundColor: 'background.default', // Use the same background as the main app
                width: '100%',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between', // Space between back button and profile
                minHeight: '64px', // Maintain some height for the header
                px: 2,
              }}
            >
              {/* Left side - Back Button */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BackButton />
              </Box>

              {/* Right side - User Profile Header */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {isAuthenticated && <UserProfileHeader />}
              </Box>
            </Box>

            {/* Main Content Container */}
            <Container sx={{
              mt: 1,
              flexGrow: 1,
              pb: { xs: 12, sm: 10 } // Increased bottom padding to prevent status bar overlap
            }}>
              {authError && <Alert severity="error" sx={{ mb: 2 }}>Auth Error: {typeof authError === 'object' ? JSON.stringify(authError) : authError}</Alert>}
              {/* Add settingsError display if needed */}
              <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
            <Route path="/settings" element={<SettingsPage />} /> {/* SettingsPage is now public */}
            <Route path="/preview/:processingId" element={
              <ProtectedRoute>
                <MappingPreviewPage />
              </ProtectedRoute>
            } />

            <Route path="/file-viewer/:processingId" element={
              <ProtectedRoute>
                <FileDataViewerPage />
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
              path="/admin"
              element={
                <CertificateProtectedRoute>
                  <AdminDashboardPage />
                </CertificateProtectedRoute>
              }
            />
                {/* Add other routes here */}
              </Routes>
            </Container>
          </Box>
        </Box>

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
                  {t('alerts.goToSettings')}
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
            {t('alerts.apiKeyMissing')}
          </Alert>
        </Snackbar>

        {/* Global Salesforce Status Bar */}
        <SalesforceStatusBar />
      </Router>
    </ThemeProvider>
  );
}

export default App;
