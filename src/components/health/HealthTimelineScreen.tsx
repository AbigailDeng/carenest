import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, parseISO, subDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';
import { SymptomEntry } from '../../types';
import { useSymptomEntries } from '../../hooks/useSymptomEntries';
import { useMedicalRecords } from '../../hooks/useMedicalRecords';
import { useTranslation } from '../../hooks/useTranslation';
import { truncateFilename } from '../../utils/truncate';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Select from '../shared/Select';

export default function HealthTimelineScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, locale } = useTranslation();
  const { entries, loading, getEntriesByDateRange, deleteEntry, refresh: refreshEntries } = useSymptomEntries();
  const { records, deleteRecord, refresh: refreshRecords } = useMedicalRecords();

  const [dateRange, setDateRange] = useState(30); // days
  const [filteredEntries, setFilteredEntries] = useState<SymptomEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline'>('calendar');
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'symptom' | 'record'; id: string; title: string } | null>(null);

  useEffect(() => {
    const dateParam = searchParams.get('date');
    const viewParam = searchParams.get('view');
    
    if (dateParam) {
      setSelectedDate(dateParam);
      setViewMode('timeline');
      // Filter to show only items from selected date
      try {
        const selectedDateObj = parseISO(dateParam + 'T00:00:00');
        const startOfDay = new Date(selectedDateObj);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDateObj);
        endOfDay.setHours(23, 59, 59, 999);
        
        const loadFiltered = async () => {
          try {
            const filtered = await getEntriesByDateRange(startOfDay.toISOString(), endOfDay.toISOString());
            setFilteredEntries(filtered);
          } catch (err) {
            console.error('Failed to load filtered entries:', err);
            setFilteredEntries([]);
          }
        };
        
        loadFiltered();
      } catch (err) {
        console.error('Invalid date parameter:', err);
        setSelectedDate(null);
        setFilteredEntries([]);
        setViewMode('calendar');
      }
    } else {
      setSelectedDate(null);
      
      // Set view mode from URL parameter
      if (viewParam === 'timeline') {
        setViewMode('timeline');
      } else {
        // Default to calendar view
        setViewMode('calendar');
      }
      
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      const startDate = subDays(new Date(), dateRange);
      startDate.setHours(0, 0, 0, 0);
      
      const loadFiltered = async () => {
        try {
          const filtered = await getEntriesByDateRange(startDate.toISOString(), endDate.toISOString());
          setFilteredEntries(filtered);
        } catch (err) {
          console.error('Failed to load entries:', err);
          setFilteredEntries([]);
        }
      };
      
      loadFiltered();
    }
  }, [dateRange, getEntriesByDateRange, searchParams]);

  // Timeline item types
  type TimelineItem = 
    | {
        type: 'symptom';
        id: string;
        date: string;
        title: string;
        subtitle: 'mild' | 'moderate' | 'severe' | null;
        severity: 'mild' | 'moderate' | 'severe' | null;
        details: string | null;
        entry: SymptomEntry;
      }
    | {
        type: 'record';
        id: string;
        date: string;
        title: string;
        fullTitle: string;
        subtitle: string | null;
        details: null;
        record: any;
      };

  // Combine entries and records for timeline
  const timelineItems = useMemo((): TimelineItem[] => {
    if (loading) {
      return [];
    }
    let itemsToShow: TimelineItem[] = [
      ...filteredEntries.map((entry) => ({
        type: 'symptom' as const,
        id: entry.id,
        date: entry.loggedDate,
        title: entry.symptoms,
        subtitle: entry.severity ? entry.severity : null,
        severity: entry.severity,
        details: entry.notes,
        entry: entry, // Keep full entry for details
      })),
    ];

    // Add records if not filtering by date, or if selected date matches
    if (!selectedDate) {
      const cutoffDate = subDays(new Date(), dateRange);
      itemsToShow = [
        ...itemsToShow,
        ...records
          .filter((r) => {
            const recordDate = parseISO(r.uploadDate);
            return recordDate >= cutoffDate;
          })
          .map((record) => ({
            type: 'record' as const,
            id: record.id,
            date: record.uploadDate,
            title: truncateFilename(record.filename, 20),
            fullTitle: record.filename, // Keep full filename for tooltip
            subtitle: record.processingStatus === 'completed' ? 'AI Summary Available' : null,
            details: null,
            record: record, // Keep full record for details
          })),
      ];
    } else {
      // Filter records by selected date
      const dateStr = selectedDate;
      itemsToShow = [
        ...itemsToShow,
        ...records
          .filter((r) => {
            return format(parseISO(r.uploadDate), 'yyyy-MM-dd') === dateStr;
          })
          .map((record) => ({
            type: 'record' as const,
            id: record.id,
            date: record.uploadDate,
            title: truncateFilename(record.filename, 20),
            fullTitle: record.filename, // Keep full filename for tooltip
            subtitle: record.processingStatus === 'completed' ? 'AI Summary Available' : null,
            details: null,
            record: record,
          })),
      ];
    }

    return itemsToShow.sort((a, b) => {
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);
      return dateB.getTime() - dateA.getTime();
    });
  }, [filteredEntries, records, dateRange, selectedDate, loading]);

  // Calendar data
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

  const firstDayOfWeek = getDay(startOfMonth(currentMonth));
  const emptyDays = Array(firstDayOfWeek).fill(null);

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
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

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      if (deleteConfirm.type === 'symptom') {
        await deleteEntry(deleteConfirm.id);
      } else {
        await deleteRecord(deleteConfirm.id);
      }
      setDeleteConfirm(null);
      // Refresh filtered entries if needed
      if (selectedDate) {
        const selectedDateObj = parseISO(selectedDate + 'T00:00:00');
        const startOfDay = new Date(selectedDateObj);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDateObj);
        endOfDay.setHours(23, 59, 59, 999);
        const filtered = await getEntriesByDateRange(startOfDay.toISOString(), endOfDay.toISOString());
        setFilteredEntries(filtered);
      } else {
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        const startDate = subDays(new Date(), dateRange);
        startDate.setHours(0, 0, 0, 0);
        const filtered = await getEntriesByDateRange(startDate.toISOString(), endDate.toISOString());
        setFilteredEntries(filtered);
      }
      await refreshEntries();
      await refreshRecords();
    } catch (err: any) {
      console.error('Failed to delete:', err);
      alert(t('common.deleteFailed') || 'Failed to delete');
    }
  };

  const handleEdit = (item: { type: 'symptom' | 'record'; id: string }) => {
    if (item.type === 'symptom') {
      navigate(`/health/symptoms/edit/${item.id}`);
    } else {
      // For medical records, navigate to summary page where user can see details
      // Medical records editing would require re-upload, so we just navigate to view
      navigate(`/health/summary/${item.id}`);
    }
  };

  const handleView = (item: { type: 'symptom' | 'record'; id: string }) => {
    if (item.type === 'record') {
      navigate(`/health/summary/${item.id}`);
    } else {
      navigate(`/health/symptoms/${item.id}`);
    }
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-gray-50">
        <div className="text-center py-12">
          <p className="text-gray-600">{t('health.loadingTimeline')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50 pb-20">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('health.timeline.title')}</h1>
          {selectedDate && (
            <p className="text-sm text-gray-600 mt-1">
              {format(parseISO(selectedDate + 'T00:00:00'), 'MMMM d, yyyy')}
            </p>
          )}
        </div>
        {viewMode === 'calendar' && (
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
        )}
        {viewMode === 'timeline' && selectedDate && (
          <button
            onClick={() => {
              navigate('/health/timeline');
              setSelectedDate(null);
              setViewMode('calendar');
            }}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            {t('common.back')}
          </button>
        )}
        {viewMode === 'timeline' && !selectedDate && (
          <Select
            value={dateRange}
            onChange={(value) => setDateRange(Number(value))}
            options={[
              { value: 7, label: t('health.timeline.last7Days') },
              { value: 30, label: t('health.timeline.last30Days') },
              { value: 90, label: t('health.timeline.last90Days') },
              { value: 365, label: t('health.timeline.lastYear') },
            ]}
          />
        )}
      </div>

      {viewMode === 'calendar' ? (
        <>
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
            <div className="flex items-center gap-4 text-sm flex-wrap">
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
        </>
      ) : (
        <>

      {timelineItems.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">{t('health.timeline.noEntries')}</p>
            <Button onClick={() => navigate('/health/symptoms')}>
              {t('health.timeline.logFirstSymptom')}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {timelineItems.map((item, index) => {
            if (!item.date) return null;
            const date = parseISO(item.date);
            const isNewDay =
              index === 0 ||
              (timelineItems[index - 1]?.date && format(parseISO(timelineItems[index - 1].date), 'yyyy-MM-dd') !==
                format(date, 'yyyy-MM-dd'));

            return (
              <div key={`${item.type}-${item.id}`}>
                {isNewDay && (
                  <div className="sticky top-0 bg-gray-50 py-2 mb-2 z-10">
                    <h2 className="text-sm font-semibold text-gray-700">
                      {format(date, 'EEEE, MMMM d, yyyy')}
                    </h2>
                  </div>
                )}
                <Card
                  className={`hover:shadow-md transition-shadow ${
                    item.type === 'record' ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-green-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                    // Store current view mode in sessionStorage before navigating
                    sessionStorage.setItem('timelineViewMode', viewMode);
                    handleView(item);
                  }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500">
                          {item.type === 'record' ? `📋 ${t('health.timeline.medicalRecord')}` : `✨ ${t('health.timeline.symptomEntry')}`}
                        </span>
                        <span className="text-xs text-gray-400">
                          {format(date, 'h:mm a')}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">{item.title}</h3>
                      {item.type === 'symptom' && item.subtitle && (
                        <p className="text-sm text-gray-600 mb-1">
                          {t('dataView.severity')} {t(`severity.${item.subtitle}`)}
                        </p>
                      )}
                      {item.type === 'record' && item.subtitle && (
                        <p className="text-sm text-gray-600 mb-1">
                          {t('health.timeline.aiSummaryAvailable')}
                        </p>
                      )}
                      {item.details && (
                        <p className="text-sm text-gray-600 mt-2">{item.details}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(item);
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors touch-target"
                        aria-label={t('common.edit')}
                        title={t('common.edit')}
                      >
                        <span className="text-lg">✏️</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({
                            type: item.type,
                            id: item.id,
                            title: item.title,
                          });
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-target"
                        aria-label={t('common.delete')}
                        title={t('common.delete')}
                      >
                        <span className="text-lg">🗑️</span>
                      </button>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}

        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('common.confirmDelete')}</h2>
            <p className="text-gray-600 mb-6">
              {t('common.deleteConfirmMessage').replace('{item}', deleteConfirm.title)}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setDeleteConfirm(null)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                {t('common.delete')}
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        {viewMode === 'calendar' ? (
          <>
            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                setViewMode('timeline');
                setSelectedDate(null);
              }}
            >
              📅 {t('health.calendar.viewTimeline')}
            </Button>
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
              onClick={() => navigate('/health/symptoms')}
            >
              {t('health.timeline.logNewSymptom')}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                setViewMode('calendar');
                setSelectedDate(null);
                sessionStorage.setItem('timelineViewMode', 'calendar');
                navigate('/health/timeline');
              }}
            >
              📅 {t('health.calendar.title')}
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => navigate('/health')}
            >
              {t('common.back')}
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => navigate('/health/symptoms')}
            >
              {t('health.timeline.logNewSymptom')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

