import { getDB } from '../../db';
import { BaseEntity, FoodReflection, SugarReductionCup } from '../../types';
import { StorageError, QueryOptions, PaginatedResult } from './types';

export type StoreName = 'medicalRecords' | 'healthConditions' | 'symptomEntries' | 'moodEntries' | 'journalEntries' | 'ingredientLists' | 'mealSuggestions' | 'foodReflections' | 'sugarReductionCups' | 'userPreferences' | 'dbVersion';

/**
 * Base storage service for IndexedDB operations
 * Provides CRUD operations for all entity types
 */

/**
 * Save an entity (create or update)
 */
export async function saveEntity<T extends BaseEntity>(
  storeName: StoreName,
  entity: T
): Promise<T> {
  try {
    const db = await getDB();
    const now = new Date().toISOString();

    // Set timestamps
    if (!entity.id) {
      // New entity - generate ID and set created/updated timestamps
      entity.id = crypto.randomUUID();
      entity.createdAt = now;
      entity.updatedAt = now;
    } else {
      // Existing entity - update timestamp
      entity.updatedAt = now;
    }

    await db.put(storeName, entity as any);
    return entity;
  } catch (error) {
    throw createStorageError(error, 'Failed to save entity');
  }
}

/**
 * Get an entity by ID
 */
export async function getEntity<T extends BaseEntity>(
  storeName: StoreName,
  id: string
): Promise<T | null> {
  try {
    const db = await getDB();
    return (await db.get(storeName, id)) as T | undefined || null;
  } catch (error) {
    throw createStorageError(error, 'Failed to get entity');
  }
}

/**
 * Get all entities from a store
 */
export async function getAllEntities<T extends BaseEntity>(
  storeName: StoreName,
  options?: QueryOptions
): Promise<T[]> {
  try {
    const db = await getDB();
    const store = db.transaction(storeName, 'readonly').objectStore(storeName);
    let index: any = store;

    // Apply ordering if specified
    if (options?.orderBy) {
      index = (store as any).index(options.orderBy);
    }

    const direction = options?.orderDirection === 'desc' ? 'prev' : 'next';
    const items: T[] = [];

    let cursor = await index.openCursor(null, direction);
    let offset = options?.offset || 0;
    let limit = options?.limit || Infinity;
    let count = 0;

    while (cursor && count < limit) {
      if (offset > 0) {
        offset--;
      } else {
        items.push(cursor.value as T);
        count++;
      }
      cursor = await cursor.continue();
    }

    return items;
  } catch (error) {
    throw createStorageError(error, 'Failed to get entities');
  }
}

/**
 * Get paginated entities
 */
export async function getPaginatedEntities<T extends BaseEntity>(
  storeName: StoreName,
  options?: QueryOptions
): Promise<PaginatedResult<T>> {
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  const items = await getAllEntities<T>(storeName, {
    ...options,
    limit: limit + 1, // Get one extra to check if there are more
  });

  const hasMore = items.length > limit;
  const result = hasMore ? items.slice(0, limit) : items;

  // Get total count (approximate for performance)
  const allItems = await getAllEntities<T>(storeName);
  const total = allItems.length;

  return {
    items: result,
    total,
    limit,
    offset,
  };
}

/**
 * Delete an entity by ID
 */
export async function deleteEntity(
  storeName: StoreName,
  id: string
): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(storeName, id);
  } catch (error) {
    throw createStorageError(error, 'Failed to delete entity');
  }
}

/**
 * Delete multiple entities by IDs
 */
export async function deleteEntities(
  storeName: StoreName,
  ids: string[]
): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    await Promise.all(ids.map((id) => store.delete(id)));
    await tx.done;
  } catch (error) {
    throw createStorageError(error, 'Failed to delete entities');
  }
}

/**
 * Delete all entities from a store
 */
export async function deleteAllEntities(storeName: StoreName): Promise<void> {
  try {
    const db = await getDB();
    await db.clear(storeName);
  } catch (error) {
    throw createStorageError(error, 'Failed to delete all entities');
  }
}

/**
 * Delete all data from all stores (full data deletion)
 */
