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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading text-gray-900 mb-3">
            {t('nutrition.input.title')}
          </h1>
          <p className="text-gray-600 font-body text-base leading-relaxed">
            {t('nutrition.input.description')}
          </p>
        </div>
        
        {/* Ingredient input card */}
        <Card className="mb-6 bg-white shadow-lg border-0">
          <label className="block mb-3 text-base font-semibold text-gray-800 font-body">
            {t('nutrition.input.ingredientsLabel')}
          </label>
          <textarea
            value={ingredientsText}
            onChange={(e) => setIngredientsText(e.target.value)}
            placeholder={t('nutrition.input.ingredientPlaceholder')}
            className="
              w-full
              p-4
              rounded-xl
              border border-gray-200
              bg-gray-50
              text-gray-900
              font-body
              text-base
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
              focus:border-blue-500
              focus:bg-white
              resize-none
              min-h-[140px]
              transition-all
            "
          />
          
          {/* Flexibility note */}
          <p className="text-sm text-gray-500 mt-3 font-body italic">
            {t('nutrition.input.flexibilityNote')}
          </p>
        </Card>
        
        {/* Energy level selector card */}
        <Card className="mb-6 bg-white shadow-lg border-0">
          <label className="block mb-4 text-base font-semibold text-gray-800 font-body">
            {t('nutrition.input.energyLevelLabel')} <span className="text-gray-500 font-normal">({t('nutrition.input.optional')})</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['low', 'medium', 'high'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setEnergyLevel(level)}
                className={`
                  touch-target
                  p-4
                  rounded-xl
                  font-body
                  text-sm
                  font-medium
                  transition-all
                  duration-200
                  ${energyLevel === level
                    ? 'bg-blue-600 text-white shadow-md transform scale-[1.02]'
                    : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 hover:border-blue-300'}
                `}
              >
                {t(`nutrition.input.energyLevel.${level}`)}
              </button>
            ))}
          </div>
        </Card>
        
        {/* Error message */}
        {error && (
          <Card className="mb-6 bg-red-50 border border-red-200 shadow-sm">
            <p className="text-red-700 text-sm font-body">{error}</p>
          </Card>
        )}
        
        {/* Action buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            fullWidth
            onClick={() => navigate('/nutrition')}
            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {t('common.back')}
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={handleGenerateSuggestions}
            disabled={!ingredientsText.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {t('nutrition.input.generateSuggestions')}
          </Button>
        </div>
      </div>
    </div>
  );
}


