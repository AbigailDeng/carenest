// Base entity interfaces and common types
// All entities extend BaseEntity for consistent structure

export interface BaseEntity {
  id: string;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

export type Timestamp = string; // ISO 8601 format

// Medical Record AI Analysis (similar to SymptomAnalysis)
export interface MedicalRecordAnalysis {
  observations: string;
  possibleCauses: string[];
  suggestions: string[];
  whenToSeekHelp: string;
  disclaimer: string;
}

// Medical Records
export interface MedicalRecord extends BaseEntity {
  filename: string;
  fileType: 'text' | 'image' | 'pdf';
  uploadDate: string; // ISO 8601 timestamp
  fileContent: ArrayBuffer;
  fileSize: number; // Bytes
  aiSummary: string | null; // Deprecated: kept for backward compatibility
  aiAnalysis: MedicalRecordAnalysis | null; // New detailed analysis
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage: string | null;
}

// Health Conditions
export interface HealthCondition extends BaseEntity {
  conditionName: string;
  documentedDate: string; // ISO 8601 timestamp
  sourceRecordId: string | null;
  lifestyleSuggestions: {
    avoid: string[];
    prefer: string[];
    general: string[];
  };
}

// Symptom Entries
export interface SymptomEntry extends BaseEntity {
  symptoms: string;
  notes: string | null;
  severity: 'mild' | 'moderate' | 'severe' | null;
  loggedDate: string; // ISO 8601 timestamp
  loggedTime: string; // ISO 8601 timestamp
  // AI-generated analysis (observational, not diagnostic)
  aiAnalysis: {
    observations: string; // What patterns or observations AI noticed
    possibleCauses: string[]; // Possible contributing factors (lifestyle, environmental, etc.)
    suggestions: string[]; // Supportive lifestyle suggestions
    whenToSeekHelp: string; // When to consult healthcare professional
    disclaimer: string; // Clear disclaimer that this is not medical advice
  } | null;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage: string | null;
}

// Mood Entries
export type MoodValue =
  | 'very-happy'
  | 'happy'
  | 'neutral'
  | 'sad'
  | 'very-sad'
  | 'anxious'
  | 'stressed'
  | 'calm'
  | 'energetic'
  | 'tired';

export interface MoodEntry extends BaseEntity {
  moodValue: MoodValue;
  notes: string | null;
  loggedDate: string; // ISO 8601 timestamp
  loggedTime: string; // ISO 8601 timestamp
}

// Journal Entries
export interface JournalEntry extends BaseEntity {
  content: string;
  aiResponse: string | null;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  entryDate: string; // ISO 8601 timestamp
  entryTime: string; // ISO 8601 timestamp
}

// Ingredient Lists
export interface IngredientList extends BaseEntity {
  ingredients: string[];
}

// Meal Suggestions
export interface MealSuggestion extends BaseEntity {
  mealName: string;
  description: string;
  ingredients: string[];
  preparationNotes: string | null;
  adaptedForConditions: boolean;
  adaptedForEnergyLevel: boolean;
  sourceIngredientListId: string;
  aiGenerated: boolean;
  isFavorite: boolean;
  timeAwareGuidance: string | null; // NEW: Gentle guidance for late-night context
  isFlexible: boolean; // NEW: Indicates ingredients are optional (default: true)
}

// Food Reflection Types
export type FoodReflectionType = 'light' | 'normal' | 'indulgent';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodReflectionAnalysis {
  encouragement: string; // Encouraging message
  suggestions: string[]; // Supportive suggestions based on health conditions
  suitability: string; // Whether the food choice is suitable given health conditions
  disclaimer: string; // Required disclaimer
}

export interface FoodReflection extends BaseEntity {
  date: string; // ISO date (YYYY-MM-DD)
  mealType: MealType; // breakfast, lunch, dinner, snack
  reflection: FoodReflectionType;
  notes: string | null; // Optional user notes
  aiAnalysis: FoodReflectionAnalysis | null; // AI-generated encouragement and suggestions
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage: string | null;
}

// Sugar Reduction Easter Egg Types
export interface SugarReductionCup extends BaseEntity {
  smallCups: number; // 0-4
  largeCups: number; // Accumulated
  lastPourDate: string | null; // ISO date (YYYY-MM-DD)
}

// User Preferences (Singleton)
export interface UserPreferences extends BaseEntity {
  healthConditions: string[]; // References to HealthCondition IDs
  energyLevelPreference: 'low' | 'medium' | 'high' | null;
  dataSharingConsent: boolean;
  dataSharingConsentDate: string | null; // ISO 8601 timestamp
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'zh'; // Language preference
}

// DB Version
export interface DBVersion {
  version: number;
  lastMigration: string; // ISO 8601 timestamp
}
