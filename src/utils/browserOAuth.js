/**
 * Dedicated Browser OAuth Handler
 * Optimized for speed and reliability to prevent authorization code expiration
 */

import { browserStorage } from "./environment";

// Global state for OAuth flow
let oauthState = {
  popup: null,
  isProcessing: false,
  codeVerifier: null,
  config: null,
};

/**
 * Get API base URL with production detection
 */
function getApiBaseUrl() {
  if (import.meta.env.PROD) {
    return window.location.origin;
  }
  return import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
}

/**
 * Generate PKCE code verifier
 */
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Generate PKCE code challenge
 */
async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode.apply(null, new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Get OAuth configuration from backend
 */
async function getOAuthConfig() {
  if (oauthState.config) {
    return oauthState.config;
  }

  const apiBaseUrl = getApiBaseUrl();
  const configUrl = `${apiBaseUrl}/api/v1/oauth/config`;

  console.log("Browser OAuth: Fetching config from:", configUrl);

  const response = await fetch(configUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get OAuth config: ${response.status}`);
  }

  oauthState.config = await response.json();
  return oauthState.config;
}

/**
 * Generate OAuth URL with PKCE
 */
export async function generateBrowserOAuthUrl() {
  try {
    console.log("Browser OAuth: Starting URL generation...");

    const config = await getOAuthConfig();
    const redirectUri = `${window.location.origin}/oauth/callback`;

    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Store code verifier immediately
    oauthState.codeVerifier = codeVerifier;
    browserStorage.set("oauth_code_verifier", codeVerifier);

    // Build OAuth URL
    const params = new URLSearchParams({
      response_type: "code",
      client_id: config.client_id,
      redirect_uri: redirectUri,
      scope: config.scope,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    const authUrl = `${config.authorize_url}?${params.toString()}`;
    console.log("Browser OAuth: URL generated successfully");

    return authUrl;
  } catch (error) {
    console.error("Browser OAuth: URL generation failed:", error);
    throw error;
  }
}

/**
 * Open OAuth popup and handle communication
 */
export function openOAuthPopup(authUrl) {
  return new Promise((resolve, reject) => {
    console.log("Browser OAuth: Opening popup...");

    const popup = window.open(
      authUrl,
      "salesforce-oauth",
      "width=600,height=700,scrollbars=yes,resizable=yes,location=yes"
    );

    if (!popup) {
      reject(new Error("Popup blocked. Please allow popups for this site."));
      return;
    }

    oauthState.popup = popup;

    // Listen for messages from popup
    const messageHandler = (event) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      console.log("Browser OAuth: Received message from popup:", event.data);

      if (event.data.type === "OAUTH_SUCCESS") {
        window.removeEventListener("message", messageHandler);
        popup.close();
        oauthState.popup = null;
        resolve(event.data.tokenData);
      } else if (event.data.type === "OAUTH_ERROR") {
        window.removeEventListener("message", messageHandler);
        popup.close();
        oauthState.popup = null;
        reject(
          new Error(event.data.error.error || "OAuth authentication failed")
        );
      }
    };

    window.addEventListener("message", messageHandler);

    // Monitor popup closure
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener("message", messageHandler);
        oauthState.popup = null;

        if (!oauthState.isProcessing) {
          reject(new Error("OAuth popup was closed before completion"));
        }
      }
    }, 1000);
  });
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code) {
  const startTime = Date.now();

  try {
    console.log("Browser OAuth: URGENT - Starting immediate token exchange");
    oauthState.isProcessing = true;

    // Get code verifier
    const codeVerifier =
      oauthState.codeVerifier || browserStorage.get("oauth_code_verifier");

    if (!codeVerifier) {
      throw new Error("Code verifier not found. Please try logging in again.");
    }

    const redirectUri = `${window.location.origin}/oauth/callback`;

    const apiBaseUrl = getApiBaseUrl();
    const tokenUrl = `${apiBaseUrl}/api/v1/oauth/token`;

    console.log("Browser OAuth: Token exchange URL:", tokenUrl);

    // Make token exchange request
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: code,
        code_verifier: codeVerifier,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Token exchange failed: ${errorData}`);
    }

    const tokenData = await response.json();

    // Store token data immediately
    const authData = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      instanceUrl: tokenData.instance_url,
      tokenType: tokenData.token_type,
      expiresIn: tokenData.expires_in,
      issuedAt: Math.floor(Date.now() / 1000),
    };

    browserStorage.set("salesforceAuth", authData);
    browserStorage.delete("oauth_code_verifier");

    // Clear state
    oauthState.codeVerifier = null;
    oauthState.isProcessing = false;

    const processingTime = Date.now() - startTime;
    console.log(
      `Browser OAuth: Token exchange completed in ${processingTime}ms`
    );

    return {
      success: true,
      data: authData,
    };
  } catch (error) {
    oauthState.isProcessing = false;
    const processingTime = Date.now() - startTime;

    console.error(
      `Browser OAuth: Token exchange failed after ${processingTime}ms:`,
      error
    );

    // Enhanced error message for expired codes
    if (
      error.message.includes("expired authorization code") ||
      error.message.includes("invalid_grant")
    ) {
      throw new Error(
        `Authorization code expired (processed in ${processingTime}ms). Please try logging in again.`
      );
    }

    throw error;
  }
}

