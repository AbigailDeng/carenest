import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteAllData } from '../../services/storage/indexedDB';
import { useTranslation } from '../../hooks/useTranslation';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Disclaimer from '../shared/Disclaimer';

interface DataDeletionScreenProps {
  onNavigate?: (path: string) => void;
}

export default function DataDeletionScreen({ onNavigate }: DataDeletionScreenProps = {}) {
  const navigate = useNavigate();
  const handleNavigate = onNavigate || navigate;
  const { t } = useTranslation();
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);

  const CONFIRMATION_TEXT = 'DELETE ALL DATA';
  const isConfirmed = confirmText === CONFIRMATION_TEXT;

  const handleDelete = async () => {
    if (!isConfirmed) {
      setError(t('dataDelete.confirmText'));
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await deleteAllData();
      setDeleted(true);
      
      // Redirect to health tab after a delay
      setTimeout(() => {
        handleNavigate('/health');
        window.location.reload(); // Reload to reset app state
      }, 2000);
    } catch (err: any) {
      setError(err.message || t('common.error'));
      setDeleting(false);
    }
  };

  if (deleted) {
    return (
      <div className="p-6 bg-gray-50 flex items-center justify-center min-h-[400px]">
        <Card>
          <div className="text-center py-8">
            <div className="text-4xl mb-4">✓</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t('dataDelete.allDataDeleted')}
            </h2>
            <p className="text-gray-600 mb-4">
              {t('dataDelete.deletedDesc')}
            </p>
            <p className="text-sm text-gray-500">
              {t('dataDelete.redirecting')}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('dataDelete.title')}</h1>

      <Card className="mb-6 border-red-200 bg-red-50">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h2 className="font-semibold text-red-900 mb-2">{t('dataDelete.warning')}</h2>
            <p className="text-sm text-red-800">
              {t('dataDelete.warningDesc')}
            </p>
            <ul className="text-sm text-red-800 mt-2 space-y-1 list-disc list-inside">
              <li>{t('dataDelete.medicalRecords')}</li>
              <li>{t('dataDelete.healthConditions')}</li>
              <li>{t('dataDelete.symptomEntries')}</li>
              <li>{t('dataDelete.moodEntries')}</li>
              <li>{t('dataDelete.journalEntries')}</li>
              <li>{t('dataDelete.nutritionData')}</li>
              <li>{t('dataDelete.allOtherData')}</li>
            </ul>
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <p className="text-gray-700 mb-4">
          {t('dataDelete.exportFirst')}
        </p>
        <Button
          variant="outline"
          fullWidth
          onClick={() => handleNavigate('/privacy/export')}
        >
          {t('dataDelete.exportDataFirst')}
        </Button>
      </Card>

      <Card className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('dataDelete.confirmText')}
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={CONFIRMATION_TEXT}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          disabled={deleting}
        />
      </Card>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <p className="text-red-800 text-sm">{error}</p>
        </Card>
      )}

      <div className="flex gap-3 mb-6">
        <Button
          variant="outline"
          fullWidth
          onClick={() => handleNavigate('/privacy')}
          disabled={deleting}
        >
          {t('common.cancel')}
        </Button>
        <Button
          variant="primary"
          fullWidth
          onClick={handleDelete}
          disabled={!isConfirmed || deleting}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          {deleting ? t('dataDelete.deleting') : t('dataDelete.deleteAllData')}
        </Button>
      </div>

      <Disclaimer type="general" className="mb-6" />
    </div>
  );
}

