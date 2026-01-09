import { useState, useEffect, useCallback } from 'react';
import { UserPreferences } from '../types';
import { saveEntity, getEntity } from '../services/storage/indexedDB';
import { setLocale, getLocale } from '../i18n';

const SINGLETON_ID = 'singleton';

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true);
      let prefs = await getEntity<UserPreferences>('userPreferences', SINGLETON_ID);
      
      // Initialize if doesn't exist
      if (!prefs) {
        const now = new Date().toISOString();
        const defaultLanguage = getLocale();
        prefs = await saveEntity<UserPreferences>('userPreferences', {
          id: SINGLETON_ID,
          healthConditions: [],
          energyLevelPreference: null,
          dataSharingConsent: false,
          dataSharingConsentDate: null,
          theme: 'system',
          language: defaultLanguage,
          createdAt: now,
          updatedAt: now,
        });
        setLocale(defaultLanguage);
      }
      
      setPreferences(prefs);
      if (prefs.language) {
        setLocale(prefs.language);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load user preferences');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    if (!preferences) {
      throw new Error('Preferences not loaded');
    }

    try {
      const updated = await saveEntity<UserPreferences>('userPreferences', {
        ...preferences,
        ...updates,
      });
      setPreferences(updated);
      setError(null);
      return updated;
    } catch (err: any) {
      setError(err.message || 'Failed to update preferences');
      throw err;
    }
  }, [preferences]);

  const updateDataSharingConsent = useCallback(async (consent: boolean) => {
    return updatePreferences({
      dataSharingConsent: consent,
      dataSharingConsentDate: consent ? new Date().toISOString() : null,
    });
  }, [updatePreferences]);

  const updateLanguage = useCallback(async (language: 'en' | 'zh') => {
    setLocale(language);
    return updatePreferences({ language });
  }, [updatePreferences]);

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    updateDataSharingConsent,
    updateLanguage,
    refresh: loadPreferences,
  };
}

