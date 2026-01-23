# Storage Service Contract: Nutrition Module Enhancement

**Feature**: Enhanced Nutrition Module  
**Date**: 2025-01-27  
**Status**: Design Complete

## Overview

This document defines the storage service contract for new nutrition-related entities: food reflections and sugar reduction cups.

---

## Food Reflection Operations

### Save/Update Daily Food Reflection

**Method**: `saveFoodReflection(reflection: FoodReflection): Promise<FoodReflection>`

**Description**: Save or update a daily food reflection. Only one reflection per day is allowed (overwrites if exists).

**Input**:
```typescript
interface FoodReflection {
  id?: string;                      // Optional: Auto-generated if not provided
  date: string;                     // ISO date (YYYY-MM-DD), required
  reflection: 'light' | 'normal' | 'indulgent';
  notes?: string | null;            // Optional user notes
  createdAt?: string;               // Optional: Auto-generated if not provided
  updatedAt?: string;               // Optional: Auto-generated if not provided
}
```

**Output**: `FoodReflection` (with all fields populated)

**Behavior**:
1. Validate input (date format, reflection type, notes length)
2. Check if reflection exists for the given date (using `date` index)
3. If exists: Update existing record with new reflection and notes
4. If not exists: Create new record with generated ID and timestamps
5. Return saved reflection

**Errors**:
- `ValidationError`: Invalid input (date format, reflection type, notes too long)
- `StorageError`: IndexedDB operation failed

**Example**:
```typescript
const reflection = await saveFoodReflection({
  date: '2025-01-27',
  reflection: 'normal',
  notes: 'Had a balanced day',
});
```

---

### Get Food Reflection for Date

**Method**: `getFoodReflection(date: string): Promise<FoodReflection | null>`

**Description**: Retrieve food reflection for a specific date.

**Input**:
- `date`: ISO date string (YYYY-MM-DD)

**Output**: `FoodReflection | null` (null if no reflection exists for date)

**Behavior**:
1. Validate date format
2. Query `foodReflections` store using `date` index
3. Return reflection if found, null otherwise

**Errors**:
- `ValidationError`: Invalid date format
- `StorageError`: IndexedDB operation failed

**Example**:
```typescript
const reflection = await getFoodReflection('2025-01-27');
if (reflection) {
  console.log(`Reflection: ${reflection.reflection}`);
}
```

---

### Get Food Reflections for Date Range

**Method**: `getFoodReflections(startDate: string, endDate: string): Promise<FoodReflection[]>`

**Description**: Retrieve all food reflections within a date range.

**Input**:
- `startDate`: ISO date string (YYYY-MM-DD), inclusive
- `endDate`: ISO date string (YYYY-MM-DD), inclusive

**Output**: `FoodReflection[]` (sorted by date, ascending)

**Behavior**:
1. Validate both date formats
2. Query `foodReflections` store using `date` index with range
3. Sort results by date (ascending)
4. Return array of reflections

**Errors**:
- `ValidationError`: Invalid date format
- `StorageError`: IndexedDB operation failed

**Example**:
```typescript
const reflections = await getFoodReflections('2025-01-01', '2025-01-31');
reflections.forEach(r => {
  console.log(`${r.date}: ${r.reflection}`);
});
```

---

### Delete Food Reflection

**Method**: `deleteFoodReflection(date: string): Promise<void>`

**Description**: Delete food reflection for a specific date.

**Input**:
- `date`: ISO date string (YYYY-MM-DD)

**Output**: `void`

**Behavior**:
1. Validate date format
2. Find reflection by date (using `date` index)
3. Delete record if found
4. No error if not found (idempotent)

**Errors**:
- `ValidationError`: Invalid date format
- `StorageError`: IndexedDB operation failed

**Example**:
```typescript
await deleteFoodReflection('2025-01-27');
```

---

## Sugar Reduction Cup Operations

### Get Sugar Reduction Cups

**Method**: `getSugarReductionCups(): Promise<SugarReductionCup>`

**Description**: Get or create singleton sugar reduction cup record.

**Input**: None

