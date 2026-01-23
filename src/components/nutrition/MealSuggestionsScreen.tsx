import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { useOffline } from '../../hooks/useOffline';
import { generateMealSuggestions, generateMealDetail, MealSuggestionInput, MealSuggestionOptions } from '../../services/llmService';
import { MealSuggestion } from '../../types';
import Card from '../shared/Card';
import Button from '../shared/Button';
import AIIndicator from '../shared/AIIndicator';
import Disclaimer from '../shared/Disclaimer';
import MealDetailScreen from './MealDetailScreen';

export default function MealSuggestionsScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const isOffline = useOffline();
  
  // Get ingredients from location state (passed from input screen)
  const ingredients = (location.state as any)?.ingredients || ''; // Now a string, not array
  const healthConditions = (location.state as any)?.healthConditions || [];
  const energyLevel = (location.state as any)?.energyLevel || null;
  
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
  
  // Generate suggestions on mount if ingredients are available
  useEffect(() => {
    const trimmedIngredients = typeof ingredients === 'string' ? ingredients.trim() : '';
    if (trimmedIngredients.length > 0 && !isOffline) {
      handleGenerateSuggestions();
    } else if (trimmedIngredients.length === 0) {
      setError(t('nutrition.suggestions.noIngredients'));
    } else if (isOffline) {
      setError(t('nutrition.suggestions.offline'));
    }
  }, []);
  
  const handleGenerateSuggestions = async () => {
    const trimmedIngredients = typeof ingredients === 'string' ? ingredients.trim() : '';
    if (trimmedIngredients.length === 0) {
      setError(t('nutrition.suggestions.noIngredients'));
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
        ingredients: typeof ingredients === 'string' ? ingredients.trim() : '',
        healthConditions: healthConditions.length > 0 ? healthConditions : undefined,
        energyLevel: energyLevel || undefined,
      };
      
      const options: MealSuggestionOptions = {
        timeAware: true, // Enable time-aware suggestions
        flexible: true, // Ingredients are optional
        maxSuggestions: 3, // Request exactly 3 suggestions
      };
      
      const results = await generateMealSuggestions(input, options);
      
      // Convert to MealSuggestion format with timeAwareGuidance
      const mealSuggestions: MealSuggestion[] = results.map((result, index) => ({
        id: crypto.randomUUID(),
        mealName: result.mealName,
        description: result.description,
        ingredients: result.ingredients,
        preparationNotes: result.preparationNotes || null,
        adaptedForConditions: result.adaptedForConditions,
        adaptedForEnergyLevel: result.adaptedForEnergyLevel,
        sourceIngredientListId: '', // Will be set when saving
        aiGenerated: true,
        isFavorite: false,
        timeAwareGuidance: result.timeAwareGuidance || null,
        isFlexible: result.isFlexible ?? true,
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
      // Continue with basic info even if detail generation fails
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
    <div className="p-6 min-h-screen bg-clay-bg pb-20">
      <h1 className="text-2xl font-heading text-clay-text mb-6">
        {t('nutrition.suggestions.title')}
      </h1>
      
      {/* Time-aware messaging */}
      {timeAware && (
        <Card className="mb-6 border-purple-200 bg-purple-50">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🌙</span>
            <div>
              <p className="font-semibold text-purple-900 mb-1 font-body">
                {t('nutrition.timeAware.title')}
              </p>
              <p className="text-sm text-purple-800 font-body">
                {t('nutrition.timeAware.message')}
              </p>
            </div>
          </div>
        </Card>
      )}
      
      {/* Ingredients used */}
      {typeof ingredients === 'string' && ingredients.trim().length > 0 && (
        <Card className="mb-6">
          <p className="text-sm text-clay-textDim font-body mb-2">
            {t('nutrition.suggestions.ingredientsUsed')}
          </p>
          <p className="text-clay-text font-body">
            {ingredients.trim()}
          </p>
          {timeAware && (
            <p className="text-xs text-clay-textDim mt-2 font-body italic">
              {t('nutrition.suggestions.ingredientsFlexible')}
            </p>
          )}
        </Card>
      )}
      
      {/* Generating indicator */}
      {generating && (
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-clay-text mb-1 font-body">
                {t('nutrition.suggestions.generating')}
              </p>
              <p className="text-sm text-clay-textDim font-body">
                {t('nutrition.suggestions.generatingNote')}
              </p>
            </div>
            <AIIndicator status="processing" />
          </div>
        </Card>
      )}
      
      {/* Error message */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <p className="text-red-800 text-sm font-body">{error}</p>
        </Card>
      )}
      
      {/* Meal suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-4 mb-6">
          {suggestions.map((suggestion) => (
            <Card 
              key={suggestion.id} 
              className="border-clay-lavender cursor-pointer transition-all hover:shadow-clay-extrude active:opacity-80"
              onClick={() => handleMealClick(suggestion)}
            >
              <h3 className="text-lg font-heading text-clay-text mb-2">
                {suggestion.mealName}
              </h3>
              <p className="text-clay-textDim font-body mb-3">
                {suggestion.description}
              </p>
              
              {suggestion.ingredients.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-semibold text-clay-text mb-1 font-body">
                    {t('nutrition.suggestions.ingredients')}:
                  </p>
                  <ul className="list-disc list-inside text-sm text-clay-textDim font-body">
                    {suggestion.ingredients.map((ing, idx) => (
                      <li key={idx}>{ing}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {suggestion.preparationNotes && (
                <div className="mb-3">
                  <p className="text-sm font-semibold text-clay-text mb-1 font-body">
                    {t('nutrition.suggestions.preparation')}:
                  </p>
                  <p className="text-sm text-clay-textDim font-body">
                    {suggestion.preparationNotes}
                  </p>
                </div>
              )}
              
              {/* Time-aware guidance */}
              {suggestion.timeAwareGuidance && (
                <Card className="mt-3 border-purple-100 bg-purple-50">
                  <p className="text-sm text-purple-800 font-body italic">
                    {suggestion.timeAwareGuidance}
                  </p>
                </Card>
              )}
              
              {/* Flexibility indicator */}
              {suggestion.isFlexible && (
                <p className="text-xs text-clay-textDim mt-2 font-body italic">
                  {t('nutrition.suggestions.flexibleNote')}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
      
      {/* Empty state */}
      {!generating && suggestions.length === 0 && !error && (
        <Card className="mb-6">
          <p className="text-clay-textDim font-body text-center py-8">
            {t('nutrition.suggestions.noSuggestions')}
          </p>
        </Card>
      )}
      
      <Disclaimer type="nutrition" className="mb-6" />
      
      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          fullWidth
          onClick={() => navigate('/nutrition')}
          disabled={generating}
        >
          {t('common.back')}
        </Button>
        {typeof ingredients === 'string' && ingredients.trim().length > 0 && !isOffline && (
          <Button
            variant="primary"
            fullWidth
            onClick={handleGenerateSuggestions}
            disabled={generating}
          >
            {generating ? t('common.loading') : t('nutrition.suggestions.regenerate')}
          </Button>
        )}
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

