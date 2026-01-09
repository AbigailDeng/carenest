import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, getDay, addMonths, subMonths } from 'date-fns';
import { useFoodReflection } from '../../hooks/useFoodReflection';
import { useTranslation } from '../../hooks/useTranslation';
import { FoodReflection, MealType } from '../../types';
import Card from '../shared/Card';
import Button from '../shared/Button';

export default function NutritionCalendarScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { getReflectionsForRange } = useFoodReflection();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reflections, setReflections] = useState<FoodReflection[]>([]);
  const [loading, setLoading] = useState(true);

  // Load reflections for current month
  useMemo(() => {
    const loadReflections = async () => {
      try {
        setLoading(true);
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const monthReflections = await getReflectionsForRange(
          format(monthStart, 'yyyy-MM-dd'),
          format(monthEnd, 'yyyy-MM-dd')
        );
        setReflections(monthReflections);
      } catch (err) {
        console.error('Failed to load reflections:', err);
      } finally {
        setLoading(false);
      }
    };
    loadReflections();
  }, [currentMonth, getReflectionsForRange]);

  // Get reflections for a specific date
  const getReflectionsForDate = (date: Date): FoodReflection[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return reflections.filter(r => r.date === dateStr);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dateReflections = getReflectionsForDate(date);
    if (dateReflections.length > 0) {
      // Navigate to timeline view for this date
      navigate(`/nutrition/timeline?date=${dateStr}`);
    } else {
      // Navigate to record screen for this date (default to current meal type)
      const hour = new Date().getHours();
      let defaultMealType = 'lunch';
      if (hour >= 6 && hour < 10) defaultMealType = 'breakfast';
      else if (hour >= 10 && hour < 14) defaultMealType = 'lunch';
      else if (hour >= 14 && hour < 20) defaultMealType = 'dinner';
      else defaultMealType = 'snack';
      navigate(`/nutrition/reflection?date=${dateStr}&mealType=${defaultMealType}`);
    }
  };

  // Calendar setup
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = getDay(monthStart);
  const emptyDays = Array(firstDayOfWeek).fill(null);

  // Meal type icons
  const mealIcons: Record<MealType, string> = {
    breakfast: '🌅',
    lunch: '🍽️',
    dinner: '🌙',
    snack: '🌃',
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-heading text-clay-text">
          {t('nutrition.calendar.title')}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousMonth}
            className="p-2 text-clay-text hover:text-clay-primary rounded-lg hover:bg-clay-mint transition-colors touch-target"
            aria-label={t('common.previous')}
          >
            <span className="text-xl">◀</span>
          </button>
          <span className="text-sm font-medium text-clay-text min-w-[120px] text-center font-body">
            {format(currentMonth, 'yyyy年MM月')}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 text-clay-text hover:text-clay-primary rounded-lg hover:bg-clay-mint transition-colors touch-target"
            aria-label={t('common.next')}
          >
            <span className="text-xl">▶</span>
          </button>
        </div>
      </div>

      <Card className="mb-6">
        <div className="grid grid-cols-7 gap-1">
          {/* Week day headers */}
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-clay-textDim py-2 font-body">
              {day}
            </div>
          ))}

          {/* Empty cells for days before month starts */}
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {/* Calendar days */}
          {calendarDays.map((day) => {
            const dateReflections = getReflectionsForDate(day);
            const hasReflections = dateReflections.length > 0;
            const isToday = isSameDay(day, new Date());

            // Get unique meal types and sort by meal order
            const mealOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
            const uniqueMealTypes = Array.from(
              new Set(dateReflections.map(r => r.mealType))
            ).sort((a, b) => mealOrder.indexOf(a) - mealOrder.indexOf(b));

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDateClick(day)}
                className={`
                  aspect-square p-1 rounded-lg border-2 transition-colors
                  ${isToday 
                    ? 'border-clay-primary bg-clay-mint' 
                    : hasReflections 
                    ? 'border-clay-lavender bg-clay-surface hover:bg-clay-mint' 
                    : 'border-gray-200 hover:border-gray-300'}
                  ${hasReflections ? 'cursor-pointer' : 'cursor-default'}
                `}
              >
                <div className={`text-xs font-medium mb-1 font-body ${
                  isToday ? 'text-clay-primary' : 'text-clay-text'
                }`}>
                  {format(day, 'd')}
                </div>
                {hasReflections && (
                  <div className="flex flex-wrap gap-0.5 justify-center">
                    {uniqueMealTypes.map((mealType) => (
                      <span key={mealType} className="text-xs" title={t(`nutrition.record.mealType.${mealType}`)}>
                        {mealIcons[mealType]}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

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
          onClick={() => navigate('/nutrition/timeline')}
        >
          {t('nutrition.calendar.viewTimeline')}
        </Button>
      </div>
    </div>
  );
}

