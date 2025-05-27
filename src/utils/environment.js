/**
 * Environment detection and API abstraction utilities
 * Provides fallback implementations for browser environments
 */

// Environment detection
export const isElectron = () => {
  return !!(window.electronAPI && typeof window.electronAPI === "object");
};

export const isBrowser = () => {
  return !isElectron();
};

export const getEnvironmentInfo = () => {
  return {
    isElectron: isElectron(),
    isBrowser: isBrowser(),
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    hasElectronAPI: !!window.electronAPI,
    availableAPIs: window.electronAPI ? Object.keys(window.electronAPI) : [],
  };
};

// Browser storage fallbacks (using localStorage)
export const browserStorage = {
  get: (key) => {
    try {
      const storageKey = `electron-store-${key}`;
      const value = localStorage.getItem(storageKey);
      console.log(
        `Browser storage GET: ${storageKey} = ${value ? "found" : "null"}`
      );
      return value ? JSON.parse(value) : null;
    } catch (err) {
      console.warn("Failed to get value from localStorage:", err);
      return null;
    }
  },

  set: (key, value) => {
    try {
      const storageKey = `electron-store-${key}`;
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(storageKey, serializedValue);

      // Verify the storage operation
      const verification = localStorage.getItem(storageKey);
      if (verification !== serializedValue) {
        throw new Error("Storage verification failed");
      }

      console.log(
        `Browser storage SET: ${storageKey} = ${
          value ? "data stored" : "null"
        } (verified)`
      );
      return true;
    } catch (err) {
      console.warn("Failed to set value in localStorage:", err);
      return false;
    }
  },

  delete: (key) => {
    try {
      const storageKey = `electron-store-${key}`;

      // Check if key exists before deletion
      const existsBefore = localStorage.getItem(storageKey) !== null;

      localStorage.removeItem(storageKey);

      // Verify deletion
      const existsAfter = localStorage.getItem(storageKey) !== null;

      console.log(
        `Browser storage DELETE: ${storageKey} (existed: ${existsBefore}, deleted: ${!existsAfter})`
      );
      return true;
    } catch (err) {
      console.warn("Failed to delete value from localStorage:", err);
      return false;
    }
  },

  // Helper method to list all stored keys
  listKeys: () => {
    try {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith("electron-store-")
      );
      console.log(`Browser storage KEYS: ${keys.length} found:`, keys);
      return keys;
    } catch (err) {
      console.warn("Failed to list localStorage keys:", err);
      return [];
    }
  },

  // Helper method to clear all electron-store keys
  clear: () => {
    try {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith("electron-store-")
      );
      keys.forEach((key) => localStorage.removeItem(key));
      console.log(`Browser storage CLEAR: removed ${keys.length} keys`);
      return true;
    } catch (err) {
      console.warn("Failed to clear localStorage:", err);
      return false;
    }
  },
};