export async function deleteAllData(): Promise<void> {
  try {
    const db = await getDB();
    const storeNames: StoreName[] = [
      'medicalRecords',
      'healthConditions',
      'symptomEntries',
      'moodEntries',
      'journalEntries',
      'ingredientLists',
      'mealSuggestions',
      'foodReflections',
      'sugarReductionCups',
      'userPreferences',
    ];

    // Clear all stores in a transaction
    const tx = db.transaction(storeNames, 'readwrite');
    await Promise.all(storeNames.map((name) => tx.objectStore(name).clear()));
    await tx.done;
  } catch (error) {
    throw createStorageError(error, 'Failed to delete all data');
  }
}

/**
 * Query entities by index
 */
export async function queryByIndex<T extends BaseEntity>(
  storeName: StoreName,
  indexName: string,
  value: any
): Promise<T[]> {
  try {
    const db = await getDB();
    const store = db.transaction(storeName, 'readonly').objectStore(storeName);
    const index = (store as any).index(indexName);
    return (await index.getAll(value)) as T[];
  } catch (error) {
    throw createStorageError(error, 'Failed to query by index');
  }
}

/**
 * Count entities in a store
 */
export async function countEntities(storeName: StoreName): Promise<number> {
  try {
    const db = await getDB();
    return await db.count(storeName);
  } catch (error) {
    throw createStorageError(error, 'Failed to count entities');
  }
}

/**
 * Create a storage error from a caught error
 */
function createStorageError(error: any, message: string): StorageError {
  const isQuotaError =
    error?.name === 'QuotaExceededError' ||
    error?.message?.includes('quota') ||
    error?.message?.includes('storage');

  return {
    code: isQuotaError ? 'QUOTA_EXCEEDED' : 'STORAGE_ERROR',
    message: `${message}: ${error?.message || 'Unknown error'}`,
    retryable: !isQuotaError,
  };
}

// Food Reflection Operations

/**
 * Save or update a daily food reflection
 * Only one reflection per day is allowed (overwrites if exists)
 */
export async function saveFoodReflection(
  reflection: Partial<FoodReflection>
): Promise<FoodReflection> {
  try {
    const db = await getDB();
    const now = new Date().toISOString();
    const today = reflection.date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const mealType = reflection.mealType || 'lunch'; // Default to lunch

    // Check if reflection exists for this date and mealType
    const existing = await getFoodReflectionByDateAndMealType(today, mealType);

    if (existing) {
      // Update existing
      const updated: FoodReflection = {
        ...existing,
        reflection: reflection.reflection !== undefined ? reflection.reflection : existing.reflection,
        notes: reflection.notes !== undefined ? reflection.notes : existing.notes,
        aiAnalysis: reflection.aiAnalysis !== undefined ? reflection.aiAnalysis : existing.aiAnalysis,
        processingStatus: reflection.processingStatus !== undefined ? reflection.processingStatus : existing.processingStatus,
        errorMessage: reflection.errorMessage !== undefined ? reflection.errorMessage : existing.errorMessage,
        updatedAt: now,
      };
      await db.put('foodReflections', updated);
      return updated;
    } else {
      // Create new
      const newReflection: FoodReflection = {
        id: reflection.id || crypto.randomUUID(),
        date: today,
        mealType: mealType,
        reflection: reflection.reflection!,
        notes: reflection.notes || null,
        aiAnalysis: reflection.aiAnalysis || null,
        processingStatus: reflection.processingStatus || 'pending',
        errorMessage: reflection.errorMessage || null,
        createdAt: now,
        updatedAt: now,
      };
      await db.put('foodReflections', newReflection);
      return newReflection;
    }
  } catch (error) {
    throw createStorageError(error, 'Failed to save food reflection');
  }
}

/**
 * Get food reflections for a specific date (all meals)
 */
export async function getFoodReflectionsForDate(
  date: string
): Promise<FoodReflection[]> {
  try {
    const db = await getDB();
    const store = db.transaction('foodReflections', 'readonly').objectStore('foodReflections');
    const index = store.index('date');
    return (await index.getAll(date)) as FoodReflection[];
  } catch (error) {
    throw createStorageError(error, 'Failed to get food reflections for date');
  }
}

/**
 * Get food reflection for a specific date and mealType
 */
