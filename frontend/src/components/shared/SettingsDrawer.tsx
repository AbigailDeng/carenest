import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import PrivacySettingsScreen from '../privacy/PrivacySettingsScreen';
import DataViewScreen from '../privacy/DataViewScreen';
import DataExportScreen from '../privacy/DataExportScreen';
import DataDeletionScreen from '../privacy/DataDeletionScreen';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [drawerRoute, setDrawerRoute] = useState<string>('/privacy');

  // Sync drawer route with location when drawer opens
  useEffect(() => {
    if (isOpen) {
      if (location.pathname.startsWith('/privacy')) {
        setDrawerRoute(location.pathname);
      } else {
        setDrawerRoute('/privacy');
        navigate('/privacy', { replace: true });
      }
    }
  }, [isOpen, location.pathname, navigate]);

  // Close drawer on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle navigation within drawer
  const handleNavigation = (path: string) => {
    setDrawerRoute(path);
    navigate(path, { replace: true }); // Use replace to avoid polluting browser history
  };

  // Get current privacy route
  const getPrivacyRoute = () => {
    const route = drawerRoute || location.pathname;
    if (route.startsWith('/privacy/view')) return 'view';
    if (route.startsWith('/privacy/export')) return 'export';
    if (route.startsWith('/privacy/delete')) return 'delete';
    return 'settings';
  };

  const currentRoute = getPrivacyRoute();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`
          fixed right-0 top-0 bottom-0
          w-full sm:w-96
          bg-white shadow-xl z-50
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('settings.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={t('common.close')}
          >
            <span className="text-xl">✕</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {currentRoute === 'settings' && (
            <div className="p-0">
              <PrivacySettingsScreen onNavigate={handleNavigation} />
            </div>
          )}
          {currentRoute === 'view' && (
            <div className="p-0">
              <DataViewScreen onNavigate={handleNavigation} />
            </div>
          )}
          {currentRoute === 'export' && (
            <div className="p-0">
              <DataExportScreen onNavigate={handleNavigation} />
            </div>
          )}
          {currentRoute === 'delete' && (
            <div className="p-0">
              <DataDeletionScreen onNavigate={handleNavigation} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

