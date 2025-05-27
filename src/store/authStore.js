import { create } from "zustand";
import { isTokenExpired } from "../services/salesforceAuth"; // Adjust path as needed
import { electronAPI, isElectron, isBrowser } from "../utils/environment";

/**
 * Validates that authentication data contains all required fields
 * @param {object} authData - Authentication data to validate
 * @returns {boolean} - True if auth data is complete and valid
 */
const isValidAuthData = (authData) => {
  if (!authData || typeof authData !== "object") {
    return false;
  }

  const requiredFields = ["accessToken", "instanceUrl", "refreshToken"];
  const hasAllFields = requiredFields.every((field) => {
    const value = authData[field];
    return value && typeof value === "string" && value.trim().length > 0;
  });

  // Check for valid issuedAt timestamp
  const hasValidIssuedAt =
    typeof authData.issuedAt === "number" && authData.issuedAt > 0;

  // expiresIn is optional - if missing, we'll use a default value
  const hasValidExpiresIn =
    authData.expiresIn === undefined ||
    authData.expiresIn === null ||
    (typeof authData.expiresIn === "number" && authData.expiresIn > 0);

  const isValid = hasAllFields && hasValidIssuedAt && hasValidExpiresIn;

  if (!isValid) {
    console.log("AuthStore - Invalid auth data detected:", {
      hasAccessToken: !!authData.accessToken,
      hasInstanceUrl: !!authData.instanceUrl,
      hasRefreshToken: !!authData.refreshToken,
      hasValidIssuedAt:
        typeof authData.issuedAt === "number" && authData.issuedAt > 0,
      hasValidExpiresIn: hasValidExpiresIn,
      authData: {
        accessToken: authData.accessToken
          ? `${authData.accessToken.substring(0, 10)}...`
          : null,
        instanceUrl: authData.instanceUrl,
        refreshToken: authData.refreshToken
          ? `${authData.refreshToken.substring(0, 10)}...`
          : null,
        issuedAt: authData.issuedAt,
        expiresIn: authData.expiresIn,
      },
    });
  } else if (authData.expiresIn === undefined || authData.expiresIn === null) {
    console.warn(
      "AuthStore - Token data missing expiresIn field, but proceeding with authentication"
    );
  }

  return isValid;
};

// Validation lock to prevent concurrent validation calls
let validationInProgress = false;

