import { create } from "zustand";
import { electronAPI, isElectron } from "../utils/environment";
import i18n from "../i18n/config";

// Helper to call electron API with fallbacks
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

// Available languages
export const LANGUAGES = {
  pt: {
    code: 'pt',
    name: 'Português',
    nativeName: 'Português',
    flag: '🇧🇷'
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸'
  }
};

export const DEFAULT_LANGUAGE = 'pt';

export const useLanguageStore = create((set, get) => ({
  // State
  currentLanguage: DEFAULT_LANGUAGE,
  isLoading: false,
  error: null,

  // Actions
  initializeLanguage: async () => {
    set({ isLoading: true, error: null });
    try {
      let storedLanguage = null;

      if (isElectron() && window.electronAPI) {
        // Load from Electron store
        storedLanguage = await callElectronApi("getStoreValue", "app_language");
      } else {
        // Browser fallback - use localStorage
        storedLanguage = localStorage.getItem('app_language');
      }

      const language = storedLanguage && LANGUAGES[storedLanguage] 
        ? storedLanguage 
        : DEFAULT_LANGUAGE;

      // Update i18next language
      await i18n.changeLanguage(language);
      
      set({
        currentLanguage: language,
        isLoading: false,
      });

      console.log(`Language initialized to: ${language}`);
    } catch (err) {
      console.error('Error initializing language:', err);
      set({
        error: err.message || 'Failed to initialize language',
        isLoading: false,
        currentLanguage: DEFAULT_LANGUAGE
      });
      
      // Fallback to default language in i18next
      await i18n.changeLanguage(DEFAULT_LANGUAGE);
    }
  },

  setLanguage: async (languageCode) => {
    if (!LANGUAGES[languageCode]) {
      console.error(`Invalid language code: ${languageCode}`);
      return;
    }

    set({ isLoading: true, error: null });
    try {
      // Update i18next language first
      await i18n.changeLanguage(languageCode);

      // Persist the language choice
      if (isElectron() && window.electronAPI) {
        // Save to Electron store
        await callElectronApi("setStoreValue", { 
          key: "app_language", 
          value: languageCode 
        });
      } else {
        // Browser fallback - use localStorage
        localStorage.setItem('app_language', languageCode);
      }

      set({
        currentLanguage: languageCode,
        isLoading: false,
      });

      console.log(`Language changed to: ${languageCode}`);
    } catch (err) {
      console.error('Error setting language:', err);
      set({
        error: err.message || 'Failed to set language',
        isLoading: false,
      });
    }
  },

  // Get current language info
  getCurrentLanguageInfo: () => {
    const { currentLanguage } = get();
    return LANGUAGES[currentLanguage] || LANGUAGES[DEFAULT_LANGUAGE];
  },

  // Clear any errors
  clearError: () => set({ error: null }),
}));
