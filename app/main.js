require('dotenv').config(); // Load environment variables from .env file
const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { simpleOAuth2 } = require('simple-oauth2'); // Will be used later

// Initialize electron-store
const store = new Store();

// Salesforce OAuth Configuration (loaded from .env)
const sfHost = process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com';
const sfClientId = process.env.SALESFORCE_CLIENT_ID;
const sfClientSecret = process.env.SALESFORCE_CLIENT_SECRET;
const sfRedirectUri = process.env.SALESFORCE_REDIRECT_URI;

if (!sfClientId || !sfClientSecret || !sfRedirectUri) {
  console.error('Salesforce OAuth environment variables (SALESFORCE_CLIENT_ID, SALESFORCE_CLIENT_SECRET, SALESFORCE_REDIRECT_URI) are not set. Please check your .env file.');
  // Optionally, exit the app or disable Salesforce features
  // app.quit();
}

const oauth2 = simpleOAuth2.create({
  client: {
    id: sfClientId,
    secret: sfClientSecret,
  },
  auth: {
    tokenHost: sfHost,
    tokenPath: '/services/oauth2/token',
    authorizePath: '/services/oauth2/authorize',
  },
  options: {
    authorizationMethod: 'body', // Salesforce requires params in body for token exchange
  },
});

// Example: Store a value
// store.set('userSettings.theme', 'dark');

// Example: Retrieve a value
// console.log(store.get('userSettings.theme'));

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200, // Increased width for better Salesforce UI potential
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // Recommended for security
      nodeIntegration: false, // Recommended for security
    },
  });

  // Load the Vite dev server URL in development or the production build
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist-renderer/index.html'));
  }

  // Handle IPC messages from renderer process if needed
  // ipcMain.on('some-channel', (event, data) => {
  //   // Process data and send response if necessary
  //   event.reply('some-response-channel', 'Processed: ' + data);
  // });
}

// Custom protocol for OAuth callback
const MY_APP_PROTOCOL = sfRedirectUri ? new URL(sfRedirectUri).protocol.slice(0, -1) : 'myapp';

