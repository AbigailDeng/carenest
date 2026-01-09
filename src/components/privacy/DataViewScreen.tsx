import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useMedicalRecords,
} from '../../hooks/useMedicalRecords';
import { useHealthConditions } from '../../hooks/useHealthConditions';
import { useSymptomEntries } from '../../hooks/useSymptomEntries';
import { useTranslation } from '../../hooks/useTranslation';
import { truncateFilename } from '../../utils/truncate';
import Card from '../shared/Card';
import Button from '../shared/Button';

interface DataViewScreenProps {
  onNavigate?: (path: string) => void;
}

export default function DataViewScreen({ onNavigate }: DataViewScreenProps = {}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const handleNavigate = onNavigate || navigate;
  const { records, loading: recordsLoading } = useMedicalRecords();
  const { conditions, loading: conditionsLoading } = useHealthConditions();
  const { entries, loading: entriesLoading } = useSymptomEntries();

  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const loading = recordsLoading || conditionsLoading || entriesLoading;

  if (loading) {
    return (
      <div className="p-6 bg-gray-50">
        <div className="text-center py-12">
          <p className="text-gray-600">{t('dataView.loading')}</p>
        </div>
      </div>
    );
  }

  const totalItems = records.length + conditions.length + entries.length;

  return (
    <div className="p-6 bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('dataView.title')}</h1>

      <Card className="mb-6">
        <div className="text-center py-4">
          <p className="text-3xl font-bold text-gray-900 mb-2">{totalItems}</p>
          <p className="text-sm text-gray-600">{t('dataView.totalEntries')}</p>
        </div>
      </Card>

      <div className="space-y-4 mb-6">
        <Card>
          <button
            onClick={() => setExpandedSection(expandedSection === 'records' ? null : 'records')}
            className="w-full flex items-center justify-between text-left"
          >
            <div>
              <h2 className="font-semibold text-gray-900">{t('dataView.medicalRecords')}</h2>
              <p className="text-sm text-gray-600">{records.length} {t('dataView.records')}</p>
            </div>
            <span className="text-gray-400">{expandedSection === 'records' ? '🔽' : '▶️'}</span>
          </button>
          {expandedSection === 'records' && (
            <div className="mt-4 space-y-2 border-t pt-4">
              {records.length === 0 ? (
                <p className="text-sm text-gray-500">{t('dataView.noRecords')}</p>
              ) : (
                records.map((record) => (
                  <div key={record.id} className="p-3 bg-gray-50 rounded text-sm">
                    <p className="font-medium text-gray-900" title={record.filename}>
                      {truncateFilename(record.filename)}
                    </p>
                    <p className="text-gray-600">
                      {new Date(record.uploadDate).toLocaleDateString()}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {t('dataView.status')} {record.processingStatus}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </Card>

        <Card>
          <button
            onClick={() => setExpandedSection(expandedSection === 'conditions' ? null : 'conditions')}
            className="w-full flex items-center justify-between text-left"
          >
            <div>
              <h2 className="font-semibold text-gray-900">{t('dataView.healthConditions')}</h2>
              <p className="text-sm text-gray-600">{conditions.length} {t('dataView.conditions')}</p>
            </div>
            <span className="text-gray-400">{expandedSection === 'conditions' ? '🔽' : '▶️'}</span>
          </button>
          {expandedSection === 'conditions' && (
            <div className="mt-4 space-y-2 border-t pt-4">
              {conditions.length === 0 ? (
                <p className="text-sm text-gray-500">{t('dataView.noConditions')}</p>
              ) : (
                conditions.map((condition) => (
                  <div key={condition.id} className="p-3 bg-gray-50 rounded text-sm">
                    <p className="font-medium text-gray-900">{condition.conditionName}</p>
                    <p className="text-gray-600">
                      {new Date(condition.documentedDate).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </Card>

        <Card>
          <button
            onClick={() => setExpandedSection(expandedSection === 'symptoms' ? null : 'symptoms')}
            className="w-full flex items-center justify-between text-left"
          >
            <div>
              <h2 className="font-semibold text-gray-900">{t('dataView.symptomEntries')}</h2>
              <p className="text-sm text-gray-600">{entries.length} {t('dataView.entries')}</p>
            </div>
            <span className="text-gray-400">{expandedSection === 'symptoms' ? '🔽' : '▶️'}</span>
          </button>
          {expandedSection === 'symptoms' && (
            <div className="mt-4 space-y-2 border-t pt-4">
              {entries.length === 0 ? (
                <p className="text-sm text-gray-500">{t('dataView.noEntries')}</p>
              ) : (
                entries.slice(0, 10).map((entry) => (
                  <div key={entry.id} className="p-3 bg-gray-50 rounded text-sm">
                    <p className="font-medium text-gray-900">{entry.symptoms}</p>
                    <p className="text-gray-600">
                      {new Date(entry.loggedDate).toLocaleDateString()}
                    </p>
                    {entry.severity && (
                      <p className="text-gray-500 text-xs">{t('dataView.severity')} {t(`severity.${entry.severity}`)}</p>
                    )}
                  </div>
                ))
              )}
              {entries.length > 10 && (
                <p className="text-sm text-gray-500 text-center pt-2">
                  {t('dataView.showing')} 10 {t('dataView.of')} {entries.length} {t('dataView.entries')}
                </p>
              )}
            </div>
          )}
        </Card>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" fullWidth onClick={() => handleNavigate('/privacy')}>
          {t('common.back')}
        </Button>
        <Button variant="primary" fullWidth onClick={() => handleNavigate('/privacy/export')}>
          {t('dataView.exportData')}
        </Button>
      </div>
    </div>
  );
}