// Unified API abstraction
export const electronAPI = {
  // Store operations
  getStoreValue: async (key) => {
    if (isElectron()) {
      return window.electronAPI.getStoreValue(key);
    } else {
      // Browser fallback using localStorage
      return browserStorage.get(key);
    }
  },

  setStoreValue: async (key, value) => {
    if (isElectron()) {
      return window.electronAPI.setStoreValue(key, value);
    } else {
      // Browser fallback using localStorage
      return browserStorage.set(key, value);
    }
  },

  // Salesforce OAuth operations
  getSalesforceAuthUrl: async () => {
    if (isElectron()) {
      return window.electronAPI.getSalesforceAuthUrl();
    } else {
      // Browser fallback - use optimized browser OAuth
      const { generateBrowserOAuthUrl } = await import("./browserOAuth");
      return generateBrowserOAuthUrl();
    }
  },

  sendSalesforceOpenAuthWindow: async (authUrl) => {
    if (isElectron()) {
      return window.electronAPI.sendSalesforceOpenAuthWindow(authUrl);
    } else {
      // Browser fallback - use optimized popup handling
      const { openOAuthPopup } = await import("./browserOAuth");
      return openOAuthPopup(authUrl);
    }
  },

  salesforceExchangeCode: async (code) => {
    if (isElectron()) {
      return window.electronAPI.salesforceExchangeCode(code);
    } else {
      // Browser fallback - use optimized token exchange
      const { exchangeCodeForToken } = await import("./browserOAuth");
      return exchangeCodeForToken(code);
    }
  },

  salesforceRefreshToken: async () => {
    if (isElectron()) {
      return window.electronAPI.salesforceRefreshToken();
    } else {
      // Browser fallback - use optimized refresh token
      const { refreshToken } = await import("./browserOAuth");
      return refreshToken();
    }
  },

  salesforceLogout: async () => {
    if (isElectron()) {
      return window.electronAPI.salesforceLogout();
    } else {
      // Browser fallback - use optimized logout
      const { logout } = await import("./browserOAuth");
      logout();
      return { success: true };
    }
  },

  salesforceGetUserProfile: async () => {
    if (isElectron()) {
      return window.electronAPI.salesforceGetUserProfile();
    } else {
      // Browser fallback
      return getUserProfileInBrowser();
    }
  },

  // OAuth event listeners
  onSalesforceOAuthCallback: (callback) => {
    if (isElectron()) {
      return window.electronAPI.onSalesforceOAuthCallback(callback);
    } else {
      // Browser fallback - use custom event system
      return setupBrowserOAuthListener(callback);
    }
  },

  onSalesforceOAuthSuccess: (callback) => {
    if (isElectron()) {
      return window.electronAPI.onSalesforceOAuthSuccess(callback);
    } else {
      // Browser fallback - use custom event system
      return setupBrowserOAuthSuccessListener(callback);
    }
  },

  onSalesforceOAuthError: (callback) => {
    if (isElectron()) {
      return window.electronAPI.onSalesforceOAuthError(callback);
    } else {
      // Browser fallback - use custom event system
      return setupBrowserOAuthErrorListener(callback);
    }
  },

  removeSalesforceOAuthListeners: () => {
    if (isElectron()) {
      return window.electronAPI.removeSalesforceOAuthListeners();
    } else {
      // Browser fallback
      return removeBrowserOAuthListeners();
    }
  },

  // Salesforce API operations
  validateSalesforceConnection: async () => {
    if (isElectron()) {
      return window.electronAPI.validateSalesforceConnection();
    } else {
      // Browser fallback - limited validation using stored auth data
      return validateSalesforceConnectionInBrowser();
    }
  },

  uploadToSalesforce: async (options) => {
    if (isElectron()) {
      return window.electronAPI.uploadToSalesforce(options);
    } else {
      // Browser implementation using backend API
      return uploadToSalesforceInBrowser(options);
    }
  },

  getSalesforceObjects: async () => {
    if (isElectron()) {
      return window.electronAPI.getSalesforceObjects();
    } else {
      // Browser implementation using backend API
      return getSalesforceObjectsInBrowser();
    }
  },

  getSalesforceFieldMapping: async (options) => {
    if (isElectron()) {
      return window.electronAPI.getSalesforceFieldMapping(options);
    } else {
      // Browser implementation using backend API
      return getSalesforceFieldMappingInBrowser(options);
    }
  },
};

// Browser-specific OAuth implementations
let oauthPopup = null;
let oauthCallbackListener = null;
let oauthSuccessListener = null;
let oauthErrorListener = null;

