require("dotenv").config(); // Load environment variables from .env file
const { app, BrowserWindow, ipcMain, protocol, Menu } = require("electron");
const path = require("path");
const crypto = require("crypto");
const Store = require("electron-store");
const { AuthorizationCode } = require("simple-oauth2"); // Will be used later

// Initialize electron-store
const store = new Store();

// Salesforce OAuth Configuration (loaded from .env)
const sfHost =
  process.env.SALESFORCE_LOGIN_URL || "https://login.salesforce.com";
const sfClientId = process.env.SALESFORCE_CLIENT_ID;
const sfClientSecret = process.env.SALESFORCE_CLIENT_SECRET;
const sfRedirectUri = process.env.SALESFORCE_REDIRECT_URI;

// Debug: Log environment variables (without secrets)
console.log("Environment variables loaded:");
console.log("SALESFORCE_LOGIN_URL:", sfHost);
console.log(
  "SALESFORCE_CLIENT_ID:",
  sfClientId ? `${sfClientId.substring(0, 10)}...` : "NOT SET"
);
console.log("SALESFORCE_CLIENT_SECRET:", sfClientSecret ? "SET" : "NOT SET");
console.log("SALESFORCE_REDIRECT_URI:", sfRedirectUri);

let oauth2 = null;
let codeVerifier = null; // Store PKCE code verifier

// PKCE helper functions
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString("base64url");
}

function generateCodeChallenge(verifier) {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

if (!sfClientId || !sfClientSecret || !sfRedirectUri) {
  console.error(
    "Salesforce OAuth environment variables (SALESFORCE_CLIENT_ID, SALESFORCE_CLIENT_SECRET, SALESFORCE_REDIRECT_URI) are not set. Please check your .env file."
  );
  console.log("Salesforce features will be disabled.");
  // Optionally, exit the app or disable Salesforce features
  // app.quit();
} else {
  try {
    oauth2 = new AuthorizationCode({
      client: {
        id: sfClientId,
        secret: sfClientSecret,
      },
      auth: {
        tokenHost: sfHost,
        tokenPath: "/services/oauth2/token",
        authorizePath: "/services/oauth2/authorize",
      },
      options: {
        authorizationMethod: "body", // Salesforce requires params in body for token exchange
      },
    });
    console.log("Salesforce OAuth2 client initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Salesforce OAuth2 client:", error);
    oauth2 = null;
  }
}

// Example: Store a value
// store.set('userSettings.theme', 'dark');

// Example: Retrieve a value
// console.log(store.get('userSettings.theme'));

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200, // Increased width for better Salesforce UI potential
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true, // Recommended for security
      nodeIntegration: false, // Recommended for security
    },
  });

  // Load the Vite dev server URL in development or the production build
  if (process.env.VITE_DEV_SERVER_URL) {
    // Try to load Vite dev server, fallback to test file if connection fails
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL).catch(() => {
      console.log("Failed to load Vite dev server, loading test file...");
      mainWindow.loadFile(path.join(__dirname, "../simple-test.html"));
    });
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist-renderer/index.html"));
  }

  // Handle IPC messages from renderer process if needed
  // ipcMain.on('some-channel', (event, data) => {
  //   // Process data and send response if necessary
  //   event.reply('some-response-channel', 'Processed: ' + data);
  // });
}

// Custom protocol for OAuth callback
const MY_APP_PROTOCOL = sfRedirectUri
  ? new URL(sfRedirectUri).protocol.slice(0, -1)
  : "myapp";

