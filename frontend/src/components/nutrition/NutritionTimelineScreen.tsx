import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useFoodReflection } from '../../hooks/useFoodReflection';
import { useTranslation } from '../../hooks/useTranslation';
import { FoodReflection, MealType } from '../../types';
import Card from '../shared/Card';
import Button from '../shared/Button';
import AIIndicator from '../shared/AIIndicator';

const mealIcons: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '🍽️',
  dinner: '🌙',
  snack: '🌃',
};

const mealOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function NutritionTimelineScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { getReflectionsForDate } = useFoodReflection();
  
  const selectedDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const [reflections, setReflections] = useState<FoodReflection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReflections = async () => {
      try {
        setLoading(true);
        const dateReflections = await getReflectionsForDate(selectedDate);
        // Sort by meal order, ensuring mealType has a default value
        const sorted = dateReflections.sort((a, b) => {
          const aMealType = a.mealType || 'lunch';
          const bMealType = b.mealType || 'lunch';
          const aIndex = mealOrder.indexOf(aMealType);
          const bIndex = mealOrder.indexOf(bMealType);
          // If mealType not found in order, put it at the end
          const aPos = aIndex === -1 ? 999 : aIndex;
          const bPos = bIndex === -1 ? 999 : bIndex;
          return aPos - bPos;
        });
        setReflections(sorted);
      } catch (err) {
        console.error('Failed to load reflections:', err);
        setReflections([]);
      } finally {
        setLoading(false);
      }
    };
    loadReflections();
  }, [selectedDate, getReflectionsForDate]);

  const handleEdit = (reflection: FoodReflection) => {
    const mealType = reflection.mealType || 'lunch';
    navigate(`/nutrition/reflection?date=${reflection.date}&mealType=${mealType}`);
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
            {t('nutrition.timeline.title')}
          </h1>
          <p className="text-gray-600 font-body text-base">
            {format(parseISO(selectedDate + 'T00:00:00'), 'yyyy年MM月dd日')}
          </p>
        </div>

        {reflections.length === 0 ? (
          <Card className="mb-6 bg-white shadow-lg border-0">
            <p className="text-gray-500 font-body text-center py-12">
              {t('nutrition.timeline.noRecords')}
            </p>
          </Card>
        ) : (
          <div className="space-y-4 mb-6">
            {reflections.map((reflection) => {
              // Ensure mealType has a valid value (default to 'lunch' if missing)
              const mealType: MealType = (reflection.mealType || 'lunch') as MealType;
              return (
                <Card key={reflection.id} className="bg-white shadow-lg border-0">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{mealIcons[mealType] || mealIcons.lunch}</span>
                    <div>
                      <h3 className="text-xl font-heading text-gray-900">
                        {t(`nutrition.record.mealType.${mealType}`)}
                      </h3>
                      <p className="text-sm text-gray-600 font-body">
                        {t(`nutrition.record.${reflection.reflection}`)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEdit(reflection)}
                    className="p-2 rounded-xl hover:bg-gray-100 transition-colors touch-target"
                    aria-label={t('common.edit')}
                  >
                    <span className="text-xl">✏️</span>
                  </button>
                </div>

                {reflection.notes && (
                  <p className="text-gray-700 font-body mb-4 text-sm leading-relaxed">
                    {reflection.notes}
                  </p>
                )}

                {/* AI Analysis */}
                {reflection.aiAnalysis && reflection.processingStatus === 'completed' && (
                  <div className="mt-5 pt-5 border-t border-gray-200">
                    <div className="flex items-start gap-3 mb-4">
                      <AIIndicator status="completed" />
                      <h4 className="text-base font-semibold text-gray-900 font-body">
                        {t('nutrition.record.aiAnalysis')}
                      </h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-800 font-body mb-2">
                          {t('nutrition.record.encouragement')}
                        </p>
                        <p className="text-sm text-gray-700 font-body leading-relaxed">
                          {reflection.aiAnalysis.encouragement}
                        </p>
                      </div>
                      
                      {reflection.aiAnalysis.suggestions.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-gray-800 font-body mb-2">
                            {t('nutrition.record.suggestions')}
                          </p>
                          <ul className="list-disc list-inside space-y-2">
                            {reflection.aiAnalysis.suggestions.map((suggestion, idx) => (
                              <li key={idx} className="text-sm text-gray-700 font-body leading-relaxed">
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div>
                        <p className="text-sm font-semibold text-gray-800 font-body mb-2">
                          {t('nutrition.record.suitability')}
                        </p>
                        <p className="text-sm text-gray-700 font-body leading-relaxed">
                          {reflection.aiAnalysis.suitability}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {reflection.processingStatus === 'processing' && (
                  <div className="mt-5 pt-5 border-t border-gray-200">
                    <AIIndicator status="processing" />
                  </div>
                )}

                {reflection.processingStatus === 'failed' && reflection.errorMessage && (
                  <div className="mt-5 pt-5 border-t border-gray-200">
                    <p className="text-sm text-red-600 font-body">
                      {t('nutrition.record.aiFailed')}: {reflection.errorMessage}
                    </p>
                  </div>
                )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            fullWidth
            onClick={() => navigate('/nutrition')}
            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {t('common.back')}
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={() => navigate(`/nutrition/reflection?date=${selectedDate}`)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {t('nutrition.timeline.addRecord')}
          </Button>
        </div>
      </div>
    </div>
  );
}