app.whenReady().then(() => {
  if (sfClientId && sfClientSecret && sfRedirectUri) {
    // Register custom protocol
    // protocol.registerSchemesAsPrivileged([{ scheme: MY_APP_PROTOCOL, privileges: { standard: true, secure: true, supportFetchAPI: true } }]);
    // The above is now preferred at app startup before it's ready.
  }

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Example of exposing a value from store to renderer via IPC
ipcMain.handle('get-store-value', async (event, key) => {
  return store.get(key);
});

ipcMain.handle('set-store-value', async (event, { key, value }) => {
  store.set(key, value);
});

// Salesforce OAuth IPC Handlers
ipcMain.handle('salesforce:get-auth-url', async () => {
  if (!oauth2) return null;
  const authorizationUri = oauth2.authorizationCode.authorizeURL({
    redirect_uri: sfRedirectUri,
    scope: 'api id web refresh_token', // Adjust scopes as needed
    // state: 'someRandomStateString' // Optional: for CSRF protection
  });
  return authorizationUri;
});

let authWindow = null; // Keep a reference to the auth window

ipcMain.on('salesforce:open-auth-window', (event, authUrl) => {
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

  webContents.on('will-redirect', (event, newUrl) => {
    // console.log('Auth window will-redirect:', newUrl);
    if (newUrl.startsWith(sfRedirectUri)) {
      event.preventDefault(); // Stop the redirect in the authWindow
      authWindow.close();
      authWindow = null;

      const urlParts = new URL(newUrl);
      const code = urlParts.searchParams.get('code');
      if (code) {
        // Send code to the main window's renderer process to be exchanged
        BrowserWindow.getAllWindows()[0]?.webContents.send('salesforce:oauth-callback', code);
      } else {
        const error = urlParts.searchParams.get('error');
        const errorDescription = urlParts.searchParams.get('error_description');
        console.error('Salesforce OAuth Error:', error, errorDescription);
        BrowserWindow.getAllWindows()[0]?.webContents.send('salesforce:oauth-error', { error, errorDescription });
      }
    }
  });

  webContents.on('did-redirect-navigation', (event, newUrl) => {
    // console.log('Auth window did-redirect-navigation:', newUrl);
     if (newUrl.startsWith(sfRedirectUri)) {
      // This might be another way to catch it, depending on Electron version and flow
      authWindow.close();
      authWindow = null;
      const urlParts = new URL(newUrl);
      const code = urlParts.searchParams.get('code');
       if (code) {
        BrowserWindow.getAllWindows()[0]?.webContents.send('salesforce:oauth-callback', code);
      } else {
        const error = urlParts.searchParams.get('error');
        const errorDescription = urlParts.searchParams.get('error_description');
        console.error('Salesforce OAuth Error:', error, errorDescription);
        BrowserWindow.getAllWindows()[0]?.webContents.send('salesforce:oauth-error', { error, errorDescription });
      }
    }
  });

  authWindow.on('closed', () => {
    authWindow = null;
  });
});


ipcMain.handle('salesforce:exchange-code', async (event, code) => {
  if (!oauth2) return null;
  try {
    const tokenParams = {
      code: code,
      redirect_uri: sfRedirectUri,
      scope: 'api id web refresh_token', // Should match the authorizeURL scope
    };
    const accessToken = await oauth2.authorizationCode.getToken(tokenParams);
    // The library automatically adds client_id and client_secret to the request.
    // It also typically handles the grant_type="authorization_code".

    const tokenData = {
      accessToken: accessToken.access_token,
      refreshToken: accessToken.refresh_token,
      instanceUrl: accessToken.instance_url, // Salesforce specific
      issuedAt: Math.floor(Date.now() / 1000), // unixtime
      expiresIn: accessToken.expires_in, // seconds
    };
    
    store.set('salesforceAuth', tokenData);
    return { success: true, data: tokenData };
  } catch (error) {
    console.error('Salesforce Access Token Error:', error.message, error.context?.body || error.context);
    return { success: false, error: error.message, context: error.context?.body };
  }
});

ipcMain.handle('salesforce:refresh-token', async () => {
  if (!oauth2) return null;
  const storedTokenData = store.get('salesforceAuth');
  if (!storedTokenData || !storedTokenData.refreshToken) {
    return { success: false, error: 'No refresh token found.' };
  }

  try {
    let token = oauth2.accessToken.create({ 
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

    token = await token.refresh({ scope: 'api id web refresh_token' });

    const newTokenData = {
      accessToken: token.token.access_token,
      refreshToken: token.token.refresh_token || storedTokenData.refreshToken, // Salesforce might not always return a new refresh token
      instanceUrl: token.token.instance_url || storedTokenData.instanceUrl,
      issuedAt: Math.floor(Date.now() / 1000),
      expiresIn: token.token.expires_in,
    };
    store.set('salesforceAuth', newTokenData);
    return { success: true, data: newTokenData };
  } catch (error) {
    console.error('Salesforce Refresh Token Error:', error.message);
    // If refresh fails (e.g. token revoked), clear stored tokens and prompt for re-login
    if (error.data && (error.data.payload?.error === 'invalid_grant' || error.data.payload?.error === 'revoked')) {
        store.delete('salesforceAuth');
        return { success: false, error: 'Refresh token invalid. Please log in again.', reauthenticate: true };
    }
    return { success: false, error: error.message };
  }
});

ipcMain.handle('salesforce:logout', async () => {
  const storedTokenData = store.get('salesforceAuth');
  if (storedTokenData && storedTokenData.accessToken && sfClientId) {
    // Optional: Revoke token with Salesforce
    // This requires an additional request.
    const revokeUrl = `${storedTokenData.instanceUrl || sfHost}/services/oauth2/revoke`;
    try {
      // Salesforce expects the token to be revoked in a POST request with 'token' parameter
      // simple-oauth2 doesn't have a direct revoke method, so use axios or fetch
      // For simplicity here, we'll skip actual revocation for now and just clear local store
      // const { default: axios } = await import('axios');
      // await axios.post(revokeUrl, `token=${storedTokenData.accessToken}`, {
      //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      // });
      console.log('Salesforce token revocation (simulated) would target:', revokeUrl);
    } catch (error) {
      console.error('Error revoking Salesforce token:', error.message);
      // Fall through to clearing local store anyway
    }
  }
  store.delete('salesforceAuth');
  return { success: true };
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

if (sfRedirectUri && MY_APP_PROTOCOL !== 'http' && MY_APP_PROTOCOL !== 'https') {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(MY_APP_PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient(MY_APP_PROTOCOL);
  }
}

// Handle custom protocol activation when app is already running
app.on('open-url', (event, url) => {
  if (url.startsWith(sfRedirectUri)) {
    event.preventDefault();
    const urlParts = new URL(url);
    const code = urlParts.searchParams.get('code');
    if (code) {
      BrowserWindow.getAllWindows()[0]?.webContents.send('salesforce:oauth-callback', code);
    } else {
      const error = urlParts.searchParams.get('error');
      const errorDescription = urlParts.searchParams.get('error_description');
      console.error('Salesforce OAuth Error (open-url):', error, errorDescription);
      BrowserWindow.getAllWindows()[0]?.webContents.send('salesforce:oauth-error', { error, errorDescription });
    }
    if (authWindow) {
      authWindow.close(); // Close the separate auth window if it was used
      authWindow = null;
    }
  }
});
