# LLM Service Contract: Nutrition Module Enhancement

**Feature**: Enhanced Nutrition Module  
**Date**: 2025-01-27  
**Status**: Design Complete

## Overview

This document defines the API contract for enhanced LLM service methods supporting time-aware meal suggestions and flexible ingredient handling.

---

## Enhanced Method: `generateMealSuggestions`

### Signature

```typescript
async function generateMealSuggestions(
  input: MealSuggestionInput,
  options?: MealSuggestionOptions
): Promise<MealSuggestion[]>
```

### Input Types

```typescript
interface MealSuggestionInput {
  ingredients: string[];                    // Available ingredients (optional suggestions)
  healthConditions?: string[];              // Optional: Logged health conditions
  energyLevel?: 'low' | 'medium' | 'high';  // Optional: Current energy level
  dietaryPreferences?: string[];           // Optional: Preferences (vegetarian, vegan, etc.)
}

interface MealSuggestionOptions {
  timeAware?: boolean;                      // Enable time-aware guidance (default: false)
  currentTime?: Date;                       // Optional: Override current time for testing
  maxSuggestions?: number;                  // Maximum suggestions to generate (default: 5)
  flexible?: boolean;                       // Ingredients are optional (default: true)
}
```

### Output Type

```typescript
interface MealSuggestion {
  id: string;
  mealName: string;
  description: string;
  ingredients: string[];                    // Ingredients used from input
  preparationNotes: string | null;
  adaptedForConditions: boolean;
  adaptedForEnergyLevel: boolean;
  sourceIngredientListId: string;
  aiGenerated: boolean;
  isFavorite: boolean;
  timeAwareGuidance: string | null;         // NEW: Gentle guidance if late night
  isFlexible: boolean;                      // NEW: Ingredients are optional (default: true)
  createdAt: string;
}
```

### Behavior

1. **Time Detection**:
   - If `options.timeAware === true`, detect current time (or use `options.currentTime`)
   - Consider "late night" as after 9:00 PM (21:00) local time
   - If late night detected, modify AI prompt for gentle guidance

2. **Ingredient Flexibility**:
   - If `options.flexible !== false`, AI prompt emphasizes:
     - Ingredients are suggestions, not requirements
     - Meals can use some or all provided ingredients
     - Common alternatives are acceptable

3. **Prompt Construction**:
   - Base prompt includes ingredient list, health conditions, energy level
   - If late night: Add gentle, supportive language
   - If flexible: Add flexibility instructions
   - Include safety guardrails (dietary guidance, not medical advice)

4. **Response Parsing**:
   - Parse AI response into structured meal suggestions
   - Extract `timeAwareGuidance` if late night context detected
   - Set `isFlexible: true` by default (or based on options)

### Example Usage

```typescript
// Standard meal suggestions
const suggestions = await generateMealSuggestions({
  ingredients: ['tomato', 'pasta', 'cheese'],
  energyLevel: 'medium',
});

// Time-aware suggestions (late night)
const lateNightSuggestions = await generateMealSuggestions({
  ingredients: ['bread', 'butter'],
}, {
  timeAware: true,  // Will detect late night and provide gentle guidance
});

// Flexible suggestions (explicit)
const flexibleSuggestions = await generateMealSuggestions({
  ingredients: ['chicken', 'rice'],
}, {
  flexible: true,  // Ingredients are optional
});
```

### Error Handling

- **Network Error**: Throw `ApiError` with `retryable: true`
- **Invalid Input**: Throw `ApiError` with `retryable: false`, clear error message
- **AI Generation Failure**: Return empty array with logged warning

---

## Prompt Templates

### Base Prompt (Standard)

```
You are a supportive nutrition companion helping users find simple meal ideas.

Available Ingredients: [ingredients]
[If healthConditions]: Health Considerations: [healthConditions]
[If energyLevel]: Energy Level: [energyLevel]
[If dietaryPreferences]: Dietary Preferences: [dietaryPreferences]

IMPORTANT GUIDELINES:
- Generate simple, accessible meal suggestions
- Ingredients are suggestions - meals can use some or all ingredients
- Provide gentle, supportive language
- Include disclaimers that suggestions are dietary guidance, not medical advice
- Do NOT prescribe specific diets or medical dietary advice

Please provide 3-5 meal suggestions in JSON format:
{
  "meals": [
    {
      "mealName": "Meal name",
      "description": "Simple description",
      "ingredients": ["ingredient1", "ingredient2"],
      "preparationNotes": "Simple preparation guidance"
    }
  ]
}
```

