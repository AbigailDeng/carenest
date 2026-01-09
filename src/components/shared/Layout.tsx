import { useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import BottomTabs from './BottomTabs';
import SettingsDrawer from './SettingsDrawer';
import { useOffline } from '../../hooks/useOffline';
import { useTranslation } from '../../hooks/useTranslation';
import HealthUploadScreen from '../health/HealthUploadScreen';
import HealthSummaryScreen from '../health/HealthSummaryScreen';
import LifestyleSuggestionsScreen from '../health/LifestyleSuggestionsScreen';
import SymptomLogScreen from '../health/SymptomLogScreen';
import SymptomAnalysisScreen from '../health/SymptomAnalysisScreen';
import HealthTimelineScreen from '../health/HealthTimelineScreen';
import HealthCalendarScreen from '../health/HealthCalendarScreen';
import PrivacySettingsScreen from '../privacy/PrivacySettingsScreen';
import DataViewScreen from '../privacy/DataViewScreen';
import DataExportScreen from '../privacy/DataExportScreen';
import DataDeletionScreen from '../privacy/DataDeletionScreen';

function Layout() {
  const isOffline = useOffline();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [previousPath, setPreviousPath] = useState<string>('/health');

  // Save current path when opening drawer
  const handleOpenDrawer = () => {
    // Only save if not already in privacy route
    if (!location.pathname.startsWith('/privacy')) {
      setPreviousPath(location.pathname);
    }
    setSettingsOpen(true);
  };

  // Restore previous path when closing drawer
  const handleCloseDrawer = () => {
    setSettingsOpen(false);
    // Navigate back to previous path if we're in privacy route
    if (location.pathname.startsWith('/privacy')) {
      navigate(previousPath, { replace: true });
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-clay-bg flex flex-col">
        {/* Offline indicator */}
        {isOffline && (
          <div className="bg-clay-warning rounded-b-[20px] px-4 py-3 text-center text-sm text-white font-body shadow-clay">
            {t('offline.message')}
          </div>
        )}

        {/* Soft extruded Header */}
        <header className="sticky top-0 z-30 clay-extrude bg-white rounded-b-[20px] mx-2 mt-2 mb-2">
          <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
            <h1 className="text-lg font-heading text-clay-text">{t('app.title')}</h1>
            <button
              onClick={handleOpenDrawer}
              className="clay-button bg-clay-lavender text-clay-text p-2.5 touch-target rounded-[18px]"
              aria-label={t('settings.title')}
            >
              <span className="text-xl">🎨</span>
            </button>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto max-w-md mx-auto w-full bg-clay-bg pb-24 px-2">
          <Routes>
            {/* Redirect root to health */}
            <Route path="/" element={<Navigate to="/health" replace />} />
            
            {/* Health routes */}
            <Route path="/health" element={<HealthHomeScreen />} />
            <Route path="/health/upload" element={<HealthUploadScreen />} />
            <Route path="/health/summary/:id" element={<HealthSummaryScreen />} />
            <Route path="/health/lifestyle/:recordId" element={<LifestyleSuggestionsScreen />} />
            <Route path="/health/symptoms" element={<SymptomLogScreen />} />
            <Route path="/health/symptoms/edit/:id" element={<SymptomLogScreen />} />
            <Route path="/health/symptoms/:id" element={<SymptomAnalysisScreen />} />
            <Route path="/health/timeline" element={<HealthTimelineScreen />} />
            <Route path="/health/calendar" element={<HealthCalendarScreen />} />
            
            {/* Nutrition routes */}
            <Route path="/nutrition" element={<NutritionHomeScreen />} />
            
            {/* Emotional routes */}
            <Route path="/emotional" element={<EmotionalHomeScreen />} />
            
            {/* Privacy routes (handled in drawer) */}
            <Route path="/privacy" element={<PrivacySettingsScreen />} />
            <Route path="/privacy/view" element={<DataViewScreen />} />
            <Route path="/privacy/export" element={<DataExportScreen />} />
            <Route path="/privacy/delete" element={<DataDeletionScreen />} />
          </Routes>
        </main>

        {/* Bottom tab navigation */}
        <BottomTabs />

        {/* Settings drawer */}
        <SettingsDrawer isOpen={settingsOpen} onClose={handleCloseDrawer} />
      </div>
    </ErrorBoundary>
  );
}

function HealthHomeScreen() {
  const { t } = useTranslation();
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-heading text-clay-text mb-6">{t('health.title')}</h1>
      <div className="space-y-4">
        <a href="/health/upload" className="block clay-card p-5 text-clay-text hover:bg-clay-mint transition-all cursor-pointer">
          <div className="flex items-center gap-3">
            <span className="text-4xl">📋</span>
            <span className="font-body text-lg font-medium">{t('health.uploadRecord')}</span>
          </div>
        </a>
        <a href="/health/symptoms" className="block clay-card p-5 text-clay-text hover:bg-clay-orange transition-all cursor-pointer">
          <div className="flex items-center gap-3">
            <span className="text-4xl">✨</span>
            <span className="font-body text-lg font-medium">{t('health.logSymptoms')}</span>
          </div>
        </a>
        <a href="/health/timeline" className="block clay-card p-5 text-clay-text hover:bg-clay-blue transition-all cursor-pointer">
          <div className="flex items-center gap-3">
            <span className="text-4xl">📅</span>
            <span className="font-body text-lg font-medium">{t('health.viewTimeline')}</span>
          </div>
        </a>
      </div>
    </div>
  );
}

function NutritionHomeScreen() {
  const { t } = useTranslation();
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-heading text-clay-text mb-6">{t('home.nutritionCompanion')}</h1>
      <p className="text-clay-textDim font-body text-lg mb-6">
        {t('home.subtitle')}
      </p>
      <div className="p-8 text-center text-clay-textDim clay-card bg-clay-mint">
        <p className="text-5xl mb-3">🍓</p>
        <p className="font-body text-lg">{t('app.comingSoon')}</p>
      </div>
    </div>
  );
}

function EmotionalHomeScreen() {
  const { t } = useTranslation();
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-heading text-clay-text mb-6">{t('home.emotionalSupport')}</h1>
      <p className="text-clay-textDim font-body text-lg mb-6">
        {t('home.subtitle')}
      </p>
      <div className="p-8 text-center text-clay-textDim clay-card bg-clay-lavender">
        <p className="text-5xl mb-3">💕</p>
        <p className="font-body text-lg">{t('app.comingSoon')}</p>
      </div>
    </div>
  );
}

export default Layout;
