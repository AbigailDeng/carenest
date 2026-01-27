import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  subDays,
  isSameDay,
  isAfter,
  startOfDay,
} from 'date-fns';
import { FoodReflection, MealType } from '../../types';
import { useFoodReflection } from '../../hooks/useFoodReflection';
import { useTranslation } from '../../hooks/useTranslation';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Utensils, Trash2, X } from 'lucide-react';
import CharacterAvatar from '../companion/CharacterAvatar';
import { useCompanion } from '../../hooks/useCompanion';
import ImageBackground from '../shared/ImageBackground';
import FloatingParticles from '../companion/FloatingParticles';

export default function NutritionTimelineScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, locale } = useTranslation();
  const { getReflectionsForRange, getReflectionsForDate } = useFoodReflection();
  const { characterState } = useCompanion('baiqi');

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline'>('calendar');
  const [monthReflections, setMonthReflections] = useState<FoodReflection[]>([]);
  const [dayReflections, setDayReflections] = useState<FoodReflection[]>([]);
  const [recentReflections, setRecentReflections] = useState<FoodReflection[]>([]);
  const [loadingMonth, setLoadingMonth] = useState(true);
  const [loadingDay, setLoadingDay] = useState(false);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    date: string;
    mealType: MealType;
    title: string;
  } | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const NUTRITION_BACKGROUND_URL = '/images/008fP45sly1hreaeb88b2j323s35s1l1.jpg';
  // Enhanced glassmorphism: brighter, more saturated (matching Health Timeline)
  const GLASS_BG = 'rgba(255, 255, 255, 0.32)';
  const GLASS_BLUR = 'blur(30px)';
  const TEXT = '#4A4A4A';
  const PINK = '#FF7E9D'; // food reflection
  // Unified button style constants
  const BUTTON_RADIUS = 20;
  const BUTTON_GRADIENT =
    'linear-gradient(135deg, rgba(255,126,157,0.35) 0%, rgba(167,139,250,0.30) 100%)';
  const monthKey = format(currentMonth, 'yyyy-MM');

  useEffect(() => {
    const dateParam = searchParams.get('date');

    if (dateParam) {
      // From calendar click: show day detail view
      setSelectedDate(dateParam);
      setViewMode('timeline');
      loadReflectionsForDate(dateParam);
    } else {
      // From nutrition folder: always show calendar view
      setSelectedDate(null);
      setViewMode('calendar');
      setDayReflections([]);
    }
  }, [searchParams, currentMonth]);

  const loadReflectionsForMonth = async () => {
    try {
      setLoadingMonth(true);
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const monthReflections = await getReflectionsForRange(
        format(monthStart, 'yyyy-MM-dd'),
        format(monthEnd, 'yyyy-MM-dd')
      );
      setMonthReflections(monthReflections);
    } catch (err) {
      console.error('Failed to load reflections:', err);
      setMonthReflections([]);
    } finally {
      setLoadingMonth(false);
    }
  };

  const loadReflectionsForDate = async (dateStr: string) => {
    try {
      setLoadingDay(true);
      const dateReflections = await getReflectionsForDate(dateStr);
      setDayReflections(dateReflections);
    } catch (err) {
      console.error('Failed to load reflections:', err);
      setDayReflections([]);
    } finally {
      setLoadingDay(false);
    }
  };

  const loadRecentReflections = async () => {
    try {
      setLoadingRecent(true);
      const end = new Date();
      const start = subDays(new Date(), 29);
      const items = await getReflectionsForRange(
        format(start, 'yyyy-MM-dd'),
        format(end, 'yyyy-MM-dd')
      );
      setRecentReflections(items);
    } catch (err) {
      console.error('Failed to load recent reflections:', err);
      setRecentReflections([]);
    } finally {
      setLoadingRecent(false);
    }
  };

  // Always keep month reflections fresh for calendar markers/list
  useEffect(() => {
    loadReflectionsForMonth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]);

  // Listen for food reflection saved event to refresh calendar
  useEffect(() => {
    const handleFoodReflectionSaved = (e: Event) => {
      const custom = e as CustomEvent<{ date?: string; mealType?: MealType }>;
      const changedDate = custom.detail?.date;
      // Refresh month view and (if currently viewing the same day) refresh day view too.
      loadReflectionsForMonth();
      if (selectedDate && changedDate && selectedDate === changedDate) {
        loadReflectionsForDate(selectedDate);
      }
    };

    window.addEventListener('foodReflectionSaved', handleFoodReflectionSaved);
    return () => {
      window.removeEventListener('foodReflectionSaved', handleFoodReflectionSaved);
    };
  }, [selectedDate]);

  // Prefetch recent reflections when opening date picker (for dots)
  useEffect(() => {
    if (!showDatePicker) return;
    loadRecentReflections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDatePicker]);

  // Calendar data - get reflections for current month
  const monthItems = useMemo(() => {
    return monthReflections;
  }, [monthReflections]);

  const getItemsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return monthItems.filter(reflection => {
      return reflection.date === dateStr;
    });
  };

  const calendarDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const firstDayOfWeek = getDay(startOfMonth(currentMonth));
  const emptyDays = Array(firstDayOfWeek).fill(null);

  const getDefaultMealType = (): MealType => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 10) return 'breakfast';
    if (hour >= 10 && hour < 14) return 'lunch';
    if (hour >= 14 && hour < 20) return 'dinner';
    return 'snack';
  };

  const handleDateClick = (date: Date) => {
    // Don't allow clicking on future dates
    const today = startOfDay(new Date());
    const selectedDay = startOfDay(date);
    if (isAfter(selectedDay, today)) {
      return; // Disable future dates
    }
    const dateStr = format(date, 'yyyy-MM-dd');
    const hasReflections = getItemsForDate(date).length > 0;
    if (hasReflections) {
      // Show day detail view
      navigate(`/nutrition/timeline?date=${dateStr}`);
    } else {
      // No records yet → go directly to add record
      navigate(`/nutrition/reflection?date=${dateStr}&mealType=${getDefaultMealType()}`);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const weekDays =
    locale === 'zh'
      ? ['日', '一', '二', '三', '四', '五', '六']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      // Use deleteFoodReflection with date and mealType
      const { deleteFoodReflection } = await import('../../services/storage/indexedDB');
      await deleteFoodReflection(deleteConfirm.date, deleteConfirm.mealType);
      setDeleteConfirm(null);
      // Refresh reflections
      if (selectedDate) {
        await loadReflectionsForDate(selectedDate);
      }
      await loadReflectionsForMonth();
    } catch (err) {
      console.error('Failed to delete:', err);
      alert(t('common.deleteFailed') || 'Failed to delete');
    }
  };

  const handleView = (reflection: FoodReflection) => {
    // Navigate to detail page using reflection ID (per FR-040)
    navigate(`/nutrition/reflection/${reflection.id}`);
  };

  // Timeline items for display
  const timelineItems = useMemo((): FoodReflection[] => {
    if (loadingMonth || loadingDay) {
      return [];
    }

    if (selectedDate) {
      // Day detail view: show reflections for selected date
      return [...dayReflections].sort((a, b) => {
        const mealOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
        const aIndex = mealOrder.indexOf(a.mealType || 'lunch');
        const bIndex = mealOrder.indexOf(b.mealType || 'lunch');
        return aIndex - bIndex;
      });
    } else {
      // Calendar view: show reflections for current month
      return [...monthItems].sort((a, b) => {
        const dateA = parseISO(a.date + 'T00:00:00');
        const dateB = parseISO(b.date + 'T00:00:00');
        return dateB.getTime() - dateA.getTime();
      });
    }
  }, [dayReflections, monthItems, selectedDate, loadingMonth, loadingDay]);

  const loading = viewMode === 'calendar' ? loadingMonth : loadingDay;

  if (loading) {
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
        }}
      >
        <ImageBackground imageUrl={NUTRITION_BACKGROUND_URL} />
        <div
          className="relative z-10 w-full"
          style={{
            paddingTop: 'calc(env(safe-area-inset-top) + 112px)',
            paddingLeft: '20px',
            paddingRight: '20px',
          }}
        >
          <div
            className="text-center py-12"
            style={{
              background: GLASS_BG,
              backdropFilter: GLASS_BLUR,
              WebkitBackdropFilter: GLASS_BLUR,
              border: '1px solid rgba(255, 255, 255, 0.55)',
              borderRadius: 20,
              color: TEXT,
            }}
          >
            <p className="text-sm font-semibold">{t('common.loading')}</p>
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
      }}
    >
      {/* ImageBackground - nutrition-specific Bai Qi illustration */}
      <ImageBackground imageUrl={NUTRITION_BACKGROUND_URL} />

      {/* Floating Particles */}
      <div className="absolute inset-0" style={{ zIndex: 2 }}>
        <FloatingParticles count={20} />
      </div>

      {/* Back button - top-left corner */}
      <motion.button
        onClick={() => {
          // If in Day Detail View (selectedDate exists), go back to timeline calendar view
          // Otherwise, go back to nutrition home
          if (selectedDate) {
            navigate('/nutrition/timeline');
          } else {
            navigate('/nutrition');
          }
        }}
        className="fixed top-5 left-5 z-50 rounded-full flex items-center justify-center transition-all duration-200 touch-target"
        style={{
          width: '56px',
          height: '56px',
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 4px 24px rgba(255, 255, 255, 0.2)',
          color: TEXT,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={t('common.back')}
      >
        <ChevronLeft size={28} strokeWidth={2} />
      </motion.button>

      <div
        className="relative z-10 w-full"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 80px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 100px)',
          paddingLeft: '20px',
          paddingRight: '20px',
          margin: 0,
        }}
      >
        {/* Calendar view header controls */}
        {viewMode === 'calendar' && (
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>
              {format(currentMonth, locale === 'zh' ? 'yyyy年MM月' : 'MMMM yyyy')}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousMonth}
                className="touch-target rounded-full flex items-center justify-center"
                style={{
                  width: 44,
                  height: 44,
                  background: GLASS_BG,
                  border: '1px solid rgba(255, 255, 255, 0.55)',
                  backdropFilter: GLASS_BLUR,
                  WebkitBackdropFilter: GLASS_BLUR,
                  color: TEXT,
                }}
                aria-label={t('common.previous')}
              >
                <ChevronLeft size={22} strokeWidth={2} />
              </button>
              <button
                onClick={handleNextMonth}
                className="touch-target rounded-full flex items-center justify-center"
                style={{
                  width: 44,
                  height: 44,
                  background: GLASS_BG,
                  border: '1px solid rgba(255, 255, 255, 0.55)',
                  backdropFilter: GLASS_BLUR,
                  WebkitBackdropFilter: GLASS_BLUR,
                  color: TEXT,
                }}
                aria-label={t('common.next')}
              >
                <ChevronRight size={22} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}

        {/* Day Detail View: Selected date display */}
        {viewMode === 'timeline' && selectedDate && (
          <div className="mb-4">
            <button
              onClick={() => setShowDatePicker(true)}
              className="touch-target text-sm font-semibold"
              style={{ color: '#FFFFFF' }}
            >
              {format(
                parseISO(selectedDate + 'T00:00:00'),
                locale === 'zh' ? 'yyyy年MM月dd日' : 'MMMM d, yyyy'
              )}
            </button>
          </div>
        )}

        {/* Main content area - Calendar always shown, Timeline below when in calendar view */}
        {viewMode === 'calendar' && (
          <motion.div
            key={`calendar-${monthKey}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {/* Glassmorphism Calendar container */}
            <motion.div
              className="mb-5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              style={{
                background: GLASS_BG,
                backdropFilter: GLASS_BLUR,
                WebkitBackdropFilter: GLASS_BLUR,
                border: '1px solid rgba(255, 255, 255, 0.6)',
                borderRadius: 24,
                boxShadow: '0 18px 50px rgba(0,0,0,0.10)',
                padding: 18,
              }}
            >
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map(day => (
                  <div
                    key={day}
                    className="text-center text-xs font-semibold py-1"
                    style={{ color: 'rgba(74,74,74,0.75)' }}
                  >
                    {day}
                  </div>
                ))}

                {emptyDays.map((_, index) => (
                  <div key={`empty-${index}`} className="aspect-square" />
                ))}

                {calendarDays.map(day => {
                  const dayReflections = getItemsForDate(day);
                  const hasReflections = dayReflections.length > 0;
                  const today = isSameDay(day, new Date());
                  const isFuture = isAfter(startOfDay(day), startOfDay(new Date()));

                  // Determine glow color based on food reflections
                  let glowColor: string | null = null;
                  let glowShadow: string | null = null;
                  let topGlowColor: string | null = null;

                  if (hasReflections) {
                    // Food reflections: pink
                    glowColor =
                      'linear-gradient(135deg, rgba(255,126,157,0.28) 0%, rgba(255,126,157,0.20) 100%)';
                    glowShadow =
                      '0 0 0 1px rgba(255,255,255,0.18) inset, 0 10px 24px rgba(255,126,157,0.25)';
                    topGlowColor = 'rgba(255, 126, 157, 0.25)';
                  } else if (today) {
                    // Today but no records: white/grey
                    glowColor = 'rgba(255, 255, 255, 0.25)';
                    glowShadow =
                      '0 0 0 1px rgba(255,255,255,0.3) inset, 0 8px 20px rgba(255,255,255,0.2)';
                    topGlowColor = 'rgba(255, 255, 255, 0.3)';
                  }

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => handleDateClick(day)}
                      disabled={isFuture}
                      className="aspect-square rounded-2xl transition-transform active:scale-[0.98]"
                      style={{
                        border: 'none',
                        background:
                          today || hasReflections
                            ? 'rgba(255, 255, 255, 0.16)'
                            : 'rgba(255, 255, 255, 0.06)',
                        position: 'relative',
                        overflow: 'hidden',
                        opacity: isFuture ? 0.4 : 1,
                        cursor: isFuture ? 'not-allowed' : 'pointer',
                      }}
                      aria-label={`${t('nutrition.calendar.title')} ${format(day, 'yyyy-MM-dd')}`}
                    >
                      {glowColor && glowShadow && (
                        <div
                          className="absolute inset-0"
                          style={{
                            background: glowColor,
                            boxShadow: glowShadow,
                          }}
                        />
                      )}

                      {topGlowColor && (
                        <div
                          className="absolute left-1/2 top-2 -translate-x-1/2"
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 9999,
                            background: topGlowColor,
                          }}
                        />
                      )}

                      <div className="relative z-10 h-full w-full flex flex-col items-center justify-center">
                        <div className="text-xs font-semibold" style={{ color: TEXT }}>
                          {format(day, 'd')}
                        </div>
                        {hasReflections && (
                          <div className="mt-1 flex items-center gap-1">
                            <span
                              title={`${dayReflections.length} ${t('nutrition.timeline.foodRecord')}`}
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: 9999,
                                background: PINK,
                                boxShadow: '0 0 12px rgba(255,126,157,0.55)',
                                display: 'inline-block',
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Legend redesign: dots */}
            <div
              className="mb-6"
              style={{
                background: GLASS_BG,
                backdropFilter: GLASS_BLUR,
                WebkitBackdropFilter: GLASS_BLUR,
                border: '1px solid rgba(255, 255, 255, 0.55)',
                borderRadius: 18,
                padding: '12px 14px',
              }}
            >
              <div
                className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm"
                style={{ color: TEXT }}
              >
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 9999,
                      background: 'rgba(255, 255, 255, 0.8)',
                      boxShadow: '0 0 14px rgba(255,255,255,0.45)',
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ opacity: 0.9 }}>{t('nutrition.calendar.today')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 9999,
                      background: PINK,
                      boxShadow: '0 0 14px rgba(255,126,157,0.45)',
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ opacity: 0.9, color: TEXT }}>
                    {t('nutrition.timeline.foodRecord')}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline list below calendar - show records for current month */}
            {timelineItems.length > 0 && (
              <div className="mt-6">
                <div className="mb-3 text-sm font-semibold" style={{ color: '#FFFFFF' }}>
                  {t('nutrition.calendar.viewTimeline')}
                </div>
                <div className="space-y-3">
                  {timelineItems.map((reflection, index) => {
                    const date = parseISO(reflection.date + 'T00:00:00');
                    const isNewDay =
                      index === 0 ||
                      (timelineItems[index - 1] &&
                        timelineItems[index - 1].date !== reflection.date);

                    const mealType = reflection.mealType || 'lunch';
                    const mealTypeLabel = t(`nutrition.record.mealType.${mealType}`);
                    const reflectionTypeLabel = t(`nutrition.record.${reflection.reflection}`);

                    return (
                      <div key={reflection.id}>
                        {isNewDay && (
                          <div className="px-2 mb-2">
                            <div className="text-xs font-semibold" style={{ color: '#FFFFFF' }}>
                              {format(
                                date,
                                locale === 'zh' ? 'yyyy年MM月dd日' : 'EEEE, MMMM d, yyyy'
                              )}
                            </div>
                          </div>
                        )}

                        <div
                          className="rounded-3xl"
                          style={{
                            background: GLASS_BG,
                            backdropFilter: GLASS_BLUR,
                            WebkitBackdropFilter: GLASS_BLUR,
                            border: '1px solid rgba(255, 255, 255, 0.55)',
                            boxShadow: '0 18px 50px rgba(0,0,0,0.10)',
                            overflow: 'hidden',
                          }}
                        >
                          <div className="flex items-start gap-3 p-4">
                            <div
                              style={{
                                width: 4,
                                alignSelf: 'stretch',
                                borderRadius: 9999,
                                background: PINK,
                                boxShadow: `0 0 14px ${PINK}55`,
                                marginTop: 2,
                              }}
                            />

                            <div
                              className="flex-1 cursor-pointer"
                              onClick={() => handleView(reflection)}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Utensils
                                  size={16}
                                  strokeWidth={2}
                                  style={{ color: TEXT, opacity: 0.85 }}
                                />
                                <span className="text-xs font-semibold" style={{ color: TEXT }}>
                                  {mealTypeLabel}
                                </span>
                                <span className="text-xs" style={{ color: 'rgba(74,74,74,0.75)' }}>
                                  {reflectionTypeLabel}
                                </span>
                              </div>

                              <div className="text-sm font-semibold" style={{ color: TEXT }}>
                                {reflection.notes || mealTypeLabel}
                              </div>

                              {reflection.aiAnalysis && (
                                <div
                                  className="text-xs mt-1"
                                  style={{ color: 'rgba(74,74,74,0.75)' }}
                                >
                                  {t('nutrition.record.aiAnalysis')}
                                </div>
                              )}
                            </div>

                            {/* Delete button */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setDeleteConfirm({
                                    id: reflection.id,
                                    date: reflection.date,
                                    mealType: reflection.mealType,
                                    title: `${mealTypeLabel} - ${reflectionTypeLabel}`,
                                  });
                                }}
                                className="touch-target rounded-full flex items-center justify-center"
                                style={{
                                  width: 44,
                                  height: 44,
                                  background: GLASS_BG,
                                  border: '1px solid rgba(255, 255, 255, 0.55)',
                                  backdropFilter: GLASS_BLUR,
                                  WebkitBackdropFilter: GLASS_BLUR,
                                  color: TEXT,
                                }}
                                aria-label={t('common.delete')}
                                title={t('common.delete')}
                              >
                                <Trash2 size={18} strokeWidth={2} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Day Detail View - when clicking a date from calendar */}
        {viewMode === 'timeline' && selectedDate && (
          <motion.div
            key={`timeline-${selectedDate}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {timelineItems.length === 0 ? (
              <div
                style={{
                  background: GLASS_BG,
                  backdropFilter: GLASS_BLUR,
                  WebkitBackdropFilter: GLASS_BLUR,
                  border: '1px solid rgba(255, 255, 255, 0.6)',
                  borderRadius: 24,
                  boxShadow: '0 18px 50px rgba(0,0,0,0.10)',
                  padding: 24,
                  color: '#FFFFFF',
                }}
              >
                {/* Bai Qi dialogue bubble for empty state - with avatar */}
                <div className="mb-6 flex items-start gap-3">
                  {/* Character Avatar */}
                  <div className="flex-shrink-0">
                    <CharacterAvatar
                      characterId="baiqi"
                      characterState={characterState}
                      size="md"
                      showBadge={false}
                    />
                  </div>
                  {/* Dialogue Bubble */}
                  <div
                    className="relative flex-1 px-5 py-4 rounded-2xl"
                    style={{
                      background: 'rgba(255, 255, 255, 0.4)',
                      backdropFilter: 'blur(30px)',
                      borderRadius: '24px',
                      border: '1px solid rgba(255, 255, 255, 0.55)',
                      boxShadow:
                        '0 10px 40px rgba(0, 0, 0, 0.10), 0 0 0 1px rgba(255, 209, 220, 0.18)',
                      color: '#FFFFFF',
                    }}
                  >
                    <p className="text-sm leading-relaxed" style={{ color: '#FFFFFF' }}>
                      {locale === 'zh'
                        ? '今天还没来得及记录饮食吗？我很想知道你今天吃了什么。'
                        : "Haven't recorded your meals today? I'd love to know what you ate."}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {timelineItems.map(reflection => {
                  const mealType = reflection.mealType || 'lunch';
                  const mealTypeLabel = t(`nutrition.record.mealType.${mealType}`);
                  const reflectionTypeLabel = t(`nutrition.record.${reflection.reflection}`);

                  return (
                    <div key={reflection.id}>
                      <div
                        className="rounded-3xl"
                        style={{
                          background: GLASS_BG,
                          backdropFilter: GLASS_BLUR,
                          WebkitBackdropFilter: GLASS_BLUR,
                          border: '1px solid rgba(255, 255, 255, 0.55)',
                          boxShadow: '0 18px 50px rgba(0,0,0,0.10)',
                          overflow: 'hidden',
                        }}
                      >
                        <div className="flex items-start gap-3 p-4">
                          <div
                            style={{
                              width: 4,
                              alignSelf: 'stretch',
                              borderRadius: 9999,
                              background: PINK,
                              boxShadow: `0 0 14px ${PINK}55`,
                              marginTop: 2,
                            }}
                          />

                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() => handleView(reflection)}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Utensils
                                size={16}
                                strokeWidth={2}
                                style={{ color: TEXT, opacity: 0.85 }}
                              />
                              <span className="text-xs font-semibold" style={{ color: TEXT }}>
                                {mealTypeLabel}
                              </span>
                              <span className="text-xs" style={{ color: 'rgba(74,74,74,0.75)' }}>
                                {reflectionTypeLabel}
                              </span>
                            </div>

                            <div className="text-sm font-semibold" style={{ color: TEXT }}>
                              {reflection.notes || mealTypeLabel}
                            </div>

                            {reflection.aiAnalysis && (
                              <div
                                className="text-xs mt-2"
                                style={{ color: 'rgba(74,74,74,0.75)' }}
                              >
                                {reflection.aiAnalysis.encouragement}
                              </div>
                            )}
                          </div>

                          {/* Delete button */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setDeleteConfirm({
                                  id: reflection.id,
                                  date: reflection.date,
                                  mealType: reflection.mealType,
                                  title: `${mealTypeLabel} - ${reflectionTypeLabel}`,
                                });
                              }}
                              className="touch-target rounded-full flex items-center justify-center"
                              style={{
                                width: 44,
                                height: 44,
                                background: GLASS_BG,
                                border: '1px solid rgba(255, 255, 255, 0.55)',
                                backdropFilter: GLASS_BLUR,
                                WebkitBackdropFilter: GLASS_BLUR,
                                color: TEXT,
                              }}
                              aria-label={t('common.delete')}
                              title={t('common.delete')}
                            >
                              <Trash2 size={18} strokeWidth={2} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Fixed bottom action button */}
      {!(
        !loading &&
        timelineItems.length === 0 &&
        !selectedDate &&
        monthReflections.length === 0
      ) && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 w-full"
          style={{
            paddingBottom: `calc(1rem + env(safe-area-inset-bottom))`,
            paddingLeft: '20px',
            paddingRight: '20px',
          }}
        >
          <div className="w-full">
            <button
              className="touch-target w-full font-semibold"
              style={{
                minHeight: 52,
                borderRadius: BUTTON_RADIUS,
                background: BUTTON_GRADIENT,
                backdropFilter: 'blur(22px)',
                WebkitBackdropFilter: 'blur(22px)',
                border: '1px solid rgba(255, 255, 255, 0.55)',
                boxShadow: '0 16px 40px rgba(255,126,157,0.18)',
                color: TEXT,
              }}
              onClick={() => {
                // If viewing a specific date, pass it as a parameter
                if (selectedDate) {
                  navigate(
                    `/nutrition/reflection?date=${selectedDate}&mealType=${getDefaultMealType()}`
                  );
                } else {
                  navigate('/nutrition/reflection');
                }
              }}
            >
              {t('nutrition.timeline.addRecord')}
            </button>
          </div>
        </div>
      )}

      {/* Date Picker Modal - horizontal date selector */}
      {showDatePicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDatePicker(false)} />
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full rounded-t-3xl p-5"
            style={{
              background: GLASS_BG,
              backdropFilter: GLASS_BLUR,
              WebkitBackdropFilter: GLASS_BLUR,
              border: '1px solid rgba(255, 255, 255, 0.55)',
              borderBottom: 'none',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.15)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: TEXT }}>
                {t('nutrition.calendar.selectDate') || 'Select Date'}
              </h3>
              <button
                onClick={() => setShowDatePicker(false)}
                className="touch-target rounded-full flex items-center justify-center"
                style={{
                  width: 32,
                  height: 32,
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: TEXT,
                }}
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>
            <div
              className="flex gap-2 overflow-x-auto pb-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {Array.from({ length: 30 }, (_, i) => {
                const date = subDays(new Date(), i);
                const dateStr = format(date, 'yyyy-MM-dd');
                const isSelected = selectedDate === dateStr;
                // Check if this date has any reflections
                const dateHasReflections = recentReflections.some(r => r.date === dateStr);

                return (
                  <button
                    key={dateStr}
                    onClick={() => {
                      setSelectedDate(dateStr);
                      navigate(`/nutrition/timeline?date=${dateStr}`);
                      setShowDatePicker(false);
                    }}
                    className="touch-target flex-shrink-0 rounded-2xl px-4 py-3 flex flex-col items-center gap-1"
                    style={{
                      minWidth: 80,
                      background: isSelected ? BUTTON_GRADIENT : GLASS_BG,
                      border: `1px solid ${isSelected ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.4)'}`,
                      backdropFilter: GLASS_BLUR,
                      WebkitBackdropFilter: GLASS_BLUR,
                      color: TEXT,
                    }}
                  >
                    <div className="text-xs font-semibold">
                      {format(date, locale === 'zh' ? 'MM月dd日' : 'MMM d')}
                    </div>
                    <div className="text-xs" style={{ opacity: 0.7 }}>
                      {format(date, locale === 'zh' ? 'EEE' : 'EEE')}
                    </div>
                    {dateHasReflections && (
                      <div
                        className="mt-1"
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 9999,
                          background: PINK,
                          boxShadow: '0 0 8px rgba(255,126,157,0.6)',
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal (glass) */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteConfirm(null)} />
          <div
            className="relative w-full rounded-3xl p-5"
            style={{
              background: GLASS_BG,
              backdropFilter: GLASS_BLUR,
              WebkitBackdropFilter: GLASS_BLUR,
              border: '1px solid rgba(255, 255, 255, 0.55)',
              boxShadow: '0 22px 70px rgba(0,0,0,0.22)',
              color: TEXT,
            }}
          >
            <div className="text-lg font-semibold mb-2">{t('common.confirmDelete')}</div>
            <div className="text-sm mb-5" style={{ color: 'rgba(74,74,74,0.75)' }}>
              {t('common.deleteConfirmMessage').replace('{item}', deleteConfirm.title)}
            </div>
            <div className="flex gap-3">
              <button
                className="touch-target w-full font-semibold"
                style={{
                  minHeight: 52,
                  borderRadius: BUTTON_RADIUS,
                  background: GLASS_BG,
                  backdropFilter: 'blur(22px)',
                  WebkitBackdropFilter: 'blur(22px)',
                  border: '1px solid rgba(255, 255, 255, 0.55)',
                  color: TEXT,
                }}
                onClick={() => setDeleteConfirm(null)}
              >
                {t('common.cancel')}
              </button>
              <button
                className="touch-target w-full font-semibold"
                style={{
                  minHeight: 52,
                  borderRadius: BUTTON_RADIUS,
                  background: BUTTON_GRADIENT,
                  backdropFilter: 'blur(22px)',
                  WebkitBackdropFilter: 'blur(22px)',
                  border: '1px solid rgba(255, 255, 255, 0.55)',
                  color: TEXT,
                }}
                onClick={handleDelete}
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
