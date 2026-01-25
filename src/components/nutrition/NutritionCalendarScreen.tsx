import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  getDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { useFoodReflection } from '../../hooks/useFoodReflection';
import { useTranslation } from '../../hooks/useTranslation';
import { FoodReflection, MealType } from '../../types';
import Card from '../shared/Card';
import Button from '../shared/Button';

export default function NutritionCalendarScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { getReflectionsForRange } = useFoodReflection();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reflections, setReflections] = useState<FoodReflection[]>([]);
  const [loading, setLoading] = useState(true);

  // Load reflections for current month
  const loadReflections = useCallback(async () => {
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
  }, [currentMonth, getReflectionsForRange]);

  // Load reflections when month changes
  useEffect(() => {
    loadReflections();
  }, [loadReflections]);

  // Reload when page becomes visible (user returns from another screen)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadReflections();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadReflections]);

  // Reload when location changes (user navigates back to this screen)
  useEffect(() => {
    loadReflections();
  }, [location.pathname, loadReflections]);

  // Listen for food reflection saved event to refresh calendar immediately
  useEffect(() => {
    const handleFoodReflectionSaved = () => {
      loadReflections();
    };

    window.addEventListener('foodReflectionSaved', handleFoodReflectionSaved);
    return () => {
      window.removeEventListener('foodReflectionSaved', handleFoodReflectionSaved);
    };
  }, [loadReflections]);

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

  // Meal type colors for circular indicators
  const mealColors: Record<MealType, string> = {
    breakfast: '#fb923c', // 早餐 - 橙色
    lunch: '#60a5fa', // 午餐 - 蓝色
    dinner: '#a78bfa', // 晚餐 - 紫色
    snack: '#9ca3af', // 夜宵 - 灰色
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-clay-bg">
        <p className="text-clay-textDim font-body">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-heading text-gray-900">{t('nutrition.calendar.title')}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousMonth}
              className="p-2 text-gray-600 hover:text-gray-900 rounded-xl hover:bg-white transition-colors touch-target shadow-sm"
              aria-label={t('common.previous')}
            >
              <span className="text-xl">◀</span>
            </button>
            <span className="text-sm font-semibold text-gray-800 min-w-[120px] text-center font-body">
              {format(currentMonth, 'yyyy年MM月')}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-2 text-gray-600 hover:text-gray-900 rounded-xl hover:bg-white transition-colors touch-target shadow-sm"
              aria-label={t('common.next')}
            >
              <span className="text-xl">▶</span>
            </button>
          </div>
        </div>

        <Card className="mb-6 bg-white shadow-lg border-0">
          <div className="grid grid-cols-7 gap-2">
            {/* Week day headers */}
            {weekDays.map(day => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-gray-600 py-3 font-body"
              >
                {day}
              </div>
            ))}

            {/* Empty cells for days before month starts */}
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}

            {/* Calendar days */}
            {calendarDays.map(day => {
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
                    aspect-square p-2 rounded-xl border-2 transition-all duration-200
                    ${
                      isToday
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : hasReflections
                          ? 'border-blue-200 bg-blue-50/50 hover:bg-blue-100 hover:border-blue-300 shadow-sm'
                          : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
                    }
                    ${hasReflections ? 'cursor-pointer' : 'cursor-default'}
                  `}
                >
                  <div
                    className={`text-xs font-semibold font-body relative ${
                      isToday ? 'text-blue-600' : 'text-gray-900'
                    }`}
                  >
                    {format(day, 'd')}
                    {hasReflections && (
                      <div className="flex gap-1 justify-center mt-1.5">
                        {uniqueMealTypes.map(mealType => {
                          const color = mealColors[mealType];
                          return (
                            <svg
                              key={mealType}
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              className="flex-shrink-0"
                            >
                              <title>{t(`nutrition.record.mealType.${mealType}`)}</title>
                              <circle
                                cx="6"
                                cy="6"
                                r="5"
                                fill="none"
                                stroke="#e5e7eb"
                                strokeWidth="1.5"
                              />
                              <circle
                                cx="6"
                                cy="6"
                                r="5"
                                fill="none"
                                stroke={color}
                                strokeWidth="1.5"
                                strokeDasharray={`${2 * Math.PI * 5}`}
                                strokeDashoffset="0"
                                strokeLinecap="round"
                                transform="rotate(-90 6 6)"
                              />
                            </svg>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

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
            onClick={() => navigate('/nutrition/timeline')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {t('nutrition.calendar.viewTimeline')}
          </Button>
        </div>
      </div>
    </div>
  );
}
