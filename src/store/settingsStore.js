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
  openAIApiKeyIsSet: true, // Always true since API key is hardcoded for Reino Capital
  isLoadingApiKeyStatus: false, 
  errorApiKeyStatus: null,
  // Developer Mode state - enabled by default
  developerMode: true,
  isDeveloperModeLoading: true,

  // Actions
  checkOpenAIApiKeyPresence: async () => {
    // Always return true since API key is hardcoded for Reino Capital
    set({
      openAIApiKeyIsSet: true,
      isLoadingApiKeyStatus: false,
      errorApiKeyStatus: null
    });
    console.log("OpenAI API key is pre-configured for Reino Capital");
  },

  // This action is maintained for compatibility but now always sets to true
  setOpenAIApiKeyStatus: (isSet) => {
    set({ openAIApiKeyIsSet: true }); // Always true
  },

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