// Initialization lock to prevent multiple concurrent initialization calls
let initializationInProgress = false;

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

  // User Profile Data
  userProfile: null, // Contains user information from Salesforce
  isLoadingProfile: false,
  profileError: null,
  lastFileUpload: null, // Timestamp of last file upload

  // Actions
  initializeAuth: async () => {
    // Prevent multiple concurrent initialization calls
    if (initializationInProgress) {
      console.log(
        "AuthStore - Initialization already in progress, skipping..."
      );
      return;
    }

    initializationInProgress = true;
    console.log("AuthStore - Starting initialization...");

    try {
      set({ isLoading: true, error: null });

      // Check environment and provide appropriate feedback
      if (isBrowser()) {
        console.log(
          "Running in browser mode - limited functionality available"
        );
      }

      // Get auth data from storage (Electron store or localStorage)
      console.log("AuthStore - Initializing auth, getting stored data...");
      const storedAuth = await electronAPI.getStoreValue("salesforceAuth");
      console.log(
        "AuthStore - Stored auth data:",
        storedAuth ? "Found" : "Not found"
      );
      console.log("AuthStore - Full stored auth data:", storedAuth);

      // Validate that we have complete authentication data
      if (storedAuth && isValidAuthData(storedAuth)) {
        if (isTokenExpired(storedAuth)) {
          console.log("Salesforce token expired, attempting refresh...");
          try {
            const refreshResult = await electronAPI.salesforceRefreshToken();
            if (
              refreshResult &&
              refreshResult.success &&
              isValidAuthData(refreshResult.data)
            ) {
              const newState = {
                isAuthenticated: true,
                accessToken: refreshResult.data.accessToken,
                instanceUrl: refreshResult.data.instanceUrl,
                refreshToken: refreshResult.data.refreshToken,
                issuedAt: refreshResult.data.issuedAt,
                expiresIn: refreshResult.data.expiresIn,
                isLoading: false,
                error: null,
              };
              console.log(
                "AuthStore - Setting refreshed token state:",
                newState
              );
              set(newState);
            } else {
              // Refresh failed or returned invalid data, clear tokens
              console.error(
                "AuthStore - Token refresh failed or returned invalid data:",
                refreshResult
              );
              await electronAPI.salesforceLogout(); // Ensure main process clears its store too
              set({
                isAuthenticated: false,
                accessToken: null,
                instanceUrl: null,
                refreshToken: null,
                userId: null,
                issuedAt: null,
                expiresIn: null,
                isLoading: false,
                error:
                  refreshResult?.error ||
                  "Failed to refresh token. Please log in again.",
              });
            }
          } catch (refreshError) {
            console.error("Error during token refresh on init:", refreshError);
            await electronAPI.salesforceLogout();
            set({
              isAuthenticated: false,
              accessToken: null,
              instanceUrl: null,
              refreshToken: null,
              userId: null,
              issuedAt: null,
              expiresIn: null,
              isLoading: false,
              error: "Session expired. Please log in again.",
            });
          }
        } else {
          // Token is valid and we have complete auth data
          console.log(
            "AuthStore - Token is valid and complete, setting authenticated state"
          );
          const newState = {
            isAuthenticated: true,
            accessToken: storedAuth.accessToken,
            instanceUrl: storedAuth.instanceUrl,
            refreshToken: storedAuth.refreshToken,
            issuedAt: storedAuth.issuedAt,
            expiresIn: storedAuth.expiresIn,
            isLoading: false,
            error: null,
          };
          console.log("AuthStore - Setting valid token state:", newState);
          set(newState);

          // Load stored profile data
          get().loadStoredProfileData();
        }
      } else {
        // No valid auth data found
        console.log("AuthStore - No valid authentication data found");
        if (storedAuth) {
          console.log("AuthStore - Stored auth data is incomplete:", {
            hasAccessToken: !!storedAuth.accessToken,
            hasInstanceUrl: !!storedAuth.instanceUrl,
            hasRefreshToken: !!storedAuth.refreshToken,
          });
          // Clear incomplete auth data
          await electronAPI.salesforceLogout();
        }
        console.log(
          "AuthStore - Setting unauthenticated state and clearing loading..."
        );
        set({
          isAuthenticated: false,
          accessToken: null,
          instanceUrl: null,
          refreshToken: null,
          userId: null,
          issuedAt: null,
          expiresIn: null,
          isLoading: false,
          error: null,
        });
        console.log("AuthStore - Unauthenticated state set successfully");
      }
    } catch (err) {
      console.error("Error initializing auth state:", err);

      // Provide environment-specific error messages
      let errorMessage = err.message;
      if (
        isBrowser() &&
        err.message.includes("not available in current environment")
      ) {
        console.log(
          "AuthStore - Browser mode detected, attempting browser storage recovery"
        );

        // Try to recover authentication state from browser storage
        try {
          const browserAuth = localStorage.getItem(
            "electron-store-salesforceAuth"
          );
          if (browserAuth) {
            const authData = JSON.parse(browserAuth);
            console.log(
              "AuthStore - Found auth data in browser storage, validating..."
            );

            if (isValidAuthData(authData) && !isTokenExpired(authData)) {
              console.log(
                "AuthStore - Browser storage auth data is valid, restoring state"
              );
              set({
                isAuthenticated: true,
                accessToken: authData.accessToken,
                instanceUrl: authData.instanceUrl,
                refreshToken: authData.refreshToken,
                issuedAt: authData.issuedAt,
                expiresIn: authData.expiresIn,
                isLoading: false,
                error: null,
                userId: null,
              });

              // Load stored profile data
              get().loadStoredProfileData();
              return;
            } else {
              console.log(
                "AuthStore - Browser storage auth data is invalid or expired"
              );
            }
          }
        } catch (storageError) {
          console.warn(
            "AuthStore - Failed to recover from browser storage:",
            storageError
          );
        }

        // Don't treat this as a critical error in browser mode
        set({
          isLoading: false,
          error: null,
          isAuthenticated: false,
          accessToken: null,
          instanceUrl: null,
          refreshToken: null,
          userId: null,
          issuedAt: null,
          expiresIn: null,
        });
      } else {
        set({ isLoading: false, error: errorMessage });
      }
    } finally {
      // Always reset the initialization lock
      initializationInProgress = false;
      console.log("AuthStore - Initialization completed, lock released");
    }
  },

  // Called after main process gets the code and exchanges it for a token
  loginSuccess: (tokenData) => {
    console.log("authStore.loginSuccess called with:", tokenData);

    // Ensure expiresIn has a default value if missing
    const DEFAULT_EXPIRES_IN = 7200; // 2 hours
    const processedTokenData = {
      ...tokenData,
      expiresIn: tokenData.expiresIn || DEFAULT_EXPIRES_IN,
    };

    // Log if we're using default expiration
    if (!tokenData.expiresIn) {
      console.warn(
        "authStore.loginSuccess: expiresIn missing, using default:",
        DEFAULT_EXPIRES_IN
      );
    }

    // Validate the token data before setting authenticated state
    if (!isValidAuthData(processedTokenData)) {
      console.error(
        "authStore.loginSuccess: Invalid token data received:",
        processedTokenData
      );
      get().loginError(
        "Invalid authentication data received. Please try logging in again."
      );
      return;
    }

    const newState = {
      isAuthenticated: true,
      accessToken: processedTokenData.accessToken,
      instanceUrl: processedTokenData.instanceUrl,
      refreshToken: processedTokenData.refreshToken,
      issuedAt: processedTokenData.issuedAt,
      expiresIn: processedTokenData.expiresIn,
      error: null,
      isLoading: false,
      userId: null,
    };
    console.log("authStore: Setting new authentication state:", newState);
    set(newState);
    console.log("authStore: Authentication state updated successfully");
    // The main process already stored it via electron-store

    // Fetch user profile data after successful authentication with a small delay
    // This prevents race conditions in browser mode where the popup might close
    // before the profile fetch completes
    setTimeout(() => {
      console.log("authStore: Starting delayed user profile fetch");
      get().fetchUserProfile();
    }, 500);
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
      await electronAPI.salesforceLogout();
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
        // Clear user profile data
        userProfile: null,
        isLoadingProfile: false,
        profileError: null,
        lastFileUpload: null,
      });
    } catch (err) {
      console.error("Error during logout:", err);
      set({ isLoading: false, error: err.message });
      // Even if main process logout fails, clear client state
      set({
        isAuthenticated: false,
        accessToken: null,
        instanceUrl: null,
        refreshToken: null,
        userId: null,
        userProfile: null,
        isLoadingProfile: false,
        profileError: null,
        lastFileUpload: null,
      });
    }
  },

  // Action to handle the OAuth callback code received from main process
  handleOAuthCode: async (code) => {
    set({ isLoading: true, error: null });
    try {
      const result = await electronAPI.salesforceExchangeCode(code);
      if (result && result.success) {
        get().loginSuccess(result.data);
      } else {
        get().loginError(
          result?.error || "Failed to exchange authorization code for token."
        );
      }
    } catch (err) {
      console.error("Error exchanging code in store:", err);
      get().loginError(err.message);
    }
  },

  // Action to explicitly refresh token if needed by UI, though main process also handles it
  ensureValidToken: async () => {
    const { isAuthenticated, issuedAt, expiresIn, instanceUrl, accessToken } =
      get();

    console.log("AuthStore - ensureValidToken called with state:", {
      isAuthenticated,
      hasAccessToken: !!accessToken,
      instanceUrl,
      issuedAt,
      expiresIn,
    });

    if (!isAuthenticated || !instanceUrl || !accessToken) {
      console.log("AuthStore - Not authenticated, cannot ensure valid token");
      return null;
    }

    // Check if token is expired or about to expire
    const isExpired = isTokenExpired({ issuedAt, expiresIn, accessToken });
    console.log("AuthStore - Token expiration check:", { isExpired });

    if (isExpired) {
      console.log("AuthStore - Token expired, attempting refresh...");
      set({ isLoading: true });
      try {
        const refreshResult = await electronAPI.salesforceRefreshToken();
        console.log("AuthStore - Refresh result:", refreshResult);

        if (refreshResult && refreshResult.success) {
          const newState = {
            accessToken: refreshResult.data.accessToken,
            instanceUrl: refreshResult.data.instanceUrl,
            refreshToken: refreshResult.data.refreshToken,
            issuedAt: refreshResult.data.issuedAt,
            expiresIn: refreshResult.data.expiresIn,
            isLoading: false,
            error: null,
          };
          console.log("AuthStore - Setting refreshed token state:", newState);
          set(newState);
          return refreshResult.data.accessToken;
        } else {
          console.error(
            "AuthStore - Token refresh failed:",
            refreshResult?.error
          );
          set({
            isLoading: false,
            error: refreshResult?.error || "Failed to refresh token.",
          });
          get().logout(); // Force logout if refresh fails
          return null;
        }
      } catch (error) {
        console.error("Error during manual token refresh:", error);
        set({ isLoading: false, error: "Failed to refresh token." });
        get().logout();
        return null;
      }
    } else {
      console.log("AuthStore - Token is still valid");
      return accessToken;
    }
  },

  // Action to validate current authentication state
  validateAuthentication: async () => {
    // Prevent concurrent validation calls to avoid stack overflow
    if (validationInProgress) {
      console.log(
        "AuthStore - Validation already in progress, skipping duplicate call"
      );
      return { success: false, error: "Validation already in progress" };
    }

    validationInProgress = true;

    try {
      const currentState = get();
      const {
        isAuthenticated,
        accessToken,
        instanceUrl,
        refreshToken,
        issuedAt,
        expiresIn,
      } = currentState;

      console.log("AuthStore - validateAuthentication called with state:", {
        isAuthenticated,
        hasAccessToken: !!accessToken,
        instanceUrl,
        hasRefreshToken: !!refreshToken,
        issuedAt,
        expiresIn,
      });

      // First check if we have a consistent authentication state
      const hasCompleteAuthData = isValidAuthData(currentState);

      if (isAuthenticated && !hasCompleteAuthData) {
        console.error(
          "AuthStore - Inconsistent authentication state detected! isAuthenticated=true but missing required data"
        );
        console.log(
          "AuthStore - Fixing inconsistent state by clearing authentication"
        );

        // Fix the inconsistent state by clearing it
        await get().logout();

        return {
          success: false,
          error:
            "Authentication state was inconsistent and has been cleared. Please log in again.",
        };
      }

      if (!isAuthenticated || !hasCompleteAuthData) {
        console.log(
          "AuthStore - Not authenticated or incomplete auth data, validation failed"
        );
        return { success: false, error: "Not authenticated" };
      }

      // Try to validate connection with Salesforce
      const validationResult = await electronAPI.validateSalesforceConnection();
      console.log(
        "AuthStore - Connection validation result:",
        validationResult
      );

      if (validationResult && validationResult.success) {
        return { success: true, data: validationResult };
      } else {
        console.error(
          "AuthStore - Connection validation failed:",
          validationResult?.error
        );

        // If validation fails, the token might be invalid - clear the state
        if (
          validationResult?.error &&
          validationResult.error.includes("Not authenticated")
        ) {
          console.log(
            "AuthStore - Server reports not authenticated, clearing local state"
          );
          await get().logout();
        }

        return {
          success: false,
          error: validationResult?.error || "Connection validation failed",
        };
      }
    } catch (error) {
      console.error("AuthStore - Error during connection validation:", error);
      return {
        success: false,
        error: error.message || "Failed to validate connection",
      };
    } finally {
      // Always reset the validation lock
      validationInProgress = false;
    }
  },

  // Action to fix inconsistent authentication state
  fixAuthenticationState: async () => {
    const currentState = get();
    const { isAuthenticated, accessToken, instanceUrl, refreshToken } =
      currentState;

    console.log("AuthStore - fixAuthenticationState called");

    // Check for inconsistent state
    if (isAuthenticated && (!accessToken || !instanceUrl || !refreshToken)) {
      console.log(
        "AuthStore - Detected inconsistent authentication state, clearing..."
      );
      await get().logout();
      return {
        success: true,
        message: "Inconsistent authentication state cleared",
      };
    }

    // Check if we have auth data but not marked as authenticated
    if (!isAuthenticated && accessToken && instanceUrl && refreshToken) {
      console.log(
        "AuthStore - Found auth data but not marked as authenticated, restoring state..."
      );

      if (isValidAuthData(currentState)) {
        // Directly restore authentication state without calling initializeAuth to prevent recursion
        console.log("AuthStore - Directly restoring authentication state");
        set({
          isAuthenticated: true,
          accessToken: currentState.accessToken,
          instanceUrl: currentState.instanceUrl,
          refreshToken: currentState.refreshToken,
          issuedAt: currentState.issuedAt,
          expiresIn: currentState.expiresIn,
          error: null,
          isLoading: false,
        });
        return { success: true, message: "Authentication state restored" };
      } else {
        // Clear invalid data
        await get().logout();
        return {
          success: true,
          message: "Invalid authentication data cleared",
        };
      }
    }

    return { success: true, message: "Authentication state is consistent" };
  },

  // User Profile Management
  fetchUserProfile: async () => {
    const { isAuthenticated, accessToken, instanceUrl } = get();

    if (!isAuthenticated || !accessToken || !instanceUrl) {
      console.log("AuthStore - Cannot fetch user profile: not authenticated");
      return;
    }

    set({ isLoadingProfile: true, profileError: null });

    try {
      console.log("AuthStore - Fetching user profile data...");
      // Use environment abstraction layer for cross-platform compatibility
      const result = await electronAPI.salesforceGetUserProfile();

      if (result && result.success) {
        // Handle case where profile data might be null due to server errors
        if (result.data) {
          console.log("AuthStore - Raw result data:", result.data);
          console.log(
            "AuthStore - Available fields in result.data:",
            Object.keys(result.data || {})
          );

          const profileData = {
            id: result.data.user_id || result.data.id,
            username: result.data.preferred_username || result.data.username,
            email: result.data.email,
            name: result.data.name || result.data.display_name,
            picture: result.data.picture,
            organization_id: result.data.organization_id,
            profile: result.data.profile,
            zoneinfo: result.data.zoneinfo,
            locale: result.data.locale,
            // Add login timestamp
            loginTimestamp: Date.now(),
          };

          console.log("AuthStore - Processed profile data:", profileData);
          console.log("AuthStore - Final name value:", profileData.name);
          console.log(
            "AuthStore - User profile fetched successfully:",
            profileData
          );
          set({
            userProfile: profileData,
            isLoadingProfile: false,
            profileError: null,
            userId: profileData.id,
          });

          // Store profile data persistently using environment abstraction
          await electronAPI.setStoreValue("userProfile", profileData);
        } else {
          // Profile data is null but operation was successful (e.g., server error handled gracefully)
          console.warn(
            "AuthStore - Profile data is null but operation successful:",
            result.warning
          );
          set({
            userProfile: null,
            isLoadingProfile: false,
            profileError: null,
          });
        }
      } else {
        console.warn(
          "AuthStore - Failed to fetch user profile (non-critical):",
          result?.error
        );
        // Don't set error state for profile fetch failures - they're non-critical
        set({
          isLoadingProfile: false,
          profileError: null, // Clear any previous errors
        });
      }
    } catch (error) {
      console.warn(
        "AuthStore - Error fetching user profile (non-critical):",
        error
      );
      // Don't set error state for profile fetch failures - they're non-critical
      set({
        isLoadingProfile: false,
        profileError: null, // Clear any previous errors
      });
    }
  },

  refreshUserProfile: async () => {
    console.log("AuthStore - Refreshing user profile...");
    await get().fetchUserProfile();
  },

  updateLastFileUpload: async () => {
    const timestamp = Date.now();
    console.log("AuthStore - Updating last file upload timestamp:", timestamp);

    set({ lastFileUpload: timestamp });

    // Store persistently
    try {
      await electronAPI.setStoreValue("lastFileUpload", timestamp);
    } catch (error) {
      console.error(
        "AuthStore - Error storing last file upload timestamp:",
        error
      );
    }
  },

  loadStoredProfileData: async () => {
    try {
      // Load stored profile data
      const storedProfile = await electronAPI.getStoreValue("userProfile");
      const storedLastUpload = await electronAPI.getStoreValue(
        "lastFileUpload"
      );

      if (storedProfile) {
        console.log("AuthStore - Loading stored profile data:", storedProfile);
        set({ userProfile: storedProfile });
      }

      if (storedLastUpload) {
        console.log(
          "AuthStore - Loading stored last upload timestamp:",
          storedLastUpload
        );
        set({ lastFileUpload: storedLastUpload });
      }
    } catch (error) {
      console.error("AuthStore - Error loading stored profile data:", error);
    }
  },
}));