**Output**: `SugarReductionCup` (always returns a record, creates if doesn't exist)

**Behavior**:
1. Query `sugarReductionCups` store for record with `id: 'singleton'`
2. If found: Return existing record
3. If not found: Create new record with default values:
   - `id: 'singleton'`
   - `smallCups: 0`
   - `largeCups: 0`
   - `lastPourDate: null`
   - `createdAt`: Current timestamp
   - `updatedAt`: Current timestamp
4. Return record

**Errors**:
- `StorageError`: IndexedDB operation failed

**Example**:
```typescript
const cups = await getSugarReductionCups();
console.log(`Small cups: ${cups.smallCups}, Large cups: ${cups.largeCups}`);
```

---

### Pour Cup (Increment)

**Method**: `pourSugarReductionCup(): Promise<SugarReductionCup>`

**Description**: Increment small cup count. When small cups reach 5, reset to 0 and increment large cups.

**Input**: None

**Output**: `SugarReductionCup` (updated record)

**Behavior**:
1. Get current cup record (or create if doesn't exist)
2. Increment `smallCups` by 1
3. If `smallCups >= 5`:
   - Reset `smallCups` to 0
   - Increment `largeCups` by 1
4. Update `lastPourDate` to today's date (YYYY-MM-DD)
5. Update `updatedAt` to current timestamp
6. Save and return updated record

**Errors**:
- `StorageError`: IndexedDB operation failed

**Example**:
```typescript
const cups = await pourSugarReductionCup();
if (cups.smallCups === 0 && cups.largeCups > 0) {
  console.log('🎉 Formed a large cup!');
}
```

---

### Reset Sugar Reduction Cups

**Method**: `resetSugarReductionCups(): Promise<SugarReductionCup>`

**Description**: Reset cup counts to zero (for testing or user reset).

**Input**: None

**Output**: `SugarReductionCup` (reset record)

**Behavior**:
1. Get current cup record (or create if doesn't exist)
2. Set `smallCups` to 0
3. Set `largeCups` to 0
4. Set `lastPourDate` to null
5. Update `updatedAt` to current timestamp
6. Save and return reset record

**Errors**:
- `StorageError`: IndexedDB operation failed

**Example**:
```typescript
await resetSugarReductionCups();
```

---

## Type Definitions

```typescript
export interface FoodReflection extends BaseEntity {
  date: string;                     // ISO date (YYYY-MM-DD)
  reflection: 'light' | 'normal' | 'indulgent';
  notes: string | null;
}

export interface SugarReductionCup extends BaseEntity {
  smallCups: number;                // 0-4
  largeCups: number;                // Accumulated
  lastPourDate: string | null;     // ISO date (YYYY-MM-DD)
}
```

---

## Error Types

```typescript
interface ValidationError {
  code: 'VALIDATION_ERROR';
  message: string;
  field?: string;
}

interface StorageError {
  code: 'STORAGE_ERROR';
  message: string;
  originalError?: Error;
}
```

---

## Implementation Notes

### Food Reflection Storage Pattern

- Use `date` as unique index to ensure one reflection per day
- Overwrite existing reflection if user reflects multiple times per day
- Store dates as ISO strings (YYYY-MM-DD) for consistency

### Sugar Reduction Cup Storage Pattern

- Use singleton pattern (single record with `id: 'singleton'`)
- Always return a record (create if doesn't exist)
- Simple counter logic: 5 small cups = 1 large cup

### Integration with Existing Storage Service

All methods should be added to `src/services/storage/indexedDB.ts`:

```typescript
// Food Reflection methods
export async function saveFoodReflection(reflection: FoodReflection): Promise<FoodReflection> { ... }
export async function getFoodReflection(date: string): Promise<FoodReflection | null> { ... }
export async function getFoodReflections(startDate: string, endDate: string): Promise<FoodReflection[]> { ... }
export async function deleteFoodReflection(date: string): Promise<void> { ... }

// Sugar Reduction Cup methods
export async function getSugarReductionCups(): Promise<SugarReductionCup> { ... }
export async function pourSugarReductionCup(): Promise<SugarReductionCup> { ... }
export async function resetSugarReductionCups(): Promise<SugarReductionCup> { ... }
```

---

## Testing Considerations

1. **Food Reflection**:
   - Test save/update for same date (overwrite behavior)
   - Test date range queries
   - Test validation (invalid date format, invalid reflection type)

2. **Sugar Reduction Cups**:
   - Test singleton creation
   - Test cup increment logic (small cups → large cups)
   - Test reset functionality

3. **Error Handling**:
   - Test IndexedDB failures
   - Test validation errors
   - Test edge cases (empty dates, invalid types)

---

## End of Contract

This contract defines storage operations for food reflections and sugar reduction cups in the enhanced Nutrition module.


