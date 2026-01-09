import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHealthConditions } from '../../hooks/useHealthConditions';
import { useTranslation } from '../../hooks/useTranslation';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Disclaimer from '../shared/Disclaimer';

export default function LifestyleSuggestionsScreen() {
  const { recordId } = useParams<{ recordId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { conditions, loading } = useHealthConditions();

  const [condition, setCondition] = useState(
    conditions.find((c) => c.sourceRecordId === recordId)
  );

  useEffect(() => {
    if (recordId) {
      const found = conditions.find((c) => c.sourceRecordId === recordId);
      setCondition(found);
    }
  }, [recordId, conditions]);

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-gray-50">
        <div className="text-center py-12">
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!condition) {
    return (
      <div className="p-6 min-h-screen bg-gray-50">
        <Card>
          <p className="text-gray-600 mb-4">{t('health.noSuggestions')}</p>
          <Button onClick={() => navigate('/health')}>{t('health.backToHealth')}</Button>
        </Card>
      </div>
    );
  }

  const { avoid, prefer, general } = condition.lifestyleSuggestions;

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('health.lifestyle.title')}</h1>
        <p className="text-sm text-gray-600">{condition.conditionName}</p>
      </div>

      {avoid.length > 0 && (
        <Card className="mb-4 border-red-100">
          <h2 className="text-lg font-semibold text-red-900 mb-3 flex items-center gap-2">
            <span>⚠️</span> {t('health.lifestyle.thingsToAvoid')}
          </h2>
          <ul className="space-y-2">
            {avoid.map((item, index) => (
              <li key={index} className="text-gray-700 flex items-start gap-2">
                <span className="text-red-600">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {prefer.length > 0 && (
        <Card className="mb-4 border-green-100">
          <h2 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
            <span>✅</span> {t('health.lifestyle.thingsToPrefer')}
          </h2>
          <ul className="space-y-2">
            {prefer.map((item, index) => (
              <li key={index} className="text-gray-700 flex items-start gap-2">
                <span className="text-green-600">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {general.length > 0 && (
        <Card className="mb-4 border-blue-100">
          <h2 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <span>💡</span> {t('health.lifestyle.generalAdvice')}
          </h2>
          <ul className="space-y-2">
            {general.map((item, index) => (
              <li key={index} className="text-gray-700 flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {avoid.length === 0 && prefer.length === 0 && general.length === 0 && (
        <Card className="mb-6">
          <p className="text-gray-600 text-center py-4">
            {t('health.lifestyle.noSuggestions')}
          </p>
        </Card>
      )}

      <Disclaimer type="medical" className="mb-6" />

      <Button variant="outline" fullWidth onClick={() => navigate('/health')}>
        {t('health.backToHealth')}
      </Button>
    </div>
  );
}