### Time-Aware Prompt (Late Night)

```
You are a supportive nutrition companion helping users find gentle meal ideas.

[Current time is late night - after 9 PM]

Available Ingredients: [ingredients]
[If healthConditions]: Health Considerations: [healthConditions]
[If energyLevel]: Energy Level: [energyLevel]

IMPORTANT GUIDELINES FOR LATE NIGHT:
- Provide gentle, comforting suggestions
- Focus on light, easy-to-prepare options
- Use supportive, non-judgmental language about eating times
- Emphasize self-care and comfort, not strict nutrition rules
- No judgment about late-night eating
- Ingredients are suggestions - meals can use some or all ingredients
- Include disclaimers that suggestions are dietary guidance, not medical advice

Please provide 2-3 gentle meal suggestions with a supportive message about late-night eating in JSON format:
{
  "meals": [
    {
      "mealName": "Meal name",
      "description": "Gentle description",
      "ingredients": ["ingredient1", "ingredient2"],
      "preparationNotes": "Simple preparation guidance"
    }
  ],
  "timeAwareGuidance": "Gentle, supportive message about late-night eating and self-care"
}
```

---

## Safety Guardrails

All prompts MUST include:

1. **Non-Medical Disclaimer**: "These suggestions are dietary guidance only, not medical advice. Consult healthcare professionals for medical dietary concerns."

2. **Flexibility Statement**: "Ingredients are suggestions - meals can use some or all provided ingredients."

3. **Supportive Tone**: "Use gentle, supportive, non-judgmental language."

4. **No Prescriptions**: "Do NOT prescribe specific diets or medical dietary advice."

---

## Response Format

### Standard Response

```json
{
  "meals": [
    {
      "mealName": "Simple Pasta",
      "description": "Easy pasta dish with available ingredients",
      "ingredients": ["pasta", "tomato"],
      "preparationNotes": "Boil pasta, heat tomatoes, combine"
    }
  ]
}
```

### Time-Aware Response

```json
{
  "meals": [
    {
      "mealName": "Comforting Toast",
      "description": "Simple, gentle option for late night",
      "ingredients": ["bread", "butter"],
      "preparationNotes": "Toast bread, add butter"
    }
  ],
  "timeAwareGuidance": "It's late - here are some gentle suggestions. Remember, eating when you need to is part of self-care, and there's no wrong time to nourish yourself."
}
```

---

## Implementation Notes

### Time Detection Logic

```typescript
function isLateNight(currentTime: Date = new Date()): boolean {
  const hour = currentTime.getHours();
  return hour >= 21; // 9 PM or later
}
```

### Prompt Modification

```typescript
function buildMealSuggestionPrompt(
  input: MealSuggestionInput,
  options: MealSuggestionOptions
): string {
  let prompt = BASE_PROMPT_TEMPLATE;
  
  // Add time-aware section if late night
  if (options.timeAware && isLateNight(options.currentTime)) {
    prompt = TIME_AWARE_PROMPT_TEMPLATE;
    // Add time-aware specific instructions
  }
  
  // Add flexibility instructions if enabled
  if (options.flexible !== false) {
    prompt += '\n\nIMPORTANT: Ingredients are suggestions, not requirements. Meals can use some or all ingredients.';
  }
  
  // Fill in input data
  prompt = prompt.replace('[ingredients]', input.ingredients.join(', '));
  // ... other replacements
  
  return prompt;
}
```

---

## Testing Considerations

1. **Time-Aware Testing**: Use `options.currentTime` to test late-night scenarios
2. **Flexibility Testing**: Verify prompts include flexibility language
3. **Error Handling**: Test network failures, invalid inputs, AI generation failures
4. **Response Parsing**: Test JSON parsing, missing fields, malformed responses

---

## End of Contract

This contract defines the enhanced LLM service methods for time-aware meal suggestions and flexible ingredient handling.

