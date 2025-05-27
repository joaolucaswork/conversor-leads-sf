import { create } from "zustand";
import { electronAPI, isElectron, isBrowser } from "../utils/environment";

// Helper to call electron API with fallbacks, simplifies store actions
const callElectronApi = async (apiFunction, ...args) => {
  try {
    if (electronAPI[apiFunction]) {
      return await electronAPI[apiFunction](...args);
    } else {
      throw new Error(
        `API function ${apiFunction} is not available in current environment`
      );
    }
  } catch (err) {
    console.error(`Error calling ${apiFunction}:`, err);
    throw err;
  }
};

export const useSettingsStore = create((set, get) => ({
  // State
  openAIApiKeyIsSet: false,
  isLoadingApiKeyStatus: true,
  errorApiKeyStatus: null,
  // For managing the post-login prompt snackbar
  showApiKeyMissingPrompt: false,
  // Developer Mode state - enabled by default
  developerMode: true,
  isDeveloperModeLoading: true,

  // Actions
  checkOpenAIApiKeyPresence: async () => {
    set({ isLoadingApiKeyStatus: true, errorApiKeyStatus: null });
    try {
      // Try the dedicated OpenAI API key function first, fallback to general store
      let storedKey;
      if (
        isElectron() &&
        window.electronAPI &&
        window.electronAPI.getOpenAIApiKey
      ) {
        storedKey = await window.electronAPI.getOpenAIApiKey();
      } else {
        storedKey = await callElectronApi("getStoreValue", "openai_api_key");
      }

      set({
        openAIApiKeyIsSet: !!storedKey,
        isLoadingApiKeyStatus: false,
      });
    } catch (err) {
      console.error("Error checking OpenAI API key presence:", err);

      // Provide environment-specific error handling
      if (
        isBrowser() &&
        err.message.includes("not available in current environment")
      ) {
        // In browser mode, assume no API key is set and don't show error
        set({
          openAIApiKeyIsSet: false,
          isLoadingApiKeyStatus: false,
          errorApiKeyStatus: null,
        });
      } else {
        set({
          errorApiKeyStatus: "Failed to check API key status.",
          isLoadingApiKeyStatus: false,
        });
      }
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

  // Developer Mode actions
  loadDeveloperMode: async () => {
    set({ isDeveloperModeLoading: true });
    try {
      let storedMode;
      if (isElectron() && window.electronAPI) {
        storedMode = await window.electronAPI.getStoreValue("developer_mode");
      } else {
        const stored = localStorage.getItem("developer_mode");
        storedMode = stored ? JSON.parse(stored) : null;
      }

      // Default to true if not set
      const developerMode = storedMode !== null ? storedMode : true;
      set({ developerMode, isDeveloperModeLoading: false });
    } catch (err) {
      console.error("Error loading developer mode:", err);
      set({ developerMode: true, isDeveloperModeLoading: false }); // Default to enabled
    }
  },

  setDeveloperMode: async (enabled) => {
    try {
      if (isElectron() && window.electronAPI) {
        await window.electronAPI.setStoreValue("developer_mode", enabled);
      } else {
        localStorage.setItem("developer_mode", JSON.stringify(enabled));
      }
      set({ developerMode: enabled });
    } catch (err) {
      console.error("Error saving developer mode:", err);
      throw err;
    }
  },
}));

// Initialize API key presence when the store is created/app starts.
// This should ideally be called once in App.jsx or a similar entry point.
// useSettingsStore.getState().checkOpenAIApiKeyPresence();
// Update: It's better to call this explicitly in App.jsx useEffect to ensure timing.
