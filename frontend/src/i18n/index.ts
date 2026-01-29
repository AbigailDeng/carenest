import { en } from './locales/en';
import { zh } from './locales/zh';

export type Locale = 'en' | 'zh';
export type TranslationKey = keyof typeof en;

const translations = {
  en,
  zh,
};

let currentLocale: Locale = 'en';

/**
 * Set the current locale
 */
export function setLocale(locale: Locale): void {
  currentLocale = locale;
  localStorage.setItem('wellmate_locale', locale);
}

/**
 * Get the current locale
 */
export function getLocale(): Locale {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('wellmate_locale') as Locale;
    if (saved && (saved === 'en' || saved === 'zh')) {
      return saved;
    }
    // Detect browser language
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'zh') {
      return 'zh';
    }
  }
  return 'en';
}

/**
 * Initialize locale from storage or browser
 */
export function initLocale(): void {
  currentLocale = getLocale();
}

/**
 * Get translation for a key path (e.g., 'home.title' or 'health.upload.title')
 */
export function t(key: string): string {
  const keys = key.split('.');
  let value: any = translations[currentLocale];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k as keyof typeof value];
    } else {
      // Fallback to English if key not found
      value = translations.en;
      for (const k2 of keys) {
        if (value && typeof value === 'object' && k2 in value) {
          value = value[k2 as keyof typeof value];
        } else {
          return key; // Return key if translation not found
        }
      }
      break;
    }
  }

  return typeof value === 'string' ? value : key;
}

/**
 * React hook for translations
 */
export function useTranslation() {
  return {
    t,
    locale: currentLocale,
    setLocale,
    availableLocales: ['en', 'zh'] as Locale[],
  };
}

// Initialize on import
if (typeof window !== 'undefined') {
  initLocale();
}


