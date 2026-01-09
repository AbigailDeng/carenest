import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { exportAsJSON, exportAsCSV, downloadExport } from '../../utils/export';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Disclaimer from '../shared/Disclaimer';

interface DataExportScreenProps {
  onNavigate?: (path: string) => void;
}

export default function DataExportScreen({ onNavigate }: DataExportScreenProps = {}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const handleNavigate = onNavigate || navigate;
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleExport = async (format: 'json' | 'csv') => {
    setExporting(true);
    setError(null);
    setSuccess(false);

    try {
      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === 'json') {
        content = await exportAsJSON();
        filename = `wellmate-export-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      } else {
        content = await exportAsCSV();
        filename = `wellmate-export-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      }

      downloadExport(content, filename, mimeType);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('dataExport.title')}</h1>

      <Card className="mb-6">
        <p className="text-gray-700 mb-4">
          {t('dataExport.description')}
        </p>
        <ul className="space-y-2 text-sm text-gray-600 mb-4">
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>{t('dataExport.backup')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>{t('dataExport.transfer')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>{t('dataExport.review')}</span>
          </li>
        </ul>
      </Card>

      <div className="space-y-3 mb-6">
        <Card>
          <div className="mb-3">
            <h2 className="font-semibold text-gray-900 mb-1">{t('dataExport.jsonFormat')}</h2>
            <p className="text-sm text-gray-600">
              {t('dataExport.jsonDesc')}
            </p>
          </div>
          <Button
            variant="primary"
            fullWidth
            onClick={() => handleExport('json')}
            disabled={exporting}
          >
            {exporting ? t('dataExport.exporting') : t('dataExport.exportAsJSON')}
          </Button>
        </Card>

        <Card>
          <div className="mb-3">
            <h2 className="font-semibold text-gray-900 mb-1">{t('dataExport.csvFormat')}</h2>
            <p className="text-sm text-gray-600">
              {t('dataExport.csvDesc')}
            </p>
          </div>
          <Button
            variant="primary"
            fullWidth
            onClick={() => handleExport('csv')}
            disabled={exporting}
          >
            {exporting ? t('dataExport.exporting') : t('dataExport.exportAsCSV')}
          </Button>
        </Card>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <p className="text-red-800 text-sm">{error}</p>
        </Card>
      )}

      {success && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <p className="text-green-800 text-sm">
            {t('dataExport.exportSuccess')}
          </p>
        </Card>
      )}

      <Disclaimer type="general" className="mb-6" />

      <Button variant="outline" fullWidth onClick={() => handleNavigate('/privacy')}>
        {t('dataExport.backToPrivacy')}
      </Button>
    </div>
  );
}

