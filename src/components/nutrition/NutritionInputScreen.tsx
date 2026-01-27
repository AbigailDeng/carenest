import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useHealthConditions } from '../../hooks/useHealthConditions';
import { useCompanion } from '../../hooks/useCompanion';
import { useOffline } from '../../hooks/useOffline';
import {
  generateMealSuggestions,
  generateMealDetail,
  MealSuggestionInput,
  MealSuggestionOptions,
} from '../../services/llmService';
import { MealSuggestion } from '../../types';
import ImageBackground from '../shared/ImageBackground';
import FloatingParticles from '../companion/FloatingParticles';
import CharacterAvatar from '../companion/CharacterAvatar';
import AIIndicator from '../shared/AIIndicator';
import MealDetailScreen from './MealDetailScreen';

export default function NutritionInputScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { conditions } = useHealthConditions();
  const { characterState } = useCompanion('baiqi');
  const isOffline = useOffline();
  
  const [ingredientsText, setIngredientsText] = useState('');
  const [energyLevel, setEnergyLevel] = useState<'low' | 'medium' | 'high' | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Meal suggestions state
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [generating, setGenerating] = useState(false);
  const [timeAware, setTimeAware] = useState(false);
  
  // Detail view state
  const [selectedMeal, setSelectedMeal] = useState<MealSuggestion | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailedPreparationMethod, setDetailedPreparationMethod] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // Detect late night (after 9 PM)
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 21) {
      setTimeAware(true);
    }
  }, []);
  
  // Background image URL - nutrition-specific Bai Qi illustration
  const BACKGROUND_URL = '/images/008fP45sly1hreaeb88b2j323s35s1l1.jpg';

  // Premium glassmorphism constants - improved readability
  const GLASS_BG = 'rgba(255, 255, 255, 0.85)'; // Increased opacity for better readability
  const GLASS_BLUR = 'blur(10px)'; // Reduced blur for clearer text
  const GLASS_BORDER = '1px solid rgba(255, 255, 255, 0.6)';
  const GLASS_SHADOW = '0 2px 12px rgba(0, 0, 0, 0.1)';
  
  const handleGenerateSuggestions = async () => {
    const trimmed = ingredientsText.trim();
    if (trimmed.length === 0) {
      setError(t('nutrition.input.noIngredients'));
      return;
    }

    if (isOffline) {
      setError(t('nutrition.suggestions.offline'));
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      // Clear previous suggestions when regenerating
      setSuggestions([]);

      const input: MealSuggestionInput = {
        ingredients: trimmed,
        healthConditions: conditions.length > 0 ? conditions.map(c => c.conditionName) : undefined,
        energyLevel: energyLevel || undefined,
      };

      const options: MealSuggestionOptions = {
        timeAware: true,
        flexible: true,
        maxSuggestions: 3,
      };

      const results = await generateMealSuggestions(input, options);

      // Convert to MealSuggestion format with timeAwareGuidance
      const mealSuggestions: MealSuggestion[] = results.map(result => ({
        id: crypto.randomUUID(),
        mealName: result.mealName,
        description: result.description,
        ingredients: result.ingredients,
        preparationNotes: result.preparationNotes || null,
        adaptedForConditions: result.adaptedForConditions,
        adaptedForEnergyLevel: result.adaptedForEnergyLevel,
        sourceIngredientListId: '',
        aiGenerated: true,
        isFavorite: false,
        timeAwareGuidance: result.timeAwareGuidance || null,
        isFlexible: result.isFlexible ?? true,
        detailedPreparationMethod: null,
        imageUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      setSuggestions(mealSuggestions);
    } catch (err: any) {
      setError(err.message || t('nutrition.suggestions.failedToGenerate'));
    } finally {
      setGenerating(false);
    }
  };
  
  const handleNewSearch = () => {
    // Clear previous suggestions and errors, then regenerate with current input
    setSuggestions([]);
    setError(null);
    // Trigger new search with current input values
    handleGenerateSuggestions();
  };
  
  // Handle meal card click - open detail view
  const handleMealClick = async (meal: MealSuggestion) => {
    setSelectedMeal(meal);
    setDetailOpen(true);
    setLoadingDetail(true);
    setDetailedPreparationMethod(null);
    setImageUrl(null);

    try {
      // Generate detailed preparation method and image on-demand
      const detail = await generateMealDetail({
        mealName: meal.mealName,
        description: meal.description,
        ingredients: meal.ingredients,
        preparationNotes: meal.preparationNotes,
      });

      setDetailedPreparationMethod(detail.detailedPreparationMethod);
      setImageUrl(detail.imageUrl);
    } catch (err: any) {
      console.error('Failed to generate meal detail:', err);
      setDetailedPreparationMethod(null);
      setImageUrl(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Close detail view
  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedMeal(null);
    setDetailedPreparationMethod(null);
    setImageUrl(null);
    setLoadingDetail(false);
  };
  
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
        background: 'transparent',
      }}
    >
      {/* ImageBackground - nutrition-specific Bai Qi illustration */}
      <ImageBackground imageUrl={BACKGROUND_URL} />

      {/* Floating Particles */}
      <div className="absolute inset-0" style={{ zIndex: 2 }}>
        <FloatingParticles count={20} />
      </div>

      {/* Glassmorphism back button */}
      <button
        onClick={() => navigate('/nutrition')}
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

      {/* Character dialogue bubble - positioned at Bai Qi's shoulder level, left-aligned */}
      <div
        className="fixed left-0 right-0 z-40 flex justify-start w-full"
        style={{
          paddingLeft: '20px',
          paddingRight: '20px',
          top: '80px',
          pointerEvents: 'none',
        }}
      >
        <div
          className="flex items-start gap-2 rounded-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.9)', // More opaque for readability
            backdropFilter: 'blur(8px)', // Reduced blur
            border: '1px solid rgba(200, 200, 200, 0.5)',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
            maxWidth: 'max-w-xs',
            padding: '8px 12px',
            pointerEvents: 'auto',
          }}
        >
          <CharacterAvatar
            characterId="baiqi"
            characterState={characterState}
            size="sm"
            showBadge={false}
          />
          <p className="text-sm font-medium flex-1" style={{ color: '#2A2A2A' }}>
            {t('nutrition.input.prompt')}
          </p>
        </div>
      </div>

      {/* Main content area */}
      <div
        className="relative z-10 pb-32 min-h-screen w-full"
        style={{ paddingLeft: '20px', paddingRight: '20px' }}
      >
        <div
          className="w-full"
          style={{
            paddingTop: '180px',
            paddingBottom: '100px',
          }}
        >
          <div className="space-y-4" style={{ gap: '15px' }}>
            {/* Ingredient input card - glassmorphism */}
            <div
              className="p-5 rounded-2xl"
              style={{
                background: GLASS_BG,
                backdropFilter: GLASS_BLUR,
                border: GLASS_BORDER,
                boxShadow: GLASS_SHADOW,
                borderRadius: '16px',
              }}
            >
              <label
                className="block mb-3 text-base font-bold"
                style={{
                  color: '#2A2A2A', // Darker text for better readability
                  fontWeight: 700,
                }}
              >
                {t('nutrition.input.ingredientsLabel')}
              </label>
              <textarea
                value={ingredientsText}
                onChange={(e) => setIngredientsText(e.target.value)}
                placeholder={t('nutrition.input.ingredientPlaceholder')}
                className="w-full px-3 py-2 rounded-lg resize-none focus:outline-none placeholder:opacity-50"
                style={{
                  background: 'rgba(255, 255, 255, 0.9)', // More opaque for readability
                  border: '1px solid rgba(200, 200, 200, 0.5)',
                  color: '#2A2A2A', // Darker text
                  fontSize: '16px',
                }}
                rows={6}
                maxLength={500}
              />
              
              {/* Flexibility note */}
              <p className="mt-2 text-xs font-medium" style={{ color: '#2A2A2A', opacity: 0.7 }}>
                {t('nutrition.input.flexibilityNote')}
              </p>
            </div>
            
            {/* Energy level selector card - glassmorphism */}
            <div
              className="p-5 rounded-2xl"
              style={{
                background: GLASS_BG,
                backdropFilter: GLASS_BLUR,
                border: GLASS_BORDER,
                boxShadow: GLASS_SHADOW,
                borderRadius: '16px',
              }}
            >
              <label
                className="block mb-4 text-base font-bold"
                style={{
                  color: '#2A2A2A', // Darker text for better readability
                  fontWeight: 700,
                }}
              >
                {t('nutrition.input.energyLevelLabel')}{' '}
                <span style={{ fontWeight: 400, opacity: 0.7 }}>
                  ({t('nutrition.input.optional')})
                </span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setEnergyLevel(level)}
                    className="touch-target p-3 rounded-xl font-body text-xs font-medium transition-all duration-200"
                    style={{
                      background: energyLevel === level
                        ? 'rgba(255, 126, 157, 0.9)' // Solid pink when selected
                        : 'rgba(255, 255, 255, 0.7)', // Glassmorphism when unselected
                      color: energyLevel === level ? '#FFFFFF' : '#2A2A2A',
                      border: '1px solid rgba(200, 200, 200, 0.3)',
                      boxShadow: energyLevel === level
                        ? '0 2px 8px rgba(255, 126, 157, 0.4)'
                        : 'none',
                    }}
                  >
                    {t(`nutrition.input.energyLevel.${level}`)}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Error message */}
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
                <p className="text-sm font-bold" style={{ color: '#DC2626' }}>
                  {error}
                </p>
              </div>
            )}
            
            {/* Generating indicator */}
            {generating && (
              <div
                className="p-5 rounded-2xl"
                style={{
                  background: GLASS_BG,
                  backdropFilter: GLASS_BLUR,
                  border: GLASS_BORDER,
                  boxShadow: GLASS_SHADOW,
                  borderRadius: '16px',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-base mb-1" style={{ color: '#2A2A2A' }}>
                      {t('nutrition.suggestions.generating')}
                    </p>
                    <p className="text-sm" style={{ color: '#2A2A2A', opacity: 0.7 }}>
                      {t('nutrition.suggestions.generatingNote')}
                    </p>
                  </div>
                  <AIIndicator status="processing" />
                </div>
              </div>
            )}
            
            {/* Meal suggestions - scrollable area below form */}
            {suggestions.length > 0 && (
              <div className="space-y-4" style={{ gap: '15px' }}>
                {/* Time-aware messaging */}
                {timeAware && (
                  <div
                    className="p-5 rounded-2xl"
                    style={{
                      background: 'rgba(99, 102, 241, 0.1)',
                      backdropFilter: GLASS_BLUR,
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      boxShadow: GLASS_SHADOW,
                      borderRadius: '16px',
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-3xl">🌙</span>
                      <div>
                        <p className="font-semibold text-base mb-2" style={{ color: '#312E81' }}>
                          {t('nutrition.timeAware.title')}
                        </p>
                        <p className="text-sm leading-relaxed" style={{ color: '#312E81', opacity: 0.9 }}>
                          {t('nutrition.timeAware.message')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Ingredients used */}
                {ingredientsText.trim().length > 0 && (
                  <div
                    className="p-5 rounded-2xl"
                    style={{
                      background: GLASS_BG,
                      backdropFilter: GLASS_BLUR,
                      border: GLASS_BORDER,
                      boxShadow: GLASS_SHADOW,
                      borderRadius: '16px',
                    }}
                  >
                    <p className="text-sm font-semibold mb-2 uppercase tracking-wide" style={{ color: '#2A2A2A', opacity: 0.7 }}>
                      {t('nutrition.suggestions.ingredientsUsed')}
                    </p>
                    <p className="text-base" style={{ color: '#2A2A2A' }}>{ingredientsText.trim()}</p>
                    {timeAware && (
                      <p className="text-xs mt-3 italic" style={{ color: '#2A2A2A', opacity: 0.6 }}>
                        {t('nutrition.suggestions.ingredientsFlexible')}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Meal suggestion cards */}
                {suggestions.map(suggestion => (
                  <button
                    key={suggestion.id}
                    type="button"
                    className="w-full text-left"
                    onClick={() => handleMealClick(suggestion)}
                  >
                    <div
                      className="p-5 rounded-2xl transition-all duration-200 active:scale-[0.98]"
                      style={{
                        background: GLASS_BG,
                        backdropFilter: GLASS_BLUR,
                        border: GLASS_BORDER,
                        boxShadow: GLASS_SHADOW,
                        borderRadius: '16px',
                        cursor: 'pointer',
                      }}
                    >
                      <h3 className="text-xl font-bold mb-3" style={{ color: '#2A2A2A' }}>
                        {suggestion.mealName}
                      </h3>
                      <p className="mb-4 leading-relaxed" style={{ color: '#2A2A2A', opacity: 0.8 }}>
                        {suggestion.description}
                      </p>

                      {suggestion.ingredients.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-semibold mb-2" style={{ color: '#2A2A2A', opacity: 0.8 }}>
                            {t('nutrition.suggestions.ingredients')}:
                          </p>
                          <ul className="list-disc list-inside text-sm space-y-1" style={{ color: '#2A2A2A', opacity: 0.7 }}>
                            {suggestion.ingredients.map((ing, idx) => (
                              <li key={idx}>{ing}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {suggestion.preparationNotes && (
                        <div className="mb-4">
                          <p className="text-sm font-semibold mb-2" style={{ color: '#2A2A2A', opacity: 0.8 }}>
                            {t('nutrition.suggestions.preparation')}:
                          </p>
                          <p className="text-sm leading-relaxed" style={{ color: '#2A2A2A', opacity: 0.7 }}>
                            {suggestion.preparationNotes}
                          </p>
                        </div>
                      )}

                      {/* Time-aware guidance */}
                      {suggestion.timeAwareGuidance && (
                        <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                          <p className="text-sm italic" style={{ color: '#312E81' }}>
                            {suggestion.timeAwareGuidance}
                          </p>
                        </div>
                      )}

                      {/* Flexibility indicator */}
                      {suggestion.isFlexible && (
                        <p className="text-xs mt-4 italic" style={{ color: '#2A2A2A', opacity: 0.6 }}>
                          {t('nutrition.suggestions.flexibleNote')}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed bottom action buttons - equal width, glassmorphism */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 pb-6 pt-4 w-full"
        style={{ background: 'transparent', paddingLeft: '20px', paddingRight: '20px' }}
      >
        <div className="w-full">
          <div className="flex gap-3">
            {/* Back button */}
            <div className="flex-1">
              <button
                type="button"
                onClick={() => navigate('/nutrition')}
                disabled={!ingredientsText.trim()}
                className="w-full px-4 py-3 rounded-xl font-semibold transition-all disabled:opacity-40"
                style={{
                  background: GLASS_BG,
                  backdropFilter: GLASS_BLUR,
                  border: GLASS_BORDER,
                  boxShadow: GLASS_SHADOW,
                  color: '#2A2A2A',
                  fontWeight: 700,
                }}
              >
                {t('common.back')}
              </button>
            </div>
            {/* Generate Suggestions / New Search button - primary action */}
            <button
              type="button"
              onClick={suggestions.length > 0 ? handleNewSearch : handleGenerateSuggestions}
              disabled={suggestions.length === 0 && (!ingredientsText.trim() || generating)}
              className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: (suggestions.length > 0 || ingredientsText.trim()) && !generating
                  ? 'rgba(255, 126, 157, 0.9)' // Solid pink background matching selected state
                  : 'rgba(200, 200, 200, 0.5)',
                color: (suggestions.length > 0 || ingredientsText.trim()) && !generating ? '#FFFFFF' : '#2A2A2A', // White text for high contrast when enabled
                fontWeight: 700,
                boxShadow: (suggestions.length > 0 || ingredientsText.trim()) && !generating
                  ? '0 2px 8px rgba(255, 126, 157, 0.4)'
                  : 'none',
              }}
            >
              {suggestions.length > 0
                ? t('nutrition.input.newSearch')
                : generating
                ? t('common.loading')
                : t('nutrition.input.generateSuggestions')}
            </button>
          </div>
        </div>
      </div>
      
      {/* Meal Detail Screen */}
      <MealDetailScreen
        meal={selectedMeal}
        isOpen={detailOpen}
        onClose={handleCloseDetail}
        detailedPreparationMethod={detailedPreparationMethod}
        imageUrl={imageUrl}
        loading={loadingDetail}
      />
    </div>
  );
}
