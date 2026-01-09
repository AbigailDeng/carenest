import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  MedicalRecord,
  HealthCondition,
  SymptomEntry,
  MoodEntry,
  JournalEntry,
  IngredientList,
  MealSuggestion,
  UserPreferences,
  DBVersion,
} from './types';

// Database schema definition
export interface WellmateDB extends DBSchema {
  medicalRecords: {
    key: string;
    value: MedicalRecord;
    indexes: { uploadDate: string; processingStatus: string };
  };
  healthConditions: {
    key: string;
    value: HealthCondition;
    indexes: { documentedDate: string; sourceRecordId: string };
  };
  symptomEntries: {
    key: string;
    value: SymptomEntry;
    indexes: { loggedDate: string; loggedTime: string; processingStatus: string };
  };
  moodEntries: {
    key: string;
    value: MoodEntry;
    indexes: { loggedDate: string; moodValue: MoodValue };
  };
  journalEntries: {
    key: string;
    value: JournalEntry;
    indexes: { entryDate: string; processingStatus: string };
  };
  ingredientLists: {
    key: string;
    value: IngredientList;
    indexes: { createdAt: string };
  };
  mealSuggestions: {
    key: string;
    value: MealSuggestion;
    indexes: {
      sourceIngredientListId: string;
      createdAt: string;
    };
  };
  userPreferences: {
    key: string;
    value: UserPreferences;
  };
  dbVersion: {
    key: number;
    value: DBVersion;
  };
}

type MoodValue =
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

const DB_NAME = 'wellmate_db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<WellmateDB> | null = null;

/**
 * Open and initialize the Wellmate database
 * Handles schema creation and migrations
 */
export async function openWellmateDB(): Promise<IDBPDatabase<WellmateDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<WellmateDB>(DB_NAME, DB_VERSION, {
    upgrade(db, _oldVersion, newVersion, transaction) {
      // Create object stores
      if (!db.objectStoreNames.contains('medicalRecords')) {
        const medicalRecordsStore = db.createObjectStore('medicalRecords', {
          keyPath: 'id',
        });
        medicalRecordsStore.createIndex('uploadDate', 'uploadDate');
        medicalRecordsStore.createIndex('processingStatus', 'processingStatus');
      }

      if (!db.objectStoreNames.contains('healthConditions')) {
        const healthConditionsStore = db.createObjectStore('healthConditions', {
          keyPath: 'id',
        });
        healthConditionsStore.createIndex('documentedDate', 'documentedDate');
        healthConditionsStore.createIndex('sourceRecordId', 'sourceRecordId');
      }

      if (!db.objectStoreNames.contains('symptomEntries')) {
        const symptomEntriesStore = db.createObjectStore('symptomEntries', {
          keyPath: 'id',
        });
        symptomEntriesStore.createIndex('loggedDate', 'loggedDate');
        symptomEntriesStore.createIndex('loggedTime', 'loggedTime');
        symptomEntriesStore.createIndex('processingStatus', 'processingStatus');
      }

      if (!db.objectStoreNames.contains('moodEntries')) {
        const moodEntriesStore = db.createObjectStore('moodEntries', {
          keyPath: 'id',
        });
        moodEntriesStore.createIndex('loggedDate', 'loggedDate');
        moodEntriesStore.createIndex('moodValue', 'moodValue');
      }

      if (!db.objectStoreNames.contains('journalEntries')) {
        const journalEntriesStore = db.createObjectStore('journalEntries', {
          keyPath: 'id',
        });
        journalEntriesStore.createIndex('entryDate', 'entryDate');
        journalEntriesStore.createIndex('processingStatus', 'processingStatus');
      }

      if (!db.objectStoreNames.contains('ingredientLists')) {
        const ingredientListsStore = db.createObjectStore('ingredientLists', {
          keyPath: 'id',
        });
        ingredientListsStore.createIndex('createdAt', 'createdAt');
      }

      if (!db.objectStoreNames.contains('mealSuggestions')) {
        const mealSuggestionsStore = db.createObjectStore('mealSuggestions', {
          keyPath: 'id',
        });
        mealSuggestionsStore.createIndex('sourceIngredientListId', 'sourceIngredientListId');
        mealSuggestionsStore.createIndex('createdAt', 'createdAt');
      }


      if (!db.objectStoreNames.contains('userPreferences')) {
        db.createObjectStore('userPreferences', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('dbVersion')) {
        db.createObjectStore('dbVersion', { keyPath: 'version' });
      }

      // Initialize DB version
      const versionStore = transaction.objectStore('dbVersion');
      versionStore.put({
        version: newVersion || DB_VERSION,
        lastMigration: new Date().toISOString(),
      } as DBVersion);
    },
  });

  return dbInstance;
}

/**
 * Get the database instance (opens if not already open)
 */
export async function getDB(): Promise<IDBPDatabase<WellmateDB>> {
  return openWellmateDB();
}

/**
 * Close the database connection
 */
export async function closeDB(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

