import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSymptomEntries } from '../../hooks/useSymptomEntries';
import { useTranslation } from '../../hooks/useTranslation';
import Card from '../shared/Card';
import Button from '../shared/Button';
import AIIndicator from '../shared/AIIndicator';
import Disclaimer from '../shared/Disclaimer';

export default function SymptomAnalysisScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { entries, loading } = useSymptomEntries();

  const [entry, setEntry] = useState(entries.find((e) => e.id === id));

  useEffect(() => {
    if (id) {
      const found = entries.find((e) => e.id === id);
      setEntry(found);
    }
  }, [id, entries]);

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-gray-50">
        <div className="text-center py-12">
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="p-6 min-h-screen bg-gray-50">
        <Card>
          <p className="text-gray-600 mb-4">{t('health.symptoms.entryNotFound')}</p>
          <Button onClick={() => navigate('/health')}>{t('health.backToHealth')}</Button>
        </Card>
      </div>
    );
  }

  const { aiAnalysis, processingStatus, errorMessage } = entry;

  return (
    <div className="p-6 min-h-screen bg-gray-50 pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('health.symptoms.analysisTitle')}</h1>
        <p className="text-sm text-gray-600">
          {new Date(entry.loggedDate).toLocaleDateString()}
        </p>
      </div>

      {/* Symptom Summary */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('health.symptoms.yourSymptoms')}</h2>
        <p className="text-gray-700 mb-2">{entry.symptoms}</p>
        {entry.severity && (
          <p className="text-sm text-gray-600">
            {t('dataView.severity')} {t(`severity.${entry.severity}`)}
          </p>
        )}
        {entry.notes && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">{entry.notes}</p>
          </div>
        )}
      </Card>

      {/* Processing Status */}
      {processingStatus === 'pending' && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <p className="text-yellow-800 text-sm">
            {t('health.symptoms.pendingAnalysis')}
          </p>
        </Card>
      )}

      {processingStatus === 'processing' && (
        <Card className="mb-6">
          <div className="flex items-center gap-3">
            <AIIndicator status="processing" />
            <p className="text-gray-700">{t('health.symptoms.analyzing')}</p>
          </div>
        </Card>
      )}

      {processingStatus === 'failed' && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <p className="text-red-800 text-sm mb-2">{t('health.symptoms.analysisFailed')}</p>
          {errorMessage && (
            <p className="text-red-700 text-sm">{errorMessage}</p>
          )}
        </Card>
      )}

      {/* AI Analysis Results */}
      {processingStatus === 'completed' && aiAnalysis && (
        <>
          <Card className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <AIIndicator status="completed" />
              <h2 className="text-lg font-semibold text-gray-900">{t('health.symptoms.observations')}</h2>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{aiAnalysis.observations}</p>
          </Card>

          {aiAnalysis.possibleCauses.length > 0 && (
            <Card className="mb-4 border-blue-100">
              <h2 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <span>💡</span> {t('health.symptoms.possibleCauses')}
              </h2>
              <ul className="space-y-2">
                {aiAnalysis.possibleCauses.map((cause, index) => (
                  <li key={index} className="text-gray-700 flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>{cause}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {aiAnalysis.suggestions.length > 0 && (
            <Card className="mb-4 border-green-100">
              <h2 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
                <span>✅</span> {t('health.symptoms.suggestions')}
              </h2>
              <ul className="space-y-2">
                {aiAnalysis.suggestions.map((suggestion, index) => (
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
            <p className="text-gray-700">{aiAnalysis.whenToSeekHelp}</p>
          </Card>

          <Card className="mb-6 border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600 italic">{aiAnalysis.disclaimer}</p>
          </Card>
        </>
      )}

      <Disclaimer type="medical" className="mb-6" />

      <div className="flex gap-3">
        <Button variant="primary" fullWidth onClick={() => {
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
      </div>
    </div>
  );
}