const generateBrowserOAuthUrl = async () => {
  try {
    console.log("Browser OAuth: Starting OAuth URL generation");

    // Get OAuth configuration from backend
    const response = await fetch(
      `${
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
      }/api/v1/oauth/config`
    );
    if (!response.ok) {
      throw new Error("Failed to get OAuth configuration");
    }

    const config = await response.json();
    console.log("Browser OAuth: Retrieved OAuth config from backend");

    // For browser mode, use clean redirect URI without hash fragments
    const redirectUri = `${window.location.origin}/oauth/callback`;
    console.log("Browser OAuth: Using redirect URI:", redirectUri);

    // Generate PKCE parameters for browser
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    console.log("Browser OAuth: Generated PKCE parameters:", {
      verifierLength: codeVerifier.length,
      challengeLength: codeChallenge.length,
    });

    // Store code verifier for later use with enhanced error handling
    const storageResult = browserStorage.set(
      "oauth_code_verifier",
      codeVerifier
    );
    if (!storageResult) {
      throw new Error("Failed to store PKCE code verifier in browser storage");
    }

    // Verify storage by reading it back
    const storedVerifier = browserStorage.get("oauth_code_verifier");
    if (!storedVerifier || storedVerifier !== codeVerifier) {
      console.error("Browser OAuth: Code verifier storage verification failed");
      throw new Error("Failed to verify PKCE code verifier storage");
    }

    console.log(
      "Browser OAuth: Code verifier stored and verified successfully"
    );

    const params = new URLSearchParams({
      response_type: "code",
      client_id: config.client_id,
      redirect_uri: redirectUri,
      scope: config.scope,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    const authUrl = `${config.authorize_url}?${params.toString()}`;
    console.log("Browser OAuth: Generated OAuth URL successfully");

    return authUrl;
  } catch (error) {
    console.error("Error generating browser OAuth URL:", error);
    throw error;
  }
};

const openBrowserOAuthPopup = (authUrl) => {
  const popup = window.open(
    authUrl,
    "salesforce-oauth",
    "width=600,height=700,scrollbars=yes,resizable=yes"
  );

  oauthPopup = popup;

  // Monitor popup for completion
  const checkClosed = setInterval(() => {
    if (popup.closed) {
      clearInterval(checkClosed);
      oauthPopup = null;
    }
  }, 1000);

  return popup;
};

const exchangeCodeInBrowser = async (code) => {
  const startTime = Date.now();
  try {
    console.log(
      "Browser OAuth: URGENT - Starting immediate code exchange for code:",
      code?.substring(0, 10) + "...",
      "at",
      new Date().toISOString()
    );

    // Get code verifier immediately - no delays
    const codeVerifier = browserStorage.get("oauth_code_verifier");

    if (!codeVerifier) {
      console.error(
        "Browser OAuth: CRITICAL - Code verifier not found in storage"
      );
      // Quick debug without delays
      const allKeys = Object.keys(localStorage).filter((key) =>
        key.startsWith("electron-store-")
      );
      console.log("Browser OAuth: Available storage keys:", allKeys);

      throw new Error(
        "Code verifier not found. Authorization code may have expired due to storage issue."
      );
    }

    console.log("Browser OAuth: Code verifier found, proceeding immediately");

    // Use the same redirect URI format as in OAuth URL generation
    const redirectUri = `${window.location.origin}/oauth/callback`;

    const requestBody = {
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
    };

    console.log(
      "Browser OAuth: Sending URGENT token exchange request (elapsed:",
      Date.now() - startTime,
      "ms)"
    );

    const response = await fetch(
      `${
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
      }/api/v1/oauth/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    const responseTime = Date.now() - startTime;
    console.log(
      "Browser OAuth: Token exchange response received in",
      responseTime,
      "ms, status:",
      response.status
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ detail: "Unknown error" }));
      console.error(
        "Browser OAuth: Token exchange failed with error:",
        errorData,
        "Total time elapsed:",
        Date.now() - startTime,
        "ms"
      );
      throw new Error(
        errorData.detail ||
          `Token exchange failed with status ${response.status}`
      );
    }

    const tokenData = await response.json();
    console.log(
      "Browser OAuth: Token exchange successful in",
      Date.now() - startTime,
      "ms"
    );

    // Store token data in browser storage immediately
    const authData = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      instanceUrl: tokenData.instance_url,
      tokenType: tokenData.token_type,
      expiresIn: tokenData.expires_in,
      issuedAt: Math.floor(Date.now() / 1000),
    };

    // Store everything immediately
    browserStorage.set("salesforceAuth", authData);
    browserStorage.delete("oauth_code_verifier");
    browserStorage.set("oauth_last_success", {
      timestamp: Date.now(),
      instanceUrl: authData.instanceUrl,
    });

    console.log(
      "Browser OAuth: Code exchange completed successfully in",
      Date.now() - startTime,
      "ms"
    );
    return {
      success: true,
      data: authData,
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(
      "Browser OAuth code exchange failed after",
      totalTime,
      "ms:",
      error
    );
    console.error("Browser OAuth error stack:", error.stack);

    // Check if this is an expired code error
    let errorMessage = error.message;
    if (
      error.message.includes("expired authorization code") ||
      error.message.includes("invalid_grant")
    ) {
      errorMessage = `Authorization code expired (processed in ${totalTime}ms). This usually happens when the OAuth flow takes too long. Please try logging in again.`;
      console.error(
        "Browser OAuth: EXPIRED CODE DETECTED - OAuth flow was too slow"
      );
    }

    // Store error information for debugging
    browserStorage.set("oauth_last_error", {
      timestamp: Date.now(),
      error: errorMessage,
      originalError: error.message,
      processingTime: totalTime,
      code: code?.substring(0, 10) + "...",
    });

    // Clean up any partial state
    browserStorage.delete("oauth_code_verifier");

    return {
      success: false,
      error: errorMessage,
    };
  }
};

const refreshTokenInBrowser = async () => {
  try {
    const authData = browserStorage.get("salesforceAuth");
    if (!authData || !authData.refreshToken) {
      throw new Error("No refresh token found");
    }

    const response = await fetch(
      `${
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
      }/api/v1/oauth/refresh`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh_token: authData.refreshToken,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Token refresh failed");
    }

    const tokenData = await response.json();

    // Update stored token data
    const updatedAuthData = {
      ...authData,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || authData.refreshToken,
      instanceUrl: tokenData.instance_url || authData.instanceUrl,
      tokenType: tokenData.token_type || authData.tokenType,
      expiresIn: tokenData.expires_in,
      issuedAt: Math.floor(Date.now() / 1000),
    };

    browserStorage.set("salesforceAuth", updatedAuthData);

    return {
      success: true,
      data: updatedAuthData,
    };
  } catch (error) {
    console.error("Browser token refresh failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

const logoutInBrowser = async () => {
  // Clear browser storage
  browserStorage.delete("salesforceAuth");
  browserStorage.delete("oauth_code_verifier");
  browserStorage.delete("userProfile");
  browserStorage.delete("lastFileUpload");
  return { success: true };
};

const getUserProfileInBrowser = async (retryCount = 0) => {
  const maxRetries = 2;

  try {
    const authData = browserStorage.get("salesforceAuth");
    if (!authData || !authData.accessToken) {
      throw new Error("No access token found");
    }

    console.log(
      `Browser: Fetching user profile via backend proxy (attempt ${
        retryCount + 1
      })...`
    );
    console.log("Browser: Auth data available:", {
      hasAccessToken: !!authData.accessToken,
      instanceUrl: authData.instanceUrl,
      tokenLength: authData.accessToken?.length || 0,
    });

    // Use backend proxy to avoid CORS issues
    const baseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

    console.log(
      "Browser: Making request to:",
      `${baseUrl}/api/v1/oauth/userinfo`
    );

    const response = await fetch(`${baseUrl}/api/v1/oauth/userinfo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${
          localStorage.getItem("authToken") || "dummy-token"
        }`,
      },
      body: JSON.stringify({
        access_token: authData.accessToken,
        instance_url: authData.instanceUrl,
      }),
    });

    console.log("Browser: Response status:", response.status);
    console.log(
      "Browser: Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      // Try to refresh token if unauthorized
      if (response.status === 401) {
        console.log("Browser: Access token expired, attempting refresh...");
        const refreshResult = await refreshTokenInBrowser();
        if (refreshResult.success) {
          // Retry with new token
          const retryResponse = await fetch(
            `${baseUrl}/api/v1/oauth/userinfo`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${
                  localStorage.getItem("authToken") || "dummy-token"
                }`,
              },
              body: JSON.stringify({
                access_token: refreshResult.data.accessToken,
                instance_url: refreshResult.data.instanceUrl,
              }),
            }
          );

          if (!retryResponse.ok) {
            const errorData = await retryResponse
              .json()
              .catch(() => ({ detail: "Unknown error" }));
            throw new Error(
              `Failed to fetch user profile after token refresh: ${
                errorData.detail || retryResponse.statusText
              }`
            );
          }

          const profileData = await retryResponse.json();
          browserStorage.set("userProfile", profileData);
          console.log(
            "Browser: User profile fetched successfully after token refresh"
          );
          return {
            success: true,
            data: profileData,
          };
        } else {
          throw new Error("Token refresh failed");
        }
      } else if (response.status === 500 && retryCount < maxRetries) {
        // Retry on 500 errors (server issues)
        console.log(
          `Browser: Server error (500), retrying in 1 second... (attempt ${
            retryCount + 1
          }/${maxRetries})`
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return getUserProfileInBrowser(retryCount + 1);
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Unknown error" }));

        // For 500 errors after max retries, return success with null data
        // This prevents authentication flow disruption
        if (response.status === 500) {
          console.warn(
            "Browser: Server error persists after retries, continuing without profile data"
          );
          return {
            success: true,
            data: null,
            warning: "Profile data unavailable due to server error",
          };
        }

        throw new Error(
          `Failed to fetch user profile: ${
            errorData.detail || response.statusText
          }`
        );
      }
    }

    const profileData = await response.json();
    console.log("Browser: Raw profile data received:", profileData);
    console.log("Browser: Profile data fields:", Object.keys(profileData));
    console.log("Browser: Name field value:", profileData.name);
    console.log("Browser: Display name field value:", profileData.display_name);

    browserStorage.set("userProfile", profileData);
    console.log("Browser: User profile fetched successfully via backend proxy");

    return {
      success: true,
      data: profileData,
    };
  } catch (error) {
    console.error("Browser user profile fetch failed:", error);

    // For network errors or other issues, return success with null data
    // This prevents authentication flow disruption
    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("NetworkError")
    ) {
      console.warn(
        "Browser: Network error during profile fetch, continuing without profile data"
      );
      return {
        success: true,
        data: null,
        warning: "Profile data unavailable due to network error",
      };
    }

    return {
      success: false,
      error: error.message,
    };
  }
};

