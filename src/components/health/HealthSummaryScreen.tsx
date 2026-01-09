import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMedicalRecords } from '../../hooks/useMedicalRecords';
import { useHealthConditions } from '../../hooks/useHealthConditions';
import { useTranslation } from '../../hooks/useTranslation';
import { truncateFilename } from '../../utils/truncate';
import Card from '../shared/Card';
import Button from '../shared/Button';
import AIIndicator from '../shared/AIIndicator';
import Disclaimer from '../shared/Disclaimer';

export default function HealthSummaryScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { records, loading } = useMedicalRecords();
  const { conditions, loading: conditionsLoading } = useHealthConditions();

  const [record, setRecord] = useState(records.find((r) => r.id === id));

  useEffect(() => {
    if (id) {
      const found = records.find((r) => r.id === id);
      setRecord(found);
    }
  }, [id, records]);

  if (loading || conditionsLoading) {
    return (
      <div className="p-6 min-h-screen bg-gray-50">
        <div className="text-center py-12">
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="p-6 min-h-screen bg-gray-50">
        <Card>
          <p className="text-gray-600 mb-4">{t('health.recordNotFound')}</p>
          <Button onClick={() => navigate('/health')}>{t('health.backToHealth')}</Button>
        </Card>
      </div>
    );
  }

  const relatedConditions = conditions.filter(
    (c) => c.sourceRecordId === record.id
  );

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('health.summary.title')}</h1>
        <p className="text-sm text-gray-600" title={record.filename}>
          {truncateFilename(record.filename, 30)}
        </p>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {new Date(record.uploadDate).toLocaleDateString()}
        </span>
      </div>

      {/* AI Analysis Results */}
      {record.processingStatus === 'completed' && record.aiAnalysis && (
        <>
          <Card className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <AIIndicator status="completed" />
              <h2 className="text-lg font-semibold text-gray-900">{t('health.symptoms.observations')}</h2>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{record.aiAnalysis.observations}</p>
          </Card>

          {record.aiAnalysis.possibleCauses.length > 0 && (
            <Card className="mb-4 border-blue-100">
              <h2 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <span>💡</span> {t('health.symptoms.possibleCauses')}
              </h2>
              <ul className="space-y-2">
                {record.aiAnalysis.possibleCauses.map((cause, index) => (
                  <li key={index} className="text-gray-700 flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>{cause}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {record.aiAnalysis.suggestions.length > 0 && (
            <Card className="mb-4 border-green-100">
              <h2 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
                <span>✅</span> {t('health.symptoms.suggestions')}
              </h2>
              <ul className="space-y-2">
                {record.aiAnalysis.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-gray-700 flex items-start gap-2">
                    <span className="text-green-600">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="mb-4 border-orange-100">
            <h2 className="text-lg font-semibold text-orange-900 mb-3 flex items-center gap-2">
              <span>💊</span> {t('health.symptoms.whenToSeekHelp')}
            </h2>
            <p className="text-gray-700">{record.aiAnalysis.whenToSeekHelp}</p>
          </Card>

          <Card className="mb-6 border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600 italic">{record.aiAnalysis.disclaimer}</p>
          </Card>
        </>
      )}

      {/* Fallback to old format for backward compatibility */}
      {record.processingStatus === 'completed' && !record.aiAnalysis && record.aiSummary && (
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('health.summary.summary')}</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{record.aiSummary}</p>
        </Card>
      )}

      {record.processingStatus === 'pending' && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <p className="text-yellow-800 text-sm">
            {t('health.summary.pending')}
          </p>
        </Card>
      )}

      {record.processingStatus === 'processing' && (
        <Card className="mb-6">
          <div className="flex items-center gap-3">
            <AIIndicator status="processing" />
            <p className="text-gray-700">{t('health.summary.processing')}</p>
          </div>
        </Card>
      )}

      {record.processingStatus === 'failed' && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <p className="text-red-800 text-sm mb-2">{t('health.summary.failed')}</p>
          {record.errorMessage && (
            <p className="text-red-700 text-sm">{record.errorMessage}</p>
          )}
        </Card>
      )}

      {relatedConditions.length > 0 && (
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('health.summary.relatedConditions')}</h2>
          <div className="space-y-2">
            {relatedConditions.map((condition) => (
              <div key={condition.id} className="p-3 bg-gray-50 rounded">
                <p className="font-medium text-gray-900">{condition.conditionName}</p>
                <p className="text-sm text-gray-600">
                  {new Date(condition.documentedDate).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Disclaimer type="medical" className="mb-6" />

      <div className="flex gap-3">
        <Button variant="outline" fullWidth onClick={() => {
          // Return to timeline list view if coming from timeline
          const viewMode = sessionStorage.getItem('timelineViewMode');
          if (viewMode === 'timeline') {
            navigate('/health/timeline?view=timeline');
          } else {
            navigate(-1);
          }
        }}>
          {t('common.back')}
        </Button>
        {relatedConditions.length > 0 && (
          <Button
            variant="primary"
            fullWidth
            onClick={() => navigate(`/health/lifestyle/${record.id}`)}
          >
            {t('health.summary.viewLifestyle')}
          </Button>
        )}
      </div>
    </div>
  );
}

