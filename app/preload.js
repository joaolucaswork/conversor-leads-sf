const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Example: Expose a function to send data to main process
  // sendData: (channel, data) => {
  //   ipcRenderer.send(channel, data);
  // },
  // Example: Expose a function to receive data from main process
  // receiveData: (channel, func) => {
  //   const validChannels = ['some-response-channel']; // Define valid channels
  //   if (validChannels.includes(channel)) {
  //     ipcRenderer.on(channel, (event, ...args) => func(...args));
  //   }
  // },

  // Expose store methods
  getStoreValue: (key) => ipcRenderer.invoke('get-store-value', key),
  setStoreValue: (key, value) => ipcRenderer.invoke('set-store-value', { key, value }),

  // Salesforce OAuth related IPC
  salesforceGetAuthUrl: () => ipcRenderer.invoke('salesforce:get-auth-url'),
  sendSalesforceOpenAuthWindow: (authUrl) => ipcRenderer.send('salesforce:open-auth-window', authUrl),
  salesforceExchangeCode: (code) => ipcRenderer.invoke('salesforce:exchange-code', code),
  salesforceRefreshToken: () => ipcRenderer.invoke('salesforce:refresh-token'),
  salesforceLogout: () => ipcRenderer.invoke('salesforce:logout'),

  // Listeners for events from main process related to OAuth
  onSalesforceOAuthCallback: (callback) => {
    ipcRenderer.on('salesforce:oauth-callback', (_event, code) => callback(code));
  },
  onSalesforceOAuthError: (callback) => {
    ipcRenderer.on('salesforce:oauth-error', (_event, errorDetails) => callback(errorDetails));
  },
  // It's good practice to provide a way to remove listeners to prevent memory leaks
  removeSalesforceOAuthListeners: () => {
    ipcRenderer.removeAllListeners('salesforce:oauth-callback');
    ipcRenderer.removeAllListeners('salesforce:oauth-error');
  }
});

console.log('Preload script loaded. electronAPI exposed.');
