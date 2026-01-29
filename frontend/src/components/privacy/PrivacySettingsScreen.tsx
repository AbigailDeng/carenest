import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserPreferences } from '../../hooks/useUserPreferences';
import { useTranslation } from '../../hooks/useTranslation';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Disclaimer from '../shared/Disclaimer';

interface PrivacySettingsScreenProps {
  onNavigate?: (path: string) => void;
}

export default function PrivacySettingsScreen({ onNavigate }: PrivacySettingsScreenProps = {}) {
  const navigate = useNavigate();
  const handleNavigate = onNavigate || navigate;
  const { preferences, loading, updateDataSharingConsent, updatePreferences } = useUserPreferences();
  const { t, changeLanguage, locale } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConsentChange = async (consent: boolean) => {
    setSaving(true);
    setError(null);
    try {
      await updateDataSharingConsent(consent);
    } catch (err: any) {
      setError(err.message || 'Failed to update consent');
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    setSaving(true);
    setError(null);
    try {
      await updatePreferences({ theme });
    } catch (err: any) {
      setError(err.message || 'Failed to update theme');
    } finally {
      setSaving(false);
    }
  };

  const handleLanguageChange = async (language: 'en' | 'zh') => {
    setSaving(true);
    setError(null);
    try {
      await changeLanguage(language);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50">
        <div className="text-center py-12">
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('privacy.title')}</h1>

      <Card className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('privacy.dataStorage')}</h2>
        <p className="text-sm text-gray-600 mb-4">
          {t('privacy.dataStorageDesc')}
        </p>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span>{t('privacy.storedLocally')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span>{t('privacy.noAutoTransmission')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span>{t('privacy.fullControl')}</span>
          </div>
        </div>
      </Card>

      <Card className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('privacy.aiConsent')}</h2>
        <p className="text-sm text-gray-600 mb-4">
          {t('privacy.aiConsentDesc')}
        </p>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">{t('privacy.enableAI')}</p>
            <p className="text-sm text-gray-600">
              {preferences?.dataSharingConsent
                ? t('privacy.consentGiven')
                : t('privacy.consentNotGiven')}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences?.dataSharingConsent || false}
              onChange={(e) => handleConsentChange(e.target.checked)}
              disabled={saving}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        {preferences?.dataSharingConsentDate && (
          <p className="text-xs text-gray-500 mt-2">
            {t('privacy.consentGiven')}: {new Date(preferences.dataSharingConsentDate).toLocaleString()}
          </p>
        )}
      </Card>

      <Card className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('privacy.theme')}</h2>
        <div className="grid grid-cols-3 gap-2">
          {(['light', 'dark', 'system'] as const).map((theme) => (
            <button
              key={theme}
              onClick={() => handleThemeChange(theme)}
              disabled={saving}
              className={`px-4 py-3 rounded-lg border-2 transition-colors touch-target ${
                preferences?.theme === theme
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              {theme.charAt(0).toUpperCase() + theme.slice(1)}
            </button>
          ))}
        </div>
      </Card>

      <Card className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">语言 / Language</h2>
        <div className="grid grid-cols-2 gap-2">
          {(['en', 'zh'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              disabled={saving}
              className={`px-4 py-3 rounded-lg border-2 transition-colors touch-target ${
                locale === lang
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              {lang === 'en' ? 'English' : '中文'}
            </button>
          ))}
        </div>
      </Card>

      {error && (
        <Card className="mb-4 border-red-200 bg-red-50">
          <p className="text-red-800 text-sm">{error}</p>
        </Card>
      )}

      <div className="space-y-3 mb-6">
        <Button
          variant="outline"
          fullWidth
          onClick={() => handleNavigate('/privacy/view')}
        >
          {t('privacy.viewData')}
        </Button>
        <Button
          variant="outline"
          fullWidth
          onClick={() => handleNavigate('/privacy/export')}
        >
          {t('privacy.exportData')}
        </Button>
        <Button
          variant="outline"
          fullWidth
          onClick={() => handleNavigate('/privacy/delete')}
          className="border-red-300 text-red-700 hover:bg-red-50"
        >
          {t('privacy.deleteData')}
        </Button>
      </div>

      <Disclaimer type="general" className="mb-6" />
    </div>
  );
}

