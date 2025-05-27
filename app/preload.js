const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
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
  getStoreValue: (key) => ipcRenderer.invoke("get-store-value", key),
  setStoreValue: (key, value) =>
    ipcRenderer.invoke("set-store-value", { key, value }),

  // OpenAI API Key operations
  getOpenAIApiKey: () => ipcRenderer.invoke("get-openai-api-key"),
  setOpenAIApiKey: (apiKey) => ipcRenderer.invoke("set-openai-api-key", apiKey),

  // Python script execution
  executePythonScript: (script, args, options) =>
    ipcRenderer.invoke("execute-python-script", { script, args, options }),

  // Salesforce OAuth related IPC
  getSalesforceAuthUrl: () => ipcRenderer.invoke("salesforce:get-auth-url"),
  sendSalesforceOpenAuthWindow: (authUrl) =>
    ipcRenderer.send("salesforce:open-auth-window", authUrl),
  salesforceExchangeCode: (code) =>
    ipcRenderer.invoke("salesforce:exchange-code", code),
  salesforceRefreshToken: () => ipcRenderer.invoke("salesforce:refresh-token"),
  salesforceLogout: () => ipcRenderer.invoke("salesforce:logout"),
  salesforceGetUserProfile: () =>
    ipcRenderer.invoke("salesforce:get-user-profile"),

  // Salesforce API operations
  uploadToSalesforce: (options) =>
    ipcRenderer.invoke("salesforce:upload", options),
  getSalesforceObjects: () => ipcRenderer.invoke("salesforce:get-objects"),
  validateSalesforceConnection: () =>
    ipcRenderer.invoke("salesforce:validate-connection"),
  getSalesforceFieldMapping: (objectType) =>
    ipcRenderer.invoke("salesforce:get-field-mapping", objectType),

  // Duplicate handling operations
  fetchExistingRecords: (options) =>
    ipcRenderer.invoke("salesforce:fetch-existing", options),
  resolveDuplicates: (options) =>
    ipcRenderer.invoke("salesforce:resolve-duplicates", options),

  // Listeners for events from main process related to OAuth
  onSalesforceOAuthCallback: (callback) => {
    ipcRenderer.on("salesforce:oauth-callback", (_event, code) =>
      callback(code)
    );
  },
  onSalesforceOAuthSuccess: (callback) => {
    ipcRenderer.on("salesforce:oauth-success", (_event, tokenData) =>
      callback(tokenData)
    );
  },
  onSalesforceOAuthError: (callback) => {
    ipcRenderer.on("salesforce:oauth-error", (_event, errorDetails) =>
      callback(errorDetails)
    );
  },
  // It's good practice to provide a way to remove listeners to prevent memory leaks
  removeSalesforceOAuthListeners: () => {
    ipcRenderer.removeAllListeners("salesforce:oauth-callback");
    ipcRenderer.removeAllListeners("salesforce:oauth-success");
    ipcRenderer.removeAllListeners("salesforce:oauth-error");
  },
});

console.log("Preload script loaded. electronAPI exposed.");
