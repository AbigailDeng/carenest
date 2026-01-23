# Data Model: Nutrition Module Enhancement

**Feature**: Enhanced Nutrition Module  
**Date**: 2025-01-27  
**Status**: Design Complete

## Overview

This document defines the data model enhancements for the Nutrition module, including new entities for daily food reflection and enhancements to existing meal suggestion entities.

## Database Schema

### Database: `WellmateDB`

**Version**: 2 (increment from existing version 1)  
**Upgrade Path**: Add new object stores and enhance existing ones

---

## New Object Stores

### Store: `foodReflections`

**Purpose**: Store daily food reflection entries (light/normal/indulgent)

**Schema**:
```typescript
interface FoodReflection {
  id: string;                      // UUID v4
  date: string;                     // ISO date string (YYYY-MM-DD), one entry per day
  reflection: 'light' | 'normal' | 'indulgent';
  notes: string | null;             // Optional user notes
  createdAt: string;                // ISO timestamp
  updatedAt: string;                // ISO timestamp
}
```

**Indexes**:
- Primary: `id`
- Unique Index: `date` (ensures one entry per day)
- Index: `createdAt` (for chronological sorting)

**Validation Rules**:
- `date` must be valid ISO date string (YYYY-MM-DD format)
- `reflection` must be one of: 'light', 'normal', 'indulgent'
- `notes` is optional (can be null or empty string)
- `date` must be unique (one reflection per day)
- `createdAt` and `updatedAt` must be valid ISO timestamps

**Relationships**:
- None (standalone daily reflection)

**Migration Notes**:
- New object store, no migration needed for existing data
- Index on `date` ensures uniqueness constraint

---

### Store: `sugarReductionCups` (Easter Egg Feature)

**Purpose**: Store playful sugar reduction cup accumulation (hidden feature)

**Schema**:
```typescript
interface SugarReductionCup {
  id: string;                      // UUID v4
  smallCups: number;               // Count of small cups (0-4, then resets)
  largeCups: number;               // Count of large cups (accumulated)
  lastPourDate: string | null;    // ISO date string of last pour
  createdAt: string;                // ISO timestamp
  updatedAt: string;                // ISO timestamp
}
```

**Indexes**:
- Primary: `id`
- Index: `lastPourDate` (for date-based queries)

**Validation Rules**:
- `smallCups` must be integer between 0 and 4 (inclusive)
- `largeCups` must be non-negative integer
- `lastPourDate` is optional (null if never used)
- When `smallCups` reaches 5, increment `largeCups` and reset `smallCups` to 0

**Relationships**:
- None (standalone playful feature)

**Migration Notes**:
- New object store, no migration needed
- Single record per user (singleton pattern)

---

## Enhanced Object Stores

### Store: `mealSuggestions` (Enhanced)

**Existing Schema** (from `001-core-modules`):
```typescript
interface MealSuggestion {
  id: string;
  mealName: string;
  description: string;
  ingredients: string[];
  preparationNotes: string | null;
  adaptedForConditions: boolean;
  adaptedForEnergyLevel: boolean;
  sourceIngredientListId: string;
  aiGenerated: boolean;
  isFavorite: boolean;
  createdAt: string;
}
```

**New Fields**:
```typescript
interface MealSuggestion {
  // ... existing fields ...
  timeAwareGuidance: string | null;  // NEW: Gentle guidance for late-night context
  isFlexible: boolean;                // NEW: Indicates ingredients are optional
  detailedPreparationMethod: string | null;  // NEW: Step-by-step numbered list for detail view
  imageUrl: string | null;            // NEW: LLM-generated image URL (generated on-demand when detail view opens)
}
```

**Enhanced Validation Rules**:
- `timeAwareGuidance` is optional (null if not time-aware)
- `isFlexible` defaults to `true` (all suggestions are flexible by default)
- `timeAwareGuidance` must be non-empty string if provided (min 10 characters, max 200)

**Migration Notes**:
- Add `timeAwareGuidance: null` to all existing records
- Add `isFlexible: true` to all existing records
- No data loss, backward compatible

