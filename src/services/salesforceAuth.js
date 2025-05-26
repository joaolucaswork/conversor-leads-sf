// This service module provides functions for the renderer process to interact
// with Salesforce OAuth functionalities handled by the main process.

/**
 * Initiates the Salesforce login process.
 * It gets the authorization URL from the main process and tells the main process
 * to open a new window for Salesforce authentication.
 */
export const loginToSalesforce = async ().then(authUrl => {
    if (authUrl) {
      // Tell the main process to open this URL in a new window
      // The main process will handle the redirect and token exchange.
      // No need for a separate AuthCallbackPage in React if main.js handles the redirect.
      window.electronAPI.sendSalesforceOpenAuthWindow(authUrl);
      // The main process will send 'salesforce:oauth-callback' or 'salesforce:oauth-error'
      // back to the renderer, which should be listened for in a relevant component/store.
      return true;
    }
    throw new Error('Could not get Salesforce authorization URL.');
  }).catch(error => {
    console.error('Error initiating Salesforce login:', error);
    throw error;
  });
};

/**
 * Exchanges an authorization code for an access token.
 * This is typically called by the main process after the redirect,
 * but if the renderer somehow gets the code, it could call this.
 * However, the current flow has main.js handle the code directly from redirect.
 * This function is exposed via preload if direct invocation from renderer is needed.
 * @param {string} code - The authorization code.
 * @returns {Promise<object>} - The result of the token exchange.
 */
export const exchangeCodeForToken = async (code) => {
  try {
    if (!window.electronAPI || typeof window.electronAPI.salesforceExchangeCode !== 'function') {
      throw new Error('Salesforce API for code exchange is not available on window.electronAPI');
    }
    const result = await window.electronAPI.salesforceExchangeCode(code);
    if (result && result.success) {
      // Token data (result.data) is stored by main process in electron-store.
      // The auth store in renderer should listen for an event or be updated.
      console.log('Token exchanged successfully:', result.data);
    } else {
      console.error('Failed to exchange code for token:', result?.error);
    }
    return result;
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw error;
  }
};

/**
 * Refreshes the Salesforce access token using the stored refresh token.
 * @returns {Promise<object>} - The result of the token refresh operation.
 */
export const refreshToken = async () => {
  try {
    if (!window.electronAPI || typeof window.electronAPI.salesforceRefreshToken !== 'function') {
      throw new Error('Salesforce API for token refresh is not available on window.electronAPI');
    }
    const result = await window.electronAPI.salesforceRefreshToken();
    if (result && result.success) {
      // New token data (result.data) is stored by main process in electron-store.
      // The auth store in renderer should update.
      console.log('Token refreshed successfully:', result.data);
    } else {
      console.error('Failed to refresh token:', result?.error);
      // If reauthenticate is true, the auth store should handle this.
    }
    return result;
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

/**
 * Logs the user out of Salesforce.
 * Clears stored tokens in electron-store via the main process.
 * @returns {Promise<object>} - The result of the logout operation.
 */
export const logoutFromSalesforce = async () => {
  try {
    if (!window.electronAPI || typeof window.electronAPI.salesforceLogout !== 'function') {
      throw new Error('Salesforce API for logout is not available on window.electronAPI');
    }
    const result = await window.electronAPI.salesforceLogout();
    // The auth store in renderer should clear its state.
    console.log('Logged out from Salesforce successfully.');
    return result;
  } catch (error) {
    console.error('Error logging out from Salesforce:', error);
    throw error;
  }
};

/**
 * Retrieves the currently stored Salesforce authentication data.
 * This is useful for initializing the auth state in the renderer.
 * @returns {Promise<object|null>} Salesforce auth data or null if not found/error.
 */
export const getStoredSalesforceAuth = async () => {
  try {
    if (!window.electronAPI || typeof window.electronAPI.getStoreValue !== 'function') {
      // Assuming getStoreValue is a generic way to get from electron-store
      throw new Error('API for getting stored value is not available.');
    }
    return await window.electronAPI.getStoreValue('salesforceAuth');
  } catch (error) {
    console.error('Error getting stored Salesforce auth:', error);
    return null;
  }
};

/**
 * A utility function to check if the access token is expired or close to expiry.
 * @param {object} authData - The authentication data containing accessToken, issuedAt, expiresIn.
 * @param {number} bufferSeconds - A buffer in seconds to consider the token expired earlier.
 * @returns {boolean} True if the token is expired or within the buffer, false otherwise.
 */
export const isTokenExpired = (authData, bufferSeconds = 300) => {
  if (!authData || !authData.accessToken || !authData.issuedAt || !authData.expiresIn) {
    return true; // If any crucial part is missing, assume expired/invalid.
  }
  const currentTime = Math.floor(Date.now() / 1000); // Current time in Unix seconds
  const expiryTime = authData.issuedAt + authData.expiresIn;
  return currentTime >= (expiryTime - bufferSeconds);
};

// Listener for OAuth callback code from main process
// This is a more passive way, an alternative is for the store to subscribe.
export const onSalesforceOAuthCallback = (handler) => {
  if (window.electronAPI && typeof window.electronAPI.onSalesforceOAuthCallback === 'function') {
    window.electronAPI.onSalesforceOAuthCallback(handler);
  } else {
    console.warn('electronAPI.onSalesforceOAuthCallback is not defined. Ensure preload script exposes it.');
  }
};

export const onSalesforceOAuthError = (handler) => {
  if (window.electronAPI && typeof window.electronAPI.onSalesforceOAuthError === 'function') {
    window.electronAPI.onSalesforceOAuthError(handler);
  } else {
    console.warn('electronAPI.onSalesforceOAuthError is not defined. Ensure preload script exposes it.');
  }
};
