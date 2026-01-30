import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Lightbulb, CheckSquare, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useSymptomEntries } from '../../hooks/useSymptomEntries';
import { useMedicalRecords } from '../../hooks/useMedicalRecords';
import { useTranslation } from '../../hooks/useTranslation';
import AIIndicator from '../shared/AIIndicator';
import Disclaimer from '../shared/Disclaimer';
import ImageBackground from '../shared/ImageBackground';

export default function SymptomAnalysisScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { entries, loading } = useSymptomEntries();
  const { records, loading: recordsLoading } = useMedicalRecords();

  const [entry, setEntry] = useState(entries.find((e) => e.id === id));

  useEffect(() => {
    if (id) {
      const found = entries.find((e) => e.id === id);
      setEntry(found);
    }
  }, [id, entries]);

  // Background image URL - character illustration (same as health page)
  const BACKGROUND_IMAGE_URL = '/images/1cb7398bea6d251b67d50b965c4295130983e2771863c5-oVQb7P_fw658webp.webp';

  // Card styling - solid background for better readability (no glassmorphism)
  const CARD_BG = 'rgba(255, 255, 255, 0.95)'; // High opacity white background for readability
  const CARD_BORDER = '1px solid rgba(0, 0, 0, 0.1)'; // Subtle border
  const CARD_SHADOW = '0 2px 8px rgba(0, 0, 0, 0.1)'; // Subtle shadow
  const TEXT_SHADOW = 'none'; // No text shadow needed with solid background

  // Get medical records (images) associated with this specific symptom entry
  const relatedMedicalRecords = useMemo(() => {
    if (!entry) return [];
    
    const entryDate = parseISO(entry.loggedDate);
    const entryDateStr = format(entryDate, 'yyyy-MM-dd');
    const entrySymptoms = entry.symptoms.trim();
    
    // Filter image records that match both date and symptom text
    // This ensures we only show medical records associated with THIS specific symptom entry
    const associatedRecords = records.filter((record) => {
      const isImage = record.fileType === 'image';
      const hasContent = record.fileContent && record.fileContent.byteLength > 0;
      if (!isImage || !hasContent) return false;
      
      const recordDate = parseISO(record.uploadDate);
      const recordDateStr = format(recordDate, 'yyyy-MM-dd');
      
      // Match by date and symptom text (stored in aiSummary when saved)
      const matchesDate = recordDateStr === entryDateStr;
      const matchesSymptoms = record.aiSummary === entrySymptoms || !record.aiSummary;
      
      return matchesDate && matchesSymptoms;
    });
    
    return associatedRecords;
  }, [entry, records]);

  // Helper function to convert ArrayBuffer to Blob URL and manage cleanup
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    // Cleanup previous URLs first
    imageUrls.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    
    // Create blob URLs for all related medical records
    const urls = new Map<string, string>();
    
    relatedMedicalRecords.forEach((record) => {
      try {
        if (!record.fileContent || record.fileContent.byteLength === 0) {
          return;
        }
        
        // Determine MIME type based on filename extension
        let mimeType = 'image/jpeg'; // default
        const filenameLower = record.filename.toLowerCase();
        if (filenameLower.endsWith('.png')) {
          mimeType = 'image/png';
        } else if (filenameLower.endsWith('.webp')) {
          mimeType = 'image/webp';
        } else if (filenameLower.endsWith('.gif')) {
          mimeType = 'image/gif';
        }
        
        const blob = new Blob([record.fileContent], { type: mimeType });
        const url = URL.createObjectURL(blob);
        urls.set(record.id, url);
      } catch (error) {
        console.error('[SymptomAnalysis] Error creating blob URL:', error);
      }
    });
    
    setImageUrls(urls);

    // Cleanup function
    return () => {
      urls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [relatedMedicalRecords]);

  if (loading || recordsLoading) {
    return (
      <div className="relative min-h-screen" style={{ backgroundColor: 'transparent', position: 'relative', width: '100%', height: '100%', minHeight: '100vh', margin: 0, padding: 0 }}>
        {/* ImageBackground - 最底层唯一的角色立绘 */}
        <ImageBackground imageUrl={BACKGROUND_IMAGE_URL} />
        <div className="relative flex items-center justify-center z-10" style={{ minHeight: '100vh' }}>
          <div className="text-center">
            <p className="text-gray-600" style={{ color: '#4A4A4E' }}>{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="relative min-h-screen" style={{ backgroundColor: 'transparent', position: 'relative', width: '100%', height: '100%', minHeight: '100vh', margin: 0, padding: 0 }}>
        {/* ImageBackground - 最底层唯一的角色立绘 */}
        <ImageBackground imageUrl={BACKGROUND_IMAGE_URL} />
        <div className="relative min-h-screen py-6 z-10 w-full" style={{ backgroundColor: 'transparent', paddingLeft: '20px', paddingRight: '20px' }}>
          <div
            className="p-5 rounded-2xl w-full"
            style={{
              background: CARD_BG,
              border: CARD_BORDER,
              boxShadow: CARD_SHADOW,
            }}
          >
            <p className="mb-4" style={{ color: '#5A4E4E' }}>
              {t('health.symptoms.entryNotFound')}
            </p>
            <button
              onClick={() => navigate('/health/timeline')}
              className="px-4 py-2 rounded-xl font-medium transition-all"
              style={{
                background: CARD_BG,
                border: CARD_BORDER,
                boxShadow: CARD_SHADOW,
                color: '#5A4E4E',
              }}
            >
              {t('health.backToHealth')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { aiAnalysis, processingStatus, errorMessage } = entry;

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: 'transparent', position: 'relative', width: '100%', height: '100%', minHeight: '100vh', margin: 0, padding: 0 }}>
      {/* ImageBackground - 最底层唯一的角色立绘 */}
      <ImageBackground imageUrl={BACKGROUND_IMAGE_URL} />

      {/* Content Layer - all containers must be transparent, scrollable */}
      <div className="relative min-h-screen overflow-y-auto w-full" style={{ backgroundColor: 'transparent', zIndex: 1, margin: 0, padding: 0, position: 'relative' }}>
        {/* Top Header - fixed at top layer */}
        <div className="fixed top-0 left-0 right-0 z-[100] py-4 w-full" style={{ backgroundColor: 'transparent', paddingLeft: '20px', paddingRight: '20px', paddingTop: `calc(env(safe-area-inset-top) + 16px)` }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                navigate('/health/timeline');
              }}
              className="rounded-full flex items-center justify-center transition-all duration-200 touch-target"
              style={{
                width: '44px',
                height: '44px',
                background: CARD_BG,
                border: CARD_BORDER,
                boxShadow: CARD_SHADOW,
                color: '#5A4E4E',
              }}
              aria-label={t('common.back')}
            >
              <ChevronLeft size={24} strokeWidth={2} />
            </button>
            <h1 className="text-xl font-bold" style={{ color: '#5A4E4E' }}>
              {t('health.symptoms.analysisTitle') || '症状详情'}
            </h1>
          </div>
        </div>

        {/* Main content area - cards with solid background for readability */}
        <div className="relative w-full" style={{ backgroundColor: 'transparent', paddingTop: '80px', paddingBottom: '100px', paddingLeft: '20px', paddingRight: '20px', minHeight: '100vh' }}>
          <div className="w-full space-y-4">
            {/* Title and date - removed per user request, but keeping date in first card */}
            
            {/* Symptom Summary Card */}
            <div
              className="p-5 rounded-2xl"
              style={{
                background: CARD_BG,
                border: CARD_BORDER,
                boxShadow: CARD_SHADOW,
                borderRadius: '16px',
              }}
            >
              <h2 className="text-lg font-bold mb-3" style={{ color: '#5A4E4E' }}>
                {t('health.symptoms.yourSymptoms')}
              </h2>
              <p className="mb-3" style={{ color: '#5A4E4E' }}>
                {entry.symptoms}
              </p>
              <p className="text-xs" style={{ color: '#5A4E4E', opacity: 0.7 }}>
                {new Date(entry.loggedDate).toLocaleDateString()}
              </p>
            </div>

            {/* Medical Records Images Card */}
            {relatedMedicalRecords.length > 0 && (
              <div
                className="p-5 rounded-2xl"
                style={{
                  background: CARD_BG,
                  border: CARD_BORDER,
                  boxShadow: CARD_SHADOW,
                  borderRadius: '16px',
                }}
              >
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: '#5A4E4E' }}>
                  <ImageIcon size={20} strokeWidth={2} style={{ color: '#A78BFA' }} />
                  {t('health.symptoms.uploadedMedicalRecords')}
                </h2>
                <div className="flex flex-wrap gap-3">
                  {relatedMedicalRecords.map((record, index) => {
                    const imageUrl = imageUrls.get(record.id);
                    if (!imageUrl) return null;
                    const rotation = (index % 2 === 0 ? 1 : -1) * (3 + Math.random() * 2); // Rotate -5deg to 5deg
                    return (
                      <div
                        key={record.id}
                        className="relative cursor-pointer"
                        style={{
                          transform: `rotate(${rotation}deg)`,
                        }}
                        // Image click - already showing in detail page, no navigation needed
                      >
                        <img
                          src={imageUrl}
                          alt={record.filename}
                          className="w-24 h-24 object-cover"
                          style={{
                            border: '2px solid white',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            borderRadius: '4px',
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Processing Status */}
            {processingStatus === 'pending' && (
              <div
                className="p-5 rounded-2xl"
                style={{
                  background: 'rgba(255, 243, 205, 0.95)',
                  border: '1px solid rgba(255, 200, 87, 0.3)',
                  boxShadow: CARD_SHADOW,
                  borderRadius: '16px',
                }}
              >
                <p className="text-sm" style={{ color: '#5A4E4E' }}>
                  {t('health.symptoms.pendingAnalysis')}
                </p>
              </div>
            )}

            {processingStatus === 'processing' && (
              <div
                className="p-5 rounded-2xl"
                style={{
                  background: CARD_BG,
                  border: CARD_BORDER,
                  boxShadow: CARD_SHADOW,
                  borderRadius: '16px',
                }}
              >
                <div className="flex items-center gap-3">
                  <AIIndicator status="processing" />
                  <p style={{ color: '#5A4E4E' }}>
                    {t('health.symptoms.analyzing')}
                  </p>
                </div>
              </div>
            )}

            {processingStatus === 'failed' && (
              <div
                className="p-5 rounded-2xl"
                style={{
                  background: 'rgba(255, 205, 205, 0.95)',
                  border: '1px solid rgba(255, 100, 100, 0.3)',
                  boxShadow: CARD_SHADOW,
                  borderRadius: '16px',
                }}
              >
                <p className="text-sm mb-2" style={{ color: '#5A4E4E' }}>
                  {t('health.symptoms.analysisFailed')}
                </p>
                {errorMessage && (
                  <p className="text-sm" style={{ color: '#5A4E4E', opacity: 0.8 }}>
                    {errorMessage}
                  </p>
                )}
              </div>
            )}

            {/* AI Analysis Results */}
            {processingStatus === 'completed' && aiAnalysis && (
              <>
                {/* AI Observations Card */}
                <div
                  className="p-5 rounded-2xl"
                  style={{
                    background: CARD_BG,
                    border: CARD_BORDER,
                    boxShadow: CARD_SHADOW,
                    borderRadius: '16px',
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <AIIndicator status="completed" />
                    <h2 className="text-lg font-bold" style={{ color: '#5A4E4E' }}>
                      {t('health.symptoms.observations')}
                    </h2>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed" style={{ color: '#5A4E4E' }}>
                    {aiAnalysis.observations}
                  </p>
                </div>

                {/* Possible Causes Card */}
                {aiAnalysis.possibleCauses.length > 0 && (
                  <div
                    className="p-5 rounded-2xl"
                    style={{
                      background: CARD_BG,
                      border: CARD_BORDER,
                      boxShadow: CARD_SHADOW,
                      borderRadius: '16px',
                    }}
                  >
                    <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: '#5A4E4E' }}>
                      <Lightbulb size={20} strokeWidth={2} style={{ color: '#FFD700' }} />
                      {t('health.symptoms.possibleCauses')}
                    </h2>
                    <ul className="space-y-2">
                      {aiAnalysis.possibleCauses.map((cause, index) => (
                        <li key={index} className="flex items-start gap-2 leading-relaxed">
                          <span style={{ color: '#5A4E4E', opacity: 0.8 }}>·</span>
                          <span style={{ color: '#5A4E4E' }}>{cause}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggestions Card */}
                {aiAnalysis.suggestions.length > 0 && (
                  <div
                    className="p-5 rounded-2xl"
                    style={{
                      background: CARD_BG,
                      border: CARD_BORDER,
                      boxShadow: CARD_SHADOW,
                      borderRadius: '16px',
                    }}
                  >
                    <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: '#5A4E4E' }}>
                      <CheckSquare size={20} strokeWidth={2} style={{ color: '#90EE90' }} />
                      {t('health.symptoms.suggestions')}
                    </h2>
                    <ul className="space-y-2">
                      {aiAnalysis.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2 leading-relaxed">
                          <span style={{ color: '#5A4E4E', opacity: 0.8 }}>·</span>
                          <span style={{ color: '#5A4E4E' }}>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* When to Seek Help Card */}
                <div
                  className="p-5 rounded-2xl"
                  style={{
                    background: CARD_BG,
                    border: CARD_BORDER,
                    boxShadow: CARD_SHADOW,
                    borderRadius: '16px',
                  }}
                >
                  <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: '#5A4E4E' }}>
                    <AlertCircle size={20} strokeWidth={2} style={{ color: '#FFA500' }} />
                    {t('health.symptoms.whenToSeekHelp')}
                  </h2>
                  <p className="leading-relaxed" style={{ color: '#5A4E4E' }}>
                    {aiAnalysis.whenToSeekHelp}
                  </p>
                </div>

                {/* Disclaimer Card */}
                <div
                  className="p-5 rounded-2xl"
                  style={{
                    background: CARD_BG,
                    border: CARD_BORDER,
                    boxShadow: CARD_SHADOW,
                    borderRadius: '16px',
                  }}
                >
                  <p className="text-sm italic leading-relaxed" style={{ color: '#5A4E4E', opacity: 0.8 }}>
                    {aiAnalysis.disclaimer}
                  </p>
                </div>
              </>
            )}

            {/* Medical Disclaimer */}
            <div
              className="p-5 rounded-2xl"
              style={{
                background: CARD_BG,
                border: CARD_BORDER,
                boxShadow: CARD_SHADOW,
                borderRadius: '16px',
              }}
            >
              <Disclaimer type="medical" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