---

## TypeScript Type Definitions

### New Types

```typescript
// Food Reflection Types
export type FoodReflectionType = 'light' | 'normal' | 'indulgent';

export interface FoodReflection extends BaseEntity {
  date: string;                     // ISO date (YYYY-MM-DD)
  reflection: FoodReflectionType;
  notes: string | null;
}

// Sugar Reduction Easter Egg Types
export interface SugarReductionCup extends BaseEntity {
  smallCups: number;                // 0-4
  largeCups: number;                 // Accumulated
  lastPourDate: string | null;       // ISO date
}
```

### Enhanced Types

```typescript
// Enhanced MealSuggestion
export interface MealSuggestion extends BaseEntity {
  // ... existing fields ...
  timeAwareGuidance: string | null;  // NEW
  isFlexible: boolean;                // NEW (default: true)
}
```

---

## IndexedDB Schema Definition

### Object Store Definitions

```typescript
// New: foodReflections
foodReflections: {
  keyPath: 'id',
  autoIncrement: false,
  indexes: {
    date: { unique: true, keyPath: 'date' },
    createdAt: { unique: false, keyPath: 'createdAt' },
  },
}

// New: sugarReductionCups
sugarReductionCups: {
  keyPath: 'id',
  autoIncrement: false,
  indexes: {
    lastPourDate: { unique: false, keyPath: 'lastPourDate' },
  },
}

// Enhanced: mealSuggestions (add new indexes if needed)
mealSuggestions: {
  keyPath: 'id',
  autoIncrement: false,
  indexes: {
    // ... existing indexes ...
    isFlexible: { unique: false, keyPath: 'isFlexible' },
  },
}
```

---

## Data Access Patterns

### Food Reflection

**Save/Update Daily Reflection**:
```typescript
// Get today's date in YYYY-MM-DD format
const today = new Date().toISOString().split('T')[0];

// Check if reflection exists for today
const existing = await getEntity('foodReflections', today, { indexName: 'date' });

if (existing) {
  // Update existing
  await saveEntity('foodReflections', {
    ...existing,
    reflection: 'normal',
    notes: 'Optional notes',
    updatedAt: new Date().toISOString(),
  });
} else {
  // Create new
  await saveEntity('foodReflections', {
    id: generateUUID(),
    date: today,
    reflection: 'normal',
    notes: 'Optional notes',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}
```

**Get Reflection for Date**:
```typescript
const reflection = await getEntity('foodReflections', date, { indexName: 'date' });
```

**Get Reflections for Date Range**:
```typescript
const reflections = await queryByIndex('foodReflections', 'date', IDBKeyRange.bound(startDate, endDate));
```

### Sugar Reduction Cups

**Get or Create Singleton**:
```typescript
// Get existing or create new
let cups = await getEntity('sugarReductionCups', 'singleton');
if (!cups) {
  cups = {
    id: 'singleton',
    smallCups: 0,
    largeCups: 0,
    lastPourDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await saveEntity('sugarReductionCups', cups);
}
```

**Pour Cup (Increment)**:
```typescript
const cups = await getEntity('sugarReductionCups', 'singleton');
const newSmallCups = cups.smallCups + 1;

if (newSmallCups >= 5) {
  // Reset small cups, increment large cups
  await saveEntity('sugarReductionCups', {
    ...cups,
    smallCups: 0,
    largeCups: cups.largeCups + 1,
    lastPourDate: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString(),
  });
} else {
  // Increment small cups
  await saveEntity('sugarReductionCups', {
    ...cups,
    smallCups: newSmallCups,
    lastPourDate: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString(),
  });
}
```

### Enhanced Meal Suggestions

**Generate with Time-Aware Guidance**:
```typescript
const suggestion = await generateMealSuggestions({
  ingredients: ['tomato', 'pasta'],
  timeAware: true,  // Enable time-aware guidance
  // ... other options
});

// suggestion.timeAwareGuidance will contain gentle guidance if late night
```

---

## Validation Functions

### Food Reflection Validation

