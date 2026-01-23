# Storage Service Contract

**Purpose**: Define the interface for IndexedDB storage operations

## Service Interface

### Database Schema

**Database Name**: `wellmate_db`  
**Version**: 1 (supports future migrations)

**Object Stores**:
- `medicalRecords` - MedicalRecord entities
- `healthConditions` - HealthCondition entities
- `symptomEntries` - SymptomEntry entities
- `moodEntries` - MoodEntry entities
- `journalEntries` - JournalEntry entities
- `ingredientLists` - IngredientList entities
- `mealSuggestions` - MealSuggestion entities
- `reminderSettings` - ReminderSettings entities
- `insights` - Insight entities
- `userPreferences` - UserPreferences entities

---

### Core Storage Operations

#### Save Entity

**Method**: `saveEntity<T>(storeName: string, entity: T): Promise<T>`

**Behavior**:
- Adds entity if new (no id), updates if exists (has id)
- Returns saved entity with generated/updated timestamps
- Handles IndexedDB transaction errors gracefully

**Error Handling**:
- Database not available → Return error with helpful message
- Storage quota exceeded → Return error with guidance
- Invalid entity → Return validation error

---

#### Get Entity

**Method**: `getEntity<T>(storeName: string, id: string): Promise<T | null>`

**Behavior**:
- Returns entity if found, null if not found
- Handles missing database gracefully

---

#### Get All Entities

**Method**: `getAllEntities<T>(storeName: string, filters?: FilterOptions): Promise<T[]>`

**Filter Options**:
```typescript
interface FilterOptions {
  dateRange?: { start: string; end: string };
  limit?: number;
  orderBy?: 'date' | 'createdAt' | 'updatedAt';
  orderDirection?: 'asc' | 'desc';
}
```

**Behavior**:
- Returns filtered/sorted entities
- Handles empty results gracefully

---

#### Delete Entity

**Method**: `deleteEntity(storeName: string, id: string): Promise<void>`

**Behavior**:
- Permanently removes entity
- Returns success confirmation
- Handles missing entity gracefully (no error)

---

#### Delete All Entities

**Method**: `deleteAllEntities(storeName: string): Promise<void>`

**Behavior**:
- Permanently removes all entities in store
- Returns success confirmation
- Used for data deletion feature

---

### Export Operations

#### Export All Data

**Method**: `exportAllData(): Promise<ExportData>`

**Output**:
```typescript
interface ExportData {
  format: 'json' | 'csv';
  data: {
    medicalRecords: MedicalRecord[];
    healthConditions: HealthCondition[];
    symptomEntries: SymptomEntry[];
    moodEntries: MoodEntry[];
    journalEntries: JournalEntry[];
    ingredientLists: IngredientList[];
    mealSuggestions: MealSuggestion[];
    reminderSettings: ReminderSettings[];
    insights: Insight[];
    userPreferences: UserPreferences;
  };
  exportDate: string;
  version: string;
}
```

**Behavior**:
- Exports all user data in requested format
- Includes metadata (export date, app version)
- Handles large datasets efficiently

---

### Migration Operations

#### Check Schema Version

**Method**: `checkSchemaVersion(): Promise<number>`

**Behavior**:
- Returns current database schema version
- Handles new installations (returns 0)

---

#### Migrate Schema

**Method**: `migrateSchema(targetVersion: number): Promise<void>`

**Behavior**:
- Migrates database schema to target version
- Preserves existing data during migration
- Handles migration failures with rollback

---

## Error Handling

### Storage Errors

```typescript
interface StorageError {
  code: 'QUOTA_EXCEEDED' | 'NOT_FOUND' | 'INVALID_ENTITY' | 'MIGRATION_FAILED' | 'DATABASE_UNAVAILABLE';
  message: string; // User-friendly, supportive message
  details?: any;
}
```

### Error Messages (Supportive Tone)

- QUOTA_EXCEEDED: "Your device storage is getting full. Consider exporting or deleting some older entries to free up space."
- NOT_FOUND: "The item you're looking for couldn't be found. It may have been deleted."
- INVALID_ENTITY: "There was an issue saving your information. Please try again."
- MIGRATION_FAILED: "We're updating your data storage. Please refresh the app and try again."
- DATABASE_UNAVAILABLE: "We're having trouble accessing your data. Please check your browser settings and try again."

---

## Implementation Notes

- All storage operations MUST be in `src/services/storage/indexedDB.ts`
- Low-level IndexedDB operations in `src/db.ts`
- All errors MUST use supportive, empathetic tone (Principle 2)
- All operations MUST work offline (Principle 6)
- Data MUST be encrypted at rest for sensitive fields (medical records)


