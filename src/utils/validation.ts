import { ValidationResult } from '../services/storage/types';
import {
  MedicalRecord,
  HealthCondition,
  SymptomEntry,
  MoodEntry,
  JournalEntry,
  IngredientList,
  MealSuggestion,
  UserPreferences,
  MoodValue,
  FoodReflection,
  SugarReductionCup,
} from '../types';

/**
 * Validation utilities for all entity types
 */

/**
 * Validate medical record
 */
export function validateMedicalRecord(
  record: Partial<MedicalRecord>
): ValidationResult {
  const errors: string[] = [];

  if (record.fileSize && record.fileSize > 10 * 1024 * 1024) {
    errors.push('File size must be ≤ 10MB');
  }

  if (record.fileType && !['text', 'image', 'pdf'].includes(record.fileType)) {
    errors.push('File type must be text, image, or pdf');
  }

  if (record.filename && record.filename.trim().length === 0) {
    errors.push('Filename cannot be empty');
  }

  if (record.uploadDate) {
    const uploadDate = new Date(record.uploadDate);
    if (uploadDate > new Date()) {
      errors.push('Upload date cannot be in the future');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate health condition
 */
export function validateHealthCondition(
  condition: Partial<HealthCondition>
): ValidationResult {
  const errors: string[] = [];

  if (condition.conditionName) {
    const name = condition.conditionName.trim();
    if (name.length < 2 || name.length > 200) {
      errors.push('Condition name must be between 2 and 200 characters');
    }
  }

  if (condition.documentedDate) {
    const date = new Date(condition.documentedDate);
    if (date > new Date()) {
      errors.push('Documented date cannot be in the future');
    }
  }

  if (condition.lifestyleSuggestions) {
    const { avoid, prefer, general } = condition.lifestyleSuggestions;
    [...avoid, ...prefer, ...general].forEach((suggestion) => {
      if (suggestion.trim().length === 0) {
        errors.push('Lifestyle suggestions cannot contain empty strings');
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate symptom entry
 */
export function validateSymptomEntry(
  entry: Partial<SymptomEntry>
): ValidationResult {
  const errors: string[] = [];

  if (entry.symptoms) {
    const symptoms = entry.symptoms.trim();
    if (symptoms.length < 3 || symptoms.length > 1000) {
      errors.push('Symptoms must be between 3 and 1000 characters');
    }
  }

  if (entry.notes && entry.notes.length > 2000) {
    errors.push('Notes cannot exceed 2000 characters');
  }

  if (entry.loggedDate) {
    const date = new Date(entry.loggedDate);
    if (date > new Date()) {
      errors.push('Logged date cannot be in the future');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate mood entry
 */
export function validateMoodEntry(entry: Partial<MoodEntry>): ValidationResult {
  const errors: string[] = [];

  const validMoodValues: MoodValue[] = [
    'very-happy',
    'happy',
    'neutral',
    'sad',
    'very-sad',
    'anxious',
    'stressed',
    'calm',
    'energetic',
    'tired',
  ];

  if (entry.moodValue && !validMoodValues.includes(entry.moodValue)) {
    errors.push('Invalid mood value');
  }

  if (entry.notes && entry.notes.length > 500) {
    errors.push('Notes cannot exceed 500 characters');
  }

  if (entry.loggedDate) {
    const date = new Date(entry.loggedDate);
    if (date > new Date()) {
      errors.push('Logged date cannot be in the future');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate journal entry
 */
export function validateJournalEntry(
  entry: Partial<JournalEntry>
): ValidationResult {
  const errors: string[] = [];

  if (entry.content) {
    const content = entry.content.trim();
    if (content.length < 10 || content.length > 5000) {
      errors.push('Journal entry must be between 10 and 5000 characters');
    }
  }

  if (entry.entryDate) {
    const date = new Date(entry.entryDate);
    if (date > new Date()) {
      errors.push('Entry date cannot be in the future');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate ingredient list
 */
export function validateIngredientList(
  list: Partial<IngredientList>
): ValidationResult {
  const errors: string[] = [];

  if (list.ingredients) {
    if (list.ingredients.length === 0) {
      errors.push('Ingredient list must contain at least one ingredient');
    }
    if (list.ingredients.length > 50) {
      errors.push('Ingredient list cannot exceed 50 ingredients');
    }
    list.ingredients.forEach((ingredient, index) => {
      const trimmed = ingredient.trim();
      if (trimmed.length < 2 || trimmed.length > 50) {
        errors.push(
          `Ingredient ${index + 1} must be between 2 and 50 characters`
        );
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate meal suggestion
 */
export function validateMealSuggestion(
  meal: Partial<MealSuggestion>
): ValidationResult {
  const errors: string[] = [];

  if (meal.mealName) {
    const name = meal.mealName.trim();
    if (name.length < 3 || name.length > 100) {
      errors.push('Meal name must be between 3 and 100 characters');
    }
  }

  if (meal.description) {
    const desc = meal.description.trim();
    if (desc.length < 10 || desc.length > 500) {
      errors.push('Description must be between 10 and 500 characters');
    }
  }

  if (meal.ingredients && meal.ingredients.length === 0) {
    errors.push('Meal must have at least one ingredient');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}


/**
 * Validate user preferences
 */
export function validateUserPreferences(
  preferences: Partial<UserPreferences>
): ValidationResult {
  const errors: string[] = [];

  const validThemes: UserPreferences['theme'][] = ['light', 'dark', 'system'];
  if (preferences.theme && !validThemes.includes(preferences.theme)) {
    errors.push('Invalid theme');
  }

  if (
    preferences.dataSharingConsent !== undefined &&
    preferences.dataSharingConsent === null
  ) {
    errors.push('Data sharing consent must be explicitly set');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate food reflection
 */
export function validateFoodReflection(
  reflection: Partial<FoodReflection>
): ValidationResult {
  const errors: string[] = [];

  if (reflection.date) {
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(reflection.date)) {
      errors.push('Date must be in YYYY-MM-DD format');
    }
  }

  if (reflection.reflection) {
    const validReflections: FoodReflection['reflection'][] = ['light', 'normal', 'indulgent'];
    if (!validReflections.includes(reflection.reflection)) {
      errors.push('Reflection must be light, normal, or indulgent');
    }
  }

  if (reflection.notes && reflection.notes.length > 500) {
    errors.push('Notes must be 500 characters or less');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate sugar reduction cup
 */
export function validateSugarReductionCup(
  cup: Partial<SugarReductionCup>
): ValidationResult {
  const errors: string[] = [];

  if (cup.smallCups !== undefined) {
    if (cup.smallCups < 0 || cup.smallCups > 4) {
      errors.push('Small cups must be between 0 and 4');
    }
  }

  if (cup.largeCups !== undefined && cup.largeCups < 0) {
    errors.push('Large cups must be non-negative');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

