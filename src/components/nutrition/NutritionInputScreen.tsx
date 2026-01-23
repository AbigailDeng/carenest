import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { useHealthConditions } from '../../hooks/useHealthConditions';
import Card from '../shared/Card';
import Button from '../shared/Button';

export default function NutritionInputScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { conditions } = useHealthConditions();
  
  const [ingredientsText, setIngredientsText] = useState('');
  const [energyLevel, setEnergyLevel] = useState<'low' | 'medium' | 'high' | null>(null);
  const [error, setError] = useState<string | null>(null);
  
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
    <div className="p-6 min-h-screen bg-clay-bg pb-20">
      <h1 className="text-2xl font-heading text-clay-text mb-6">
        {t('nutrition.input.title')}
      </h1>
      
      <p className="text-clay-textDim font-body mb-6">
        {t('nutrition.input.description')}
      </p>
      
      {/* Ingredient input */}
      <Card className="mb-6">
        <label className="block mb-2 text-sm font-semibold text-clay-text font-body">
          {t('nutrition.input.ingredientsLabel')}
        </label>
        <textarea
          value={ingredientsText}
          onChange={(e) => setIngredientsText(e.target.value)}
          placeholder={t('nutrition.input.ingredientPlaceholder')}
          className="
            w-full
            p-4
            rounded-[20px]
            border-2 border-clay-lavender
            bg-white
            text-clay-text
            font-body
            text-base
            focus:outline-none
            focus:ring-2
            focus:ring-clay-primary
            focus:border-clay-primary
            resize-none
            min-h-[120px]
          "
        />
        
        {/* Flexibility note */}
        <p className="text-xs text-clay-textDim mt-3 font-body italic">
          {t('nutrition.input.flexibilityNote')}
        </p>
      </Card>
      
      {/* Energy level selector */}
      <Card className="mb-6">
        <label className="block mb-3 text-sm font-semibold text-clay-text font-body">
          {t('nutrition.input.energyLevelLabel')} ({t('nutrition.input.optional')})
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(['low', 'medium', 'high'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setEnergyLevel(level)}
              className={`
                clay-button
                p-4
                rounded-[20px]
                font-body
                transition-all
                ${energyLevel === level
                  ? 'bg-clay-primary text-white shadow-clay-extrude'
                  : 'bg-white text-clay-text border-2 border-clay-lavender hover:bg-clay-mint'}
              `}
            >
              {t(`nutrition.input.energyLevel.${level}`)}
            </button>
          ))}
        </div>
      </Card>
      
      {/* Error message */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <p className="text-red-800 text-sm font-body">{error}</p>
        </Card>
      )}
      
      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          fullWidth
          onClick={() => navigate('/nutrition')}
        >
          {t('common.back')}
        </Button>
        <Button
          variant="primary"
          fullWidth
          onClick={handleGenerateSuggestions}
          disabled={!ingredientsText.trim()}
        >
          {t('nutrition.input.generateSuggestions')}
        </Button>
      </div>
    </div>
  );
}


