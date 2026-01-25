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

      // Trigger custom event to notify calendar components to refresh
      window.dispatchEvent(
        new CustomEvent('foodReflectionSaved', {
          detail: { date: today, mealType: selectedMealType },
        })
      );

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
          max-h-[90vh] bg-white rounded-t-3xl z-50
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
          flex flex-col
          shadow-2xl
        `}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-16 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <h2 className="text-2xl font-heading text-gray-900">{meal.mealName}</h2>
          <button
            onClick={onClose}
            className="touch-target p-2 text-gray-500 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors"
            aria-label={t('common.close')}
          >
            <span className="text-3xl leading-none">×</span>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Loading indicator */}
          {loading && (
            <Card className="mb-6 bg-blue-50 border border-blue-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900 mb-1 font-body text-base">
                    {t('nutrition.detail.generating')}
                  </p>
                  <p className="text-sm text-blue-700 font-body">
                    {t('nutrition.detail.generatingNote')}
                  </p>
                </div>
                <AIIndicator status="processing" />
              </div>
            </Card>
          )}

          {/* Description */}
          <Card className="mb-6 bg-gray-50 border-0 shadow-sm">
            <p className="text-gray-700 font-body leading-relaxed">{meal.description}</p>
          </Card>

          {/* Image */}
          {imageUrl ? (
            <Card className="mb-6 p-0 overflow-hidden rounded-xl shadow-md">
              <img
                src={imageUrl}
                alt={meal.mealName}
                className="w-full h-auto object-cover"
                onError={e => {
                  // Fallback to placeholder if image fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </Card>
          ) : (
            !loading && (
              <Card className="mb-6 bg-gray-100 border-0 shadow-sm">
                <div className="flex flex-col items-center justify-center py-16">
                  <span className="text-6xl mb-4">🍽️</span>
                  <p className="text-gray-500 font-body text-center">
                    {t('nutrition.detail.noImage')}
                  </p>
                </div>
              </Card>
            )
          )}

          {/* Ingredients */}
          {meal.ingredients.length > 0 && (
            <Card className="mb-6 bg-white shadow-sm border-0">
              <p className="text-sm font-semibold text-gray-800 mb-3 font-body uppercase tracking-wide">
                {t('nutrition.suggestions.ingredients')}:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-700 font-body space-y-2">
                {meal.ingredients.map((ing, idx) => (
                  <li key={idx}>{ing}</li>
                ))}
              </ul>
            </Card>
          )}

          {/* Detailed Preparation Method */}
          {preparationSteps.length > 0 && (
            <Card className="mb-6 bg-white shadow-sm border-0">
              <p className="text-sm font-semibold text-gray-800 mb-4 font-body uppercase tracking-wide">
                {t('nutrition.detail.preparationMethod')}:
              </p>
              <ol className="list-decimal list-inside text-sm text-gray-700 font-body space-y-3">
                {preparationSteps.map((step, idx) => (
                  <li key={idx} className="pl-2 leading-relaxed">
                    {step.replace(/^\d+\.\s*/, '')}
                  </li>
                ))}
              </ol>
            </Card>
          )}

          {/* Fallback to basic preparation notes if detailed method not available */}
          {preparationSteps.length === 0 && meal.preparationNotes && (
            <Card className="mb-6 bg-white shadow-sm border-0">
              <p className="text-sm font-semibold text-gray-800 mb-2 font-body uppercase tracking-wide">
                {t('nutrition.suggestions.preparation')}:
              </p>
              <p className="text-sm text-gray-700 font-body leading-relaxed">
                {meal.preparationNotes}
              </p>
            </Card>
          )}

          {/* Time-aware guidance */}
          {meal.timeAwareGuidance && (
            <Card className="mb-6 bg-indigo-50 border border-indigo-200 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🌙</span>
                <p className="text-sm text-indigo-800 font-body italic leading-relaxed">
                  {meal.timeAwareGuidance}
                </p>
              </div>
            </Card>
          )}

          {/* Flexibility indicator */}
          {meal.isFlexible && (
            <Card className="mb-6 bg-blue-50 border border-blue-200 shadow-sm">
              <p className="text-xs text-blue-700 font-body italic">
                {t('nutrition.suggestions.flexibleNote')}
              </p>
            </Card>
          )}

          {/* Save Meal Section */}
          <Card className="mb-6 bg-white shadow-sm border-0">
            <p className="text-base font-semibold text-gray-900 mb-5 font-body">
              {t('nutrition.detail.saveAsEaten')}
            </p>

            {/* Meal Type Selection */}
            <div className="mb-5">
              <label className="block mb-3 text-sm font-semibold text-gray-700 font-body">
                {t('nutrition.detail.mealType')}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map(mealType => (
                  <button
                    key={mealType}
                    onClick={() => setSelectedMealType(mealType)}
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
            </div>

            {/* Reflection Selection */}
            <div>
              <label className="block mb-3 text-sm font-semibold text-gray-700 font-body">
                {t('nutrition.detail.reflection')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['light', 'normal', 'indulgent'] as FoodReflectionType[]).map(reflection => (
                  <button
                    key={reflection}
                    onClick={() => setSelectedReflection(reflection)}
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
                        selectedReflection === reflection
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 hover:border-blue-300'
                      }
                    `}
                  >
                    {t(`nutrition.record.${reflection}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Error message */}
            {saveError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200">
                <p className="text-sm text-red-700 font-body">{saveError}</p>
              </div>
            )}

            {/* Success message */}
            {saveSuccess && (
              <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-200">
                <p className="text-sm text-green-700 font-body">
                  {t('nutrition.detail.saveSuccess')}
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Footer with save and close buttons */}
        <div className="px-6 py-5 border-t border-gray-200 bg-white space-y-3">
          <Button
            variant="primary"
            fullWidth
            onClick={handleSaveMeal}
            disabled={saving || saveSuccess}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {saving ? t('nutrition.detail.saving') : t('nutrition.detail.saveAsEatenButton')}
          </Button>
          <Button
            variant="outline"
            fullWidth
            onClick={onClose}
            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {t('common.close')}
          </Button>
        </div>
      </div>
    </>
  );
}