// Initialize auth state when the store is created/app starts
// This should ideally be called once in App.jsx or similar entry point.
// useAuthStore.getState().initializeAuth();

// Track if listeners have been set up to prevent duplicates
let listenersSetup = false;

// Function to setup OAuth listeners - works in both Electron and browser environments
const setupOAuthListeners = () => {
  if (listenersSetup) {
    console.log("OAuth listeners already set up, skipping...");
    return;
  }

  try {
    // Legacy callback handler (for backward compatibility)
    electronAPI.onSalesforceOAuthCallback((code) => {
      console.log(
        "authStore observed salesforce:oauth-callback with code:",
        code
      );
      useAuthStore.getState().handleOAuthCode(code);
    });

    // New success handler - main process already exchanged the token
    electronAPI.onSalesforceOAuthSuccess((tokenData) => {
      console.log("authStore observed salesforce:oauth-success:", tokenData);
      useAuthStore.getState().loginSuccess(tokenData);
    });

    electronAPI.onSalesforceOAuthError((errorDetails) => {
      console.error("authStore observed salesforce:oauth-error:", errorDetails);
      useAuthStore
        .getState()
        .loginError(
          errorDetails.error_description ||
            errorDetails.error ||
            "Salesforce authentication failed."
        );
    });

    // Browser-specific OAuth event handlers
    if (isBrowser()) {
      console.log("AuthStore: Setting up browser OAuth message handlers");

      // Listen for OAuth success messages from popup windows
      const handleOAuthMessage = (event) => {
        // Verify origin for security
        if (event.origin !== window.location.origin) {
          console.warn(
            "AuthStore: Ignoring message from different origin:",
            event.origin
          );
          return;
        }

        console.log(
          "AuthStore: Received browser OAuth message:",
          event.data.type
        );

        if (event.data.type === "OAUTH_SUCCESS" && event.data.tokenData) {
          console.log(
            "AuthStore: Processing browser OAuth success message with token data"
          );

          // Ensure we have valid token data before processing
          if (event.data.tokenData && event.data.tokenData.accessToken) {
            console.log(
              "AuthStore: Token data appears valid, calling loginSuccess"
            );
            useAuthStore.getState().loginSuccess(event.data.tokenData);
          } else {
            console.error(
              "AuthStore: Invalid token data in OAuth success message:",
              event.data.tokenData
            );
            useAuthStore
              .getState()
              .loginError(
                "Invalid authentication data received from OAuth flow"
              );
          }
        } else if (event.data.type === "OAUTH_ERROR" && event.data.error) {
          console.error(
            "AuthStore: Processing browser OAuth error message:",
            event.data.error
          );

          // Only process error if we're not already authenticated
          // This prevents error messages from disrupting successful authentication
          const currentState = useAuthStore.getState();
          if (!currentState.isAuthenticated) {
            useAuthStore
              .getState()
              .loginError(
                event.data.error.error || "Browser OAuth authentication failed."
              );
          } else {
            console.log(
              "AuthStore: Ignoring OAuth error - already authenticated"
            );
          }
        }
      };

      window.addEventListener("message", handleOAuthMessage);

      // Store reference for cleanup
      window.authStoreOAuthMessageHandler = handleOAuthMessage;
    }

    listenersSetup = true;
    console.log(
      `OAuth listeners setup successfully (${
        isElectron() ? "Electron" : "Browser"
      } mode)`
    );
  } catch (err) {
    if (process.env.NODE_ENV !== "test") {
      console.warn(
        `OAuth callback listeners setup failed in ${
          isElectron() ? "Electron" : "Browser"
        } mode:`,
        err.message
      );
    }
  }
};

// Try to setup listeners immediately, but also provide a way to retry
setupOAuthListeners();

// Export the setup function so it can be called from components if needed
export { setupOAuthListeners };
