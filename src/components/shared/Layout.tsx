import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
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
import { ChevronLeft, Calendar, ClipboardList, HeartPulse } from 'lucide-react';
import { motion } from 'framer-motion';
import ErrorBoundary from './ErrorBoundary';
import SettingsDrawer from './SettingsDrawer';
import Button from './Button';
import Card from './Card';
import { useOffline } from '../../hooks/useOffline';
import { useTranslation } from '../../hooks/useTranslation';
import { useFoodReflection } from '../../hooks/useFoodReflection';
import { useCompanion } from '../../hooks/useCompanion';
import { FoodReflection, MealType } from '../../types';
import CharacterLayer from '../companion/CharacterLayer';
import SceneBackground from '../companion/SceneBackground';
import FloatingParticles from '../companion/FloatingParticles';
import ImageBackground from '../shared/ImageBackground';
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
import CompanionScreen from '../companion/CompanionScreen';
import HomeScreen from '../companion/HomeScreen';

function Layout() {
  const isOffline = useOffline();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const isHealthHome = location.pathname === '/health';
  const isHealthCalendar = location.pathname === '/health/calendar';
  const isHealthTimeline = location.pathname.startsWith('/health/timeline');
  const isImmersive = isHome || isHealthHome || isHealthCalendar || isHealthTimeline;
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
      <div className={`min-h-screen flex flex-col ${isImmersive ? 'bg-transparent' : 'bg-clay-bg'}`}>
        {/* Offline indicator */}
        {isOffline && (
          <div className="bg-clay-warning rounded-b-[20px] px-4 py-3 text-center text-sm text-white font-body shadow-clay">
            {t('offline.message')}
          </div>
        )}


        {/* Main content area */}
        <main
          className={
            isImmersive
              ? 'flex-1 w-full overflow-hidden'
              : 'flex-1 overflow-y-auto max-w-md mx-auto w-full bg-clay-bg pb-24 px-2'
          }
        >
          <Routes>
            {/* Home screen with character and entry cards */}
            <Route path="/" element={<HomeScreen />} />

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

            {/* Companion routes */}
            <Route path="/companion" element={<CompanionScreen />} />

            {/* Privacy routes (handled in drawer) */}
            <Route path="/privacy" element={<PrivacySettingsScreen />} />
            <Route path="/privacy/view" element={<DataViewScreen />} />
            <Route path="/privacy/export" element={<DataExportScreen />} />
            <Route path="/privacy/delete" element={<DataDeletionScreen />} />
          </Routes>
        </main>


        {/* Settings drawer */}
        <SettingsDrawer isOpen={settingsOpen} onClose={handleCloseDrawer} />
      </div>
    </ErrorBoundary>
  );
}

function HealthHomeScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  useCompanion('baiqi');

  // Health page character illustration - use specified image
  const characterLayerUrls = [
    '/images/1cb7398bea6d251b67d50b965c4295130983e2771863c5-oVQb7P_fw658webp.webp',
  ];

  // Ref: FR-030B (enhanced) + user request: higher-end glass
  const GLASS_BG = 'rgba(255, 255, 255, 0.2)';
  const GLASS_BLUR = 'blur(35px)';

  // Narrower cards + more breathing room (avoid mutual blocking on small screens)
  const CARD_LEFT = '14%';
  const CARD_WIDTH = '72%'; // MUST not overflow
  const CARD_MAX_WIDTH_PX = 340;
  const CARD_HEIGHT_PX = 104;
  const CARD_RADIUS_PX = 18;

  // Centralized absolute stacking (NOT a vertical list)
  const cards = [
    {
      id: 'folder-upload',
      label: t('health.uploadRecord'),
      route: '/health/upload',
      icon: ClipboardList,
      rotate: -1.5,
      bottom: '6%',
      zIndex: 3,
      floatDelay: 0.0,
      floatDuration: 4.2,
    },
    {
      id: 'folder-symptoms',
      label: t('health.logSymptoms'),
      route: '/health/symptoms',
      icon: HeartPulse,
      rotate: 4,
      bottom: '16%',
      zIndex: 2,
      floatDelay: 0.2,
      floatDuration: 5.1,
    },
    {
      id: 'folder-timeline',
      label: t('health.viewTimeline'),
      route: '/health/timeline?view=calendar',
      icon: Calendar,
      rotate: -3,
      bottom: '26%',
      zIndex: 1,
      floatDelay: 0.4,
      floatDuration: 6.0,
    },
  ];

  // Handle card click with spring animation - FR-035(5)
  const handleCardClick = (route: string) => {
    // Navigation happens after animation completes
    setTimeout(() => {
      navigate(route);
    }, 400);
  };

  // Background image URL (same as home screen) - FR-036(1)
  const HOME_SCREEN_BACKGROUND_URL = 'https://i.pinimg.com/564x/a6/39/19/a639190333210fb5da77b4903661354e.jpg';

  return (
    <ImageBackground imageUrl={HOME_SCREEN_BACKGROUND_URL}>
      <div className="relative min-h-screen overflow-hidden">
        {/* Scene Background - FR-036(1) */}
        <div className="absolute inset-0" style={{ zIndex: 1 }}>
          <SceneBackground characterId="baiqi" />
        </div>

        {/* Floating Particles - FR-036(1) */}
        <div className="absolute inset-0" style={{ zIndex: 2 }}>
          <FloatingParticles count={20} />
        </div>

        {/* Full-screen character illustration background with breathing animation - reuse home screen URLs */}
        <div className="fixed inset-0" style={{ zIndex: 3 }}>
          <CharacterLayer
            imageUrl={characterLayerUrls}
            resizeMode="cover"
            alt="Bai Qi character background"
          />
        </div>

      {/* Large-sized back button - top-left corner - FR-035(7) & FR-036(4) */}
      <motion.button
        onClick={() => navigate('/')}
        className="fixed top-5 left-5 z-50 rounded-full flex items-center justify-center transition-all duration-200 touch-target"
        style={{
          width: '56px',
          height: '56px',
          background: 'rgba(255, 255, 255, 0.15)', // More subtle glassmorphism - FR-036(4)
          backdropFilter: 'blur(20px)', // Reduced blur - FR-036(4)
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 4px 24px rgba(255, 255, 255, 0.2)',
          color: '#4A4A4A',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={t('common.back')}
      >
        <ChevronLeft size={28} strokeWidth={2} />
      </motion.button>

      {/* Staggered floating folders (NOT a list): absolute stacking, overlap, no overflow */}
      <div className="fixed inset-0 z-30" style={{ pointerEvents: 'none' }}>
        <div className="relative w-full h-full">
          {cards.map((card) => {
            const IconComponent = card.icon;
            return (
              <motion.div
                key={card.id}
                className="touch-target"
                style={{
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  position: 'absolute',
                  left: CARD_LEFT,
                  width: CARD_WIDTH,
                  bottom: card.bottom,
                  zIndex: card.zIndex,
                  maxWidth: `${CARD_MAX_WIDTH_PX}px`,
                  height: `${CARD_HEIGHT_PX}px`,
                  background: GLASS_BG,
                  backdropFilter: GLASS_BLUR,
                  // Inner glow stroke (no heavy/dark shadow)
                  border: '1px solid rgba(255, 255, 255, 0.6)',
                  borderRadius: `${CARD_RADIUS_PX}px`,
                  boxShadow:
                    '0 0 0 1px rgba(255, 255, 255, 0.28) inset, 0 16px 44px rgba(255, 255, 255, 0.18)',
                  overflow: 'hidden',
                  willChange: 'transform',
                  rotate: card.rotate,
                }}
                initial={false} // persistent buttons (never disappear)
                animate={{
                  y: [0, -5, 0, 5, 0], // independent floating (±5px)
                }}
                transition={{
                  delay: card.floatDelay,
                  duration: card.floatDuration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                whileHover={{ scale: 1.015 }}
                whileTap={{
                  y: -14,
                  scale: 1.05,
                  transition: {
                    type: 'spring',
                    stiffness: 300,
                    damping: 25,
                    duration: 0.4,
                  },
                }}
                onClick={() => handleCardClick(card.route)}
              >
                {/* Subtle folder tab (no dark shadow) */}
                <div
                  style={{
                    width: '100%',
                    height: '26px',
                    background: 'rgba(255, 255, 255, 0.12)',
                    backdropFilter: GLASS_BLUR,
                    borderTopLeftRadius: `${CARD_RADIUS_PX}px`,
                    borderTopRightRadius: `${CARD_RADIUS_PX}px`,
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '8px',
                      width: '64px',
                      height: '10px',
                      background: 'rgba(255, 255, 255, 0.16)',
                      borderRadius: '10px',
                    }}
                  />
                </div>

                {/* Folder content */}
                <div className="h-[calc(100%-26px)] px-4 py-3 flex items-center justify-center gap-3">
                  <IconComponent size={34} strokeWidth={1.75} style={{ color: '#FF7E9D', fill: 'none' }} />
                  <span className="text-base font-semibold text-center leading-snug" style={{ color: '#4A4A4A' }}>
                    {card.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Companion dialogue bubble above cards - positioned to avoid blocking character face */}
      <div
        className="fixed left-1/2 transform -translate-x-1/2 z-40"
        style={{
          top: '36%', // Move down per request
        }}
      >
        <div
          className="px-4 py-3"
          style={{
            maxWidth: '300px',
            background: GLASS_BG,
            backdropFilter: GLASS_BLUR,
            border: '1px solid rgba(255, 255, 255, 0.75)',
            borderRadius: '18px',
            boxShadow: '0 10px 28px rgba(255, 255, 255, 0.22)',
          }}
        >
          <p className="text-sm leading-relaxed text-center font-bold" style={{ color: '#4A4A4A' }}>
            {t('health.ledgerPrompt') || '这是我为你整理的记录，想先看哪一部分？'}
          </p>
        </div>
      </div>
      </div>
    </ImageBackground>
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

  useEffect(() => {
    loadReflections();
  }, [loadReflections]);

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

  // Meal type colors for circular indicators
  const mealColors: Record<MealType, string> = {
    breakfast: '#fb923c', // 早餐 - 橙色
    lunch: '#60a5fa', // 午餐 - 蓝色
    dinner: '#a78bfa', // 晚餐 - 紫色
    snack: '#9ca3af', // 夜宵 - 灰色
  };

  const mealOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-heading text-gray-900">{t('home.nutritionCompanion')}</h1>
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

        {/* Calendar */}
        <Card className="mb-6 bg-white shadow-lg border-0">
          {loading ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 font-body">{t('common.loading')}</p>
            </div>
          ) : (
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
          )}
        </Card>

        {/* Action buttons */}
        <div className="grid grid-cols-1 gap-4">
          <Button
            variant="primary"
            fullWidth
            onClick={() => navigate('/nutrition/reflection')}
            className="min-h-[64px] bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">📝</span>
              <span className="text-base font-semibold">{t('nutrition.record.title')}</span>
            </div>
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={() => navigate('/nutrition/input')}
            className="min-h-[64px] bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">🍎</span>
              <span className="text-base font-semibold">{t('nutrition.input.title')}</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmotionalHomeScreen() {
  const { t } = useTranslation();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-heading text-clay-text mb-6">{t('home.emotionalSupport')}</h1>
      <p className="text-clay-textDim font-body text-lg mb-6">{t('home.subtitle')}</p>
      <div className="p-8 text-center text-clay-textDim clay-card bg-clay-lavender">
        <p className="text-5xl mb-3">💕</p>
        <p className="font-body text-lg">{t('app.comingSoon')}</p>
      </div>
    </div>
  );
}

export default Layout;
