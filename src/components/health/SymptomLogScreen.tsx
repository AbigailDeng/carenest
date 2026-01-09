import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSymptomEntries } from '../../hooks/useSymptomEntries';
import { useTranslation } from '../../hooks/useTranslation';
import { useOffline } from '../../hooks/useOffline';
import { analyzeSymptoms } from '../../services/llmService';
import { validateSymptomEntry } from '../../utils/validation';
import { getEntity } from '../../services/storage/indexedDB';
import { SymptomEntry } from '../../types';
import Card from '../shared/Card';
import Button from '../shared/Button';
import AIIndicator from '../shared/AIIndicator';

export default function SymptomLogScreen() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { t } = useTranslation();
  const { addEntry, updateEntry, loading } = useSymptomEntries();
  const isOffline = useOffline();
  const isEditMode = id && id.startsWith('edit');

  const [symptoms, setSymptoms] = useState('');
  const [notes, setNotes] = useState('');
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [loadingEntry, setLoadingEntry] = useState(false);

  // Load existing entry if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const entryId = id.replace('edit/', '');
      setLoadingEntry(true);
      getEntity<SymptomEntry>('symptomEntries', entryId)
        .then((entry) => {
          if (entry) {
            setSymptoms(entry.symptoms);
            setNotes(entry.notes || '');
            setSeverity(entry.severity);
            setAiAnalysis(entry.aiAnalysis);
          }
        })
        .catch((err) => {
          setError(err.message || t('health.failedToLoad'));
        })
        .finally(() => {
          setLoadingEntry(false);
        });
    }
  }, [id, isEditMode, t]);

  const handleAnalyze = async () => {
    setError(null);

    const now = new Date();
    const entry = {
      symptoms: symptoms.trim(),
      notes: notes.trim() || null,
      severity,
      loggedDate: now.toISOString(),
      loggedTime: now.toISOString(),
    };

    // Validate
    const validation = validateSymptomEntry(entry);
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      // Process with AI (or queue if offline)
      if (isOffline) {
        setError(t('health.symptoms.offline'));
        setAnalyzing(false);
        return;
      }

      const analysis = await analyzeSymptoms({
        symptoms: entry.symptoms,
        notes: entry.notes,
        severity: entry.severity,
      });

      setAiAnalysis(analysis);
      setAnalyzing(false);
    } catch (aiError: any) {
      setError(aiError.message || t('health.symptoms.aiAnalysisFailed'));
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!aiAnalysis && !isEditMode) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const now = new Date().toISOString();
      
      if (isEditMode && id) {
        const entryId = id.replace('edit/', '');
        const existing = await getEntity<SymptomEntry>('symptomEntries', entryId);
        if (!existing) {
          throw new Error('Entry not found');
        }
        
        await updateEntry(entryId, {
          symptoms: symptoms.trim(),
          notes: notes.trim() || null,
          severity,
          aiAnalysis: aiAnalysis || existing.aiAnalysis,
          updatedAt: now,
        });
        navigate(`/health/symptoms/${entryId}`);
      } else {
        const entry = {
          symptoms: symptoms.trim(),
          notes: notes.trim() || null,
          severity,
          loggedDate: now,
          loggedTime: now,
          aiAnalysis,
          processingStatus: 'completed' as const,
          errorMessage: null,
          createdAt: now,
          updatedAt: now,
        };

        const savedEntry = await addEntry(entry);
        navigate(`/health/symptoms/${savedEntry.id}`);
      }
    } catch (err: any) {
      setError(err.message || t('health.failedToSave'));
      setSaving(false);
    }
  };

  if (loadingEntry) {
    return (
      <div className="p-6 min-h-screen bg-gray-50 pb-20">
        <div className="text-center py-12">
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50 pb-20">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditMode ? t('health.symptoms.editTitle') : t('health.symptoms.title')}
      </h1>

      <div className="space-y-4">
        <Card>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            {t('health.symptoms.symptomsLabel')}
          </label>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder={t('health.symptoms.symptomsPlaceholder')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={4}
            required
            minLength={3}
            maxLength={1000}
          />
          <p className="mt-1 text-xs text-gray-500">
            {symptoms.length}/1000 {t('health.symptoms.characters')}
          </p>
        </Card>

        <Card>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            {t('health.symptoms.severityLabel')}
          </label>
          <div className="flex gap-2">
            {(['mild', 'moderate', 'severe'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setSeverity(severity === level ? null : level)}
                className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors touch-target ${
                  severity === level
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                {t(`severity.${level}`)}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            {t('health.symptoms.notesLabel')}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('health.symptoms.notesPlaceholder')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
            maxLength={2000}
          />
          <p className="mt-1 text-xs text-gray-500">
            {notes.length}/2000 {t('health.symptoms.characters')}
          </p>
        </Card>

        {analyzing && (
          <Card className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 mb-1">{t('health.symptoms.analyzing')}</p>
                <p className="text-sm text-gray-600">{t('health.symptoms.analyzingNote')}</p>
              </div>
              <AIIndicator status="processing" />
            </div>
          </Card>
        )}

        {/* AI Analysis Results Preview */}
        {aiAnalysis && !analyzing && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <div className="flex items-center gap-2 mb-3">
              <AIIndicator status="completed" />
              <h2 className="text-lg font-semibold text-gray-900">{t('health.symptoms.aiAnalysisReady')}</h2>
            </div>
            <p className="text-sm text-gray-700 mb-2">{aiAnalysis.observations}</p>
            {aiAnalysis.suggestions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <p className="text-xs font-medium text-gray-600 mb-1">{t('health.symptoms.suggestions')}:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {aiAnalysis.suggestions.slice(0, 3).map((suggestion: string, index: number) => (
                    <li key={index} className="flex items-start gap-1">
                      <span>•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <p className="text-red-800 text-sm">{error}</p>
          </Card>
        )}

        {isOffline && !aiAnalysis && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <p className="text-yellow-800 text-sm">
              {t('health.symptoms.offline')}
            </p>
          </Card>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={() => navigate('/health')}
            disabled={analyzing || saving}
          >
            {t('common.cancel')}
          </Button>
          {!aiAnalysis && !isEditMode ? (
            <Button
              type="button"
              variant="primary"
              fullWidth
              onClick={handleAnalyze}
              disabled={analyzing || loading || symptoms.trim().length < 3 || isOffline}
            >
              {analyzing ? t('health.symptoms.analyzing') : t('health.symptoms.aiDiagnosis')}
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              fullWidth
              onClick={handleSave}
              disabled={saving || loading || symptoms.trim().length < 3}
            >
              {saving ? t('health.symptoms.saving') : t('common.save')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