const setupBrowserOAuthListener = (callback) => {
  oauthCallbackListener = callback;

  // Listen for messages from OAuth popup window
  const messageHandler = (event) => {
    if (event.origin !== window.location.origin) return;

    if (event.data.type === "OAUTH_CALLBACK" && event.data.code) {
      callback(event.data.code);
    }
  };

  window.addEventListener("message", messageHandler);

  // Store reference to remove later
  if (!window.browserOAuthMessageHandlers) {
    window.browserOAuthMessageHandlers = [];
  }
  window.browserOAuthMessageHandlers.push(messageHandler);
};

const setupBrowserOAuthSuccessListener = (callback) => {
  oauthSuccessListener = callback;

  // Listen for OAuth success events
  const successHandler = (event) => {
    if (event.origin !== window.location.origin) return;

    if (event.data.type === "OAUTH_SUCCESS" && event.data.tokenData) {
      callback(event.data.tokenData);
    }
  };

  window.addEventListener("message", successHandler);

  // Store reference to remove later
  if (!window.browserOAuthMessageHandlers) {
    window.browserOAuthMessageHandlers = [];
  }
  window.browserOAuthMessageHandlers.push(successHandler);
};

const setupBrowserOAuthErrorListener = (callback) => {
  oauthErrorListener = callback;

  // Listen for OAuth error events
  const errorHandler = (event) => {
    if (event.origin !== window.location.origin) return;

    if (event.data.type === "OAUTH_ERROR" && event.data.error) {
      callback(event.data.error);
    }
  };

  window.addEventListener("message", errorHandler);

  // Store reference to remove later
  if (!window.browserOAuthMessageHandlers) {
    window.browserOAuthMessageHandlers = [];
  }
  window.browserOAuthMessageHandlers.push(errorHandler);
};