```typescript
export function validateFoodReflection(reflection: Partial<FoodReflection>): ValidationResult {
  if (!reflection.date) {
    return { valid: false, error: 'Date is required' };
  }
  
  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(reflection.date)) {
    return { valid: false, error: 'Date must be in YYYY-MM-DD format' };
  }
  
  if (!reflection.reflection || !['light', 'normal', 'indulgent'].includes(reflection.reflection)) {
    return { valid: false, error: 'Reflection must be light, normal, or indulgent' };
  }
  
  if (reflection.notes && reflection.notes.length > 500) {
    return { valid: false, error: 'Notes must be 500 characters or less' };
  }
  
  return { valid: true };
}
```

### Sugar Reduction Cup Validation

```typescript
export function validateSugarReductionCup(cup: Partial<SugarReductionCup>): ValidationResult {
  if (cup.smallCups !== undefined && (cup.smallCups < 0 || cup.smallCups > 4)) {
    return { valid: false, error: 'Small cups must be between 0 and 4' };
  }
  
  if (cup.largeCups !== undefined && cup.largeCups < 0) {
    return { valid: false, error: 'Large cups must be non-negative' };
  }
  
  return { valid: true };
}
```

---

## Data Export/Import

### Export Format

```typescript
// Food Reflections
{
  "foodReflections": [
    {
      "id": "uuid",
      "date": "2025-01-27",
      "reflection": "normal",
      "notes": "Optional notes",
      "createdAt": "2025-01-27T10:00:00Z",
      "updatedAt": "2025-01-27T10:00:00Z"
    }
  ],
  "sugarReductionCups": [
    {
      "id": "singleton",
      "smallCups": 3,
      "largeCups": 2,
      "lastPourDate": "2025-01-27",
      "createdAt": "2025-01-20T10:00:00Z",
      "updatedAt": "2025-01-27T10:00:00Z"
    }
  ]
}
```

---

## Migration Strategy

### Version 1 → Version 2

1. **Add new object stores**:
   - `foodReflections`
   - `sugarReductionCups`

2. **Enhance existing object store**:
   - Add `timeAwareGuidance` field to `mealSuggestions` (default: null)
   - Add `isFlexible` field to `mealSuggestions` (default: true)

3. **Migration script**:
```typescript
export async function migrateToVersion2(db: IDBPDatabase<WellmateDB>) {
  // Create new object stores
  if (!db.objectStoreNames.contains('foodReflections')) {
    const foodReflectionsStore = db.createObjectStore('foodReflections', { keyPath: 'id' });
    foodReflectionsStore.createIndex('date', 'date', { unique: true });
    foodReflectionsStore.createIndex('createdAt', 'createdAt');
  }
  
  if (!db.objectStoreNames.contains('sugarReductionCups')) {
    const cupsStore = db.createObjectStore('sugarReductionCups', { keyPath: 'id' });
    cupsStore.createIndex('lastPourDate', 'lastPourDate');
  }
  
  // Enhance mealSuggestions
  const mealSuggestionsStore = db.transaction('mealSuggestions', 'readwrite').objectStore('mealSuggestions');
  const allSuggestions = await mealSuggestionsStore.getAll();
  
  for (const suggestion of allSuggestions) {
    await mealSuggestionsStore.put({
      ...suggestion,
      timeAwareGuidance: null,
      isFlexible: true,
    });
  }
}
```

---

## Privacy Considerations

- **Food Reflections**: Personal eating patterns, stored locally only
- **Sugar Reduction Cups**: Playful feature data, stored locally only
- **No External Transmission**: All data remains local unless user explicitly exports
- **Export/Delete**: Users can export or delete all nutrition data including reflections and cups

---

## Performance Considerations

- **Food Reflection Lookup**: Indexed by date for O(1) lookup
- **Sugar Reduction Cups**: Singleton pattern, single record lookup
- **Meal Suggestions**: Existing indexes maintained, new `isFlexible` index for filtering

---

## End of Data Model

This data model supports the enhanced Nutrition module with daily food reflection, time-aware meal suggestions, and the hidden sugar reduction easter egg feature.


