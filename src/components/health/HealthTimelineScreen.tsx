import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, parseISO, subDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isAfter, startOfDay } from 'date-fns';
import { SymptomEntry, MedicalRecord } from '../../types';
import { useSymptomEntries } from '../../hooks/useSymptomEntries';
import { useMedicalRecords } from '../../hooks/useMedicalRecords';
import { useTranslation } from '../../hooks/useTranslation';
import { truncateFilename } from '../../utils/truncate';
import { motion } from 'framer-motion';
import { CalendarDays, ChevronLeft, ChevronRight, ClipboardList, Trash2, X } from 'lucide-react';
import CharacterAvatar from '../companion/CharacterAvatar';
import { useCompanion } from '../../hooks/useCompanion';
import ImageBackground from '../shared/ImageBackground';

export default function HealthTimelineScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, locale } = useTranslation();
  const { entries, loading, getEntriesByDateRange, deleteEntry, refresh: refreshEntries } = useSymptomEntries();
  const { records, deleteRecord, refresh: refreshRecords } = useMedicalRecords();
  const { characterState } = useCompanion('baiqi');

  const [dateRange, setDateRange] = useState(30); // days
  const [filteredEntries, setFilteredEntries] = useState<SymptomEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline'>('calendar');
  const [deleteConfirm, setDeleteConfirm] = useState<{ 
    type: 'symptom' | 'record'; 
    id: string; 
    title: string;
    associatedSymptomEntryId?: string; // For medical records that are associated with symptom entries
  } | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const BAIQI_IMAGE_URL =
    '/images/1cb7398bea6d251b67d50b965c4295130983e2771863c5-oVQb7P_fw658webp.webp';
  // Enhanced glassmorphism: brighter, more saturated (fix muddy glass)
  const GLASS_BG = 'rgba(255, 255, 255, 0.32)';
  const GLASS_BLUR = 'blur(30px)';
  const TEXT = '#4A4A4A';
  const PINK = '#FF7E9D'; // symptom
  const PURPLE = '#A78BFA'; // record
  // Unified button style constants
  const BUTTON_RADIUS = 20;
  const BUTTON_GRADIENT = 'linear-gradient(135deg, rgba(255,126,157,0.35) 0%, rgba(167,139,250,0.30) 100%)';
  const monthKey = format(currentMonth, 'yyyy-MM');

  useEffect(() => {
    const dateParam = searchParams.get('date');
    
    if (dateParam) {
      // From calendar click: show day detail view
      setSelectedDate(dateParam);
      setViewMode('timeline');
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
        setViewMode('timeline'); // Default to timeline when from folder
      }
    } else {
      // From health folder: always show calendar view
      setSelectedDate(null);
      
      // Always default to calendar view
      setViewMode('calendar');
      
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
        record: MedicalRecord;
        associatedSymptomEntryId?: string; // ID of associated symptom entry
      };

  // Combine entries and records for timeline
  // Logic: If symptom entry has associated medical record (image), show as medical record with symptom text as title
  // If no medical record, show as simple symptom entry
  const timelineItems = useMemo((): TimelineItem[] => {
    if (loading) {
      return [];
    }
    
    const itemsToShow: TimelineItem[] = [];
    
    // Get date range for filtering records
    const cutoffDate = selectedDate 
      ? parseISO(selectedDate + 'T00:00:00')
      : subDays(new Date(), dateRange);
    
    // Process entries: check if they have associated medical records
    filteredEntries.forEach((entry) => {
      const entryDateStr = format(parseISO(entry.loggedDate), 'yyyy-MM-dd');
      
      // Find associated medical records (images) for the same date and symptom text
      // Match by date and symptom text to ensure correct association
      const entrySymptomsTrimmed = entry.symptoms.trim();
      const associatedRecords = records.filter((r) => {
        const recordDate = parseISO(r.uploadDate);
        const recordDateStr = format(recordDate, 'yyyy-MM-dd');
        // Match by date and symptom text (stored in aiSummary when saved)
        // If aiSummary matches entry.symptoms, they're associated
        // Also match if aiSummary is empty/null (for older records)
        const recordSymptomsTrimmed = (r.aiSummary || '').trim();
        return recordDateStr === entryDateStr && 
               r.fileType === 'image' && 
               (recordSymptomsTrimmed === entrySymptomsTrimmed || recordSymptomsTrimmed === '');
      });
      
      if (associatedRecords.length > 0) {
        // Has medical records: show as ONE medical record (merged), not separate items
        // Use the first record as the representative, but show symptom text as title
        const firstRecord = associatedRecords[0];
        itemsToShow.push({
          type: 'record' as const,
          id: firstRecord.id, // Use first record's ID, but represent the merged entry
          date: entry.loggedDate, // Use symptom entry date for consistency
          title: entry.symptoms, // Always use symptom text as title
          fullTitle: entry.symptoms,
          subtitle: firstRecord.processingStatus === 'completed' ? 'AI Summary Available' : null,
          details: null,
          record: firstRecord, // Keep reference to first record
          associatedSymptomEntryId: entry.id, // Store associated symptom entry ID
        });
        // Don't create separate items for other records - they're all part of the same entry
      } else {
        // No medical records: show as simple symptom entry
        itemsToShow.push({
          type: 'symptom' as const,
          id: entry.id,
          date: entry.loggedDate,
          title: entry.symptoms,
          subtitle: null, // Don't show severity
          severity: entry.severity,
          details: entry.notes,
          entry: entry,
        });
      }
    });
    
    // Track which symptom entries already have medical records (to avoid duplicates)
    const entriesWithRecords = new Set(
      filteredEntries
        .filter((entry) => {
          const entryDateStr = format(parseISO(entry.loggedDate), 'yyyy-MM-dd');
          return records.some((r) => {
            const recordDateStr = format(parseISO(r.uploadDate), 'yyyy-MM-dd');
            return recordDateStr === entryDateStr && 
                   r.fileType === 'image' && 
                   (r.aiSummary === entry.symptoms || !r.aiSummary);
          });
        })
        .map((e) => format(parseISO(e.loggedDate), 'yyyy-MM-dd') + '|' + e.symptoms.trim())
    );
    
    // Add standalone medical records (without associated symptom entries)
    // These are records uploaded directly without symptom text
    const standaloneRecords = records.filter((r) => {
      const recordDate = parseISO(r.uploadDate);
      const recordDateStr = format(recordDate, 'yyyy-MM-dd');
      const isInRange = selectedDate 
        ? recordDateStr === selectedDate
        : recordDate >= cutoffDate;
      
      if (!isInRange || r.fileType !== 'image') return false;
      
      // Check if this record is already associated with a symptom entry
      const recordKey = recordDateStr + '|' + (r.aiSummary || '').trim();
      return !entriesWithRecords.has(recordKey);
    });
    
    standaloneRecords.forEach((record) => {
      itemsToShow.push({
        type: 'record' as const,
        id: record.id,
        date: record.uploadDate,
        title: record.aiSummary || truncateFilename(record.filename, 20), // Use symptom text if available
        fullTitle: record.aiSummary || record.filename,
        subtitle: record.processingStatus === 'completed' ? 'AI Summary Available' : null,
        details: null,
        record: record,
      });
    });

    return itemsToShow.sort((a, b) => {
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);
      return dateB.getTime() - dateA.getTime();
    });
  }, [filteredEntries, records, selectedDate, dateRange, loading]);

  // Calendar data - only records with images count as medical records
  const monthItems = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    const monthEntries = entries.filter((entry) => {
      const entryDate = parseISO(entry.loggedDate);
      return entryDate >= monthStart && entryDate <= monthEnd;
    });

    // Only include records with images (fileType === 'image')
    const monthRecords = records.filter((record) => {
      const recordDate = parseISO(record.uploadDate);
      return recordDate >= monthStart && recordDate <= monthEnd && record.fileType === 'image';
    });

    return { entries: monthEntries, records: monthRecords };
  }, [currentMonth, entries, records]);

  const getItemsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayEntries = monthItems.entries.filter((entry) => {
      return format(parseISO(entry.loggedDate), 'yyyy-MM-dd') === dateStr;
    });
    // Only include records with images (fileType === 'image')
    const dayRecords = monthItems.records.filter((record) => {
      return format(parseISO(record.uploadDate), 'yyyy-MM-dd') === dateStr && record.fileType === 'image';
    });
    
    // Filter: if entry has associated medical record (by date and symptom text), don't show as symptom entry
    // Only show symptom entries that don't have medical records
    const entriesWithoutRecords = dayEntries.filter((entry) => {
      const entrySymptoms = entry.symptoms.trim();
      const hasAssociatedRecord = dayRecords.some((record) => {
        const recordDateStr = format(parseISO(record.uploadDate), 'yyyy-MM-dd');
        const entryDateStr = format(parseISO(entry.loggedDate), 'yyyy-MM-dd');
        // Match by date and symptom text
        return recordDateStr === entryDateStr && 
               (record.aiSummary === entrySymptoms || !record.aiSummary);
      });
      return !hasAssociatedRecord;
    });
    
    return { entries: entriesWithoutRecords, records: dayRecords };
  };

  const calendarDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const firstDayOfWeek = getDay(startOfMonth(currentMonth));
  const emptyDays = Array(firstDayOfWeek).fill(null);

  const handleDateClick = (date: Date) => {
    // Don't allow clicking on future dates
    const today = startOfDay(new Date());
    const selectedDay = startOfDay(date);
    if (isAfter(selectedDay, today)) {
      return; // Disable future dates
    }
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
        // Before deleting, check if this medical record is associated with a symptom entry
        // and if there are other medical records for that entry
        let shouldDeleteAssociatedEntry = false;
        if (deleteConfirm.associatedSymptomEntryId) {
          const associatedEntry = entries.find(e => e.id === deleteConfirm.associatedSymptomEntryId);
          if (associatedEntry) {
            const entryDateStr = format(parseISO(associatedEntry.loggedDate), 'yyyy-MM-dd');
            const entrySymptoms = associatedEntry.symptoms.trim();
            
            // Check if there are any remaining medical records for this symptom entry
            // (excluding the one we're about to delete)
            const remainingRecords = records.filter((r) => {
              if (r.id === deleteConfirm.id) return false; // Exclude the one we're about to delete
              const recordDate = parseISO(r.uploadDate);
              const recordDateStr = format(recordDate, 'yyyy-MM-dd');
              const recordSymptomsTrimmed = (r.aiSummary || '').trim();
              return recordDateStr === entryDateStr && 
                     r.fileType === 'image' && 
                     (recordSymptomsTrimmed === entrySymptoms || recordSymptomsTrimmed === '');
            });
            
            // If no remaining medical records, mark for deletion
            if (remainingRecords.length === 0) {
              shouldDeleteAssociatedEntry = true;
            }
          }
        }
        
        // Delete medical record
        await deleteRecord(deleteConfirm.id);
        
        // If no other medical records exist for this symptom entry, delete the symptom entry too
        if (shouldDeleteAssociatedEntry && deleteConfirm.associatedSymptomEntryId) {
          await deleteEntry(deleteConfirm.associatedSymptomEntryId);
        }
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
    } catch (err) {
      console.error('Failed to delete:', err);
      alert(t('common.deleteFailed') || 'Failed to delete');
    }
  };


  const handleView = (item: TimelineItem) => {
    if (item.type === 'record') {
      // Medical records are displayed in symptom detail pages
      // Use stored associated symptom entry ID if available
      if (item.associatedSymptomEntryId) {
        navigate(`/health/symptoms/${item.associatedSymptomEntryId}`);
      } else {
        // Fallback: find by date and symptom text match (for standalone records)
        const recordDate = parseISO(item.date);
        const recordDateStr = format(recordDate, 'yyyy-MM-dd');
        const recordTitle = item.title; // This should be the symptom text
        
        // Find entry that matches both date and symptom text exactly
        const associatedEntry = entries.find((entry) => {
          const entryDateStr = format(parseISO(entry.loggedDate), 'yyyy-MM-dd');
          return entryDateStr === recordDateStr && entry.symptoms.trim() === recordTitle.trim();
        });
        
        if (associatedEntry) {
          navigate(`/health/symptoms/${associatedEntry.id}`);
        }
        // If no associated entry, stay on timeline
      }
    } else {
      navigate(`/health/symptoms/${item.id}`);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden" style={{ position: 'relative', width: '100%', height: '100%', minHeight: '100vh', margin: 0, padding: 0 }}>
        {/* ImageBackground - 最底层唯一的白起立绘 */}
        <ImageBackground imageUrl={BAIQI_IMAGE_URL} />
        <div className="relative z-10 w-full" style={{ 
          paddingTop: 'calc(env(safe-area-inset-top) + 112px)',
          paddingLeft: '20px',
          paddingRight: '20px',
        }}>
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
            <p className="text-sm font-semibold">{t('health.loadingTimeline')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ position: 'relative', width: '100%', height: '100%', minHeight: '100vh', margin: 0, padding: 0 }}>
      {/* ImageBackground - 最底层唯一的白起立绘 */}
      <ImageBackground imageUrl={BAIQI_IMAGE_URL} />

      {/* Back button - top-left corner */}
      <motion.button
        onClick={() => {
          // If in Day Detail View (selectedDate exists), go back to timeline calendar view
          // Otherwise, go back to health home
          if (selectedDate) {
            navigate('/health/timeline');
          } else {
            navigate('/health');
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
            <div className="text-sm font-semibold" style={{ color: TEXT }}>
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

        {/* Timeline View: "最近x天" filter - only show when NOT in Day Detail View */}
        {viewMode === 'timeline' && !selectedDate && (
          <div
            className="mb-4 flex items-center gap-2 p-1"
            style={{
              background: GLASS_BG,
              backdropFilter: GLASS_BLUR,
              WebkitBackdropFilter: GLASS_BLUR,
              border: '1px solid rgba(255, 255, 255, 0.55)',
              borderRadius: 9999,
              overflowX: 'auto',
            }}
          >
            {[
              { value: 7, label: t('health.timeline.last7Days') },
              { value: 30, label: t('health.timeline.last30Days') },
              { value: 90, label: t('health.timeline.last90Days') },
              { value: 365, label: t('health.timeline.lastYear') },
            ].map((opt) => {
              const active = dateRange === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setDateRange(opt.value)}
                  className="touch-target rounded-full px-3 py-2 text-xs font-semibold whitespace-nowrap"
                  style={{
                    color: TEXT,
                    background: active ? 'rgba(255,255,255,0.35)' : 'transparent',
                    opacity: active ? 1 : 0.7,
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Day Detail View: Selected date display - clickable to show date picker */}
        {viewMode === 'timeline' && selectedDate && (
          <div className="mb-4">
            <button
              onClick={() => setShowDatePicker(true)}
              className="touch-target text-sm font-semibold"
              style={{ color: TEXT }}
            >
              {format(parseISO(selectedDate + 'T00:00:00'), locale === 'zh' ? 'yyyy年MM月dd日' : 'MMMM d, yyyy')}
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
                    const isFuture = isAfter(startOfDay(day), startOfDay(new Date()));
                    
                    // Determine glow color based on record type
                    let glowColor: string | null = null;
                    let glowShadow: string | null = null;
                    let topGlowColor: string | null = null;
                    
                    if (hasItems) {
                      if (hasSymptoms && hasRecords) {
                        // Both: mixed pink-purple gradient
                        glowColor = 'linear-gradient(135deg, rgba(255,126,157,0.28) 0%, rgba(167,139,250,0.22) 100%)';
                        glowShadow = '0 0 0 1px rgba(255,255,255,0.18) inset, 0 10px 24px rgba(255,126,157,0.18)';
                        topGlowColor = 'rgba(255, 126, 157, 0.18)';
                      } else if (hasSymptoms) {
                        // Only symptoms: pink
                        glowColor = 'linear-gradient(135deg, rgba(255,126,157,0.28) 0%, rgba(255,126,157,0.20) 100%)';
                        glowShadow = '0 0 0 1px rgba(255,255,255,0.18) inset, 0 10px 24px rgba(255,126,157,0.25)';
                        topGlowColor = 'rgba(255, 126, 157, 0.25)';
                      } else if (hasRecords) {
                        // Only records: purple
                        glowColor = 'linear-gradient(135deg, rgba(167,139,250,0.28) 0%, rgba(167,139,250,0.20) 100%)';
                        glowShadow = '0 0 0 1px rgba(255,255,255,0.18) inset, 0 10px 24px rgba(167,139,250,0.25)';
                        topGlowColor = 'rgba(167, 139, 250, 0.25)';
                      }
                    } else if (today) {
                      // Today but no records: white/grey
                      glowColor = 'rgba(255, 255, 255, 0.25)';
                      glowShadow = '0 0 0 1px rgba(255,255,255,0.3) inset, 0 8px 20px rgba(255,255,255,0.2)';
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
                          background: (today || hasItems) ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.06)',
                          position: 'relative',
                          overflow: 'hidden',
                          opacity: isFuture ? 0.4 : 1,
                          cursor: isFuture ? 'not-allowed' : 'pointer',
                        }}
                        aria-label={`${t('health.calendar.title')} ${format(day, 'yyyy-MM-dd')}`}
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

              {/* Timeline list below calendar - show records for current month */}
              {timelineItems.length > 0 && (
                <div className="mt-6">
                  <div className="mb-3 text-sm font-semibold" style={{ color: TEXT }}>
                    {t('health.calendar.viewTimeline')}
                  </div>
                  <div className="space-y-3">
                    {timelineItems.map((item, index) => {
                      if (!item.date) return null;
                      const date = parseISO(item.date);
                      const isNewDay =
                        index === 0 ||
                        (timelineItems[index - 1]?.date &&
                          format(parseISO(timelineItems[index - 1].date), 'yyyy-MM-dd') !==
                            format(date, 'yyyy-MM-dd'));

                      const accent = item.type === 'record' ? PURPLE : PINK;
                      const TypeIcon = item.type === 'record' ? ClipboardList : CalendarDays;

                      return (
                        <div key={`${item.type}-${item.id}`}>
                          {isNewDay && (
                            <div className="px-2 mb-2">
                              <div className="text-xs font-semibold" style={{ color: 'rgba(74,74,74,0.8)' }}>
                                {format(date, locale === 'zh' ? 'yyyy年MM月dd日' : 'EEEE, MMMM d, yyyy')}
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
                                  background: accent,
                                  boxShadow: `0 0 14px ${accent}55`,
                                  marginTop: 2,
                                }}
                              />

                              <div
                                className="flex-1 cursor-pointer"
                                onClick={() => {
                                  sessionStorage.setItem('timelineViewMode', viewMode);
                                  handleView(item);
                                }}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <TypeIcon size={16} strokeWidth={2} style={{ color: TEXT, opacity: 0.85 }} />
                                  <span className="text-xs font-semibold" style={{ color: 'rgba(74,74,74,0.75)' }}>
                                    {item.type === 'record'
                                      ? t('health.timeline.medicalRecord')
                                      : t('health.timeline.symptomEntry')}
                                  </span>
                                  <span className="text-xs" style={{ color: 'rgba(74,74,74,0.55)' }}>
                                    {format(date, locale === 'zh' ? 'HH:mm' : 'h:mm a')}
                                  </span>
                                </div>

                                <div className="text-sm font-semibold" style={{ color: TEXT }}>
                                  {item.title}
                                </div>


                                {item.type === 'record' && item.subtitle && (
                                  <div className="text-xs mt-1" style={{ color: 'rgba(74,74,74,0.75)' }}>
                                    {t('health.timeline.aiSummaryAvailable')}
                                  </div>
                                )}

                                {item.details && (
                                  <div className="text-xs mt-2" style={{ color: 'rgba(74,74,74,0.75)' }}>
                                    {item.details}
                                  </div>
                                )}
                              </div>

                              {/* Show delete button for all items, no edit button */}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirm({
                                      type: item.type,
                                      id: item.id,
                                      title: item.title,
                                      associatedSymptomEntryId: item.type === 'record' ? item.associatedSymptomEntryId : undefined,
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
                    color: TEXT,
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
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.10), 0 0 0 1px rgba(255, 209, 220, 0.18)',
                        color: TEXT,
                      }}
                    >
                      <p className="text-sm leading-relaxed" style={{ color: TEXT }}>
                        {locale === 'zh' 
                          ? '今天还没来得及记录吗？我很想知道你的近况。'
                          : "Haven't recorded anything today? I'd love to know how you're doing."}
                      </p>
                    </div>
                  </div>
                  {/* No button here - bottom fixed button handles the action */}
                </div>
              ) : (
                <div className="space-y-4">
                  {timelineItems.map((item, index) => {
                    if (!item.date) return null;
                    const date = parseISO(item.date);
                    const isNewDay =
                      index === 0 ||
                      (timelineItems[index - 1]?.date &&
                        format(parseISO(timelineItems[index - 1].date), 'yyyy-MM-dd') !==
                          format(date, 'yyyy-MM-dd'));

                    const accent = item.type === 'record' ? PURPLE : PINK;
                    const TypeIcon = item.type === 'record' ? ClipboardList : CalendarDays;

                    return (
                      <div key={`${item.type}-${item.id}`}>
                        {/* Only show date header if NOT in Day Detail View (selectedDate is null) */}
                        {isNewDay && !selectedDate && (
                          <div className="px-2 mb-2">
                            <div className="text-xs font-semibold" style={{ color: 'rgba(74,74,74,0.8)' }}>
                              {format(date, locale === 'zh' ? 'yyyy年MM月dd日' : 'EEEE, MMMM d, yyyy')}
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
                                background: accent,
                                boxShadow: `0 0 14px ${accent}55`,
                                marginTop: 2,
                              }}
                            />

                            <div
                              className="flex-1 cursor-pointer"
                              onClick={() => {
                                sessionStorage.setItem('timelineViewMode', viewMode);
                                handleView(item);
                              }}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <TypeIcon size={16} strokeWidth={2} style={{ color: TEXT, opacity: 0.85 }} />
                                <span className="text-xs font-semibold" style={{ color: 'rgba(74,74,74,0.75)' }}>
                                  {item.type === 'record'
                                    ? t('health.timeline.medicalRecord')
                                    : t('health.timeline.symptomEntry')}
                                </span>
                                <span className="text-xs" style={{ color: 'rgba(74,74,74,0.55)' }}>
                                  {format(date, locale === 'zh' ? 'HH:mm' : 'h:mm a')}
                                </span>
                              </div>

                              <div className="text-sm font-semibold" style={{ color: TEXT }}>
                                {item.title}
                              </div>


                              {item.type === 'record' && item.subtitle && (
                                <div className="text-xs mt-1" style={{ color: 'rgba(74,74,74,0.75)' }}>
                                  {t('health.timeline.aiSummaryAvailable')}
                                </div>
                              )}

                              {item.details && (
                                <div className="text-xs mt-2" style={{ color: 'rgba(74,74,74,0.75)' }}>
                                  {item.details}
                                </div>
                              )}
                            </div>

                            {/* Show delete button for all items, no edit button */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirm({
                                    type: item.type,
                                    id: item.id,
                                    title: item.title,
                                    associatedSymptomEntryId: item.type === 'record' ? item.associatedSymptomEntryId : undefined,
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

      {/* Fixed bottom action button - hide only when showing empty state with button */}
      {!(!loading && timelineItems.length === 0 && !selectedDate && entries.length === 0 && records.length === 0) && (
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
                  navigate(`/health/symptoms?date=${selectedDate}`);
                } else {
                  navigate('/health/symptoms');
                }
              }}
            >
              {t('health.timeline.logNewSymptom')}
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
                {t('health.calendar.selectDate') || 'Select Date'}
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
            <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {Array.from({ length: 30 }, (_, i) => {
                const date = subDays(new Date(), i);
                const dateStr = format(date, 'yyyy-MM-dd');
                const isSelected = selectedDate === dateStr;
                // Check if this date has any entries or records (only image records count)
                const dateHasEntries = entries.some(e => format(parseISO(e.loggedDate), 'yyyy-MM-dd') === dateStr);
                const dateHasRecords = records.some(r => format(parseISO(r.uploadDate), 'yyyy-MM-dd') === dateStr && r.fileType === 'image');
                const hasItems = dateHasEntries || dateHasRecords;
                
                return (
                  <button
                    key={dateStr}
                    onClick={() => {
                      setSelectedDate(dateStr);
                      navigate(`/health/timeline?date=${dateStr}`);
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
                    {hasItems && (
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