const removeBrowserOAuthListeners = () => {
  oauthCallbackListener = null;
  oauthSuccessListener = null;
  oauthErrorListener = null;

  // Remove all message handlers
  if (window.browserOAuthMessageHandlers) {
    window.browserOAuthMessageHandlers.forEach((handler) => {
      window.removeEventListener("message", handler);
    });
    window.browserOAuthMessageHandlers = [];
  }
};

// Browser fallback implementations for Salesforce API operations
const validateSalesforceConnectionInBrowser = async () => {
  try {
    console.log("Browser validation - Starting validation check");

    // In browser mode, we can do basic validation using stored auth data
    const storedAuth = browserStorage.get("salesforceAuth");

    if (!storedAuth || !storedAuth.accessToken || !storedAuth.instanceUrl) {
      console.log("Browser validation - No auth data found");
      return {
        success: false,
        error: "Not authenticated with Salesforce. Please log in first.",
      };
    }

    // Check if token appears to be expired (basic check)
    if (storedAuth.issuedAt && storedAuth.expiresIn) {
      const issuedTime = parseInt(storedAuth.issuedAt);
      const expiresIn = parseInt(storedAuth.expiresIn);
      const currentTime = Math.floor(Date.now() / 1000);

      if (currentTime > issuedTime + expiresIn) {
        console.log("Browser validation - Token expired");
        return {
          success: false,
          error: "Salesforce token has expired. Please log in again.",
        };
      }
    }

    // Use backend API for validation
    const baseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    const response = await fetch(`${baseUrl}/api/v1/salesforce/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${
          localStorage.getItem("authToken") || "dummy-token"
        }`,
      },
      body: JSON.stringify({
        access_token: storedAuth.accessToken,
        instance_url: storedAuth.instanceUrl,
      }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ detail: "Unknown error" }));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log("Browser validation - Backend validation result:", result);
    return result;
  } catch (error) {
    console.error("Browser validation error:", error);
    return {
      success: false,
      error: "Failed to validate authentication in browser mode.",
    };
  }
};

