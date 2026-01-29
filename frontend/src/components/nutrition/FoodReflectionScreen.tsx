import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFoodReflection } from '../../hooks/useFoodReflection';
import { useTranslation } from '../../hooks/useTranslation';
import { useOffline } from '../../hooks/useOffline';
import { FoodReflectionType, FoodReflectionAnalysis, MealType } from '../../types';
import Card from '../shared/Card';
import Button from '../shared/Button';
import AIIndicator from '../shared/AIIndicator';

export default function FoodReflectionScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const isOffline = useOffline();
  const { reflection, loading, analyzeReflection, saveReflection, getReflectionForDateAndMeal } =
    useFoodReflection();

  // Get mealType from URL params or default to current meal based on time
  const getDefaultMealType = (): MealType => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 10) return 'breakfast';
    if (hour >= 10 && hour < 14) return 'lunch';
    if (hour >= 14 && hour < 20) return 'dinner';
    return 'snack';
  };

  const [selectedMealType, setSelectedMealType] = useState<MealType>(
    (searchParams.get('mealType') as MealType) || getDefaultMealType()
  );
  const [selectedDate] = useState<string>(
    searchParams.get('date') || new Date().toISOString().split('T')[0]
  );
  const [selectedType, setSelectedType] = useState<FoodReflectionType | null>(null);
  const [notes, setNotes] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [localAiAnalysis, setLocalAiAnalysis] = useState<FoodReflectionAnalysis | null>(null);

  // Load reflection for selected date and meal type
  useEffect(() => {
    const loadReflection = async () => {
      try {
        const loaded = await getReflectionForDateAndMeal(selectedDate, selectedMealType);
        if (loaded) {
          setSelectedType(loaded.reflection);
          setNotes(loaded.notes || '');
          if (loaded.aiAnalysis) {
            setLocalAiAnalysis(loaded.aiAnalysis);
          }
          if (loaded.processingStatus === 'completed' && loaded.aiAnalysis) {
            setSaved(true);
          }
        } else {
          setSelectedType(null);
          setNotes('');
          setLocalAiAnalysis(null);
          setSaved(false);
        }
      } catch (err) {
        console.error('Failed to load reflection:', err);
      }
    };
    loadReflection();
  }, [selectedDate, selectedMealType, getReflectionForDateAndMeal]);

  const handleAnalyze = async () => {
    if (!selectedType) {
      setError(t('nutrition.record.selectType'));
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);
      // Clear previous analysis results before starting new analysis
      setLocalAiAnalysis(null);
      const aiAnalysis = await analyzeReflection(selectedType, selectedMealType, notes || null);
      setLocalAiAnalysis(aiAnalysis);
    } catch (err: any) {
      setError(err.message || t('nutrition.record.failedToAnalyze'));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!selectedType) {
      setError(t('nutrition.record.selectType'));
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await saveReflection(
        selectedType,
        selectedMealType,
        notes || null,
        localAiAnalysis,
        selectedDate
      );
      setSaved(true);

      // Trigger custom event to notify calendar components to refresh
      window.dispatchEvent(
        new CustomEvent('foodReflectionSaved', {
          detail: { date: selectedDate, mealType: selectedMealType },
        })
      );
    } catch (err: any) {
      setError(err.message || t('nutrition.record.failedToSave'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <p className="text-gray-600 font-body">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading text-gray-900 mb-3">
            {t('nutrition.record.title')}
          </h1>
          <p className="text-gray-600 font-body text-base leading-relaxed">
            {t('nutrition.record.description')}
          </p>
        </div>

        {/* Meal type selection */}
        <Card className="mb-6 bg-white shadow-lg border-0">
          <label className="block mb-4 text-base font-semibold text-gray-800 font-body">
            {t('nutrition.record.mealTypeLabel')}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map(mealType => (
              <button
                key={mealType}
                onClick={() => {
                  setSelectedMealType(mealType);
                  setLocalAiAnalysis(null);
                  setSaved(false);
                }}
                className={`
                  touch-target
                  p-3
                  rounded-xl
                  font-body
                  text-xs
                  font-medium
                  transition-all
                  duration-200
                  ${
                    selectedMealType === mealType
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 hover:border-blue-300'
                  }
                `}
              >
                {t(`nutrition.record.mealType.${mealType}`)}
              </button>
            ))}
          </div>
        </Card>

        {/* Three large reflection buttons */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          <button
            onClick={() => setSelectedType('light')}
            className={`
              w-full
              p-6
              text-left
              rounded-2xl
              transition-all
              duration-200
              min-h-[140px]
              ${
                selectedType === 'light'
                  ? 'bg-green-50 border-4 border-green-500 shadow-lg'
                  : 'bg-white hover:bg-gray-50 border-2 border-gray-200 shadow-md hover:shadow-lg'
              }
            `}
          >
            <div className="flex items-center gap-5">
              <span className="text-5xl">🌱</span>
              <div>
                <h3 className="text-xl font-heading text-gray-900 mb-2">
                  {t('nutrition.record.light')}
                </h3>
                <p className="text-sm text-gray-600 font-body leading-relaxed">
                  {t('nutrition.record.lightDesc')}
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedType('normal')}
            className={`
              w-full
              p-6
              text-left
              rounded-2xl
              transition-all
              duration-200
              min-h-[140px]
              ${
                selectedType === 'normal'
                  ? 'bg-blue-50 border-4 border-blue-500 shadow-lg'
                  : 'bg-white hover:bg-gray-50 border-2 border-gray-200 shadow-md hover:shadow-lg'
              }
            `}
          >
            <div className="flex items-center gap-5">
              <span className="text-5xl">🍽️</span>
              <div>
                <h3 className="text-xl font-heading text-gray-900 mb-2">
                  {t('nutrition.record.normal')}
                </h3>
                <p className="text-sm text-gray-600 font-body leading-relaxed">
                  {t('nutrition.record.normalDesc')}
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedType('indulgent')}
            className={`
              w-full
              p-6
              text-left
              rounded-2xl
              transition-all
              duration-200
              min-h-[140px]
              ${
                selectedType === 'indulgent'
                  ? 'bg-purple-50 border-4 border-purple-500 shadow-lg'
                  : 'bg-white hover:bg-gray-50 border-2 border-gray-200 shadow-md hover:shadow-lg'
              }
            `}
          >
            <div className="flex items-center gap-5">
              <span className="text-5xl">✨</span>
              <div>
                <h3 className="text-xl font-heading text-gray-900 mb-2">
                  {t('nutrition.record.indulgent')}
                </h3>
                <p className="text-sm text-gray-600 font-body leading-relaxed">
                  {t('nutrition.record.indulgentDesc')}
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Optional notes field */}
        <Card className="mb-6 bg-white shadow-lg border-0">
          <label className="block mb-3 text-base font-semibold text-gray-800 font-body">
            {t('nutrition.record.notesLabel')}
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={t('nutrition.record.notesPlaceholder')}
            className="
              w-full
              p-4
              rounded-xl
              border border-gray-200
              bg-gray-50
              text-gray-900
              font-body
              text-base
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
              focus:border-blue-500
              focus:bg-white
              resize-none
              min-h-[120px]
              transition-all
            "
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-2 font-body">
            {notes.length}/500 {t('common.characters')}
          </p>
        </Card>

        {/* AI Analysis Display */}
        {localAiAnalysis && (
          <Card className="mb-6 bg-blue-50 border border-blue-200 shadow-lg">
            <div className="flex items-start gap-3 mb-4">
              <AIIndicator status="completed" />
              <h3 className="text-lg font-heading text-gray-900">
                {t('nutrition.record.aiAnalysis')}
              </h3>
            </div>

            {/* Encouragement */}
            <div className="mb-5">
              <p className="text-gray-900 font-body font-semibold mb-2 text-base">
                {t('nutrition.record.encouragement')}
              </p>
              <p className="text-gray-700 font-body leading-relaxed">
                {localAiAnalysis.encouragement}
              </p>
            </div>

            {/* Suggestions */}
            {localAiAnalysis.suggestions.length > 0 && (
              <div className="mb-5">
                <p className="text-gray-900 font-body font-semibold mb-3 text-base">
                  {t('nutrition.record.suggestions')}
                </p>
                <ul className="list-disc list-inside space-y-2">
                  {localAiAnalysis.suggestions.map((suggestion, idx) => (
                    <li key={idx} className="text-gray-700 font-body text-sm leading-relaxed">
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suitability */}
            <div className="mb-5">
              <p className="text-gray-900 font-body font-semibold mb-2 text-base">
                {t('nutrition.record.suitability')}
              </p>
              <p className="text-gray-700 font-body text-sm leading-relaxed">
                {localAiAnalysis.suitability}
              </p>
            </div>

            {/* Disclaimer */}
            <div className="mt-5 pt-4 border-t border-blue-200">
              <p className="text-xs text-gray-600 font-body italic">{localAiAnalysis.disclaimer}</p>
            </div>
          </Card>
        )}

        {/* AI Processing Indicator */}
        {analyzing && (
          <Card className="mb-6 bg-blue-50 border border-blue-200 shadow-sm">
            <div className="flex items-center gap-4">
              <AIIndicator status="processing" />
              <div>
                <p className="font-medium text-blue-900 font-body text-base">
                  {t('nutrition.record.aiProcessing')}
                </p>
                <p className="text-sm text-blue-700 font-body">
                  {t('nutrition.record.aiProcessingNote')}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Offline warning */}
        {isOffline && (
          <Card className="mb-6 bg-yellow-50 border border-yellow-200 shadow-sm">
            <p className="text-yellow-800 text-sm font-body">{t('nutrition.record.offline')}</p>
          </Card>
        )}

        {/* Success message */}
        {saved && !reflection?.aiAnalysis && (
          <Card className="mb-6 bg-green-50 border border-green-200 shadow-sm">
            <p className="text-green-800 font-body">{t('nutrition.record.saved')}</p>
          </Card>
        )}

        {/* Error message */}
        {error && (
          <Card className="mb-6 bg-red-50 border border-red-200 shadow-sm">
            <p className="text-red-700 text-sm font-body">{error}</p>
          </Card>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                navigate('/nutrition');
              }}
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {t('common.back')}
            </Button>
            {!localAiAnalysis && (
              <Button
                variant="secondary"
                fullWidth
                onClick={handleAnalyze}
                disabled={!selectedType || analyzing || isOffline}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {analyzing ? t('common.loading') : t('nutrition.record.aiAnalyze')}
              </Button>
            )}
            {localAiAnalysis && (
              <Button
                variant="primary"
                fullWidth
                onClick={handleSave}
                disabled={!selectedType || saving || isOffline}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {saving ? t('common.loading') : t('common.save')}
              </Button>
            )}
          </div>
          {localAiAnalysis && (
            <Button
              variant="outline"
              fullWidth
              onClick={handleAnalyze}
              disabled={analyzing || isOffline}
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {analyzing ? t('common.loading') : t('nutrition.record.reanalyze')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
