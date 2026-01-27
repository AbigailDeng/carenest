import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Leaf, Utensils, Coffee, Droplet } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useFoodReflection } from '../../hooks/useFoodReflection';
import { useTranslation } from '../../hooks/useTranslation';
import { useOffline } from '../../hooks/useOffline';
import { useCompanion } from '../../hooks/useCompanion';
import { FoodReflection, FoodReflectionType, FoodReflectionAnalysis, MealType } from '../../types';
import AIIndicator from '../shared/AIIndicator';
import ImageBackground from '../shared/ImageBackground';
import FloatingParticles from '../companion/FloatingParticles';
import CharacterAvatar from '../companion/CharacterAvatar';
import Toast from '../shared/Toast';

export default function FoodReflectionScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, locale } = useTranslation();
  const isOffline = useOffline();
  const { characterState } = useCompanion('baiqi');
  const { loading, analyzeReflection, saveReflection, getReflectionForDateAndMeal } =
    useFoodReflection();

  // Background image URL - nutrition-specific Bai Qi illustration
  const BACKGROUND_URL = '/images/008fP45sly1hreaeb88b2j323s35s1l1.jpg';

  // Premium glassmorphism constants - improved readability
  const GLASS_BG = 'rgba(255, 255, 255, 0.85)'; // Increased opacity for better readability
  const GLASS_BLUR = 'blur(10px)'; // Reduced blur for clearer text
  const GLASS_BORDER = '1px solid rgba(255, 255, 255, 0.6)';
  const GLASS_SHADOW = '0 2px 12px rgba(0, 0, 0, 0.1)';

  // Get mealType from URL params or default to current meal based on time
  const getDefaultMealType = (): MealType => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 10) return 'breakfast';
    if (hour >= 10 && hour < 14) return 'lunch';
    if (hour >= 14 && hour < 20) return 'dinner';
    return 'snack';
  };

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const [selectedMealType, setSelectedMealType] = useState<MealType>(getDefaultMealType());
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
  const [selectedType, setSelectedType] = useState<FoodReflectionType | null>(null);
  const [notes, setNotes] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [localAiAnalysis, setLocalAiAnalysis] = useState<FoodReflectionAnalysis | null>(null);
  const [existingRecord, setExistingRecord] = useState<FoodReflection | null>(null);

  // Sync state with URL params (supports navigation between saved meals)
  useEffect(() => {
    const dateParam = searchParams.get('date') || getTodayDate();
    const mealTypeParam = (searchParams.get('mealType') as MealType) || getDefaultMealType();
    setSelectedDate(dateParam);
    setSelectedMealType(mealTypeParam);
  }, [searchParams]);

  // Load reflection for selected date and meal type
  useEffect(() => {
    const loadReflection = async () => {
      try {
        const loaded = await getReflectionForDateAndMeal(selectedDate, selectedMealType);
        if (loaded) {
          setExistingRecord(loaded);
          setSelectedType(loaded.reflection);
          setNotes(loaded.notes || '');
          setLocalAiAnalysis(loaded.aiAnalysis || null);
        } else {
          setExistingRecord(null);
          setSelectedType(null);
          setNotes('');
          setLocalAiAnalysis(null);
        }
      } catch (err) {
        console.error('Failed to load reflection:', err);
      }
    };
    loadReflection();
  }, [selectedDate, selectedMealType, getReflectionForDateAndMeal, searchParams]);

  const handleAnalyze = async () => {
    if (!selectedType) {
      setError(t('nutrition.record.selectType'));
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);
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
      const savedRecord = await saveReflection(
        selectedType,
        selectedMealType,
        notes || null,
        localAiAnalysis,
        selectedDate
      );
      setExistingRecord(savedRecord);
      setShowToast(true);

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

  // Meal type icons mapping
  const mealTypeIcons = {
    breakfast: Coffee,
    lunch: Utensils,
    dinner: Utensils,
    snack: Droplet,
  };

  // Reflection type icons mapping (replacing emoji)
  const reflectionTypeIcons = {
    light: Leaf,
    normal: Utensils,
    indulgent: Utensils,
  };

  if (loading) {
    return (
      <div
        className="relative min-h-screen"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: '100vh',
          margin: 0,
          padding: 0,
        }}
      >
        <ImageBackground imageUrl={BACKGROUND_URL} />
        <div
          className="relative flex items-center justify-center z-10"
          style={{ minHeight: '100vh' }}
        >
          <div className="text-center">
            <p className="text-gray-600" style={{ color: '#4A4A4A' }}>
              {t('common.loading')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '100vh',
        margin: 0,
        padding: 0,
        background: 'transparent',
      }}
    >
      {/* ImageBackground - nutrition-specific Bai Qi illustration */}
      <ImageBackground imageUrl={BACKGROUND_URL} />

      {/* Floating Particles */}
      <div className="absolute inset-0" style={{ zIndex: 2 }}>
        <FloatingParticles count={20} />
      </div>

      {/* Glassmorphism back button */}
      <button
        onClick={() => navigate('/nutrition/timeline')}
        className="fixed top-5 left-5 z-50 rounded-full flex items-center justify-center transition-all duration-200 touch-target"
        style={{
          width: '44px',
          height: '44px',
          background: GLASS_BG,
          backdropFilter: GLASS_BLUR,
          border: GLASS_BORDER,
          boxShadow: GLASS_SHADOW,
          color: '#5A4E4E',
        }}
        aria-label={t('common.back')}
      >
        <ChevronLeft size={24} strokeWidth={2} />
      </button>

      {/* Toast notification */}
      {showToast && (
        <Toast
          message={t('nutrition.record.saved') || '记录已保存！'}
          type="success"
          duration={3000}
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Character dialogue bubble - positioned at Bai Qi's shoulder level, left-aligned */}
      <div
        className="fixed left-0 right-0 z-40 flex justify-start w-full"
        style={{
          paddingLeft: '20px',
          paddingRight: '20px',
          top: localAiAnalysis ? '80px' : '80px',
          pointerEvents: localAiAnalysis ? 'auto' : 'none',
        }}
      >
        <div
          className="flex items-start gap-2 rounded-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.9)', // More opaque for readability
            backdropFilter: 'blur(8px)', // Reduced blur
            border: '1px solid rgba(200, 200, 200, 0.5)',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
            maxWidth: localAiAnalysis ? '85%' : 'max-w-xs',
            height: localAiAnalysis ? '180px' : 'auto',
            maxHeight: localAiAnalysis ? '180px' : 'auto',
            overflow: 'hidden',
            padding: localAiAnalysis ? '12px' : '8px 12px',
            pointerEvents: 'auto',
          }}
        >
          <CharacterAvatar
            characterId="baiqi"
            characterState={characterState}
            size="sm"
            showBadge={false}
          />
          <div
            className="flex-1 min-w-0"
            style={{
              height: localAiAnalysis ? '100%' : 'auto',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {localAiAnalysis && !analyzing ? (
              // AI conclusion replaces initial prompt - scrollable content area
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  WebkitOverflowScrolling: 'touch',
                  paddingRight: '4px',
                }}
              >
                <p
                  className="text-sm font-medium mb-2 leading-relaxed"
                  style={{ color: '#2A2A2A' }}
                >
                  {localAiAnalysis.encouragement}
                </p>
                {localAiAnalysis.suggestions && localAiAnalysis.suggestions.length > 0 && (
                  <ul
                    className="text-xs space-y-1 font-medium"
                    style={{ color: '#2A2A2A', opacity: 0.9 }}
                  >
                    {localAiAnalysis.suggestions.map((suggestion: string, index: number) => (
                      <li key={index} className="flex items-start gap-1 leading-relaxed">
                        <span>·</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {localAiAnalysis.suitability && (
                  <p
                    className="text-xs mt-2 font-medium leading-relaxed"
                    style={{ color: '#2A2A2A', opacity: 0.9 }}
                  >
                    {localAiAnalysis.suitability}
                  </p>
                )}
              </div>
            ) : (
              // Initial prompt
              <p className="text-sm font-medium flex-1" style={{ color: '#2A2A2A' }}>
                {t('nutrition.reflection.prompt')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div
        className="relative z-10 pb-32 min-h-screen w-full"
        style={{ paddingLeft: '20px', paddingRight: '20px' }}
      >
        <div
          className="w-full"
          style={{
            paddingTop: localAiAnalysis ? '280px' : '180px',
            paddingBottom: '100px',
          }}
        >
          <div className="space-y-4" style={{ gap: '15px' }}>
            {/* Meal type selection - glassmorphism */}
            <div
              className="p-5 rounded-2xl"
              style={{
                background: GLASS_BG,
                backdropFilter: GLASS_BLUR,
                border: GLASS_BORDER,
                boxShadow: GLASS_SHADOW,
                borderRadius: '16px',
              }}
            >
              <label
                className="block mb-4 text-base font-bold"
                style={{
                  color: '#2A2A2A', // Darker text for better readability
                  fontWeight: 700,
                }}
              >
                {t('nutrition.record.mealTypeLabel')}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map(mealType => {
                  const IconComponent = mealTypeIcons[mealType];
                  return (
                    <button
                      key={mealType}
                      onClick={() => {
                        setSelectedMealType(mealType);
                        setLocalAiAnalysis(null);
                      }}
                      className="touch-target p-3 rounded-xl font-body text-xs font-medium transition-all duration-200"
                      style={{
                        background:
                          selectedMealType === mealType
                            ? 'rgba(255, 126, 157, 0.9)' // Solid background when selected
                            : 'rgba(255, 255, 255, 0.7)', // More opaque for readability
                        backdropFilter: selectedMealType === mealType ? 'none' : GLASS_BLUR,
                        border:
                          selectedMealType === mealType
                            ? '2px solid rgba(255, 126, 157, 1)'
                            : '1px solid rgba(200, 200, 200, 0.5)',
                        color: selectedMealType === mealType ? '#FFFFFF' : '#2A2A2A', // High contrast text
                        fontWeight: selectedMealType === mealType ? 700 : 500,
                      }}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <IconComponent size={18} strokeWidth={2} />
                        <span>{t(`nutrition.record.mealType.${mealType}`)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reflection type buttons - small compact buttons */}
            <div
              className="p-5 rounded-2xl"
              style={{
                background: GLASS_BG,
                backdropFilter: GLASS_BLUR,
                border: GLASS_BORDER,
                boxShadow: GLASS_SHADOW,
                borderRadius: '16px',
              }}
            >
              <label
                className="block mb-3 text-base font-bold"
                style={{
                  color: '#2A2A2A', // Darker text for better readability
                  fontWeight: 700,
                }}
              >
                {t('nutrition.record.reflectionTypeLabel') || '选择类型'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['light', 'normal', 'indulgent'] as FoodReflectionType[]).map(type => {
                  const IconComponent = reflectionTypeIcons[type];
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className="touch-target p-3 rounded-xl font-body text-xs font-medium transition-all duration-200"
                      style={{
                        background:
                          selectedType === type
                            ? 'rgba(255, 126, 157, 0.9)' // Solid background when selected
                            : 'rgba(255, 255, 255, 0.7)', // More opaque for readability
                        backdropFilter: selectedType === type ? 'none' : GLASS_BLUR,
                        border:
                          selectedType === type
                            ? '2px solid rgba(255, 126, 157, 1)'
                            : '1px solid rgba(200, 200, 200, 0.5)',
                        color: selectedType === type ? '#FFFFFF' : '#2A2A2A', // High contrast text
                        fontWeight: selectedType === type ? 700 : 500,
                      }}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <IconComponent size={20} strokeWidth={2} />
                        <span>{t(`nutrition.record.${type}`)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes field - glassmorphism */}
            <div
              className="p-5 rounded-2xl"
              style={{
                background: GLASS_BG,
                backdropFilter: GLASS_BLUR,
                border: GLASS_BORDER,
                boxShadow: GLASS_SHADOW,
                borderRadius: '16px',
              }}
            >
              <label
                className="block mb-3 text-base font-bold"
                style={{
                  color: '#2A2A2A', // Darker text for better readability
                  fontWeight: 700,
                }}
              >
                {t('nutrition.record.notesLabel')}
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={t('nutrition.record.notesPlaceholder')}
                className="w-full px-3 py-2 rounded-lg resize-none focus:outline-none placeholder:opacity-50"
                style={{
                  background: 'rgba(255, 255, 255, 0.9)', // More opaque for readability
                  border: '1px solid rgba(200, 200, 200, 0.5)',
                  color: '#2A2A2A', // Darker text
                  fontSize: '16px',
                }}
                rows={6}
                maxLength={500}
              />
              <p className="mt-2 text-xs font-medium" style={{ color: '#2A2A2A', opacity: 0.7 }}>
                {notes.length}/500 {t('common.characters')}
              </p>
            </div>

            {/* Analyzing indicator */}
            {analyzing && (
              <div
                className="p-4 rounded-2xl"
                style={{
                  background: GLASS_BG,
                  backdropFilter: GLASS_BLUR,
                  border: GLASS_BORDER,
                  boxShadow: GLASS_SHADOW,
                  borderRadius: '16px',
                }}
              >
                <div className="flex items-center gap-3">
                  <AIIndicator status="processing" />
                  <p className="text-sm font-medium" style={{ color: '#2A2A2A' }}>
                    {t('nutrition.record.aiProcessing')}
                  </p>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div
                className="p-5 rounded-2xl"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  backdropFilter: GLASS_BLUR,
                  border: GLASS_BORDER,
                  boxShadow: GLASS_SHADOW,
                  borderRadius: '16px',
                }}
              >
                <p className="text-sm font-bold" style={{ color: '#DC2626' }}>
                  {error}
                </p>
              </div>
            )}

            {/* Offline message */}
            {isOffline && !localAiAnalysis && (
              <div
                className="p-5 rounded-2xl"
                style={{
                  background: 'rgba(234, 179, 8, 0.15)',
                  backdropFilter: GLASS_BLUR,
                  border: GLASS_BORDER,
                  boxShadow: GLASS_SHADOW,
                  borderRadius: '16px',
                }}
              >
                <p className="text-sm font-bold" style={{ color: '#CA8A04' }}>
                  {t('nutrition.record.offline')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed bottom action buttons - equal width, glassmorphism */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 pb-6 pt-4 w-full"
        style={{ background: 'transparent', paddingLeft: '20px', paddingRight: '20px' }}
      >
        <div className="w-full">
          <div className="flex gap-3">
            {/* Cancel button */}
            <div className="flex-1">
              <button
                type="button"
                onClick={() => navigate('/nutrition/timeline')}
                disabled={analyzing || saving}
                className="w-full px-4 py-3 rounded-xl font-semibold transition-all disabled:opacity-40"
                style={{
                  background: GLASS_BG,
                  backdropFilter: GLASS_BLUR,
                  border: GLASS_BORDER,
                  boxShadow: GLASS_SHADOW,
                  color: '#2A2A2A',
                  fontWeight: 700,
                }}
              >
                {t('common.cancel')}
              </button>
            </div>
            {/* Save button - always available when reflection type is selected */}
            <button
              type="button"
              onClick={handleSave}
              disabled={!selectedType || saving || isOffline}
              className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all disabled:opacity-40"
              style={{
                background: 'rgba(255, 126, 157, 0.9)', // Solid pink background matching selected state
                color: '#FFFFFF', // White text for high contrast
                fontWeight: 700,
                boxShadow: '0 2px 8px rgba(255, 126, 157, 0.4)',
              }}
            >
              {saving ? t('common.loading') : t('common.save')}
            </button>
          </div>

          {/* Optional analyze / re-analyze (keeps bottom primary actions to 2 buttons) */}
          <div className="mt-3">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!selectedType || analyzing || isOffline}
              className="w-full px-4 py-3 rounded-xl font-semibold transition-all disabled:opacity-40"
              style={{
                background: GLASS_BG,
                backdropFilter: GLASS_BLUR,
                border: GLASS_BORDER,
                boxShadow: GLASS_SHADOW,
                color: '#2A2A2A',
                fontWeight: 700,
              }}
            >
              {analyzing
                ? t('common.loading')
                : localAiAnalysis
                  ? t('nutrition.record.reanalyze')
                  : t('nutrition.record.aiAnalyze')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
