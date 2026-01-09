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
  const { reflection, loading, analyzeReflection, saveReflection, getReflectionForDateAndMeal } = useFoodReflection();
  
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
  const [selectedDate, setSelectedDate] = useState<string>(
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
    if (getReflectionForDateAndMeal) {
      loadReflection();
    }
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
      await saveReflection(selectedType, selectedMealType, notes || null, localAiAnalysis, selectedDate);
      setSaved(true);
    } catch (err: any) {
      setError(err.message || t('nutrition.record.failedToSave'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-clay-bg">
        <p className="text-clay-textDim font-body">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-clay-bg pb-20">
      <h1 className="text-2xl font-heading text-clay-text mb-6">
        {t('nutrition.record.title')}
      </h1>

      <p className="text-clay-textDim font-body mb-6">
        {t('nutrition.record.description')}
      </p>

      {/* Meal type selection */}
      <Card className="mb-6">
        <label className="block mb-3 text-sm font-semibold text-clay-text font-body">
          {t('nutrition.record.mealTypeLabel')}
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((mealType) => (
            <button
              key={mealType}
              onClick={() => {
                setSelectedMealType(mealType);
                setLocalAiAnalysis(null);
                setSaved(false);
              }}
              className={`
                clay-button
                p-3
                rounded-[18px]
                font-body
                text-sm
                transition-all
                ${selectedMealType === mealType
                  ? 'bg-clay-primary text-white shadow-clay-extrude'
                  : 'bg-white text-clay-text border-2 border-clay-lavender hover:bg-clay-mint'}
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
            clay-button clay-card
            p-6 text-left
            transition-all duration-200
            min-h-[120px]
            ${selectedType === 'light' 
              ? 'bg-clay-mint border-4 border-clay-primary shadow-clay-extrude' 
              : 'bg-white hover:bg-clay-mint border-2 border-clay-lavender'}
          `}
        >
          <div className="flex items-center gap-4">
            <span className="text-5xl">🌱</span>
            <div>
              <h3 className="text-xl font-heading text-clay-text mb-1">
                {t('nutrition.record.light')}
              </h3>
              <p className="text-sm text-clay-textDim font-body">
                {t('nutrition.record.lightDesc')}
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setSelectedType('normal')}
          className={`
            clay-button clay-card
            p-6 text-left
            transition-all duration-200
            min-h-[120px]
            ${selectedType === 'normal' 
              ? 'bg-clay-mint border-4 border-clay-primary shadow-clay-extrude' 
              : 'bg-white hover:bg-clay-mint border-2 border-clay-lavender'}
          `}
        >
          <div className="flex items-center gap-4">
            <span className="text-5xl">🍽️</span>
            <div>
              <h3 className="text-xl font-heading text-clay-text mb-1">
                {t('nutrition.record.normal')}
              </h3>
              <p className="text-sm text-clay-textDim font-body">
                {t('nutrition.record.normalDesc')}
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setSelectedType('indulgent')}
          className={`
            clay-button clay-card
            p-6 text-left
            transition-all duration-200
            min-h-[120px]
            ${selectedType === 'indulgent' 
              ? 'bg-clay-mint border-4 border-clay-primary shadow-clay-extrude' 
              : 'bg-white hover:bg-clay-mint border-2 border-clay-lavender'}
          `}
        >
          <div className="flex items-center gap-4">
            <span className="text-5xl">✨</span>
            <div>
              <h3 className="text-xl font-heading text-clay-text mb-1">
                {t('nutrition.record.indulgent')}
              </h3>
              <p className="text-sm text-clay-textDim font-body">
                {t('nutrition.record.indulgentDesc')}
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Optional notes field */}
      <Card className="mb-6">
        <label className="block mb-2 text-sm font-semibold text-clay-text">
          {t('nutrition.record.notesLabel')}
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('nutrition.record.notesPlaceholder')}
          className="
            w-full
            p-4
            rounded-[20px]
            border-2 border-clay-lavender
            bg-white
            text-clay-text
            font-body
            text-base
            focus:outline-none
            focus:ring-2
            focus:ring-clay-primary
            focus:border-clay-primary
            resize-none
            min-h-[100px]
          "
          maxLength={500}
        />
        <p className="text-xs text-clay-textDim mt-2">
          {notes.length}/500 {t('common.characters')}
        </p>
      </Card>

      {/* AI Analysis Display */}
      {localAiAnalysis && (
        <Card className="mb-6 border-clay-primary bg-clay-mint">
          <div className="flex items-start gap-3 mb-3">
            <AIIndicator status="completed" />
            <h3 className="text-lg font-heading text-clay-text">
              {t('nutrition.record.aiAnalysis')}
            </h3>
          </div>
          
          {/* Encouragement */}
          <div className="mb-4">
            <p className="text-clay-text font-body font-semibold mb-2">
              {t('nutrition.record.encouragement')}
            </p>
            <p className="text-clay-textDim font-body">
              {localAiAnalysis.encouragement}
            </p>
          </div>
          
          {/* Suggestions */}
          {localAiAnalysis.suggestions.length > 0 && (
            <div className="mb-4">
              <p className="text-clay-text font-body font-semibold mb-2">
                {t('nutrition.record.suggestions')}
              </p>
              <ul className="list-disc list-inside space-y-1">
                {localAiAnalysis.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="text-clay-textDim font-body text-sm">
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Suitability */}
          <div className="mb-4">
            <p className="text-clay-text font-body font-semibold mb-2">
              {t('nutrition.record.suitability')}
            </p>
            <p className="text-clay-textDim font-body text-sm">
              {localAiAnalysis.suitability}
            </p>
          </div>
          
          {/* Disclaimer */}
          <div className="mt-4 pt-4 border-t border-clay-lavender">
            <p className="text-xs text-clay-textDim font-body italic">
              {localAiAnalysis.disclaimer}
            </p>
          </div>
        </Card>
      )}
      
      {/* AI Processing Indicator */}
      {analyzing && (
        <Card className="mb-6">
          <div className="flex items-center gap-3">
            <AIIndicator status="processing" />
            <div>
              <p className="font-medium text-clay-text font-body">
                {t('nutrition.record.aiProcessing')}
              </p>
              <p className="text-sm text-clay-textDim font-body">
                {t('nutrition.record.aiProcessingNote')}
              </p>
            </div>
          </div>
        </Card>
      )}
      
      {/* Offline warning */}
      {isOffline && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <p className="text-yellow-800 text-sm font-body">
            {t('nutrition.record.offline')}
          </p>
        </Card>
      )}

      {/* Success message */}
      {saved && !reflection?.aiAnalysis && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <p className="text-green-800 font-body">
            {t('nutrition.record.saved')}
          </p>
        </Card>
      )}

      {/* Error message */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <p className="text-red-800 text-sm font-body">{error}</p>
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <Button
            variant="outline"
            fullWidth
            onClick={() => {
              navigate('/nutrition');
            }}
            disabled={false}
          >
            {t('common.back')}
          </Button>
          {!localAiAnalysis && (
            <Button
              variant="secondary"
              fullWidth
              onClick={handleAnalyze}
              disabled={!selectedType || analyzing || isOffline}
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
          >
            {analyzing ? t('common.loading') : t('nutrition.record.reanalyze')}
          </Button>
        )}
      </div>
    </div>
  );
}

