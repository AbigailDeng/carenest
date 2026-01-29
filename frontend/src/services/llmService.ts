import { apiRequest, ApiError } from './apiClient';
import { getEntity, saveEntity } from '../services/storage/indexedDB';

// Backend API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export interface MedicalRecordInput {
  content: string;
  fileType: 'text' | 'image' | 'pdf';
  metadata?: {
    filename?: string;
    uploadDate?: string;
  };
}

export interface MedicalRecordSummary {
  observations: string;
  possibleCauses: string[];
  suggestions: string[];
  whenToSeekHelp: string;
  disclaimer: string;
  processingTimestamp: string;
}

export interface SymptomAnalysisInput {
  symptoms: string;
  notes?: string | null;
  severity?: 'mild' | 'moderate' | 'severe' | null;
  medicalRecordImages?: File[];
}

export interface SymptomAnalysisOutput {
  observations: string;
  possibleCauses: string[];
  suggestions: string[];
  whenToSeekHelp: string;
  disclaimer: string;
  severity?: 'mild' | 'moderate' | 'severe' | null;
}

export interface MealSuggestionInput {
  ingredients: string;
  healthConditions?: string[];
  energyLevel?: 'low' | 'medium' | 'high';
  dietaryPreferences?: string[];
}

export interface MealSuggestionOptions {
  timeAware?: boolean;
  currentTime?: Date;
  maxSuggestions?: number;
  flexible?: boolean;
}

export interface MealSuggestionOutput {
  mealName: string;
  description: string;
  ingredients: string[];
  preparationNotes?: string;
  adaptedForConditions: boolean;
  adaptedForEnergyLevel: boolean;
  disclaimer: string;
  timeAwareGuidance?: string | null;
  isFlexible?: boolean;
}

export interface EmotionalInput {
  journalEntry: string;
  moodContext?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface EmotionalResponse {
  response: string;
  tone: 'supportive' | 'encouraging' | 'acknowledging';
  disclaimer: string;
  suggestedResources?: string[];
}

export interface FoodReflectionInput {
  reflection: 'light' | 'normal' | 'indulgent';
  notes?: string | null;
  healthConditions?: string[];
  recentSymptoms?: string[];
}

export interface FoodReflectionAnalysisOutput {
  encouragement: string;
  suggestions: string[];
  suitability: string;
  disclaimer: string;
}

/**
 * Get user language preference
 */
async function getUserLanguage(): Promise<'zh' | 'en'> {
  try {
    const types = await import('../types');
    type UserPreferences = types.UserPreferences;
    const preferences = await getEntity('userPreferences', 'singleton') as UserPreferences | null;
    return preferences?.language === 'zh' ? 'zh' : 'en';
  } catch {
    return 'en';
  }
}

/**
 * Check if user has consented to data sharing and auto-grant if using AI features
 */
async function ensureConsent(): Promise<void> {
  try {
    const preferences = await getEntity<any>('userPreferences', 'singleton');
    if (preferences && preferences.dataSharingConsent !== true) {
      await saveEntity('userPreferences', {
        ...preferences,
        dataSharingConsent: true,
        dataSharingConsentDate: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn('Failed to auto-grant consent:', err);
  }
}

/**
 * Make API request to backend
 */
async function backendRequest<T>(endpoint: string, body: object): Promise<T> {
  await ensureConsent();

  const response = await apiRequest(`${API_BASE_URL}/api${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    timeout: 60000,
  });

  const data = await response.json();
  
  if (data.error) {
    throw {
      code: data.error.code || 'API_ERROR',
      message: data.error.message || 'API request failed',
      retryable: data.error.retryable ?? true,
    } as ApiError;
  }

  return data as T;
}

/**
 * Summarize medical record in plain language
 */
export async function summarizeMedicalRecord(
  input: MedicalRecordInput
): Promise<MedicalRecordSummary> {
  const language = await getUserLanguage();
  
  return backendRequest<MedicalRecordSummary>('/summarize-medical-record', {
    content: input.content,
    fileType: input.fileType,
    metadata: input.metadata,
    language,
  });
}

/**
 * Analyze symptoms and provide observational insights
 */
export async function analyzeSymptoms(
  input: SymptomAnalysisInput
): Promise<SymptomAnalysisOutput> {
  const language = await getUserLanguage();
  
  // Extract text from medical record images if provided
  let combinedInput = input.symptoms;
  if (input.medicalRecordImages && input.medicalRecordImages.length > 0) {
    try {
      const { uploadFile } = await import('./fileUpload');
      const extractedTexts: string[] = [];
      
      for (const imageFile of input.medicalRecordImages) {
        try {
          const result = await uploadFile(imageFile);
          if (result.content && result.content.trim()) {
            extractedTexts.push(result.content.trim());
          }
        } catch (err: any) {
          console.warn('Failed to extract text from image:', err);
        }
      }
      
      if (extractedTexts.length > 0) {
        combinedInput = `${input.symptoms}\n\n[上传的病历内容：]\n${extractedTexts.join('\n\n')}`;
      }
    } catch (err: any) {
      console.warn('Failed to process medical record images:', err);
    }
  }

  return backendRequest<SymptomAnalysisOutput>('/analyze-symptoms', {
    symptoms: combinedInput,
    notes: input.notes,
    severity: input.severity,
    language,
  });
}

/**
 * Generate meal suggestions based on ingredients
 */
export async function generateMealSuggestions(
  input: MealSuggestionInput,
  options?: MealSuggestionOptions
): Promise<MealSuggestionOutput[]> {
  const trimmedIngredients = input.ingredients.trim();
  if (trimmedIngredients.length === 0) {
    return [];
  }

  const language = await getUserLanguage();

  return backendRequest<MealSuggestionOutput[]>('/meal-suggestions', {
    ingredients: trimmedIngredients,
    healthConditions: input.healthConditions,
    energyLevel: input.energyLevel,
    dietaryPreferences: input.dietaryPreferences,
    options: {
      timeAware: options?.timeAware,
      flexible: options?.flexible,
      maxSuggestions: options?.maxSuggestions,
    },
    language,
  });
}

/**
 * Generate empathetic emotional response
 */
export async function generateEmotionalResponse(
  input: EmotionalInput
): Promise<EmotionalResponse> {
  const language = await getUserLanguage();

  return backendRequest<EmotionalResponse>('/emotional-response', {
    journalEntry: input.journalEntry,
    moodContext: input.moodContext,
    conversationHistory: input.conversationHistory,
    language,
  });
}

/**
 * Analyze food reflection and provide encouragement and suggestions
 */
export async function analyzeFoodReflection(
  input: FoodReflectionInput
): Promise<FoodReflectionAnalysisOutput> {
  const language = await getUserLanguage();

  return backendRequest<FoodReflectionAnalysisOutput>('/analyze-food-reflection', {
    reflection: input.reflection,
    notes: input.notes,
    healthConditions: input.healthConditions,
    recentSymptoms: input.recentSymptoms,
    language,
  });
}

/**
 * Generate detailed preparation method for a meal suggestion
 */
export async function generateMealDetail(
  mealSuggestion: { mealName: string; description: string; ingredients: string[]; preparationNotes: string | null }
): Promise<{
  detailedPreparationMethod: string;
  imageUrl: string | null;
}> {
  const language = await getUserLanguage();

  return backendRequest<{
    detailedPreparationMethod: string;
    imageUrl: string | null;
  }>('/meal-detail', {
    mealName: mealSuggestion.mealName,
    description: mealSuggestion.description,
    ingredients: mealSuggestion.ingredients,
    preparationNotes: mealSuggestion.preparationNotes,
    language,
  });
}
