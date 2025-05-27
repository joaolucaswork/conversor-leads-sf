import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import ptTranslations from './locales/pt.json';
import enTranslations from './locales/en.json';

const resources = {
  pt: {
    translation: ptTranslations
  },
  en: {
    translation: enTranslations
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    
    // Default language
    lng: 'pt',
    fallbackLng: 'pt',
    
    // Namespace configuration
    defaultNS: 'translation',
    ns: ['translation'],
    
    // Key separator and nesting
    keySeparator: '.',
    nsSeparator: ':',
    
    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // Detection options
    detection: {
      // Don't use browser language detection by default
      // We'll handle language selection manually through our store
      order: [],
      caches: [], // Don't cache in browser storage, we handle this manually
    },
    
    // React options
    react: {
      useSuspense: false, // Disable suspense to avoid loading issues
    },
    
    // Debug mode (disable in production)
    debug: process.env.NODE_ENV === 'development',
    
    // Load path for missing translations (useful for development)
    saveMissing: process.env.NODE_ENV === 'development',
    
    // Pluralization
    pluralSeparator: '_',
    contextSeparator: '_',
  });

export default i18n;