export async function getFoodReflectionByDateAndMealType(
  date: string,
  mealType: string
): Promise<FoodReflection | null> {
  try {
    const allReflections = await getFoodReflectionsForDate(date);
    return allReflections.find(r => r.mealType === mealType) || null;
  } catch (error) {
    throw createStorageError(error, 'Failed to get food reflection by date and meal type');
  }
}

/**
 * @deprecated Use getFoodReflectionsForDate instead
 * Get food reflection for a specific date (returns first one found, for backward compatibility)
 */
export async function getFoodReflection(
  date: string
): Promise<FoodReflection | null> {
  try {
    const reflections = await getFoodReflectionsForDate(date);
    return reflections.length > 0 ? reflections[0] : null;
  } catch (error) {
    throw createStorageError(error, 'Failed to get food reflection');
  }
}

/**
 * Get food reflections for a date range
 */
export async function getFoodReflections(
  startDate: string,
  endDate: string
): Promise<FoodReflection[]> {
  try {
    const db = await getDB();
    const store = db.transaction('foodReflections', 'readonly').objectStore('foodReflections');
    const index = store.index('date');
    const range = IDBKeyRange.bound(startDate, endDate, false, false); // Inclusive
    return (await index.getAll(range)) as FoodReflection[];
  } catch (error) {
    throw createStorageError(error, 'Failed to get food reflections');
  }
}

/**
 * Delete food reflection for a specific date and mealType
 */
export async function deleteFoodReflection(date: string, mealType?: string): Promise<void> {
  try {
    if (mealType) {
      // Delete specific meal
      const reflection = await getFoodReflectionByDateAndMealType(date, mealType);
      if (reflection) {
        await deleteEntity('foodReflections', reflection.id);
      }
    } else {
      // Delete all meals for the date
      const reflections = await getFoodReflectionsForDate(date);
      for (const reflection of reflections) {
        await deleteEntity('foodReflections', reflection.id);
      }
    }
  } catch (error) {
    throw createStorageError(error, 'Failed to delete food reflection');
  }
}

// Sugar Reduction Cup Operations

/**
 * Get or create singleton sugar reduction cup record
 */
export async function getSugarReductionCups(): Promise<SugarReductionCup> {
  try {
    const db = await getDB();
    let cups = await getEntity<SugarReductionCup>('sugarReductionCups', 'singleton');
    
    if (!cups) {
      // Create new singleton record
      const now = new Date().toISOString();
      cups = {
        id: 'singleton',
        smallCups: 0,
        largeCups: 0,
        lastPourDate: null,
        createdAt: now,
        updatedAt: now,
      };
      await db.put('sugarReductionCups', cups);
    }
    
    return cups;
  } catch (error) {
    throw createStorageError(error, 'Failed to get sugar reduction cups');
  }
}

/**
 * Pour cup (increment small cups, form large cup if needed)
 */
export async function pourSugarReductionCup(): Promise<SugarReductionCup> {
  try {
    const cups = await getSugarReductionCups();
    const now = new Date().toISOString();
    const today = now.split('T')[0]; // YYYY-MM-DD
    
    const newSmallCups = cups.smallCups + 1;
    
    if (newSmallCups >= 5) {
      // Reset small cups, increment large cups
      const updated: SugarReductionCup = {
        ...cups,
        smallCups: 0,
        largeCups: cups.largeCups + 1,
        lastPourDate: today,
        updatedAt: now,
      };
      await saveEntity('sugarReductionCups', updated);
      return updated;
    } else {
      // Increment small cups
      const updated: SugarReductionCup = {
        ...cups,
        smallCups: newSmallCups,
        lastPourDate: today,
        updatedAt: now,
      };
      await saveEntity('sugarReductionCups', updated);
      return updated;
    }
  } catch (error) {
    throw createStorageError(error, 'Failed to pour sugar reduction cup');
  }
}

/**
 * Reset sugar reduction cups to zero
 */
export async function resetSugarReductionCups(): Promise<SugarReductionCup> {
  try {
    const cups = await getSugarReductionCups();
    const now = new Date().toISOString();
    
    const reset: SugarReductionCup = {
      ...cups,
      smallCups: 0,
      largeCups: 0,
      lastPourDate: null,
      updatedAt: now,
    };
    
    await saveEntity('sugarReductionCups', reset);
    return reset;
  } catch (error) {
    throw createStorageError(error, 'Failed to reset sugar reduction cups');
  }
}

