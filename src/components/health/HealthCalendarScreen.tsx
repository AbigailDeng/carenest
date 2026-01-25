import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, getDay, addMonths, subMonths } from 'date-fns';
import { useSymptomEntries } from '../../hooks/useSymptomEntries';
import { useMedicalRecords } from '../../hooks/useMedicalRecords';
import { useTranslation } from '../../hooks/useTranslation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function HealthCalendarScreen() {
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  const { entries } = useSymptomEntries();
  const { records } = useMedicalRecords();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthKey = format(currentMonth, 'yyyy-MM');

  const BAIQI_IMAGE_URL =
    '/images/1cb7398bea6d251b67d50b965c4295130983e2771863c5-oVQb7P_fw658webp.webp';

  const GLASS_BG = 'rgba(255, 255, 255, 0.2)';
  const GLASS_BLUR = 'blur(25px)';
  const TEXT = '#4A4A4A';
  const PINK = '#FF7E9D';
  const PURPLE = '#A78BFA';

  // Get all items for the current month
  const monthItems = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    const monthEntries = entries.filter((entry) => {
      const entryDate = parseISO(entry.loggedDate);
      return entryDate >= monthStart && entryDate <= monthEnd;
    });

    const monthRecords = records.filter((record) => {
      const recordDate = parseISO(record.uploadDate);
      return recordDate >= monthStart && recordDate <= monthEnd;
    });

    return { entries: monthEntries, records: monthRecords };
  }, [currentMonth, entries, records]);

  // Get items for a specific date
  const getItemsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayEntries = monthItems.entries.filter((entry) => {
      return format(parseISO(entry.loggedDate), 'yyyy-MM-dd') === dateStr;
    });
    const dayRecords = monthItems.records.filter((record) => {
      return format(parseISO(record.uploadDate), 'yyyy-MM-dd') === dateStr;
    });
    return { entries: dayEntries, records: dayRecords };
  };

  const calendarDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Get first day of week for the month (0 = Sunday)
  const firstDayOfWeek = getDay(startOfMonth(currentMonth));
  
  // Create empty cells for days before the first day of the month
  const emptyDays = Array(firstDayOfWeek).fill(null);

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    // Navigate to timeline filtered by date
    navigate(`/health/timeline?date=${dateStr}`);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const weekDays = locale === 'zh' 
    ? ['日', '一', '二', '三', '四', '五', '六']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Visual Foundation: Bai Qi illustration as blurred base layer */}
      <div className="fixed inset-0">
        <img
          src={BAIQI_IMAGE_URL}
          alt="Bai Qi background"
          className="w-full h-full object-cover"
          style={{
            filter: 'blur(10px)',
            transform: 'scale(1.06)',
            opacity: 0.9,
          }}
        />
        {/* Soft readability veil */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.40) 60%, rgba(255,255,255,0.52) 100%)',
          }}
        />
      </div>

      <div className="relative z-10 px-5 pt-24 pb-8 max-w-md mx-auto">
        {/* Month header (icons aligned with Lucide style) */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-lg font-semibold" style={{ color: TEXT }}>
            {t('health.calendar.title')}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousMonth}
              className="touch-target rounded-full flex items-center justify-center"
              style={{
                width: 44,
                height: 44,
                background: 'rgba(255, 255, 255, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.45)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                color: TEXT,
              }}
              aria-label={t('common.previous')}
            >
              <ChevronLeft size={22} strokeWidth={2} />
            </button>

            <div className="min-w-[132px] text-center text-sm font-semibold" style={{ color: TEXT }}>
              {format(currentMonth, locale === 'zh' ? 'yyyy年MM月' : 'MMMM yyyy')}
            </div>

            <button
              onClick={handleNextMonth}
              className="touch-target rounded-full flex items-center justify-center"
              style={{
                width: 44,
                height: 44,
                background: 'rgba(255, 255, 255, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.45)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                color: TEXT,
              }}
              aria-label={t('common.next')}
            >
              <ChevronRight size={22} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Glassmorphism Calendar container + entry micro-interaction */}
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
            padding: 16,
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={monthKey}
              className="grid grid-cols-7 gap-2"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {weekDays.map((day) => (
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

              {calendarDays.map((day) => {
                const items = getItemsForDate(day);
                const hasSymptoms = items.entries.length > 0;
                const hasRecords = items.records.length > 0;
                const hasItems = hasSymptoms || hasRecords;
                const today = isSameDay(day, new Date());

                const glow = today || hasItems;
                const dayNumber = format(day, 'd');

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => handleDateClick(day)}
                    className="aspect-square rounded-2xl transition-transform active:scale-[0.98]"
                    style={{
                      border: 'none', // Minimalist grid: remove borders
                      background: glow ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.06)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    aria-label={`${t('health.calendar.title')} ${format(day, 'yyyy-MM-dd')}`}
                  >
                    {/* Pink-purple glow only for today / has items */}
                    {glow && (
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            'linear-gradient(135deg, rgba(255,126,157,0.28) 0%, rgba(167,139,250,0.22) 100%)',
                          boxShadow:
                            '0 0 0 1px rgba(255,255,255,0.18) inset, 0 10px 24px rgba(255,126,157,0.18)',
                        }}
                      />
                    )}

                    {/* Selected-like circular halo for highlighted days */}
                    {glow && (
                      <div
                        className="absolute left-1/2 top-2 -translate-x-1/2"
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 9999,
                          background: 'rgba(255, 126, 157, 0.18)',
                        }}
                      />
                    )}

                    <div className="relative z-10 h-full w-full flex flex-col items-center justify-center">
                      <div className="text-xs font-semibold" style={{ color: TEXT }}>
                        {dayNumber}
                      </div>

                      {/* Minimal indicators: dots (not bars) */}
                      {(hasSymptoms || hasRecords) && (
                        <div className="mt-1 flex items-center gap-1">
                          {hasSymptoms && (
                            <span
                              title={`${items.entries.length} ${t('health.timeline.symptomEntry')}`}
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: 9999,
                                background: PINK,
                                boxShadow: '0 0 12px rgba(255,126,157,0.55)',
                                display: 'inline-block',
                              }}
                            />
                          )}
                          {hasRecords && (
                            <span
                              title={`${items.records.length} ${t('health.timeline.medicalRecord')}`}
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: 9999,
                                background: PURPLE,
                                boxShadow: '0 0 12px rgba(167,139,250,0.55)',
                                display: 'inline-block',
                              }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Legend redesign: simple dot + text, breathable spacing */}
        <div
          className="mb-5"
          style={{
            background: 'rgba(255, 255, 255, 0.18)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            borderRadius: 18,
            padding: '12px 14px',
          }}
        >
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm" style={{ color: TEXT }}>
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
              <span style={{ opacity: 0.9 }}>{t('health.calendar.today')}</span>
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
              <span style={{ opacity: 0.9 }}>{t('health.timeline.symptomEntry')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 9999,
                  background: PURPLE,
                  boxShadow: '0 0 14px rgba(167,139,250,0.45)',
                  display: 'inline-block',
                }}
              />
              <span style={{ opacity: 0.9 }}>{t('health.timeline.medicalRecord')}</span>
            </div>
          </div>
        </div>

        {/* Button refinement: equal height, glass material, bold text */}
        <div className="flex gap-3">
          <button
            className="touch-target w-full rounded-[18px] font-semibold"
            style={{
              minHeight: 52,
              background: 'rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(22px)',
              WebkitBackdropFilter: 'blur(22px)',
              border: '1px solid rgba(255, 255, 255, 0.55)',
              boxShadow: '0 12px 34px rgba(0,0,0,0.10)',
              color: TEXT,
            }}
            onClick={() => navigate('/health')}
          >
            {t('common.back')}
          </button>
          <button
            className="touch-target w-full rounded-[18px] font-semibold"
            style={{
              minHeight: 52,
              background: 'linear-gradient(135deg, rgba(255,126,157,0.30) 0%, rgba(167,139,250,0.26) 100%)',
              backdropFilter: 'blur(22px)',
              WebkitBackdropFilter: 'blur(22px)',
              border: '1px solid rgba(255, 255, 255, 0.55)',
              boxShadow: '0 16px 40px rgba(255,126,157,0.18)',
              color: TEXT,
            }}
            onClick={() => navigate('/health/timeline')}
          >
            {t('health.calendar.viewTimeline')}
          </button>
        </div>
      </div>
    </div>
  );
}