const getSalesforceObjectsInBrowser = async () => {
  try {
    // Get stored auth data
    const storedAuth = browserStorage.get("salesforceAuth");

    if (!storedAuth || !storedAuth.accessToken || !storedAuth.instanceUrl) {
      // Return default objects if not authenticated
      return {
        success: true,
        objects: [
          { name: "Lead", label: "Lead", createable: true },
          { name: "Contact", label: "Contact", createable: true },
          { name: "Account", label: "Account", createable: true },
          { name: "Opportunity", label: "Opportunity", createable: true },
          { name: "Case", label: "Case", createable: true },
        ],
        message: "Default objects (browser mode - not authenticated)",
      };
    }

    // Use backend API for objects
    const baseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    const response = await fetch(`${baseUrl}/api/v1/salesforce/objects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${
          localStorage.getItem("authToken") || "dummy-token"
        }`,
      },
      body: JSON.stringify({
        access_token: storedAuth.accessToken,
        instance_url: storedAuth.instanceUrl,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Browser objects error:", error);
    // Return default objects on error
    return {
      success: true,
      objects: [
        { name: "Lead", label: "Lead", createable: true },
        { name: "Contact", label: "Contact", createable: true },
        { name: "Account", label: "Account", createable: true },
        { name: "Opportunity", label: "Opportunity", createable: true },
        { name: "Case", label: "Case", createable: true },
      ],
      message: "Default objects (browser mode - API error)",
    };
  }
};

const uploadToSalesforceInBrowser = async (options) => {
  try {
    // Get stored auth data
    const storedAuth = browserStorage.get("salesforceAuth");

    if (!storedAuth || !storedAuth.accessToken || !storedAuth.instanceUrl) {
      return {
        success: false,
        error: "Not authenticated with Salesforce. Please log in first.",
      };
    }

    // Use backend API for upload
    const baseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    const response = await fetch(`${baseUrl}/api/v1/salesforce/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${
          localStorage.getItem("authToken") || "dummy-token"
        }`,
      },
      body: JSON.stringify({
        processing_id: options.processingId,
        salesforce_object: options.salesforceObject || "Lead",
        access_token: storedAuth.accessToken,
        instance_url: storedAuth.instanceUrl,
        file_name: options.fileName,
      }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ detail: "Unknown error" }));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log("Browser upload - Backend upload result:", result);
    return result;
  } catch (error) {
    console.error("Browser upload error:", error);
    return {
      success: false,
      error: `Upload failed: ${error.message}`,
    };
  }
};

const getSalesforceFieldMappingInBrowser = async (options) => {
  try {
    // Get stored auth data
    const storedAuth = browserStorage.get("salesforceAuth");

    if (!storedAuth || !storedAuth.accessToken || !storedAuth.instanceUrl) {
      return {
        success: false,
        error: "Not authenticated with Salesforce. Please log in first.",
      };
    }

    // Use backend API for field mapping
    const baseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    const response = await fetch(`${baseUrl}/api/v1/salesforce/field-mapping`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${
          localStorage.getItem("authToken") || "dummy-token"
        }`,
      },
      body: JSON.stringify({
        access_token: storedAuth.accessToken,
        instance_url: storedAuth.instanceUrl,
        object_type: options || "Lead",
      }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ detail: "Unknown error" }));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log("Browser field mapping - Backend result:", result);
    return result;
  } catch (error) {
    console.error("Browser field mapping error:", error);
    return {
      success: false,
      error: `Field mapping failed: ${error.message}`,
    };
  }
};

// PKCE helper functions for browser OAuth
const generateCodeVerifier = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
};

const generateCodeChallenge = async (verifier) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode.apply(null, new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
};

// Export environment info for debugging
export const logEnvironmentInfo = () => {
  const info = getEnvironmentInfo();
  console.log("Environment Info:", info);
  return info;
};
