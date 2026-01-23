import { useTranslation as useI18n } from '../i18n';
import { useUserPreferences } from './useUserPreferences';
import { useEffect } from 'react';

/**
 * React hook for translations with language sync
 */
export function useTranslation() {
  const i18n = useI18n();
  const { preferences, updateLanguage } = useUserPreferences();

  // Sync language with preferences
  useEffect(() => {
    if (preferences?.language && preferences.language !== i18n.locale) {
      i18n.setLocale(preferences.language);
    }
  }, [preferences?.language, i18n]);

  const changeLanguage = async (locale: 'en' | 'zh') => {
    i18n.setLocale(locale);
    if (preferences) {
      await updateLanguage(locale);
    }
  };

  return {
    ...i18n,
    changeLanguage,
  };
}


