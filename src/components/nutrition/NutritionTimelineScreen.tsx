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
      <div className="p-6 min-h-screen bg-clay-bg">
        <p className="text-clay-textDim font-body">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-clay-bg pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-heading text-clay-text mb-2">
          {t('nutrition.timeline.title')}
        </h1>
        <p className="text-clay-textDim font-body">
          {format(parseISO(selectedDate + 'T00:00:00'), 'yyyy年MM月dd日')}
        </p>
      </div>

      {reflections.length === 0 ? (
        <Card className="mb-6">
          <p className="text-clay-textDim font-body text-center py-8">
            {t('nutrition.timeline.noRecords')}
          </p>
        </Card>
      ) : (
        <div className="space-y-4 mb-6">
          {reflections.map((reflection) => {
            // Ensure mealType has a valid value (default to 'lunch' if missing)
            const mealType: MealType = (reflection.mealType || 'lunch') as MealType;
            return (
              <Card key={reflection.id} className="border-clay-lavender">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{mealIcons[mealType] || mealIcons.lunch}</span>
                  <div>
                    <h3 className="text-lg font-heading text-clay-text">
                      {t(`nutrition.record.mealType.${mealType}`)}
                    </h3>
                    <p className="text-sm text-clay-textDim font-body">
                      {t(`nutrition.record.${reflection.reflection}`)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleEdit(reflection)}
                  className="clay-button p-2 rounded-lg hover:bg-clay-mint transition-colors"
                  aria-label={t('common.edit')}
                >
                  <span className="text-lg">✏️</span>
                </button>
              </div>

              {reflection.notes && (
                <p className="text-clay-textDim font-body mb-3 text-sm">
                  {reflection.notes}
                </p>
              )}

              {/* AI Analysis */}
              {reflection.aiAnalysis && reflection.processingStatus === 'completed' && (
                <div className="mt-4 pt-4 border-t border-clay-lavender">
                  <div className="flex items-start gap-2 mb-3">
                    <AIIndicator status="completed" />
                    <h4 className="text-sm font-semibold text-clay-text font-body">
                      {t('nutrition.record.aiAnalysis')}
                    </h4>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-clay-textDim font-body mb-1">
                        {t('nutrition.record.encouragement')}
                      </p>
                      <p className="text-sm text-clay-textDim font-body">
                        {reflection.aiAnalysis.encouragement}
                      </p>
                    </div>
                    
                    {reflection.aiAnalysis.suggestions.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-clay-textDim font-body mb-1">
                          {t('nutrition.record.suggestions')}
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                          {reflection.aiAnalysis.suggestions.map((suggestion, idx) => (
                            <li key={idx} className="text-sm text-clay-textDim font-body">
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-xs font-semibold text-clay-textDim font-body mb-1">
                        {t('nutrition.record.suitability')}
                      </p>
                      <p className="text-sm text-clay-textDim font-body">
                        {reflection.aiAnalysis.suitability}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {reflection.processingStatus === 'processing' && (
                <div className="mt-4 pt-4 border-t border-clay-lavender">
                  <AIIndicator status="processing" />
                </div>
              )}

              {reflection.processingStatus === 'failed' && reflection.errorMessage && (
                <div className="mt-4 pt-4 border-t border-clay-lavender">
                  <p className="text-xs text-clay-warning font-body">
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
      <div className="flex gap-3">
        <Button
          variant="outline"
          fullWidth
          onClick={() => navigate('/nutrition')}
        >
          {t('common.back')}
        </Button>
        <Button
          variant="primary"
          fullWidth
          onClick={() => navigate(`/nutrition/reflection?date=${selectedDate}`)}
        >
          {t('nutrition.timeline.addRecord')}
        </Button>
      </div>
    </div>
  );
}

