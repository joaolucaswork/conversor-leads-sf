import { create } from 'zustand';

// Helper to call electron API, simplifies store actions
const callElectronApi = async (apiFunction, ...args) => {
  if (!window.electronAPI || typeof window.electronAPI[apiFunction] !== 'function') {
    const errorMsg = `Electron API function ${apiFunction} is not available. Ensure preload script exposes it and it's correctly named.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  return window.electronAPI[apiFunction](...args);
};

export const useSettingsStore = create((set, get) => ({
  // State
  openAIApiKeyIsSet: false,
  isLoadingApiKeyStatus: true,
  errorApiKeyStatus: null,
  // For managing the post-login prompt snackbar
  showApiKeyMissingPrompt: false,

  // Actions
  checkOpenAIApiKeyPresence: async () => {
    set({ isLoadingApiKeyStatus: true, errorApiKeyStatus: null });
    try {
      const storedKey = await callElectronApi('getStoreValue', 'openai_api_key');
      set({ 
        openAIApiKeyIsSet: !!storedKey, 
        isLoadingApiKeyStatus: false 
      });
    } catch (err) {
      console.error('Error checking OpenAI API key presence:', err);
      set({ 
        errorApiKeyStatus: 'Failed to check API key status.', 
        isLoadingApiKeyStatus: false 
      });
    }
  },

  // This action is called by OpenAIApiKeyForm directly saving via electronAPI.
  // This store action mainly updates the status for other parts of the app.
  setOpenAIApiKeyStatus: (isSet) => {
    set({ openAIApiKeyIsSet: isSet, showApiKeyMissingPrompt: false }); // Hide prompt once key is set
  },

  // Actions for Snackbar prompt
  openApiKeyMissingPrompt: () => set({ showApiKeyMissingPrompt: true }),
  closeApiKeyMissingPrompt: () => set({ showApiKeyMissingPrompt: false }),
}));

// Initialize API key presence when the store is created/app starts.
// This should ideally be called once in App.jsx or a similar entry point.
// useSettingsStore.getState().checkOpenAIApiKeyPresence();
// Update: It's better to call this explicitly in App.jsx useEffect to ensure timing.
