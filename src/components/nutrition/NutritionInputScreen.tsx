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
  
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [energyLevel, setEnergyLevel] = useState<'low' | 'medium' | 'high' | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleAddIngredient = () => {
    const trimmed = currentIngredient.trim();
    if (trimmed.length < 2) {
      setError(t('nutrition.input.ingredientTooShort'));
      return;
    }
    if (ingredients.includes(trimmed)) {
      setError(t('nutrition.input.duplicateIngredient'));
      return;
    }
    if (ingredients.length >= 50) {
      setError(t('nutrition.input.tooManyIngredients'));
      return;
    }
    
    setIngredients([...ingredients, trimmed]);
    setCurrentIngredient('');
    setError(null);
  };
  
  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };
  
  const handleGenerateSuggestions = () => {
    if (ingredients.length === 0) {
      setError(t('nutrition.input.noIngredients'));
      return;
    }
    
    navigate('/nutrition/suggestions', {
      state: {
        ingredients,
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
        <div className="flex gap-2">
          <input
            type="text"
            value={currentIngredient}
            onChange={(e) => setCurrentIngredient(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddIngredient();
              }
            }}
            placeholder={t('nutrition.input.ingredientPlaceholder')}
            className="
              flex-1
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
            "
          />
          <Button
            variant="primary"
            onClick={handleAddIngredient}
            disabled={!currentIngredient.trim()}
          >
            {t('nutrition.input.add')}
          </Button>
        </div>
        
        {/* Flexibility note */}
        <p className="text-xs text-clay-textDim mt-3 font-body italic">
          {t('nutrition.input.flexibilityNote')}
        </p>
      </Card>
      
      {/* Ingredients list */}
      {ingredients.length > 0 && (
        <Card className="mb-6">
          <p className="text-sm font-semibold text-clay-text mb-3 font-body">
            {t('nutrition.input.addedIngredients')} ({ingredients.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {ingredients.map((ingredient, index) => (
              <span
                key={index}
                className="
                  inline-flex
                  items-center
                  gap-2
                  px-3
                  py-2
                  bg-clay-mint
                  text-clay-text
                  rounded-[18px]
                  text-sm
                  font-body
                "
              >
                {ingredient}
                <button
                  onClick={() => handleRemoveIngredient(index)}
                  className="
                    touch-target
                    text-clay-textDim
                    hover:text-clay-text
                    transition-colors
                  "
                  aria-label={t('nutrition.input.removeIngredient')}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </Card>
      )}
      
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
      
      {/* Empty state */}
      {ingredients.length === 0 && (
        <Card className="mb-6 border-clay-lavender bg-clay-mint">
          <p className="text-clay-textDim font-body text-center py-8">
            {t('nutrition.input.emptyState')}
          </p>
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
          disabled={ingredients.length === 0}
        >
          {t('nutrition.input.generateSuggestions')}
        </Button>
      </div>
    </div>
  );
}

