import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useSymptomEntries } from '../../hooks/useSymptomEntries';
import { useTranslation } from '../../hooks/useTranslation';
import { useOffline } from '../../hooks/useOffline';
import { useCompanion } from '../../hooks/useCompanion';
import { analyzeSymptoms } from '../../services/llmService';
import { validateSymptomEntry } from '../../utils/validation';
import { getEntity } from '../../services/storage/indexedDB';
import { SymptomEntry } from '../../types';
import AIIndicator from '../shared/AIIndicator';
import ImageBackground from '../shared/ImageBackground';
import SceneBackground from '../companion/SceneBackground';
import FloatingParticles from '../companion/FloatingParticles';
import CharacterLayer from '../companion/CharacterLayer';
import CharacterAvatar from '../companion/CharacterAvatar';

export default function SymptomLogScreen() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { t } = useTranslation();
  const { addEntry, updateEntry, loading } = useSymptomEntries();
  const isOffline = useOffline();
  const isEditMode = id && id.startsWith('edit');
  const { characterState } = useCompanion('baiqi');

  const [symptoms, setSymptoms] = useState(''); // Unified free description area - FR-037(2)
  const [uploadedImages, setUploadedImages] = useState<File[]>([]); // Image uploads - FR-037(3)
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [loadingEntry, setLoadingEntry] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false); // Emotional save confirmation - FR-037(8)

  // Background image URL (same as Health Details Page) - FR-037(1)
  const BACKGROUND_URL = 'https://i.pinimg.com/564x/a6/39/19/a639190333210fb5da77b4903661354e.jpg';
  
  // Character layer URLs - FR-037(1)
  const characterLayerUrls = [
    '/images/1cb7398bea6d251b67d50b965c4295130983e2771863c5-oVQb7P_fw658webp.webp',
  ];

  // Premium glassmorphism constants - FR-037(2) "Baiqi's Private Consultation Room"
  const GLASS_BG = 'rgba(255, 255, 255, 0.15)'; // Premium transparency, no gray
  const GLASS_BLUR = 'blur(35px)'; // Enhanced blur for premium effect
  const GLASS_BORDER = '1.5px solid rgba(255, 255, 255, 0.4)'; // White glowing border
  const GLASS_SHADOW = '0 4px 24px rgba(255, 255, 255, 0.2)';

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
      const analysis = await analyzeSymptoms({
        symptoms: symptoms.trim(),
        notes: null, // No separate notes field - FR-037(2)
        severity: null, // Auto-extracted by AI - FR-037(4)
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
        
        // Show emotional save confirmation - FR-037(8)
        setShowSaveConfirmation(true);
        setTimeout(() => {
          navigate(`/health/symptoms/${entryId}`);
        }, 2000);
      } else {
        const entry = {
          symptoms: symptoms.trim(),
          notes: null, // No separate notes field - FR-037(2)
          severity: extractedSeverity, // Auto-extracted by AI - FR-037(4)
          loggedDate: now,
          loggedTime: now,
          aiAnalysis,
          processingStatus: 'completed' as const,
          errorMessage: null,
          createdAt: now,
          updatedAt: now,
        };

        const savedEntry = await addEntry(entry);
        
        // Show emotional save confirmation - FR-037(8)
        setShowSaveConfirmation(true);
        setTimeout(() => {
          navigate(`/health/symptoms/${savedEntry.id}`);
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || t('health.failedToSave'));
      setSaving(false);
    }
  };

  if (loadingEntry) {
    return (
      <ImageBackground imageUrl={BACKGROUND_URL}>
        <div className="relative min-h-screen flex items-center justify-center z-10">
          <div className="text-center">
            <p className="text-gray-600" style={{ color: '#4A4A4A' }}>{t('common.loading')}</p>
          </div>
        </div>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground imageUrl={BACKGROUND_URL}>
      <div className="relative min-h-screen overflow-hidden">
        {/* Scene Background - FR-037(1) */}
        <div className="absolute inset-0" style={{ zIndex: 1 }}>
          <SceneBackground characterId="baiqi" />
        </div>

        {/* Floating Particles - FR-037(1) */}
        <div className="absolute inset-0" style={{ zIndex: 2 }}>
          <FloatingParticles count={20} />
        </div>

        {/* Character Layer - FR-037(1) */}
        <div className="fixed inset-0" style={{ zIndex: 3 }}>
          <CharacterLayer
            imageUrl={characterLayerUrls}
            resizeMode="cover"
            alt="Bai Qi character background"
          />
        </div>

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

        {/* Character dialogue bubble - positioned at Bai Qi's shoulder level with avatar icon, left-aligned to avoid overlapping input area - FR-037(3) */}
        <div className="fixed top-20 left-0 right-0 z-40 flex justify-start px-5" style={{ pointerEvents: 'none' }}>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-2xl max-w-xs"
            style={{
              background: GLASS_BG,
              backdropFilter: GLASS_BLUR,
              border: GLASS_BORDER,
              boxShadow: GLASS_SHADOW,
            }}
          >
            <CharacterAvatar
              characterId="baiqi"
              characterState={characterState}
              size="sm"
              showBadge={false}
            />
            <p className="text-sm font-medium flex-1" style={{ color: '#5A4E4E', textShadow: '0 1px 2px rgba(255,255,255,0.6)' }}>
              {t('health.symptoms.symptomPrompt')}
            </p>
          </div>
        </div>

        {/* Main content area - positioned higher on screen with sufficient spacing from dialogue bubble - FR-037(12) */}
        <div className="relative z-10 px-5 pb-32 min-h-screen">
          <div className="max-w-2xl mx-auto w-full" style={{ paddingTop: '180px', paddingBottom: '100px' }}>
            <div className="space-y-4" style={{ gap: '15px' }}>
              {/* Inline AI feedback - displayed above input area - FR-037(7) */}
              {aiAnalysis && !analyzing && (
                <div
                  className="p-4 rounded-2xl mb-2"
                  style={{
                    background: GLASS_BG,
                    backdropFilter: GLASS_BLUR,
                    border: GLASS_BORDER,
                    boxShadow: GLASS_SHADOW,
                    borderRadius: '16px',
                  }}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-2" style={{ color: '#5A4E4E', textShadow: '0 1px 2px rgba(255,255,255,0.6)' }}>
                        {aiAnalysis.observations}
                      </p>
                      {aiAnalysis.suggestions && aiAnalysis.suggestions.length > 0 && (
                        <ul className="text-xs space-y-1 font-medium" style={{ color: '#5A4E4E', opacity: 0.8, textShadow: '0 1px 2px rgba(255,255,255,0.6)' }}>
                          {aiAnalysis.suggestions.slice(0, 3).map((suggestion: string, index: number) => (
                            <li key={index} className="flex items-start gap-1">
                              <span>•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Unified free description area - FR-037(2) */}
              <div
                className="p-5 rounded-2xl"
                style={{
                  background: GLASS_BG,
                  backdropFilter: GLASS_BLUR,
                  border: GLASS_BORDER,
                  boxShadow: GLASS_SHADOW,
                  borderRadius: '16px',
                  animation: 'floatCard1 3.5s ease-in-out infinite',
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
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder={t('health.symptoms.freeDescriptionPlaceholder')}
                  className="w-full px-3 py-2 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder:opacity-70"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: '#5A4E4E',
                    fontSize: '16px',
                  }}
                  rows={6}
                  required
                  maxLength={3000}
                />
                <p className="mt-2 text-xs font-medium" style={{ color: '#5A4E4E', opacity: 0.7 }}>
                  {symptoms.length}/3000 {t('health.symptoms.characters')}
                </p>
              </div>

              {/* Image upload section - FR-037(3) */}
              <div
                className="p-5 rounded-2xl"
                style={{
                  background: GLASS_BG,
                  backdropFilter: GLASS_BLUR,
                  border: GLASS_BORDER,
                  boxShadow: GLASS_SHADOW,
                  borderRadius: '16px',
                  animation: 'floatCard2 3.8s ease-in-out infinite',
                  animationDelay: '0.4s',
                }}
              >
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
                  className="block w-full px-4 py-3 rounded-xl font-semibold text-center cursor-pointer transition-all"
                  style={{
                    background: GLASS_BG,
                    backdropFilter: GLASS_BLUR,
                    border: GLASS_BORDER,
                    color: '#5A4E4E',
                    fontWeight: 700,
                    textShadow: '0 1px 2px rgba(255,255,255,0.6)',
                  }}
                >
                  {t('health.symptoms.uploadMedicalRecord')}
                </label>
                {uploadedImages.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {uploadedImages.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Upload ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg"
                          style={{
                            border: GLASS_BORDER,
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{
                            background: 'rgba(239, 68, 68, 0.9)',
                            color: 'white',
                            fontSize: '14px',
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

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

              {/* Emotional save confirmation - FR-037(8) */}
              {showSaveConfirmation && (
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
                  <p className="text-sm font-bold text-center" style={{ color: '#5A4E4E', textShadow: '0 1px 2px rgba(255,255,255,0.6)' }}>
                    {t('health.symptoms.rememberedInHeart')}
                  </p>
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
        <div className="fixed bottom-0 left-0 right-0 z-50 px-5 pb-6 pt-4" style={{ background: 'transparent' }}>
          <div className="max-w-2xl mx-auto">
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

        {/* CSS for floating animations, breathing glow, and placeholder styling - FR-037(9), FR-037(6), FR-037(2) */}
        <style>{`
          @keyframes floatCard1 {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-4px);
            }
          }
          @keyframes floatCard2 {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-5px);
            }
          }
          @keyframes floatCard3 {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-3px);
            }
          }
          @keyframes breathingGlow {
            0%, 100% {
              box-shadow: 0 0 20px rgba(255, 126, 157, 0.4), 0 4px 12px rgba(255, 126, 157, 0.2);
            }
            50% {
              box-shadow: 0 0 30px rgba(255, 126, 157, 0.6), 0 4px 16px rgba(255, 126, 157, 0.4);
            }
          }
          textarea::placeholder {
            color: #5A4E4E;
            opacity: 0.7;
          }
        `}</style>
      </div>
    </ImageBackground>
  );
}
