import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, addMonths, subMonths } from 'date-fns';
import ErrorBoundary from './ErrorBoundary';
import BottomTabs from './BottomTabs';
import SettingsDrawer from './SettingsDrawer';
import Button from './Button';
import Card from './Card';
import { useOffline } from '../../hooks/useOffline';
import { useTranslation } from '../../hooks/useTranslation';
import { useFoodReflection } from '../../hooks/useFoodReflection';
import { FoodReflection, MealType } from '../../types';
import HealthUploadScreen from '../health/HealthUploadScreen';
import HealthSummaryScreen from '../health/HealthSummaryScreen';
import LifestyleSuggestionsScreen from '../health/LifestyleSuggestionsScreen';
import SymptomLogScreen from '../health/SymptomLogScreen';
import SymptomAnalysisScreen from '../health/SymptomAnalysisScreen';
import HealthTimelineScreen from '../health/HealthTimelineScreen';
import HealthCalendarScreen from '../health/HealthCalendarScreen';
import FoodReflectionScreen from '../nutrition/FoodReflectionScreen';
import NutritionInputScreen from '../nutrition/NutritionInputScreen';
import MealSuggestionsScreen from '../nutrition/MealSuggestionsScreen';
import NutritionCalendarScreen from '../nutrition/NutritionCalendarScreen';
import NutritionTimelineScreen from '../nutrition/NutritionTimelineScreen';
import SugarReductionEasterEgg from '../nutrition/SugarReductionEasterEgg';
import PrivacySettingsScreen from '../privacy/PrivacySettingsScreen';
import DataViewScreen from '../privacy/DataViewScreen';
import DataExportScreen from '../privacy/DataExportScreen';
import DataDeletionScreen from '../privacy/DataDeletionScreen';

function Layout() {
  const isOffline = useOffline();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [previousPath, setPreviousPath] = useState<string>('/health');

  // Save current path when opening drawer
  const handleOpenDrawer = () => {
    // Only save if not already in privacy route
    if (!location.pathname.startsWith('/privacy')) {
      setPreviousPath(location.pathname);
    }
    setSettingsOpen(true);
  };

  // Restore previous path when closing drawer
  const handleCloseDrawer = () => {
    setSettingsOpen(false);
    // Navigate back to previous path if we're in privacy route
    if (location.pathname.startsWith('/privacy')) {
      navigate(previousPath, { replace: true });
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-clay-bg flex flex-col">
        {/* Offline indicator */}
        {isOffline && (
          <div className="bg-clay-warning rounded-b-[20px] px-4 py-3 text-center text-sm text-white font-body shadow-clay">
            {t('offline.message')}
          </div>
        )}

        {/* Soft extruded Header */}
        <header className="sticky top-0 z-30 clay-extrude bg-white rounded-b-[20px] mx-2 mt-2 mb-2">
          <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
            <h1 className="text-lg font-heading text-clay-text">{t('app.title')}</h1>
            <button
              onClick={handleOpenDrawer}
              className="clay-button bg-clay-lavender text-clay-text p-2.5 touch-target rounded-[18px]"
              aria-label={t('settings.title')}
            >
              <span className="text-xl">🎨</span>
            </button>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto max-w-md mx-auto w-full bg-clay-bg pb-24 px-2">
          <Routes>
            {/* Redirect root to health */}
            <Route path="/" element={<Navigate to="/health" replace />} />
            
            {/* Health routes */}
            <Route path="/health" element={<HealthHomeScreen />} />
            <Route path="/health/upload" element={<HealthUploadScreen />} />
            <Route path="/health/summary/:id" element={<HealthSummaryScreen />} />
            <Route path="/health/lifestyle/:recordId" element={<LifestyleSuggestionsScreen />} />
            <Route path="/health/symptoms" element={<SymptomLogScreen />} />
            <Route path="/health/symptoms/edit/:id" element={<SymptomLogScreen />} />
            <Route path="/health/symptoms/:id" element={<SymptomAnalysisScreen />} />
            <Route path="/health/timeline" element={<HealthTimelineScreen />} />
            <Route path="/health/calendar" element={<HealthCalendarScreen />} />
            
            {/* Nutrition routes */}
            <Route path="/nutrition" element={<NutritionHomeScreen />} />
            <Route path="/nutrition/reflection" element={<FoodReflectionScreen />} />
            <Route path="/nutrition/calendar" element={<NutritionCalendarScreen />} />
            <Route path="/nutrition/timeline" element={<NutritionTimelineScreen />} />
            <Route path="/nutrition/input" element={<NutritionInputScreen />} />
            <Route path="/nutrition/suggestions" element={<MealSuggestionsScreen />} />
            <Route path="/nutrition/easter-egg" element={<SugarReductionEasterEgg />} />
            
            {/* Emotional routes */}
            <Route path="/emotional" element={<EmotionalHomeScreen />} />
            
            {/* Privacy routes (handled in drawer) */}
            <Route path="/privacy" element={<PrivacySettingsScreen />} />
            <Route path="/privacy/view" element={<DataViewScreen />} />
            <Route path="/privacy/export" element={<DataExportScreen />} />
            <Route path="/privacy/delete" element={<DataDeletionScreen />} />
          </Routes>
        </main>

        {/* Bottom tab navigation */}
        <BottomTabs />

        {/* Settings drawer */}
        <SettingsDrawer isOpen={settingsOpen} onClose={handleCloseDrawer} />
      </div>
    </ErrorBoundary>
  );
}

function HealthHomeScreen() {
  const { t } = useTranslation();
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-heading text-clay-text mb-6">{t('health.title')}</h1>
      <div className="space-y-4">
        <a href="/health/upload" className="block clay-card p-5 text-clay-text hover:bg-clay-mint transition-all cursor-pointer">
          <div className="flex items-center gap-3">
            <span className="text-4xl">📋</span>
            <span className="font-body text-lg font-medium">{t('health.uploadRecord')}</span>
          </div>
        </a>
        <a href="/health/symptoms" className="block clay-card p-5 text-clay-text hover:bg-clay-orange transition-all cursor-pointer">
          <div className="flex items-center gap-3">
            <span className="text-4xl">✨</span>
            <span className="font-body text-lg font-medium">{t('health.logSymptoms')}</span>
          </div>
        </a>
        <a href="/health/timeline" className="block clay-card p-5 text-clay-text hover:bg-clay-blue transition-all cursor-pointer">
          <div className="flex items-center gap-3">
            <span className="text-4xl">📅</span>
            <span className="font-body text-lg font-medium">{t('health.viewTimeline')}</span>
          </div>
        </a>
      </div>
    </div>
  );
}

function NutritionHomeScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getReflectionsForRange } = useFoodReflection();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reflections, setReflections] = useState<FoodReflection[]>([]);
  const [loading, setLoading] = useState(true);

  // Load reflections for current month
  useEffect(() => {
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
    }
    // If no data, do nothing (just show empty)
  };

  // Calendar setup
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = getDay(monthStart);
  const emptyDays = Array(firstDayOfWeek).fill(null);

  // Meal type colors for dots
  const mealColors: Record<MealType, string> = {
    breakfast: 'bg-orange-400', // 早餐 - 橙色
    lunch: 'bg-blue-400',       // 午餐 - 蓝色
    dinner: 'bg-purple-400',    // 晚餐 - 紫色
    snack: 'bg-gray-400',       // 夜宵 - 灰色
  };

  const mealOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
  
  return (
    <div className="p-6 pb-20">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-heading text-clay-text">
          {t('home.nutritionCompanion')}
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

      {/* Calendar */}
      <Card className="mb-6">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-clay-textDim font-body">{t('common.loading')}</p>
          </div>
        ) : (
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
              // Filter out undefined/null mealTypes and ensure valid values
              const uniqueMealTypes = Array.from(
                new Set(
                  dateReflections
                    .map(r => r.mealType || 'lunch') // Default to 'lunch' if missing
                    .filter((mt): mt is MealType => mealOrder.includes(mt as MealType))
                )
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
                  <div className={`text-xs font-medium font-body relative ${
                    isToday ? 'text-clay-primary' : 'text-clay-text'
                  }`}>
                    {format(day, 'd')}
                    {hasReflections && (
                      <div className="flex gap-0.5 justify-center mt-0.5">
                        {uniqueMealTypes.map((mealType) => (
                          <span
                            key={mealType}
                            className={`w-1.5 h-1.5 rounded-full ${mealColors[mealType]}`}
                            title={t(`nutrition.record.mealType.${mealType}`)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Action buttons */}
      <div className="grid grid-cols-1 gap-4">
        <Button
          variant="primary"
          fullWidth
          onClick={() => navigate('/nutrition/reflection')}
          className="min-h-[60px]"
        >
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl">📝</span>
            <span>{t('nutrition.record.title')}</span>
          </div>
        </Button>
        <Button
          variant="primary"
          fullWidth
          onClick={() => navigate('/nutrition/input')}
          className="min-h-[60px]"
        >
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl">🍎</span>
            <span>{t('nutrition.input.title')}</span>
          </div>
        </Button>
      </div>
    </div>
  );
}

function EmotionalHomeScreen() {
  const { t } = useTranslation();
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-heading text-clay-text mb-6">{t('home.emotionalSupport')}</h1>
      <p className="text-clay-textDim font-body text-lg mb-6">
        {t('home.subtitle')}
      </p>
      <div className="p-8 text-center text-clay-textDim clay-card bg-clay-lavender">
        <p className="text-5xl mb-3">💕</p>
        <p className="font-body text-lg">{t('app.comingSoon')}</p>
      </div>
    </div>
  );
}

export default Layout;
