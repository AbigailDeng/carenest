import { getDB } from '../../db';
import { BaseEntity } from '../../types';
import { StorageError, QueryOptions, PaginatedResult } from './types';

export type StoreName = 'medicalRecords' | 'healthConditions' | 'symptomEntries' | 'moodEntries' | 'journalEntries' | 'ingredientLists' | 'mealSuggestions' | 'userPreferences' | 'dbVersion';

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

