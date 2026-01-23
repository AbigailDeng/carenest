import { useEffect, useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useFoodReflection } from '../../hooks/useFoodReflection';
import { MealSuggestion, MealType, FoodReflectionType } from '../../types';
import Card from '../shared/Card';
import Button from '../shared/Button';
import AIIndicator from '../shared/AIIndicator';

interface MealDetailScreenProps {
  meal: MealSuggestion | null;
  isOpen: boolean;
  onClose: () => void;
  detailedPreparationMethod: string | null;
  imageUrl: string | null;
  loading: boolean;
}

export default function MealDetailScreen({
  meal,
  isOpen,
  onClose,
  detailedPreparationMethod,
  imageUrl,
  loading,
}: MealDetailScreenProps) {
  const { t } = useTranslation();
  const { saveReflection } = useFoodReflection();

  // Get default mealType based on current time
  const getDefaultMealType = (): MealType => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 10) return 'breakfast';
    if (hour >= 10 && hour < 14) return 'lunch';
    if (hour >= 14 && hour < 20) return 'dinner';
    return 'snack';
  };

  // State for mealType and reflection selection
  const [selectedMealType, setSelectedMealType] = useState<MealType>(getDefaultMealType());
  const [selectedReflection, setSelectedReflection] = useState<FoodReflectionType>('normal');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Reset state when meal changes or drawer opens
  useEffect(() => {
    if (isOpen && meal) {
      setSelectedMealType(getDefaultMealType());
      setSelectedReflection('normal');
      setSaveError(null);
      setSaveSuccess(false);
    }
  }, [isOpen, meal]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !meal) return null;

  // Handle save meal as eaten
  const handleSaveMeal = async () => {
    if (!meal) return;

    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      const today = new Date().toISOString().split('T')[0];
      await saveReflection(
        selectedReflection,
        selectedMealType,
        meal.mealName, // Use meal name as notes
        null, // No AI analysis for saved meals
        today
      );

      setSaveSuccess(true);
      // Close drawer after a short delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setSaveError(err.message || t('nutrition.detail.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  // Parse step-by-step preparation method
  const preparationSteps = detailedPreparationMethod
    ? detailedPreparationMethod.split('\n').filter(step => step.trim().length > 0)
    : [];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Drawer */}
      <div
        className={`
          fixed left-0 right-0 bottom-0
          max-h-[90vh] bg-white rounded-t-[20px] z-50
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
          flex flex-col
          shadow-clay-extrude
        `}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-12 h-1 bg-clay-textDim rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-clay-lavender">
          <h2 className="text-xl font-heading text-clay-text">
            {meal.mealName}
          </h2>
          <button
            onClick={onClose}
            className="touch-target p-2 text-clay-textDim hover:text-clay-text rounded-[18px] hover:bg-clay-mint transition-colors"
            aria-label={t('common.close')}
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Loading indicator */}
          {loading && (
            <Card className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-clay-text mb-1 font-body">
                    {t('nutrition.detail.generating')}
                  </p>
                  <p className="text-sm text-clay-textDim font-body">
                    {t('nutrition.detail.generatingNote')}
                  </p>
                </div>
                <AIIndicator status="processing" />
              </div>
            </Card>
          )}

          {/* Description */}
          <Card className="mb-6">
            <p className="text-clay-textDim font-body">
              {meal.description}
            </p>
          </Card>

          {/* Image */}
          {imageUrl ? (
            <Card className="mb-6 p-0 overflow-hidden">
              <img
                src={imageUrl}
                alt={meal.mealName}
                className="w-full h-auto object-cover"
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </Card>
          ) : (
            !loading && (
              <Card className="mb-6 border-clay-lavender bg-clay-mint">
                <div className="flex flex-col items-center justify-center py-12">
                  <span className="text-6xl mb-4">🍽️</span>
                  <p className="text-clay-textDim font-body text-center">
                    {t('nutrition.detail.noImage')}
                  </p>
                </div>
              </Card>
            )
          )}

          {/* Ingredients */}
          {meal.ingredients.length > 0 && (
            <Card className="mb-6">
              <p className="text-sm font-semibold text-clay-text mb-2 font-body">
                {t('nutrition.suggestions.ingredients')}:
              </p>
              <ul className="list-disc list-inside text-sm text-clay-textDim font-body space-y-1">
                {meal.ingredients.map((ing, idx) => (
                  <li key={idx}>{ing}</li>
                ))}
              </ul>
            </Card>
          )}

          {/* Detailed Preparation Method */}
          {preparationSteps.length > 0 && (
            <Card className="mb-6">
              <p className="text-sm font-semibold text-clay-text mb-3 font-body">
                {t('nutrition.detail.preparationMethod')}:
              </p>
              <ol className="list-decimal list-inside text-sm text-clay-textDim font-body space-y-2">
                {preparationSteps.map((step, idx) => (
                  <li key={idx} className="pl-2">
                    {step.replace(/^\d+\.\s*/, '')}
                  </li>
                ))}
              </ol>
            </Card>
          )}

          {/* Fallback to basic preparation notes if detailed method not available */}
          {preparationSteps.length === 0 && meal.preparationNotes && (
            <Card className="mb-6">
              <p className="text-sm font-semibold text-clay-text mb-2 font-body">
                {t('nutrition.suggestions.preparation')}:
              </p>
              <p className="text-sm text-clay-textDim font-body">
                {meal.preparationNotes}
              </p>
            </Card>
          )}

          {/* Time-aware guidance */}
          {meal.timeAwareGuidance && (
            <Card className="mb-6 border-purple-100 bg-purple-50">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🌙</span>
                <p className="text-sm text-purple-800 font-body italic">
                  {meal.timeAwareGuidance}
                </p>
              </div>
            </Card>
          )}

          {/* Flexibility indicator */}
          {meal.isFlexible && (
            <Card className="mb-6 border-clay-lavender bg-clay-mint">
              <p className="text-xs text-clay-textDim font-body italic">
                {t('nutrition.suggestions.flexibleNote')}
              </p>
            </Card>
          )}

          {/* Save Meal Section */}
          <Card className="mb-6">
            <p className="text-sm font-semibold text-clay-text mb-4 font-body">
              {t('nutrition.detail.saveAsEaten')}
            </p>

            {/* Meal Type Selection */}
            <div className="mb-4">
              <label className="block mb-2 text-xs font-semibold text-clay-textDim font-body">
                {t('nutrition.detail.mealType')}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((mealType) => (
                  <button
                    key={mealType}
                    onClick={() => setSelectedMealType(mealType)}
                    className={`
                      touch-target
                      p-2
                      rounded-[12px]
                      font-body
                      text-xs
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
            </div>

            {/* Reflection Selection */}
            <div>
              <label className="block mb-2 text-xs font-semibold text-clay-textDim font-body">
                {t('nutrition.detail.reflection')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['light', 'normal', 'indulgent'] as FoodReflectionType[]).map((reflection) => (
                  <button
                    key={reflection}
                    onClick={() => setSelectedReflection(reflection)}
                    className={`
                      touch-target
                      p-3
                      rounded-[12px]
                      font-body
                      text-xs
                      transition-all
                      ${selectedReflection === reflection
                        ? 'bg-clay-primary text-white shadow-clay-extrude'
                        : 'bg-white text-clay-text border-2 border-clay-lavender hover:bg-clay-mint'}
                    `}
                  >
                    {t(`nutrition.record.${reflection}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Error message */}
            {saveError && (
              <div className="mt-4 p-3 rounded-[12px] bg-red-50 border-2 border-red-200">
                <p className="text-xs text-red-800 font-body">{saveError}</p>
              </div>
            )}

            {/* Success message */}
            {saveSuccess && (
              <div className="mt-4 p-3 rounded-[12px] bg-green-50 border-2 border-green-200">
                <p className="text-xs text-green-800 font-body">
                  {t('nutrition.detail.saveSuccess')}
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Footer with save and close buttons */}
        <div className="px-6 py-4 border-t border-clay-lavender bg-white space-y-3">
          <Button
            variant="primary"
            fullWidth
            onClick={handleSaveMeal}
            disabled={saving || saveSuccess}
          >
            {saving ? t('nutrition.detail.saving') : t('nutrition.detail.saveAsEatenButton')}
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={onClose}
          >
            {t('common.close')}
          </Button>
        </div>
      </div>
    </>
  );
}
