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
  FoodReflection,
  MealType,
  SugarReductionCup,
  CharacterState,
  ConversationMessage,
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
      isFlexible: number;
    };
  };
  foodReflections: {
    key: string;
    value: FoodReflection;
    indexes: { date: string; mealType: MealType; createdAt: string; processingStatus: string };
  };
  sugarReductionCups: {
    key: string;
    value: SugarReductionCup;
    indexes: { lastPourDate: string };
  };
  userPreferences: {
    key: string;
    value: UserPreferences;
  };
  dbVersion: {
    key: number;
    value: DBVersion;
  };
  characterState: {
    key: string;
    value: CharacterState;
    indexes: { id: string };
  };
  conversations: {
    key: string;
    value: ConversationMessage;
    indexes: {
      characterId: string;
      timestamp: string;
      characterId_timestamp: [string, string];
    };
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
const DB_VERSION = 5;

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
    async upgrade(db, _oldVersion, newVersion, transaction) {
      const targetVersion = newVersion ?? DB_VERSION;

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

      // Version 2: Add new object stores and enhance existing ones
      if (targetVersion >= 2) {
        // Add new index to mealSuggestions if it doesn't exist
        if (db.objectStoreNames.contains('mealSuggestions')) {
          const mealSuggestionsStore = transaction.objectStore('mealSuggestions');
          if (!mealSuggestionsStore.indexNames.contains('isFlexible')) {
            mealSuggestionsStore.createIndex('isFlexible', 'isFlexible');
          }
        }

        // Create foodReflections object store
        if (!db.objectStoreNames.contains('foodReflections')) {
          const foodReflectionsStore = db.createObjectStore('foodReflections', {
            keyPath: 'id',
          });
          foodReflectionsStore.createIndex('date', 'date', { unique: false }); // Allow multiple entries per day
          foodReflectionsStore.createIndex('mealType', 'mealType');
          foodReflectionsStore.createIndex('createdAt', 'createdAt');
          foodReflectionsStore.createIndex('processingStatus', 'processingStatus');
        } else {
          const foodReflectionsStore = transaction.objectStore('foodReflections');

          // Add processingStatus index if it doesn't exist
          if (!foodReflectionsStore.indexNames.contains('processingStatus')) {
            foodReflectionsStore.createIndex('processingStatus', 'processingStatus');
          }
          // Add mealType index if it doesn't exist
          if (!foodReflectionsStore.indexNames.contains('mealType')) {
            foodReflectionsStore.createIndex('mealType', 'mealType');
          }
        }

        // Create sugarReductionCups object store
        if (!db.objectStoreNames.contains('sugarReductionCups')) {
          const sugarReductionCupsStore = db.createObjectStore('sugarReductionCups', {
            keyPath: 'id',
          });
          sugarReductionCupsStore.createIndex('lastPourDate', 'lastPourDate');
        }

        // Migrate existing mealSuggestions to add new fields
        if (targetVersion === 2) {
          await migrateToVersion2(transaction as any);
          await migrateToVersion3(transaction as any);
        }
      }

      // Version 4: Fix date index uniqueness constraint for foodReflections
      // Note: IndexedDB doesn't allow modifying index uniqueness, so we need to
      // delete and recreate the store. We'll migrate data before deleting.
      if (targetVersion >= 4 && _oldVersion < 4) {
        if (db.objectStoreNames.contains('foodReflections')) {
          const foodReflectionsStore = transaction.objectStore('foodReflections');
          // Get all data before deleting the store
          const allReflections = await foodReflectionsStore.getAll();

          // Delete the store - it will be recreated below with correct index settings
          db.deleteObjectStore('foodReflections');

          // Recreate with correct index settings (non-unique date index)
          const newFoodReflectionsStore = db.createObjectStore('foodReflections', {
            keyPath: 'id',
          });
          newFoodReflectionsStore.createIndex('date', 'date', { unique: false }); // Allow multiple entries per day
          newFoodReflectionsStore.createIndex('mealType', 'mealType');
          newFoodReflectionsStore.createIndex('createdAt', 'createdAt');
          newFoodReflectionsStore.createIndex('processingStatus', 'processingStatus');

          // Restore all data
          for (const reflection of allReflections) {
            await newFoodReflectionsStore.put(reflection);
          }
        } else {
          // Store doesn't exist, just create it with correct settings
          const foodReflectionsStore = db.createObjectStore('foodReflections', {
            keyPath: 'id',
          });
          foodReflectionsStore.createIndex('date', 'date', { unique: false }); // Allow multiple entries per day
          foodReflectionsStore.createIndex('mealType', 'mealType');
          foodReflectionsStore.createIndex('createdAt', 'createdAt');
          foodReflectionsStore.createIndex('processingStatus', 'processingStatus');
        }
      }

      // Version 5: Add companion character system stores
      if (targetVersion >= 5 && _oldVersion < 5) {
        // Create characterState object store
        if (!db.objectStoreNames.contains('characterState')) {
          const characterStateStore = db.createObjectStore('characterState', {
            keyPath: 'id',
          });
          characterStateStore.createIndex('id', 'id', { unique: true });
        }

        // Create conversations object store
        if (!db.objectStoreNames.contains('conversations')) {
          const conversationsStore = db.createObjectStore('conversations', {
            keyPath: 'id',
          });
          conversationsStore.createIndex('characterId', 'characterId');
          conversationsStore.createIndex('timestamp', 'timestamp');
          // Compound index for efficient queries: characterId + timestamp
          conversationsStore.createIndex('characterId_timestamp', ['characterId', 'timestamp']);
        }
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
        version: targetVersion,
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

/**
 * Migrate database to version 2
 * Adds new fields to existing mealSuggestions records
 */
async function migrateToVersion3(transaction: any): Promise<void> {
  // Migrate foodReflections: add mealType to existing records
  if (transaction.objectStoreNames.contains('foodReflections')) {
    const foodReflectionsStore = transaction.objectStore('foodReflections');
    const allReflections = await foodReflectionsStore.getAll();

    // Update existing records to have default mealType if missing
    for (const reflection of allReflections) {
      if (!('mealType' in reflection) || !reflection.mealType) {
        // Default to 'lunch' for existing records
        const updated: FoodReflection = {
          ...reflection,
          mealType: 'lunch',
        };
        await foodReflectionsStore.put(updated);
      }
    }
  }
}

async function migrateToVersion2(transaction: any): Promise<void> {
  const mealSuggestionsStore = transaction.objectStore('mealSuggestions');
  const allSuggestions = await mealSuggestionsStore.getAll();

  for (const suggestion of allSuggestions) {
    // Add new fields with default values
    const updated: MealSuggestion = {
      ...suggestion,
      timeAwareGuidance: null,
      isFlexible: true,
      detailedPreparationMethod: null,
      imageUrl: null,
    };
    await mealSuggestionsStore.put(updated);
  }
}
