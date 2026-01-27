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
  detailedPreparationMethod: string | null; // NEW: Step-by-step numbered list for detail view
  imageUrl: string | null; // NEW: LLM-generated image URL (generated on-demand when detail view opens)
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

// Companion Character System Types

export type CharacterMood = "happy" | "calm" | "concerned" | "energetic" | "tired";
export type RelationshipStage = "stranger" | "acquaintance" | "friend" | "close_friend" | "intimate";

export interface CharacterState extends BaseEntity {
  id: string; // Character identifier (e.g., "baiqi")
  closeness: number; // 0-100, increases with daily interaction
  mood: CharacterMood;
  energy: "low" | "medium" | "high";
  lastInteractionTime: string; // ISO 8601 timestamp
  totalInteractions: number; // Count of all interactions (conversations + acknowledgments)
  relationshipStage: RelationshipStage; // Derived from closeness level
}

export interface MessageContext {
  mood: CharacterMood;
  closeness: number;
  energy: "low" | "medium" | "high";
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  relationshipStage: RelationshipStage;
  emotionalState?: "sad" | "stressed" | "lonely" | "happy" | "neutral"; // FR-045: Track character's emotional state during message
}

export interface ConversationMessage extends BaseEntity {
  id: string; // UUID v4
  timestamp: string; // ISO 8601 timestamp
  characterId: string; // Character identifier (e.g., "baiqi")
  sender: "character" | "user";
  content: string; // Message text content
  messageType: "text" | "image" | "choice_prompt";
  choices?: string[]; // For choice-based dialogue (2-5 options)
  characterImageUrl?: string; // URL to character illustration embedded in message
  context?: MessageContext; // Character state at time of message
  metadata?: {
    isProactive?: boolean; // True if character initiated conversation
    triggerType?: string; // "morning_greeting" | "evening_greeting" | "inactivity" | "activity_acknowledgment" | "user_initiated"
    aiGenerated?: boolean; // True if generated by LLM (vs. template)
    templateId?: string; // Template ID if fallback template used
  };
}

export interface CharacterConfig {
  id: string; // Character identifier (e.g., "baiqi")
  name: Record<string, string>; // i18n: { "en": "I", "zh": "我" }
  avatarUrl: string; // Path to avatar image (e.g., "/assets/characters/baiqi/avatar.png")
  illustrationUrls: {
    default: string;
    happy: string;
    calm: string;
    concerned: string;
    energetic: string;
    tired: string;
  };
  backgroundUrls: {
    morning: string;
    afternoon: string;
    evening: string;
    night: string;
  };
  dialogueTemplates: {
    greetings: Record<string, string[]>; // time-of-day → dialogue options
    responses: Record<string, string[]>; // emotion → dialogue options
    proactive: Record<string, string[]>; // trigger → dialogue options
  };
  stateThresholds: {
    closenessStages: Record<RelationshipStage, number>; // stage → min closeness
    moodInfluences: Record<CharacterMood, {
      dialogueTone: string; // "warm" | "gentle" | "energetic" | "concerned"
      proactiveFrequency: number; // Multiplier for proactive initiation (0.5-2.0)
    }>;
  };
  personality: {
    traits: string[]; // ["empathetic", "supportive", "gentle", "patient"]
    communicationStyle: string; // "warm" | "casual" | "formal"
  };
}

export interface CompanionDialogueInput {
  characterId: string; // Character identifier (e.g., "baiqi")
  userMessage?: string; // User's message (optional for proactive dialogue)
  characterState: CharacterState; // Current character state
  conversationHistory: ConversationMessage[]; // Last 5-10 messages for context
  triggerType?: "user_initiated" | "morning_greeting" | "evening_greeting" | "inactivity" | "activity_acknowledgment";
  userEmotionalState?: "sad" | "stressed" | "lonely" | "happy" | "neutral"; // If user expressed emotion
  integrationHint?: "health" | "nutrition" | "emotion" | null; // Gentle guidance toward module
}

export interface CompanionDialogueOutput {
  content: string; // Generated dialogue text
  messageType: "text" | "image" | "choice_prompt";
  choices?: string[]; // For choice-based dialogue (2-5 options)
  characterImageUrl?: string; // URL to character illustration (if applicable)
  suggestedMood?: CharacterMood; // Suggested mood update based on dialogue
  metadata: {
    aiGenerated: boolean; // True if LLM-generated, false if template fallback
    templateId?: string; // Template ID if fallback used
    processingTime: number; // Milliseconds
  };
}