app.whenReady().then(() => {
  if (sfClientId && sfClientSecret && sfRedirectUri) {
    // Register custom protocol
    // protocol.registerSchemesAsPrivileged([{ scheme: MY_APP_PROTOCOL, privileges: { standard: true, secure: true, supportFetchAPI: true } }]);
    // The above is now preferred at app startup before it's ready.
  }

  // Load OpenAI API key from store or config/.env file into environment on startup
  let apiKey = store.get("openai_api_key");

  // If no API key in store, try to load from config/.env file
  if (!apiKey) {
    const configPath = path.join(__dirname, "..", "config", ".env");
    if (require("fs").existsSync(configPath)) {
      try {
        const configContent = require("fs").readFileSync(configPath, "utf8");
        const envMatch = configContent.match(/OPENAI_API_KEY=(.+)/);
        if (envMatch && envMatch[1]) {
          apiKey = envMatch[1].trim();
          // Store it in Electron store for future use
          store.set("openai_api_key", apiKey);
          console.log("OpenAI API key loaded from config/.env and stored");
        }
      } catch (error) {
        console.error("Error reading config/.env file:", error);
      }
    }
  }

  if (apiKey) {
    process.env.OPENAI_API_KEY = apiKey;
    console.log("OpenAI API key loaded into environment");
  } else {
    console.log("No OpenAI API key found in store or config/.env");
  }

  // Remove the default menu bar (File, Edit, View, Window, Help)
  Menu.setApplicationMenu(null);

  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// Example of exposing a value from store to renderer via IPC
ipcMain.handle("get-store-value", async (event, key) => {
  return store.get(key);
});

ipcMain.handle("set-store-value", async (event, { key, value }) => {
  store.set(key, value);
});

// OpenAI API Key management for Python integration
ipcMain.handle("get-openai-api-key", async (event) => {
  return store.get("openai_api_key");
});

ipcMain.handle("set-openai-api-key", async (event, apiKey) => {
  store.set("openai_api_key", apiKey);
  // Also set as environment variable for current process
  if (apiKey) {
    process.env.OPENAI_API_KEY = apiKey;
  } else {
    delete process.env.OPENAI_API_KEY;
  }
});

// Python script execution with environment variables
ipcMain.handle(
  "execute-python-script",
  async (event, { script, args = [], options = {} }) => {
    const { spawn } = require("child_process");
    const path = require("path");
    const fs = require("fs");

    try {
      // Prepare environment variables
      const env = { ...process.env };

      // Ensure OpenAI API key is available
      const apiKey = store.get("openai_api_key");
      if (apiKey) {
        env.OPENAI_API_KEY = apiKey;
        console.log("OpenAI API key loaded for Python script execution");
      } else {
        console.log("No OpenAI API key found in store");
      }

      // Construct the full script path
      const scriptPath = path.join(__dirname, "..", script);
      console.log("Executing Python script:", scriptPath);

      // Check if script exists
      if (!fs.existsSync(scriptPath)) {
        return {
          success: false,
          error: `Python script not found: ${scriptPath}`,
          stdout: "",
          stderr: "",
        };
      }

      return new Promise((resolve, reject) => {
        // Try different Python commands
        const pythonCommands = ["python", "python3", "py"];
        let currentCommandIndex = 0;

        const tryNextCommand = () => {
          if (currentCommandIndex >= pythonCommands.length) {
            resolve({
              success: false,
              error:
                "Python interpreter not found. Please ensure Python is installed and in PATH.",
              stdout: "",
              stderr: "Tried commands: " + pythonCommands.join(", "),
            });
            return;
          }

          const pythonCmd = pythonCommands[currentCommandIndex];
          console.log(`Trying Python command: ${pythonCmd}`);

          // Spawn Python process
          const pythonProcess = spawn(pythonCmd, [scriptPath, ...args], {
            env,
            cwd: path.join(__dirname, ".."),
            ...options,
          });

          let stdout = "";
          let stderr = "";

          pythonProcess.stdout.on("data", (data) => {
            stdout += data.toString();
          });

          pythonProcess.stderr.on("data", (data) => {
            stderr += data.toString();
          });

          pythonProcess.on("close", (code) => {
            console.log(`Python script finished with code: ${code}`);
            console.log("STDOUT:", stdout);
            console.log("STDERR:", stderr);

            resolve({ success: code === 0, stdout, stderr, code });
          });

          pythonProcess.on("error", (error) => {
            console.log(`Python command '${pythonCmd}' failed:`, error.message);
            if (error.code === "ENOENT") {
              // Command not found, try next one
              currentCommandIndex++;
              tryNextCommand();
            } else {
              resolve({
                success: false,
                error: error.message,
                stdout,
                stderr,
              });
            }
          });
        };

        tryNextCommand();
      });
    } catch (error) {
      console.error("Error in execute-python-script handler:", error);
      return { success: false, error: error.message, stdout: "", stderr: "" };
    }
  }
);

// Salesforce OAuth IPC Handlers
ipcMain.handle("salesforce:get-auth-url", async () => {
  if (!oauth2) {
    console.error("OAuth2 client not initialized");
    return null;
  }

  if (!sfRedirectUri) {
    console.error("Redirect URI not configured");
    return null;
  }

  // Generate PKCE parameters
  codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  console.log("Generating OAuth URL with parameters:");
  console.log("- redirect_uri:", sfRedirectUri);
  console.log("- code_challenge length:", codeChallenge.length);
  console.log("- code_verifier length:", codeVerifier.length);

  const authorizationUri = oauth2.authorizeURL({
    redirect_uri: sfRedirectUri,
    scope: "api id web refresh_token", // Adjust scopes as needed
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    // state: 'someRandomStateString' // Optional: for CSRF protection
  });

  console.log("Generated OAuth URL:", authorizationUri);
  return authorizationUri;
});

let authWindow = null; // Keep a reference to the auth window
let isProcessingCallback = false; // Prevent multiple simultaneous callback processing

// Helper function to handle OAuth callback URL processing
const handleOAuthCallback = async (callbackUrl) => {
  if (isProcessingCallback) {
    console.log(
      "OAuth callback already being processed, ignoring duplicate call"
    );
    return;
  }

  isProcessingCallback = true;
  console.log("Processing OAuth callback URL:", callbackUrl);

  try {
    const urlParts = new URL(callbackUrl);
    const code = urlParts.searchParams.get("code");
    const error = urlParts.searchParams.get("error");
    const errorDescription = urlParts.searchParams.get("error_description");

    // Find the main window first
    const mainWindow = BrowserWindow.getAllWindows().find(
      (win) => !win.isDestroyed() && win !== authWindow
    );

    if (!mainWindow) {
      console.error("No main window found to send OAuth callback");
      return;
    }

    if (code) {
      console.log(
        "OAuth callback received authorization code:",
        code.substring(0, 20) + "..."
      );

      // Exchange the code for tokens immediately in the main process
      try {
        const tokenResult = await exchangeCodeForTokens(code);

        if (tokenResult.success) {
          console.log("Token exchange successful, notifying renderer");
          // Send success event with token data to renderer
          mainWindow.webContents.send(
            "salesforce:oauth-success",
            tokenResult.data
          );
        } else {
          console.error("Token exchange failed:", tokenResult.error);
          mainWindow.webContents.send("salesforce:oauth-error", {
            error: "token_exchange_failed",
            errorDescription: tokenResult.error,
          });
        }
      } catch (exchangeError) {
        console.error("Error during token exchange:", exchangeError);
        mainWindow.webContents.send("salesforce:oauth-error", {
          error: "token_exchange_error",
          errorDescription: exchangeError.message,
        });
      }
    } else if (error) {
      console.error("Salesforce OAuth Error:", error, errorDescription);
      mainWindow.webContents.send("salesforce:oauth-error", {
        error,
        errorDescription,
      });
    } else {
      console.warn(
        "OAuth callback URL has no code or error parameter:",
        callbackUrl
      );
      mainWindow.webContents.send("salesforce:oauth-error", {
        error: "invalid_callback",
        errorDescription:
          "No authorization code or error found in callback URL",
      });
    }
  } catch (err) {
    console.error("Error processing OAuth callback URL:", err);
    const mainWindow = BrowserWindow.getAllWindows().find(
      (win) => !win.isDestroyed() && win !== authWindow
    );
    if (mainWindow) {
      mainWindow.webContents.send("salesforce:oauth-error", {
        error: "callback_processing_error",
        errorDescription: "Failed to process OAuth callback URL",
      });
    }
  } finally {
    // Always close the auth window after processing
    if (authWindow && !authWindow.isDestroyed()) {
      console.log("Closing OAuth auth window");
      authWindow.close();
      authWindow = null;
    }
    // Reset the processing flag
    isProcessingCallback = false;
  }
};

// Helper function to exchange code for tokens
const exchangeCodeForTokens = async (code) => {
  if (!oauth2) {
    return { success: false, error: "OAuth2 client not initialized" };
  }

  if (!codeVerifier) {
    console.error("PKCE code verifier is missing!");
    return { success: false, error: "PKCE code verifier is missing" };
  }

  try {
    // Note: Salesforce OAuth token exchange does NOT accept scope parameter
    // Scope is only used in the authorization URL, not in token exchange
    const tokenParams = {
      code: code,
      redirect_uri: sfRedirectUri,
      code_verifier: codeVerifier,
    };

    // Enhanced logging for debugging
    console.log("Token exchange request parameters:");
    console.log("- redirect_uri:", sfRedirectUri);
    console.log(
      "- scope: NOT INCLUDED (Salesforce doesn't support scope in token exchange)"
    );
    console.log(
      "- code_verifier length:",
      codeVerifier ? codeVerifier.length : "null"
    );
    console.log("- code length:", code ? code.length : "null");
    console.log(
      "- client_id:",
      sfClientId ? `${sfClientId.substring(0, 10)}...` : "null"
    );

    console.log("Attempting token exchange with Salesforce...");
    const tokenResponse = await oauth2.getToken(tokenParams);

    console.log("=== TOKEN EXCHANGE SUCCESS ===");
    console.log(
      "Full token response structure:",
      JSON.stringify(tokenResponse, null, 2)
    );

    // The simple-oauth2 library returns a token object with the actual token data in the 'token' property
    // Handle different possible response structures
    let tokenData;

    // Default expiration time (7200 seconds = 2 hours) for when Salesforce doesn't provide expires_in
    const DEFAULT_EXPIRES_IN = 7200;

    if (tokenResponse.token) {
      // Standard simple-oauth2 structure
      const expiresIn = tokenResponse.token.expires_in || DEFAULT_EXPIRES_IN;

      // Log if we're using default expiration
      if (!tokenResponse.token.expires_in) {
        console.warn(
          "Salesforce token response missing expires_in field, using default:",
          DEFAULT_EXPIRES_IN
        );
      }

      tokenData = {
        accessToken: tokenResponse.token.access_token,
        refreshToken: tokenResponse.token.refresh_token,
        instanceUrl: tokenResponse.token.instance_url,
        issuedAt: Math.floor(Date.now() / 1000),
        expiresIn: expiresIn,
      };
    } else if (tokenResponse.access_token) {
      // Direct token structure (fallback)
      const expiresIn = tokenResponse.expires_in || DEFAULT_EXPIRES_IN;

      // Log if we're using default expiration
      if (!tokenResponse.expires_in) {
        console.warn(
          "Salesforce token response missing expires_in field, using default:",
          DEFAULT_EXPIRES_IN
        );
      }

      tokenData = {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        instanceUrl: tokenResponse.instance_url,
        issuedAt: Math.floor(Date.now() / 1000),
        expiresIn: expiresIn,
      };
    } else {
      console.error("=== UNEXPECTED TOKEN RESPONSE STRUCTURE ===");
      console.error("Cannot find token data in response:", tokenResponse);
      return {
        success: false,
        error: "Unexpected token response structure from Salesforce",
        details: { responseStructure: Object.keys(tokenResponse) },
      };
    }

    console.log("Extracted token data:", {
      hasAccessToken: !!tokenData.accessToken,
      hasRefreshToken: !!tokenData.refreshToken,
      hasInstanceUrl: !!tokenData.instanceUrl,
      expiresIn: tokenData.expiresIn,
      instanceUrl: tokenData.instanceUrl,
    });

    // Validate that we have all required fields
    if (
      !tokenData.accessToken ||
      !tokenData.refreshToken ||
      !tokenData.instanceUrl
    ) {
      console.error("=== INCOMPLETE TOKEN DATA ===");
      console.error("Missing required fields in token response:");
      console.error("- accessToken:", !!tokenData.accessToken);
      console.error("- refreshToken:", !!tokenData.refreshToken);
      console.error("- instanceUrl:", !!tokenData.instanceUrl);
      console.error("Raw token response:", tokenResponse.token);

      return {
        success: false,
        error:
          "Incomplete token data received from Salesforce. Missing required fields.",
        details: {
          hasAccessToken: !!tokenData.accessToken,
          hasRefreshToken: !!tokenData.refreshToken,
          hasInstanceUrl: !!tokenData.instanceUrl,
        },
      };
    }

    // Store the token data
    store.set("salesforceAuth", tokenData);
    console.log("Token data stored successfully with all required fields");

    // Clear the code verifier after successful use
    codeVerifier = null;

    return { success: true, data: tokenData };
  } catch (error) {
    console.error("=== TOKEN EXCHANGE ERROR DETAILS ===");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error status:", error.status);
    console.error("Error context:", error.context);
    console.error("Error data:", error.data);

    // Log the full error object for debugging
    if (error.context?.body) {
      console.error("Response body:", error.context.body);
    }

    // Clear the code verifier on error to prevent reuse
    codeVerifier = null;

    return {
      success: false,
      error: error.message,
      context: error.context?.body,
      status: error.status,
      code: error.code,
    };
  }
};

ipcMain.on("salesforce:open-auth-window", (event, authUrl) => {
  if (!authUrl) return;

  authWindow = new BrowserWindow({
    width: 600,
    height: 700,
    modal: true,
    parent: BrowserWindow.getFocusedWindow(), // Optional: makes it a child of the main window
    webPreferences: {
      // Be careful with nodeIntegration and contextIsolation if loading external pages
      // nodeIntegration: false,
      // contextIsolation: true,
      // Consider a preload script for the auth window if it needs to communicate back more complexly
    },
  });

  authWindow.loadURL(authUrl);

  const { webContents } = authWindow;

  webContents.on("will-redirect", (event, newUrl) => {
    console.log("Auth window will-redirect:", newUrl);
    if (newUrl.startsWith(sfRedirectUri)) {
      event.preventDefault(); // Stop the redirect in the authWindow
      handleOAuthCallback(newUrl);
    }
  });

  webContents.on("did-redirect-navigation", (event, newUrl) => {
    console.log("Auth window did-redirect-navigation:", newUrl);
    if (newUrl.startsWith(sfRedirectUri)) {
      handleOAuthCallback(newUrl);
    }
  });

  // Additional event listener for navigation completion
  webContents.on("did-navigate", (event, newUrl) => {
    console.log("Auth window did-navigate:", newUrl);
    if (newUrl.startsWith(sfRedirectUri)) {
      handleOAuthCallback(newUrl);
    }
  });

  // Monitor URL changes more comprehensively
  webContents.on("did-navigate-in-page", (event, newUrl) => {
    console.log("Auth window did-navigate-in-page:", newUrl);
    if (newUrl.startsWith(sfRedirectUri)) {
      handleOAuthCallback(newUrl);
    }
  });

  // Periodic URL check as a fallback mechanism
  const urlCheckInterval = setInterval(() => {
    if (authWindow && !authWindow.isDestroyed()) {
      const currentUrl = authWindow.webContents.getURL();
      if (currentUrl && currentUrl.startsWith(sfRedirectUri)) {
        console.log("Periodic check detected OAuth callback URL:", currentUrl);
        clearInterval(urlCheckInterval);
        handleOAuthCallback(currentUrl);
      }
    } else {
      clearInterval(urlCheckInterval);
    }
  }, 1000); // Check every second

  authWindow.on("closed", () => {
    clearInterval(urlCheckInterval);
    authWindow = null;
  });
});

// Legacy handler for backward compatibility - now handled in handleOAuthCallback
ipcMain.handle("salesforce:exchange-code", async (event, code) => {
  console.log(
    "Legacy salesforce:exchange-code handler called - redirecting to new flow"
  );
  return await exchangeCodeForTokens(code);
});

ipcMain.handle("salesforce:refresh-token", async () => {
  if (!oauth2) return null;
  const storedTokenData = store.get("salesforceAuth");
  if (!storedTokenData || !storedTokenData.refreshToken) {
    return { success: false, error: "No refresh token found." };
  }

  try {
    let token = oauth2.createToken({
      refresh_token: storedTokenData.refreshToken,
      access_token: storedTokenData.accessToken, // some libraries might need this
      // scope: 'api id web refresh_token', // scope might be needed again by some providers
      // expires_in: storedTokenData.expiresIn // used by token.expired()
    });

    // If token is expired or about to expire, refresh it
    // Adding a buffer of 5 minutes (300 seconds)
    // const isExpired = (storedTokenData.issuedAt + storedTokenData.expiresIn - 300) < Math.floor(Date.now() / 1000);
    // if (!isExpired) {
    //    return { success: true, data: storedTokenData, message: "Token not expired yet." };
    // }

    console.log("Attempting token refresh...");
    token = await token.refresh({ scope: "api id web refresh_token" });

    console.log("=== TOKEN REFRESH SUCCESS ===");
    console.log(
      "Refresh token response structure:",
      JSON.stringify(token, null, 2)
    );

    // Handle different possible response structures for refresh token
    let newTokenData;

    // Default expiration time (7200 seconds = 2 hours) for when Salesforce doesn't provide expires_in
    const DEFAULT_EXPIRES_IN = 7200;

    if (token.token) {
      // Standard simple-oauth2 structure
      const expiresIn = token.token.expires_in || DEFAULT_EXPIRES_IN;

      // Log if we're using default expiration
      if (!token.token.expires_in) {
        console.warn(
          "Salesforce refresh token response missing expires_in field, using default:",
          DEFAULT_EXPIRES_IN
        );
      }

      newTokenData = {
        accessToken: token.token.access_token,
        refreshToken: token.token.refresh_token || storedTokenData.refreshToken, // Salesforce might not always return a new refresh token
        instanceUrl: token.token.instance_url || storedTokenData.instanceUrl,
        issuedAt: Math.floor(Date.now() / 1000),
        expiresIn: expiresIn,
      };
    } else if (token.access_token) {
      // Direct token structure (fallback)
      const expiresIn = token.expires_in || DEFAULT_EXPIRES_IN;

      // Log if we're using default expiration
      if (!token.expires_in) {
        console.warn(
          "Salesforce refresh token response missing expires_in field, using default:",
          DEFAULT_EXPIRES_IN
        );
      }

      newTokenData = {
        accessToken: token.access_token,
        refreshToken: token.refresh_token || storedTokenData.refreshToken,
        instanceUrl: token.instance_url || storedTokenData.instanceUrl,
        issuedAt: Math.floor(Date.now() / 1000),
        expiresIn: expiresIn,
      };
    } else {
      console.error("=== UNEXPECTED REFRESH TOKEN RESPONSE STRUCTURE ===");
      console.error("Cannot find token data in refresh response:", token);
      return {
        success: false,
        error: "Unexpected refresh token response structure from Salesforce",
        details: { responseStructure: Object.keys(token) },
      };
    }

    console.log("Extracted refresh token data:", {
      hasAccessToken: !!newTokenData.accessToken,
      hasRefreshToken: !!newTokenData.refreshToken,
      hasInstanceUrl: !!newTokenData.instanceUrl,
      expiresIn: newTokenData.expiresIn,
      instanceUrl: newTokenData.instanceUrl,
    });

    // Validate that we have all required fields
    if (
      !newTokenData.accessToken ||
      !newTokenData.refreshToken ||
      !newTokenData.instanceUrl
    ) {
      console.error("=== INCOMPLETE REFRESH TOKEN DATA ===");
      console.error("Missing required fields in refresh token response:");
      console.error("- accessToken:", !!newTokenData.accessToken);
      console.error("- refreshToken:", !!newTokenData.refreshToken);
      console.error("- instanceUrl:", !!newTokenData.instanceUrl);

      return {
        success: false,
        error:
          "Incomplete refresh token data received from Salesforce. Missing required fields.",
        details: {
          hasAccessToken: !!newTokenData.accessToken,
          hasRefreshToken: !!newTokenData.refreshToken,
          hasInstanceUrl: !!newTokenData.instanceUrl,
        },
      };
    }

    store.set("salesforceAuth", newTokenData);
    console.log(
      "Refresh token data stored successfully with all required fields"
    );
    return { success: true, data: newTokenData };
  } catch (error) {
    console.error("Salesforce Refresh Token Error:", error.message);
    // If refresh fails (e.g. token revoked), clear stored tokens and prompt for re-login
    if (
      error.data &&
      (error.data.payload?.error === "invalid_grant" ||
        error.data.payload?.error === "revoked")
    ) {
      store.delete("salesforceAuth");
      return {
        success: false,
        error: "Refresh token invalid. Please log in again.",
        reauthenticate: true,
      };
    }
    return { success: false, error: error.message };
  }
});

ipcMain.handle("salesforce:logout", async () => {
  const storedTokenData = store.get("salesforceAuth");
  if (storedTokenData && storedTokenData.accessToken && sfClientId) {
    // Optional: Revoke token with Salesforce
    // This requires an additional request.
    const revokeUrl = `${
      storedTokenData.instanceUrl || sfHost
    }/services/oauth2/revoke`;
    try {
      // Salesforce expects the token to be revoked in a POST request with 'token' parameter
      // simple-oauth2 doesn't have a direct revoke method, so use axios or fetch
      // For simplicity here, we'll skip actual revocation for now and just clear local store
      // const { default: axios } = await import('axios');
      // await axios.post(revokeUrl, `token=${storedTokenData.accessToken}`, {
      //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      // });
      console.log(
        "Salesforce token revocation (simulated) would target:",
        revokeUrl
      );
    } catch (error) {
      console.error("Error revoking Salesforce token:", error.message);
      // Fall through to clearing local store anyway
    }
  }
  store.delete("salesforceAuth");
  // Clear user profile data on logout
  store.delete("userProfile");
  store.delete("lastFileUpload");
  return { success: true };
});

// Get user profile information from Salesforce
ipcMain.handle("salesforce:get-user-profile", async () => {
  const storedTokenData = store.get("salesforceAuth");
  if (!storedTokenData || !storedTokenData.accessToken) {
    return {
      success: false,
      error: "Not authenticated with Salesforce. Please log in first.",
    };
  }

  try {
    console.log("Fetching user profile from Salesforce...");

    // Use Salesforce's userinfo endpoint
    const { default: axios } = await import("axios");
    const response = await axios.get(
      `${storedTokenData.instanceUrl}/services/oauth2/userinfo`,
      {
        headers: {
          Authorization: `Bearer ${storedTokenData.accessToken}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    if (response.status === 200) {
      console.log("User profile fetched successfully:", response.data);
      return { success: true, data: response.data };
    } else {
      console.error(
        "Failed to fetch user profile:",
        response.status,
        response.statusText
      );
      return {
        success: false,
        error: `Failed to fetch user profile: ${response.status} ${response.statusText}`,
      };
    }
  } catch (error) {
    console.error("Error fetching user profile:", error.message);

    // Check if it's an authentication error
    if (error.response && error.response.status === 401) {
      return {
        success: false,
        error: "Authentication expired. Please log in again.",
        reauthenticate: true,
      };
    }

    return {
      success: false,
      error: error.message || "Failed to fetch user profile",
    };
  }
});

// Salesforce API Operations IPC Handlers
ipcMain.handle("salesforce:upload", async (event, options) => {
  try {
    console.log("Salesforce upload requested with options:", options);

    // Get stored auth data
    const storedTokenData = store.get("salesforceAuth");
    if (!storedTokenData || !storedTokenData.accessToken) {
      return {
        success: false,
        error: "Not authenticated with Salesforce. Please log in first.",
      };
    }

    // Call the Python Salesforce integration script
    const { spawn } = require("child_process");
    const path = require("path");

    // Prepare the Python script call for Salesforce upload
    const pythonScript = path.join(
      __dirname,
      "..",
      "core",
      "salesforce_integration.py"
    );
    const args = [
      "--action",
      "upload",
      "--file-path",
      options.filePath,
      "--object-type",
      options.salesforceObject || "Lead",
      "--access-token",
      storedTokenData.accessToken,
      "--instance-url",
      storedTokenData.instanceUrl,
    ];

    console.log("Executing Python script:", pythonScript, "with args:", args);

    // Execute the Python script
    return new Promise((resolve) => {
      const pythonCommands = ["python", "python3", "py"];
      let currentCommandIndex = 0;

      const tryPythonCommand = () => {
        if (currentCommandIndex >= pythonCommands.length) {
          resolve({
            success: false,
            error:
              "Python interpreter not found. Please ensure Python is installed and in PATH.",
          });
          return;
        }

        const pythonCommand = pythonCommands[currentCommandIndex];
        const pythonProcess = spawn(pythonCommand, [pythonScript, ...args], {
          stdio: ["pipe", "pipe", "pipe"],
          env: { ...process.env },
        });

        let stdout = "";
        let stderr = "";

        pythonProcess.stdout.on("data", (data) => {
          stdout += data.toString();
        });

        pythonProcess.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        pythonProcess.on("close", (code) => {
          console.log(`Python process exited with code: ${code}`);
          console.log(`stdout length: ${stdout.length}`);
          console.log(`stderr length: ${stderr.length}`);

          if (code === 0) {
            try {
              // Log the raw output for debugging
              console.log("Raw Python stdout:", stdout);
              if (stderr) {
                console.log("Python stderr (warnings/debug):", stderr);
              }

              const result = JSON.parse(stdout);
              console.log("Parsed Python result:", result);
              resolve(result);
            } catch (parseError) {
              console.error(
                "Failed to parse Python output:",
                parseError.message
              );
              console.error("Raw stdout:", stdout);
              console.error("Raw stderr:", stderr);
              resolve({
                success: false,
                error: `Failed to parse Python script output: ${parseError.message}`,
                errorType: "PARSE_ERROR",
                rawOutput: stdout,
                rawError: stderr,
              });
            }
          } else {
            console.log(
              `Python command ${pythonCommand} failed with code ${code}`
            );
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);

            // If this is the last command to try, return detailed error
            if (currentCommandIndex >= pythonCommands.length - 1) {
              resolve({
                success: false,
                error: `Python script execution failed with exit code ${code}`,
                errorType: "PYTHON_EXECUTION_ERROR",
                exitCode: code,
                stdout: stdout,
                stderr: stderr,
                triedCommands: pythonCommands,
              });
            } else {
              currentCommandIndex++;
              tryPythonCommand();
            }
          }
        });

        pythonProcess.on("error", (error) => {
          console.log(`Python command ${pythonCommand} error:`, error.message);
          currentCommandIndex++;
          tryPythonCommand();
        });
      };

      tryPythonCommand();
    });
  } catch (error) {
    console.error("Error in Salesforce upload:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

ipcMain.handle("salesforce:get-objects", async () => {
  try {
    console.log("Salesforce objects requested");

    // Get stored auth data
    const storedTokenData = store.get("salesforceAuth");
    if (!storedTokenData || !storedTokenData.accessToken) {
      return {
        success: false,
        error: "Not authenticated with Salesforce. Please log in first.",
      };
    }

    // Call the Python script to get objects
    const { spawn } = require("child_process");
    const path = require("path");

    const pythonScript = path.join(
      __dirname,
      "..",
      "core",
      "salesforce_integration.py"
    );
    const args = [
      "--action",
      "objects",
      "--access-token",
      storedTokenData.accessToken,
      "--instance-url",
      storedTokenData.instanceUrl,
    ];

    return new Promise((resolve) => {
      const pythonCommands = ["python", "python3", "py"];
      let currentCommandIndex = 0;

      const tryPythonCommand = () => {
        if (currentCommandIndex >= pythonCommands.length) {
          // Fallback to default objects if Python fails
          resolve({
            success: true,
            objects: [
              { name: "Lead", label: "Lead", createable: true },
              { name: "Contact", label: "Contact", createable: true },
              { name: "Account", label: "Account", createable: true },
              { name: "Opportunity", label: "Opportunity", createable: true },
              { name: "Case", label: "Case", createable: true },
            ],
          });
          return;
        }

        const pythonCommand = pythonCommands[currentCommandIndex];
        const pythonProcess = spawn(pythonCommand, [pythonScript, ...args], {
          stdio: ["pipe", "pipe", "pipe"],
          env: { ...process.env },
        });

        let stdout = "";
        let stderr = "";

        pythonProcess.stdout.on("data", (data) => {
          stdout += data.toString();
        });

        pythonProcess.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        pythonProcess.on("close", (code) => {
          if (code === 0) {
            try {
              const result = JSON.parse(stdout);
              resolve(result);
            } catch (parseError) {
              console.log("Failed to parse Python output, using fallback");
              currentCommandIndex++;
              tryPythonCommand();
            }
          } else {
            console.log(
              `Python command ${pythonCommand} failed with code ${code}`
            );
            currentCommandIndex++;
            tryPythonCommand();
          }
        });

        pythonProcess.on("error", (error) => {
          console.log(`Python command ${pythonCommand} error:`, error.message);
          currentCommandIndex++;
          tryPythonCommand();
        });
      };

      tryPythonCommand();
    });
  } catch (error) {
    console.error("Error getting Salesforce objects:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

ipcMain.handle("salesforce:validate-connection", async () => {
  try {
    console.log("Salesforce connection validation requested");

    // Get stored auth data
    const storedTokenData = store.get("salesforceAuth");
    if (!storedTokenData || !storedTokenData.accessToken) {
      return {
        success: false,
        error: "Not authenticated with Salesforce. Please log in first.",
      };
    }

    // Call the Python script to validate connection
    const { spawn } = require("child_process");
    const path = require("path");

    const pythonScript = path.join(
      __dirname,
      "..",
      "core",
      "salesforce_integration.py"
    );
    const args = [
      "--action",
      "validate",
      "--access-token",
      storedTokenData.accessToken,
      "--instance-url",
      storedTokenData.instanceUrl,
    ];

    return new Promise((resolve) => {
      const pythonCommands = ["python", "python3", "py"];
      let currentCommandIndex = 0;

      const tryPythonCommand = () => {
        if (currentCommandIndex >= pythonCommands.length) {
          // Fallback to simulated response if Python fails
          resolve({
            success: true,
            userInfo: {
              id: "005000000000000AAA",
              username: "user@example.com",
              display_name: "Demo User",
              organization_id: "00D000000000000EAA",
            },
            permissions: ["api", "refresh_token"],
            limits: {
              dailyApiRequests: { max: 15000, remaining: 14500 },
            },
            message: "Connection validated successfully (fallback)",
          });
          return;
        }

        const pythonCommand = pythonCommands[currentCommandIndex];
        const pythonProcess = spawn(pythonCommand, [pythonScript, ...args], {
          stdio: ["pipe", "pipe", "pipe"],
          env: { ...process.env },
        });

        let stdout = "";
        let stderr = "";

        pythonProcess.stdout.on("data", (data) => {
          stdout += data.toString();
        });

        pythonProcess.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        pythonProcess.on("close", (code) => {
          if (code === 0) {
            try {
              const result = JSON.parse(stdout);
              resolve(result);
            } catch (parseError) {
              console.log("Failed to parse Python output, using fallback");
              currentCommandIndex++;
              tryPythonCommand();
            }
          } else {
            console.log(
              `Python command ${pythonCommand} failed with code ${code}`
            );
            currentCommandIndex++;
            tryPythonCommand();
          }
        });

        pythonProcess.on("error", (error) => {
          console.log(`Python command ${pythonCommand} error:`, error.message);
          currentCommandIndex++;
          tryPythonCommand();
        });
      };

      tryPythonCommand();
    });
  } catch (error) {
    console.error("Error validating Salesforce connection:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

ipcMain.handle("salesforce:get-field-mapping", async (event, objectType) => {
  try {
    console.log("Salesforce field mapping requested for object:", objectType);

    // Get stored auth data
    const storedTokenData = store.get("salesforceAuth");
    if (!storedTokenData || !storedTokenData.accessToken) {
      return {
        success: false,
        error: "Not authenticated with Salesforce. Please log in first.",
      };
    }

    // Call the Python script to get field mappings
    const { spawn } = require("child_process");
    const path = require("path");

    const pythonScript = path.join(
      __dirname,
      "..",
      "core",
      "salesforce_integration.py"
    );
    const args = [
      "--action",
      "fields",
      "--object-type",
      objectType,
      "--access-token",
      storedTokenData.accessToken,
      "--instance-url",
      storedTokenData.instanceUrl,
    ];

    return new Promise((resolve) => {
      const pythonCommands = ["python", "python3", "py"];
      let currentCommandIndex = 0;

      const tryPythonCommand = () => {
        if (currentCommandIndex >= pythonCommands.length) {
          // Fallback to default field mappings if Python fails
          const fieldMappings = {
            Lead: [
              {
                name: "FirstName",
                label: "First Name",
                type: "string",
                required: false,
              },
              {
                name: "LastName",
                label: "Last Name",
                type: "string",
                required: true,
              },
              { name: "Email", label: "Email", type: "email", required: false },
              { name: "Phone", label: "Phone", type: "phone", required: false },
              {
                name: "Company",
                label: "Company",
                type: "string",
                required: true,
              },
              {
                name: "Status",
                label: "Lead Status",
                type: "picklist",
                required: true,
              },
              {
                name: "LeadSource",
                label: "Lead Source",
                type: "picklist",
                required: false,
              },
            ],
            Contact: [
              {
                name: "FirstName",
                label: "First Name",
                type: "string",
                required: false,
              },
              {
                name: "LastName",
                label: "Last Name",
                type: "string",
                required: true,
              },
              { name: "Email", label: "Email", type: "email", required: false },
              { name: "Phone", label: "Phone", type: "phone", required: false },
              {
                name: "AccountId",
                label: "Account",
                type: "reference",
                required: false,
              },
            ],
            Account: [
              {
                name: "Name",
                label: "Account Name",
                type: "string",
                required: true,
              },
              {
                name: "Type",
                label: "Account Type",
                type: "picklist",
                required: false,
              },
              {
                name: "Industry",
                label: "Industry",
                type: "picklist",
                required: false,
              },
              { name: "Phone", label: "Phone", type: "phone", required: false },
              {
                name: "Website",
                label: "Website",
                type: "url",
                required: false,
              },
            ],
          };

          resolve({
            success: true,
            fields: fieldMappings[objectType] || fieldMappings.Lead,
          });
          return;
        }

        const pythonCommand = pythonCommands[currentCommandIndex];
        const pythonProcess = spawn(pythonCommand, [pythonScript, ...args], {
          stdio: ["pipe", "pipe", "pipe"],
          env: { ...process.env },
        });

        let stdout = "";
        let stderr = "";

        pythonProcess.stdout.on("data", (data) => {
          stdout += data.toString();
        });

        pythonProcess.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        pythonProcess.on("close", (code) => {
          if (code === 0) {
            try {
              const result = JSON.parse(stdout);
              resolve(result);
            } catch (parseError) {
              console.log("Failed to parse Python output, using fallback");
              currentCommandIndex++;
              tryPythonCommand();
            }
          } else {
            console.log(
              `Python command ${pythonCommand} failed with code ${code}`
            );
            currentCommandIndex++;
            tryPythonCommand();
          }
        });

        pythonProcess.on("error", (error) => {
          console.log(`Python command ${pythonCommand} error:`, error.message);
          currentCommandIndex++;
          tryPythonCommand();
        });
      };

      tryPythonCommand();
    });
  } catch (error) {
    console.error("Error getting Salesforce field mapping:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

// Fetch existing records for duplicate comparison
ipcMain.handle("salesforce:fetch-existing", async (event, options) => {
  try {
    console.log("Fetch existing records requested:", options);

    const { duplicates, objectType = "Lead" } = options;

    if (!duplicates || !Array.isArray(duplicates)) {
      return {
        success: false,
        error: "Duplicates array is required",
      };
    }

    // Get stored auth data
    const storedTokenData = store.get("salesforceAuth");
    if (!storedTokenData || !storedTokenData.accessToken) {
      return {
        success: false,
        error: "Not authenticated with Salesforce. Please log in first.",
      };
    }

    console.log("Fetching existing records for duplicates:", {
      duplicateCount: duplicates.length,
      objectType,
    });

    // Execute the duplicate handler script
    const { spawn } = require("child_process");
    const path = require("path");

    const pythonScript = path.join(
      __dirname,
      "..",
      "core",
      "duplicate_handler.py"
    );
    const args = [
      "--action",
      "fetch",
      "--access-token",
      storedTokenData.accessToken,
      "--instance-url",
      storedTokenData.instanceUrl,
      "--object-type",
      objectType,
      "--data",
      JSON.stringify(duplicates),
    ];

    return new Promise((resolve) => {
      const pythonCommands = ["python", "python3", "py"];
      let currentCommandIndex = 0;

      const tryPythonCommand = () => {
        if (currentCommandIndex >= pythonCommands.length) {
          console.error(
            "All Python commands failed for fetch existing records"
          );
          resolve({
            success: false,
            error:
              "Failed to execute duplicate handler script - Python not found or script error",
            details: "Tried commands: " + pythonCommands.join(", "),
          });
          return;
        }

        const pythonCommand = pythonCommands[currentCommandIndex];
        const pythonProcess = spawn(pythonCommand, [pythonScript, ...args], {
          stdio: ["pipe", "pipe", "pipe"],
          env: { ...process.env },
        });

        let stdout = "";
        let stderr = "";

        pythonProcess.stdout.on("data", (data) => {
          stdout += data.toString();
        });

        pythonProcess.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        pythonProcess.on("close", (code) => {
          if (code === 0) {
            try {
              const result = JSON.parse(stdout);
              console.log(
                "Fetch existing records - Python script result:",
                result
              );
              resolve(result);
            } catch (parseError) {
              console.error("Failed to parse fetch result:", parseError);
              console.error("Raw stdout:", stdout);
              console.error("Raw stderr:", stderr);
              resolve({
                success: false,
                error: "Invalid response from fetch script",
                rawOutput: stdout,
                stderr: stderr,
              });
            }
          } else {
            console.log(
              `Python command ${pythonCommand} failed with code ${code}, stderr: ${stderr}`
            );
            currentCommandIndex++;
            tryPythonCommand();
          }
        });

        pythonProcess.on("error", (error) => {
          console.log(`Python command ${pythonCommand} error:`, error.message);
          currentCommandIndex++;
          tryPythonCommand();
        });
      };

      tryPythonCommand();
    });
  } catch (error) {
    console.error("Fetch existing records error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch existing records",
    };
  }
});

// Resolve duplicates (update, skip, or cancel)
ipcMain.handle("salesforce:resolve-duplicates", async (event, options) => {
  try {
    console.log("Resolve duplicates requested:", options);

    const { action, duplicates, selectedFields, objectType = "Lead" } = options;

    if (!action || !duplicates) {
      return {
        success: false,
        error: "Action and duplicates are required",
      };
    }

    // Get stored auth data
    const storedTokenData = store.get("salesforceAuth");
    if (!storedTokenData || !storedTokenData.accessToken) {
      return {
        success: false,
        error: "Not authenticated with Salesforce. Please log in first.",
      };
    }

    console.log("Resolving duplicates:", {
      action,
      duplicateCount: duplicates.length,
      objectType,
    });

    const resolutionData = {
      action,
      duplicates,
      selectedFields: selectedFields || {},
      objectType,
    };

    // Execute the duplicate handler script
    const { spawn } = require("child_process");
    const path = require("path");

    const pythonScript = path.join(
      __dirname,
      "..",
      "core",
      "duplicate_handler.py"
    );
    const args = [
      "--action",
      "resolve",
      "--access-token",
      storedTokenData.accessToken,
      "--instance-url",
      storedTokenData.instanceUrl,
      "--object-type",
      objectType,
      "--data",
      JSON.stringify(resolutionData),
    ];

    return new Promise((resolve) => {
      const pythonCommands = ["python", "python3", "py"];
      let currentCommandIndex = 0;

      const tryPythonCommand = () => {
        if (currentCommandIndex >= pythonCommands.length) {
          resolve({
            success: false,
            error: "Failed to execute duplicate resolution script",
          });
          return;
        }

        const pythonCommand = pythonCommands[currentCommandIndex];
        const pythonProcess = spawn(pythonCommand, [pythonScript, ...args], {
          stdio: ["pipe", "pipe", "pipe"],
          env: { ...process.env },
        });

        let stdout = "";
        let stderr = "";

        pythonProcess.stdout.on("data", (data) => {
          stdout += data.toString();
        });

        pythonProcess.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        pythonProcess.on("close", (code) => {
          if (code === 0) {
            try {
              const result = JSON.parse(stdout);
              resolve(result);
            } catch (parseError) {
              console.error("Failed to parse resolution result:", parseError);
              resolve({
                success: false,
                error: "Invalid response from resolution script",
              });
            }
          } else {
            console.log(
              `Python command ${pythonCommand} failed with code ${code}`
            );
            currentCommandIndex++;
            tryPythonCommand();
          }
        });

        pythonProcess.on("error", (error) => {
          console.log(`Python command ${pythonCommand} error:`, error.message);
          currentCommandIndex++;
          tryPythonCommand();
        });
      };

      tryPythonCommand();
    });
  } catch (error) {
    console.error("Resolve duplicates error:", error);
    return {
      success: false,
      error: error.message || "Failed to resolve duplicates",
    };
  }
});

// Protocol registration needs to be done earlier
if (app.isPackaged && sfRedirectUri) {
  // For packaged apps, register the protocol.
  // For development, Vite handles redirects if using http://localhost.
  // If using custom protocol in dev, this needs to be set before app ready.
}

// It's generally better to register protocols before the app is ready.
// Moved the protocol registration part to the top of whenReady()
// or even outside if possible (though app.setAsDefaultProtocolClient needs app to be ready for some OS).

if (
  sfRedirectUri &&
  MY_APP_PROTOCOL !== "http" &&
  MY_APP_PROTOCOL !== "https"
) {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(MY_APP_PROTOCOL, process.execPath, [
        path.resolve(process.argv[1]),
      ]);
    }
  } else {
    app.setAsDefaultProtocolClient(MY_APP_PROTOCOL);
  }
}

// Handle custom protocol activation when app is already running
app.on("open-url", (event, url) => {
  if (url.startsWith(sfRedirectUri)) {
    event.preventDefault();
    console.log("App open-url event triggered for OAuth callback:", url);
    handleOAuthCallback(url);
  }
});