/**
 * Process OAuth callback immediately (called from callback page)
 */
export async function processOAuthCallback() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const error = urlParams.get("error");
    const errorDescription = urlParams.get("error_description");

    if (error) {
      const errorMsg =
        errorDescription || error || "OAuth authentication failed";

      // Notify parent window if this is a popup
      if (window.opener && window.opener !== window) {
        window.opener.postMessage(
          {
            type: "OAUTH_ERROR",
            error: { error: errorMsg },
          },
          window.location.origin
        );
        window.close();
        return;
      }

      throw new Error(errorMsg);
    }

    if (!code) {
      throw new Error("No authorization code received");
    }

    console.log(
      "Browser OAuth: Processing callback with code:",
      code.substring(0, 10) + "..."
    );

    // Exchange code for token immediately
    const result = await exchangeCodeForToken(code);

    if (result.success) {
      console.log("Browser OAuth: Token exchange successful");

      // Notify parent window if this is a popup
      if (window.opener && window.opener !== window) {
        window.opener.postMessage(
          {
            type: "OAUTH_SUCCESS",
            tokenData: result.data,
          },
          window.location.origin
        );
        window.close();
        return result;
      }

      return result;
    } else {
      throw new Error("Token exchange failed");
    }
  } catch (error) {
    console.error("Browser OAuth: Callback processing failed:", error);

    // Notify parent window if this is a popup
    if (window.opener && window.opener !== window) {
      window.opener.postMessage(
        {
          type: "OAUTH_ERROR",
          error: { error: error.message },
        },
        window.location.origin
      );
      window.close();
      return;
    }

    throw error;
  }
}

/**
 * Refresh OAuth token
 */
export async function refreshToken() {
  try {
    const authData = browserStorage.get("salesforceAuth");

    if (!authData || !authData.refreshToken) {
      throw new Error("No refresh token available");
    }

    const apiBaseUrl = getApiBaseUrl();
    const refreshUrl = `${apiBaseUrl}/api/v1/oauth/refresh`;

    console.log("Browser OAuth: Refresh token URL:", refreshUrl);

    const response = await fetch(refreshUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh_token: authData.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error("Token refresh failed");
    }

    const tokenData = await response.json();

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
    console.error("Browser OAuth: Token refresh failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Logout and clear tokens
 */
export function logout() {
  browserStorage.delete("salesforceAuth");
  browserStorage.delete("oauth_code_verifier");
  oauthState = {
    popup: null,
    isProcessing: false,
    codeVerifier: null,
    config: null,
  };
}
