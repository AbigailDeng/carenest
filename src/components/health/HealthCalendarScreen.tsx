import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, getDay, addMonths, subMonths } from 'date-fns';
import { useSymptomEntries } from '../../hooks/useSymptomEntries';
import { useMedicalRecords } from '../../hooks/useMedicalRecords';
import { useTranslation } from '../../hooks/useTranslation';
import Card from '../shared/Card';
import Button from '../shared/Button';

export default function HealthCalendarScreen() {
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  const { entries } = useSymptomEntries();
  const { records } = useMedicalRecords();
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
    <div className="p-6 min-h-screen bg-gray-50 pb-20">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('health.calendar.title')}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousMonth}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors touch-target"
            aria-label={t('common.previous')}
          >
            <span className="text-xl">◀</span>
          </button>
          <span className="text-sm font-medium text-gray-900 min-w-[120px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors touch-target"
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
            <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}

          {/* Empty cells for days before month starts */}
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {/* Calendar days */}
          {calendarDays.map((day) => {
            const items = getItemsForDate(day);
            const hasItems = items.entries.length > 0 || items.records.length > 0;
            const isToday = isSameDay(day, new Date());

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDateClick(day)}
                className={`
                  aspect-square p-1 rounded-lg border-2 transition-colors
                  ${isToday 
                    ? 'border-blue-500 bg-blue-50' 
                    : hasItems 
                    ? 'border-green-300 bg-green-50 hover:bg-green-100' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                  ${hasItems ? 'cursor-pointer' : 'cursor-default'}
                `}
              >
                <div className="text-xs font-medium text-gray-900 mb-1">
                  {format(day, 'd')}
                </div>
                {hasItems && (
                  <div className="flex flex-col gap-0.5">
                    {items.entries.length > 0 && (
                      <div className="h-1 bg-green-500 rounded-full" title={`${items.entries.length} ${t('health.timeline.symptomEntry')}`} />
                    )}
                    {items.records.length > 0 && (
                      <div className="h-1 bg-blue-500 rounded-full" title={`${items.records.length} ${t('health.timeline.medicalRecord')}`} />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Legend */}
      <Card className="mb-6">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 bg-blue-50 rounded"></div>
            <span className="text-gray-600">{t('health.calendar.today')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-green-300 bg-green-50 rounded"></div>
            <span className="text-gray-600">{t('health.calendar.hasEntries')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">{t('health.timeline.symptomEntry')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">{t('health.timeline.medicalRecord')}</span>
          </div>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="outline"
          fullWidth
          onClick={() => navigate('/health')}
        >
          {t('common.back')}
        </Button>
        <Button
          variant="primary"
          fullWidth
          onClick={() => navigate('/health/timeline')}
        >
          {t('health.calendar.viewTimeline')}
        </Button>
      </div>
    </div>
  );
}

