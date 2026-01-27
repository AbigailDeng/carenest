import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useHealthConditions } from '../../hooks/useHealthConditions';
import { useCompanion } from '../../hooks/useCompanion';
import ImageBackground from '../shared/ImageBackground';
import FloatingParticles from '../companion/FloatingParticles';
import CharacterAvatar from '../companion/CharacterAvatar';

export default function NutritionInputScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { conditions } = useHealthConditions();
  const { characterState } = useCompanion('baiqi');
  
  const [ingredientsText, setIngredientsText] = useState('');
  const [energyLevel, setEnergyLevel] = useState<'low' | 'medium' | 'high' | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Background image URL - nutrition-specific Bai Qi illustration
  const BACKGROUND_URL = '/images/008fP45sly1hreaeb88b2j323s35s1l1.jpg';

  // Premium glassmorphism constants - improved readability
  const GLASS_BG = 'rgba(255, 255, 255, 0.85)'; // Increased opacity for better readability
  const GLASS_BLUR = 'blur(10px)'; // Reduced blur for clearer text
  const GLASS_BORDER = '1px solid rgba(255, 255, 255, 0.6)';
  const GLASS_SHADOW = '0 2px 12px rgba(0, 0, 0, 0.1)';
  
  const handleGenerateSuggestions = () => {
    const trimmed = ingredientsText.trim();
    if (trimmed.length === 0) {
      setError(t('nutrition.input.noIngredients'));
      return;
    }
    
    setError(null);
    
    navigate('/nutrition/suggestions', {
      state: {
        ingredients: trimmed, // Pass as string, not array
        healthConditions: conditions.map(c => c.conditionName),
        energyLevel,
      },
    });
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
            {t('nutrition.reflection.prompt')}
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
            {/* Generate Suggestions button - primary action */}
            <button
              type="button"
              onClick={handleGenerateSuggestions}
              disabled={!ingredientsText.trim()}
              className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: ingredientsText.trim()
                  ? 'rgba(255, 126, 157, 0.9)' // Solid pink background matching selected state
                  : 'rgba(200, 200, 200, 0.5)',
                color: ingredientsText.trim() ? '#FFFFFF' : '#2A2A2A', // White text for high contrast when enabled
                fontWeight: 700,
                boxShadow: ingredientsText.trim()
                  ? '0 2px 8px rgba(255, 126, 157, 0.4)'
                  : 'none',
              }}
            >
              {t('nutrition.input.generateSuggestions')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
