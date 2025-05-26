import { create } from 'zustand';
import {
  getStoredSalesforceAuth,
  exchangeCodeForToken, // This is mainly for main process, but store might initiate via preload
  refreshToken as refreshSalesforceToken,
  logoutFromSalesforce as logoutSf,
  isTokenExpired
} from '../services/salesforceAuth'; // Adjust path as needed

// Helper to call electron API, simplifies store actions
const callElectronApi = async (apiFunction, ...args) => {
  if (!window.electronAPI || typeof window.electronAPI[apiFunction] !== 'function') {
    console.error(`Electron API function ${apiFunction} is not available.`);
    throw new Error(`Electron API function ${apiFunction} is not available.`);
  }
  return window.electronAPI[apiFunction](...args);
};

export const useAuthStore = create((set, get) => ({
  // State
  isAuthenticated: false,
  accessToken: null,
  instanceUrl: null,
  refreshToken: null, // Store refresh token if needed for client-side checks, though main handles refresh
  userId: null, // Or other user info if fetched
  issuedAt: null,
  expiresIn: null,
  isLoading: true, // For initial loading of stored auth state
  error: null,

  // Actions
  initializeAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      // Get auth data from electron-store via main process
      const storedAuth = await callElectronApi('getStoreValue', 'salesforceAuth');
      if (storedAuth && storedAuth.accessToken) {
        if (isTokenExpired(storedAuth)) {
          console.log('Salesforce token expired, attempting refresh...');
          try {
            const refreshResult = await callElectronApi('salesforceRefreshToken');
            if (refreshResult && refreshResult.success) {
              set({
                isAuthenticated: true,
                accessToken: refreshResult.data.accessToken,
                instanceUrl: refreshResult.data.instanceUrl,
                refreshToken: refreshResult.data.refreshToken,
                issuedAt: refreshResult.data.issuedAt,
                expiresIn: refreshResult.data.expiresIn,
                // userId: fetch some user ID if needed with new token
                isLoading: false,
              });
            } else {
              // Refresh failed, clear tokens
              await callElectronApi('salesforceLogout'); // Ensure main process clears its store too
              set({
                isAuthenticated: false,
                accessToken: null,
                instanceUrl: null,
                refreshToken: null,
                userId: null,
                issuedAt: null,
                expiresIn: null,
                isLoading: false,
                error: refreshResult?.error || 'Failed to refresh token. Please log in again.',
              });
            }
          } catch (refreshError) {
            console.error('Error during token refresh on init:', refreshError);
            await callElectronApi('salesforceLogout');
            set({ isAuthenticated: false, isLoading: false, error: 'Session expired. Please log in again.' });
          }
        } else {
          // Token is valid
          set({
            isAuthenticated: true,
            accessToken: storedAuth.accessToken,
            instanceUrl: storedAuth.instanceUrl,
            refreshToken: storedAuth.refreshToken,
            issuedAt: storedAuth.issuedAt,
            expiresIn: storedAuth.expiresIn,
            // userId: fetch userId if needed
            isLoading: false,
          });
        }
      } else {
        set({ isAuthenticated: false, isLoading: false });
      }
    } catch (err) {
      console.error('Error initializing auth state:', err);
      set({ isLoading: false, error: err.message });
    }
  },

  // Called after main process gets the code and exchanges it for a token
  loginSuccess: (tokenData) => {
    set({
      isAuthenticated: true,
      accessToken: tokenData.accessToken,
      instanceUrl: tokenData.instanceUrl,
      refreshToken: tokenData.refreshToken,
      issuedAt: tokenData.issuedAt,
      expiresIn: tokenData.expiresIn,
      error: null,
      isLoading: false,
      // userId: fetch from instanceUrl + accessToken
    });
    // The main process already stored it via electron-store
  },

  loginError: (errorMessage) => {
    set({
      isAuthenticated: false,
      accessToken: null,
      instanceUrl: null,
      refreshToken: null,
      userId: null,
      issuedAt: null,
      expiresIn: null,
      error: errorMessage,
      isLoading: false,
    });
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await callElectronApi('salesforceLogout');
      set({
        isAuthenticated: false,
        accessToken: null,
        instanceUrl: null,
        refreshToken: null,
        userId: null,
        issuedAt: null,
        expiresIn: null,
        error: null,
        isLoading: false,
      });
    } catch (err) {
      console.error('Error during logout:', err);
      set({ isLoading: false, error: err.message });
      // Even if main process logout fails, clear client state
      set({ isAuthenticated: false, accessToken: null, instanceUrl: null, refreshToken: null, userId: null });
    }
  },

  // Action to handle the OAuth callback code received from main process
  handleOAuthCode: async (code) => {
    set({ isLoading: true, error: null });
    try {
      const result = await callElectronApi('salesforceExchangeCode', code);
      if (result && result.success) {
        get().loginSuccess(result.data);
      } else {
        get().loginError(result?.error || 'Failed to exchange authorization code for token.');
      }
    } catch (err) {
      console.error('Error exchanging code in store:', err);
      get().loginError(err.message);
    }
  },
  
  // Action to explicitly refresh token if needed by UI, though main process also handles it
  ensureValidToken: async () => {
    const { isAuthenticated, issuedAt, expiresIn, instanceUrl } = get();
    if (!isAuthenticated || !instanceUrl) return null;

    if (isTokenExpired({ issuedAt, expiresIn, accessToken: get().accessToken })) {
      set({ isLoading: true });
      try {
        const refreshResult = await callElectronApi('salesforceRefreshToken');
        if (refreshResult && refreshResult.success) {
          set({
            accessToken: refreshResult.data.accessToken,
            instanceUrl: refreshResult.data.instanceUrl,
            refreshToken: refreshResult.data.refreshToken,
            issuedAt: refreshResult.data.issuedAt,
            expiresIn: refreshResult.data.expiresIn,
            isLoading: false,
            error: null,
          });
          return refreshResult.data.accessToken;
        } else {
          set({ isLoading: false, error: refreshResult?.error || 'Failed to refresh token.' });
          get().logout(); // Force logout if refresh fails
          return null;
        }
      } catch (error) {
        console.error('Error during manual token refresh:', error);
        set({ isLoading: false, error: 'Failed to refresh token.' });
        get().logout();
        return null;
      }
    }
    return get().accessToken;
  }
}));

// Initialize auth state when the store is created/app starts
// This should ideally be called once in App.jsx or similar entry point.
// useAuthStore.getState().initializeAuth();

// Listen for OAuth events from main process
// This allows the store to react to events handled by main.js (like code callback)
if (window.electronAPI && window.electronAPI.onSalesforceOAuthCallback) {
  window.electronAPI.onSalesforceOAuthCallback((code) => {
    console.log('authStore observed salesforce:oauth-callback with code:', code);
    useAuthStore.getState().handleOAuthCode(code);
  });

  window.electronAPI.onSalesforceOAuthError((errorDetails) => {
    console.error('authStore observed salesforce:oauth-error:', errorDetails);
    useAuthStore.getState().loginError(errorDetails.error_description || errorDetails.error || 'Salesforce authentication failed.');
  });
} else {
  if (process.env.NODE_ENV !== 'test') { // Avoid spamming test logs
    console.warn('Salesforce OAuth callback listeners not available on window.electronAPI. Ensure preload is correct.');
  }
}
