import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { parseISO, format } from 'date-fns';
import { ChevronLeft, Paperclip } from 'lucide-react';
import { useSymptomEntries } from '../../hooks/useSymptomEntries';
import { useMedicalRecords } from '../../hooks/useMedicalRecords';
import { useTranslation } from '../../hooks/useTranslation';
import { useOffline } from '../../hooks/useOffline';
import { useCompanion } from '../../hooks/useCompanion';
import { analyzeSymptoms } from '../../services/llmService';
import { validateSymptomEntry } from '../../utils/validation';
import { getEntity } from '../../services/storage/indexedDB';
import { SymptomEntry } from '../../types';
import AIIndicator from '../shared/AIIndicator';
import ImageBackground from '../shared/ImageBackground';
import CharacterAvatar from '../companion/CharacterAvatar';

export default function SymptomLogScreen() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { addEntry, updateEntry, loading } = useSymptomEntries();
  const { addRecord } = useMedicalRecords();
  const isOffline = useOffline();
  const isEditMode = id && id.startsWith('edit');
  const { characterState } = useCompanion('baiqi');
  
  // Get date parameter from URL (for logging symptoms to a specific past date)
  const dateParam = searchParams.get('date');

  const [symptoms, setSymptoms] = useState(''); // Unified free description area - FR-037(2)
  const [uploadedImages, setUploadedImages] = useState<File[]>([]); // Image uploads - FR-037(3)
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [loadingEntry, setLoadingEntry] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0); // Dynamic placeholder rotation - FR-037(3)

  // Background image URL - character illustration
  const BACKGROUND_URL = '/images/1cb7398bea6d251b67d50b965c4295130983e2771863c5-oVQb7P_fw658webp.webp';

  // Premium glassmorphism constants - FR-037(2) "Private Consultation Room"
  const GLASS_BG = 'rgba(255, 255, 255, 0.15)'; // Premium transparency, no gray
  const GLASS_BLUR = 'blur(35px)'; // Enhanced blur for premium effect
  const GLASS_BORDER = '1.5px solid rgba(255, 255, 255, 0.4)'; // White glowing border
  const GLASS_SHADOW = '0 4px 24px rgba(255, 255, 255, 0.2)';

  // Dynamic placeholder rotation - FR-037(3)
  useEffect(() => {
    // Rotate placeholder on page load
    const randomIndex = Math.floor(Math.random() * 3);
    setPlaceholderIndex(randomIndex);
  }, []);

  // Load existing entry if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const entryId = id.replace('edit/', '');
      setLoadingEntry(true);
      getEntity<SymptomEntry>('symptomEntries', entryId)
        .then((entry) => {
          if (entry) {
            // Combine symptoms and notes into unified free description - FR-037(2)
            const combinedText = entry.notes 
              ? `${entry.symptoms}\n\n${entry.notes}` 
              : entry.symptoms;
            setSymptoms(combinedText);
            setAiAnalysis(entry.aiAnalysis);
            // Severity is auto-extracted by AI, not manually selected - FR-037(4)
          }
        })
        .catch((err) => {
          setError(err.message || t('health.failedToLoad'));
        })
        .finally(() => {
          setLoadingEntry(false);
        });
    }
  }, [id, isEditMode, t]);

  // Get dynamic placeholder text - FR-037(3)
  const getPlaceholderText = () => {
    const placeholders = [
      t('health.symptoms.freeDescriptionPlaceholder1'),
      t('health.symptoms.freeDescriptionPlaceholder2'),
      t('health.symptoms.freeDescriptionPlaceholder3'),
    ];
    return placeholders[placeholderIndex] || placeholders[0];
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploadedImages((prev) => [...prev, ...files]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    setError(null);

    // Validate unified free description - FR-037(2)
    const validation = validateSymptomEntry({ symptoms: symptoms.trim() });
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      // Process with AI (or queue if offline)
      if (isOffline) {
        setError(t('health.symptoms.offline'));
        setAnalyzing(false);
        return;
      }

      // AI auto-extracts severity from free-form text - FR-037(4)
      // Include uploaded images for analysis
      const analysis = await analyzeSymptoms({
        symptoms: symptoms.trim(),
        notes: null, // No separate notes field - FR-037(2)
        severity: null, // Auto-extracted by AI - FR-037(4)
        medicalRecordImages: uploadedImages.length > 0 ? uploadedImages : undefined, // Include images for analysis
      });

      setAiAnalysis(analysis);
      setAnalyzing(false);
    } catch (aiError: any) {
      console.error('AI analysis error:', aiError);
      const errorMessage = aiError?.message || aiError?.code === 'CONFIG_ERROR' 
        ? (t('health.symptoms.apiKeyMissing') || 'AI service is not configured. Please check your settings.')
        : (t('health.symptoms.aiAnalysisFailed') || 'Failed to analyze symptoms. Please try again.');
      setError(errorMessage);
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    // Validate unified free description - FR-037(2)
    const validation = validateSymptomEntry({ symptoms: symptoms.trim() });
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Use date from URL parameter if provided (for logging to past dates), otherwise use current date/time
      let loggedDate: string;
      let loggedTime: string;
      
      if (dateParam) {
        // Parse the date parameter (format: yyyy-MM-dd) and set time to current time
        try {
          const parsedDate = parseISO(dateParam + 'T00:00:00');
          const now = new Date();
          // Use the date from parameter but keep current time
          parsedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
          loggedDate = parsedDate.toISOString();
          loggedTime = loggedDate;
        } catch (err) {
          console.error('Invalid date parameter:', err);
          // Fallback to current date if parsing fails
          const now = new Date().toISOString();
          loggedDate = now;
          loggedTime = now;
        }
      } else {
        const now = new Date().toISOString();
        loggedDate = now;
        loggedTime = now;
      }
      
      const now = new Date().toISOString();
      
      // Extract severity from AI analysis if available - FR-037(4)
      const extractedSeverity = aiAnalysis?.severity || null;
      
      if (isEditMode && id) {
        const entryId = id.replace('edit/', '');
        const existing = await getEntity<SymptomEntry>('symptomEntries', entryId);
        if (!existing) {
          throw new Error('Entry not found');
        }
        
        await updateEntry(entryId, {
          symptoms: symptoms.trim(),
          notes: null, // No separate notes field - FR-037(2)
          severity: extractedSeverity, // Auto-extracted by AI - FR-037(4)
          aiAnalysis: aiAnalysis || existing.aiAnalysis,
          updatedAt: now,
        });
        
        // Save uploaded images as medical records (use original entry date)
        if (uploadedImages.length > 0) {
          try {
            for (const imageFile of uploadedImages) {
              // Convert File to ArrayBuffer
              const arrayBuffer = await imageFile.arrayBuffer();
              
              // Determine file type from MIME type
              let fileType: 'text' | 'image' | 'pdf' = 'image';
              if (imageFile.type.includes('pdf')) {
                fileType = 'pdf';
              } else if (imageFile.type.startsWith('text/')) {
                fileType = 'text';
              }
              
              // Save as medical record with same date as original symptom entry
              // Store symptom text in aiSummary field for display title
              await addRecord({
                filename: imageFile.name,
                fileType,
                uploadDate: existing.loggedDate, // Use original symptom entry date
                fileContent: arrayBuffer,
                fileSize: imageFile.size,
                aiSummary: symptoms.trim(), // Store symptom text as title
                aiAnalysis: null,
                processingStatus: 'pending',
                errorMessage: null,
              });
            }
          } catch (imageError: any) {
            console.error('Failed to save medical record images:', imageError);
            // Don't fail the entire save if image saving fails
            // The symptom entry is already saved
          }
        }
        
        // Navigate directly to symptom detail page after save
        navigate(`/health/symptoms/${entryId}`);
      } else {
        const entry = {
          symptoms: symptoms.trim(),
          notes: null, // No separate notes field - FR-037(2)
          severity: extractedSeverity, // Auto-extracted by AI - FR-037(4)
          loggedDate: loggedDate, // Use date from URL parameter if provided
          loggedTime: loggedTime, // Use time from URL parameter if provided
          aiAnalysis,
          processingStatus: 'completed' as const,
          errorMessage: null,
          createdAt: now,
          updatedAt: now,
        };

        const savedEntry = await addEntry(entry);
        
        // Save uploaded images as medical records
        if (uploadedImages.length > 0) {
          try {
            for (const imageFile of uploadedImages) {
              // Convert File to ArrayBuffer
              const arrayBuffer = await imageFile.arrayBuffer();
              
              // Determine file type from MIME type
              let fileType: 'text' | 'image' | 'pdf' = 'image';
              if (imageFile.type.includes('pdf')) {
                fileType = 'pdf';
              } else if (imageFile.type.startsWith('text/')) {
                fileType = 'text';
              }
              
              // Save as medical record with same date as symptom entry
              // Store symptom text in aiSummary field for display title
              await addRecord({
                filename: imageFile.name,
                fileType,
                uploadDate: loggedDate, // Use same date as symptom entry (from URL parameter if provided)
                fileContent: arrayBuffer,
                fileSize: imageFile.size,
                aiSummary: symptoms.trim(), // Store symptom text as title
                aiAnalysis: null,
                processingStatus: 'pending',
                errorMessage: null,
              });
            }
          } catch (imageError: any) {
            console.error('Failed to save medical record images:', imageError);
            // Don't fail the entire save if image saving fails
            // The symptom entry is already saved
          }
        }
        
        // Navigate directly to symptom detail page after save
        navigate(`/health/symptoms/${savedEntry.id}`);
      }
    } catch (err: any) {
      setError(err.message || t('health.failedToSave'));
      setSaving(false);
    }
  };

  if (loadingEntry) {
    return (
      <div className="relative min-h-screen" style={{ position: 'relative', width: '100%', height: '100%', minHeight: '100vh', margin: 0, padding: 0 }}>
        {/* ImageBackground - 最底层唯一的角色立绘 */}
        <ImageBackground imageUrl={BACKGROUND_URL} />
        <div className="relative flex items-center justify-center z-10" style={{ minHeight: '100vh' }}>
          <div className="text-center">
            <p className="text-gray-600" style={{ color: '#4A4A4A' }}>{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ position: 'relative', width: '100%', height: '100%', minHeight: '100vh', margin: 0, padding: 0, background: 'transparent' }}>
      {/* ImageBackground - 最底层唯一的角色立绘 */}
      <ImageBackground imageUrl={BACKGROUND_URL} />

      {/* Minimal premium glassmorphism back button - FR-037(5) */}
      <button
          onClick={() => navigate(-1)}
          className="fixed top-5 left-5 z-50 rounded-full flex items-center justify-center transition-all duration-200 touch-target"
          style={{
            width: '44px',
            height: '44px',
            background: GLASS_BG,
            backdropFilter: GLASS_BLUR,
            border: GLASS_BORDER,
            boxShadow: GLASS_SHADOW,
            color: '#5A4E4E',
          }}
          aria-label={t('common.back')}
        >
          <ChevronLeft size={24} strokeWidth={2} />
      </button>

      {/* Character dialogue bubble - positioned at character's shoulder level with avatar icon, left-aligned to avoid overlapping input area - FR-037(7) */}
      {/* When AI analysis completes, this bubble REPLACES the initial prompt with AI conclusion */}
      {/* CRITICAL: Position must ensure NO overlap with input area below */}
      <div className="fixed left-0 right-0 z-40 flex justify-start w-full" style={{
        paddingLeft: '20px',
        paddingRight: '20px', 
          top: aiAnalysis ? '80px' : '80px', // Fixed position to prevent overlap with input area
          pointerEvents: aiAnalysis ? 'auto' : 'none', // Enable pointer events when AI analysis is shown for scrolling
        }}>
          <div
            className="flex items-start gap-2 rounded-2xl"
            style={{
              background: GLASS_BG,
              backdropFilter: GLASS_BLUR,
              border: GLASS_BORDER,
              boxShadow: GLASS_SHADOW,
              maxWidth: aiAnalysis ? '85%' : 'max-w-xs', // Allow wider bubble for AI conclusion
              height: aiAnalysis ? '180px' : 'auto', // Fixed height for AI conclusion to prevent blocking other areas
              maxHeight: aiAnalysis ? '180px' : 'auto', // Fixed max height - 180px as requested
              overflow: 'hidden', // Hide overflow on outer container
              padding: aiAnalysis ? '12px' : '8px 12px', // Adjust padding for scrollable content
              pointerEvents: 'auto', // Ensure the bubble itself can receive touch events for scrolling
            }}
          >
            <CharacterAvatar
              characterId="baiqi"
              characterState={characterState}
              size="sm"
              showBadge={false}
            />
            <div className="flex-1 min-w-0" style={{ 
              height: aiAnalysis ? '100%' : 'auto',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden', // Hide overflow on flex container
            }}>
              {aiAnalysis && !analyzing ? (
                // AI conclusion replaces initial prompt - FR-037(7) - Scrollable content area
                <div style={{ 
                  flex: 1,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
                  paddingRight: '4px', // Add padding for scrollbar
                }}>
                  <p className="text-sm font-medium mb-2 leading-relaxed" style={{ color: '#5A4E4E', textShadow: '0 1px 2px rgba(255,255,255,0.6)' }}>
                    {aiAnalysis.observations}
                  </p>
                  {aiAnalysis.suggestions && aiAnalysis.suggestions.length > 0 && (
                    <ul className="text-xs space-y-1 font-medium" style={{ color: '#5A4E4E', opacity: 0.9, textShadow: '0 1px 2px rgba(255,255,255,0.6)' }}>
                      {aiAnalysis.suggestions.map((suggestion: string, index: number) => (
                        <li key={index} className="flex items-start gap-1 leading-relaxed">
                          <span>·</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                // Initial prompt - shown when no AI analysis yet
                <p className="text-sm font-medium flex-1" style={{ color: '#5A4E4E', textShadow: '0 1px 2px rgba(255,255,255,0.6)' }}>
                  {t('health.symptoms.symptomPrompt')}
                </p>
              )}
            </div>
          </div>
        </div>

      {/* Main content area - positioned higher on screen with sufficient spacing from dialogue bubble - FR-037(12) */}
      {/* Note: AI conclusion now replaces the dialogue bubble above, not displayed here - FR-037(7) */}
      {/* CRITICAL: paddingTop must ensure NO overlap with dialogue bubble above */}
      <div className="relative z-10 pb-32 min-h-screen w-full" style={{ paddingLeft: '20px', paddingRight: '20px' }}>
        <div className="w-full" style={{
            paddingTop: aiAnalysis ? '280px' : '180px', // Increase padding when AI conclusion is shown (taller bubble)
            paddingBottom: '100px' 
          }}>
            <div className="space-y-4" style={{ gap: '15px' }}>
              {/* Unified free description area with paperclip icon - FR-037(2), FR-037(4) */}
              <div
                className="p-5 rounded-2xl relative"
                style={{
                  background: GLASS_BG,
                  backdropFilter: GLASS_BLUR,
                  border: GLASS_BORDER,
                  boxShadow: GLASS_SHADOW,
                  borderRadius: '16px',
                  // No floating animation - only character illustration should float
                }}
              >
                <label 
                  className="block mb-3 text-base font-bold" 
                  style={{ 
                    color: '#5A4E4E',
                    textShadow: '0 1px 2px rgba(255,255,255,0.6)',
                    letterSpacing: '0.05em',
                    fontWeight: 700,
                  }}
                >
                  {t('health.symptoms.freeDescriptionLabel')}
                </label>
                <div className="relative">
                  <textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    onFocus={() => {
                      // Rotate placeholder on focus - FR-037(3)
                      setPlaceholderIndex((prev) => (prev + 1) % 3);
                    }}
                    placeholder={getPlaceholderText()}
                    className="w-full px-3 py-2 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder:opacity-70"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: 'none', // Border-free input - FR-037(2)
                      borderBottom: '1px solid rgba(255, 255, 255, 0.3)', // Subtle bottom border only
                      color: '#5A4E4E',
                      fontSize: '16px',
                    }}
                    rows={6}
                    required
                    maxLength={3000}
                  />
                  {/* Enhanced paperclip icon with label at bottom-right corner - FR-037(4) */}
                  <input
                    type="file"
                    id="imageUpload"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="imageUpload"
                    className="absolute bottom-2 right-2 cursor-pointer flex flex-col items-center gap-1 transition-all group"
                    style={{
                      padding: '8px',
                      background: 'rgba(255, 255, 255, 0.2)', // Stronger background for distinction
                      backdropFilter: GLASS_BLUR,
                      border: GLASS_BORDER,
                      borderRadius: '8px',
                      color: '#5A4E4E',
                      minWidth: '60px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.boxShadow = '0 2px 12px rgba(255, 126, 157, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Paperclip size={28} />
                    <span className="text-xs font-medium whitespace-nowrap" style={{ fontSize: '12px', color: '#5A4E4E' }}>
                      {t('health.symptoms.uploadMedicalRecordLabel')}
                    </span>
                  </label>
                </div>
                <p className="mt-2 text-xs font-medium" style={{ color: '#5A4E4E', opacity: 0.7 }}>
                  {symptoms.length}/3000 {t('health.symptoms.characters')}
                </p>
              </div>

              {/* Separate upload preview area - visually distinct from text input - FR-037(4) */}
              {uploadedImages.length > 0 && (
                <div
                  className="p-5 rounded-2xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.18)', // Slightly different opacity for distinction
                    backdropFilter: GLASS_BLUR,
                    border: GLASS_BORDER,
                    boxShadow: GLASS_SHADOW,
                    borderRadius: '16px',
                    // No floating animation - only character illustration should float
                    marginTop: '16px', // Clear visual separation from textarea container
                  }}
                >
                  <label 
                    className="block mb-3 text-sm font-bold" 
                    style={{ 
                      color: '#5A4E4E',
                      textShadow: '0 1px 2px rgba(255,255,255,0.6)',
                      letterSpacing: '0.05em',
                      fontWeight: 700,
                    }}
                  >
                    {t('health.symptoms.uploadedMedicalRecords')}
                  </label>
                  {/* Tilted/rotated image previews positioned at edge - FR-037(4), FR-037(5) */}
                  <div className="flex flex-wrap gap-3">
                    {uploadedImages.map((file, index) => {
                      const rotation = (index % 2 === 0 ? 1 : -1) * (3 + Math.random() * 2); // Rotate -5deg to 5deg
                      return (
                        <div 
                          key={index} 
                          className="relative"
                          style={{
                            transform: `rotate(${rotation}deg)`,
                          }}
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Upload ${index + 1}`}
                            className="w-20 h-20 object-cover"
                            style={{
                              border: '2px solid white', // Polaroid white border - FR-037(5)
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)', // Polaroid shadow - FR-037(5)
                              borderRadius: '4px',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center z-10"
                            style={{
                              background: 'rgba(239, 68, 68, 0.9)',
                              color: 'white',
                              fontSize: '14px',
                            }}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Analyzing indicator - FR-037(2) premium glassmorphism */}
              {analyzing && (
                <div
                  className="p-4 rounded-2xl"
                  style={{
                    background: GLASS_BG,
                    backdropFilter: GLASS_BLUR,
                    border: GLASS_BORDER,
                    boxShadow: GLASS_SHADOW,
                    borderRadius: '16px',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <AIIndicator status="processing" />
                    <p className="text-sm font-medium" style={{ color: '#5A4E4E', textShadow: '0 1px 2px rgba(255,255,255,0.6)' }}>
                      {t('health.symptoms.analyzing')}
                    </p>
                  </div>
                </div>
              )}

              {/* Error message - FR-037(2) premium glassmorphism */}
              {error && (
                <div
                  className="p-5 rounded-2xl"
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    backdropFilter: GLASS_BLUR,
                    border: GLASS_BORDER,
                    boxShadow: GLASS_SHADOW,
                    borderRadius: '16px',
                  }}
                >
                  <p className="text-sm font-bold" style={{ color: '#DC2626', textShadow: '0 1px 2px rgba(255,255,255,0.6)' }}>{error}</p>
                </div>
              )}

              {/* Offline message - FR-037(2) premium glassmorphism */}
              {isOffline && !aiAnalysis && (
                <div
                  className="p-5 rounded-2xl"
                  style={{
                    background: 'rgba(234, 179, 8, 0.15)',
                    backdropFilter: GLASS_BLUR,
                    border: GLASS_BORDER,
                    boxShadow: GLASS_SHADOW,
                    borderRadius: '16px',
                  }}
                >
                  <p className="text-sm font-bold" style={{ color: '#CA8A04', textShadow: '0 1px 2px rgba(255,255,255,0.6)' }}>
                    {t('health.symptoms.offline')}
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>

      {/* Fixed bottom action buttons - FR-037(5), FR-037(7) premium glassmorphism - equal width */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pb-6 pt-4 w-full" style={{ background: 'transparent', paddingLeft: '20px', paddingRight: '20px' }}>
          <div className="w-full">
            <div className="flex gap-3">
                {/* Cancel button - equal width wrapper */}
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => navigate('/health')}
                    disabled={analyzing || saving}
                    className="w-full px-4 py-3 rounded-xl font-semibold transition-all disabled:opacity-40"
                    style={{
                      background: GLASS_BG,
                      backdropFilter: GLASS_BLUR,
                      border: GLASS_BORDER,
                      boxShadow: GLASS_SHADOW,
                      color: '#5A4E4E',
                      fontWeight: 700,
                      textShadow: '0 1px 2px rgba(255,255,255,0.6)',
                    }}
                  >
                    {t('common.cancel')}
                  </button>
                </div>
                {!aiAnalysis && !isEditMode ? (
                  <div className="flex-1 relative rounded-xl" style={{ padding: '2px' }}>
                    <div
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: 'linear-gradient(135deg, #FF7E9D 0%, #A78BFA 100%)',
                        opacity: 0.8,
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAnalyze}
                      disabled={analyzing || loading || !symptoms.trim() || isOffline}
                      className="relative w-full px-4 py-3 rounded-xl font-semibold transition-all disabled:opacity-40"
                      style={{
                        background: GLASS_BG,
                        backdropFilter: GLASS_BLUR,
                        boxShadow: '0 4px 20px rgba(255, 126, 157, 0.4), 0 0 30px rgba(167, 139, 250, 0.3)',
                        color: '#5A4E4E',
                        fontWeight: 700,
                        textShadow: '0 1px 2px rgba(255,255,255,0.6)',
                      }}
                    >
                      {analyzing ? t('health.symptoms.analyzing') : t('health.symptoms.letHimLook')}
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 relative rounded-xl" style={{ padding: '2px' }}>
                    <div
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: 'linear-gradient(135deg, #FF7E9D 0%, #A78BFA 100%)',
                        opacity: 0.8,
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving || loading || !symptoms.trim()}
                      className="relative w-full px-4 py-3 rounded-xl font-semibold transition-all disabled:opacity-40"
                      style={{
                        background: GLASS_BG,
                        backdropFilter: GLASS_BLUR,
                        boxShadow: '0 4px 20px rgba(255, 126, 157, 0.4), 0 0 30px rgba(167, 139, 250, 0.3)',
                        color: '#5A4E4E',
                        fontWeight: 700,
                        textShadow: '0 1px 2px rgba(255,255,255,0.6)',
                      }}
                    >
                      {saving ? t('health.symptoms.saving') : t('common.save')}
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* CSS for placeholder styling - FR-037(2) */}
        {/* Note: Floating animations removed - only character illustration (立绘图) should have floating effect */}
        <style>{`
          textarea::placeholder {
            color: #5A4E4E;
            opacity: 0.7;
          }
        `}</style>
    </div>
  );
}
