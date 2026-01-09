# Data Model: Wellmate Core Modules

**Created**: 2025-01-27  
**Purpose**: Define data structures, relationships, and validation rules for Wellmate

## Database Schema: IndexedDB

### Store: `medicalRecords`

**Purpose**: Store uploaded medical documents and AI-generated summaries

**Schema**:
```typescript
interface MedicalRecord {
  id: string;                    // UUID v4
  filename: string;               // Original filename
  fileType: 'text' | 'image' | 'pdf';
  uploadDate: Date;              // ISO 8601 timestamp
  fileContent: ArrayBuffer;      // Encrypted file content
  fileSize: number;              // Bytes
  aiSummary: string | null;       // Plain-language summary (nullable until processed)
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage: string | null;    // Error details if processing failed
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
- Primary: `id`
- Index: `uploadDate` (for chronological sorting)
- Index: `processingStatus` (for queue management)

**Validation Rules**:
- `fileSize` must be ≤ 10MB
- `fileType` must be one of: 'text', 'image', 'pdf'
- `filename` must not be empty
- `uploadDate` cannot be in the future

**State Transitions**:
- `pending` → `processing` (when AI processing starts)
- `processing` → `completed` (on successful summary generation)
- `processing` → `failed` (on error)
- `failed` → `pending` (on retry)

---

### Store: `healthConditions`

**Purpose**: Store user's documented health conditions and lifestyle suggestions

**Schema**:
```typescript
interface HealthCondition {
  id: string;                     // UUID v4
  conditionName: string;          // Plain language name (user-entered or extracted)
  documentedDate: Date;          // When condition was documented
  sourceRecordId: string | null; // Reference to MedicalRecord (nullable for manual entry)
  lifestyleSuggestions: {
    avoid: string[];              // Things to avoid
    prefer: string[];             // Things to prefer
    general: string[];           // General advice
  };
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
- Primary: `id`
- Index: `documentedDate` (for chronological sorting)
- Index: `sourceRecordId` (for linking to medical records)

**Validation Rules**:
- `conditionName` must not be empty (min 2 characters, max 200)
- `documentedDate` cannot be in the future
- `lifestyleSuggestions` arrays must contain non-empty strings

**Relationships**:
- Many-to-one with `medicalRecords` (via `sourceRecordId`)

---

### Store: `symptomEntries`

**Purpose**: Store daily symptom logs with notes and timestamps

**Schema**:
```typescript
interface SymptomEntry {
  id: string;                     // UUID v4
  symptoms: string;               // Free-text symptom description
  notes: string | null;           // Optional additional notes
  severity: 'mild' | 'moderate' | 'severe' | null; // Optional severity indicator
  loggedDate: Date;              // Date of symptom occurrence
  loggedTime: Date;              // Time of symptom occurrence (ISO 8601)
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
- Primary: `id`
- Index: `loggedDate` (for timeline queries)
- Index: `loggedTime` (for chronological sorting)

**Validation Rules**:
- `symptoms` must not be empty (min 3 characters, max 1000)
- `loggedDate` cannot be in the future
- `loggedTime` cannot be in the future
- `notes` max length: 2000 characters

**Relationships**:
- None (standalone entries)

---

### Store: `moodEntries`

**Purpose**: Store daily mood check-ins

**Schema**:
```typescript
interface MoodEntry {
  id: string;                      // UUID v4
  moodValue: MoodValue;           // Selected mood option
  notes: string | null;           // Optional notes
  loggedDate: Date;               // Date of check-in
  loggedTime: Date;               // Time of check-in (ISO 8601)
  createdAt: Date;
  updatedAt: Date;
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
```

**Indexes**:
- Primary: `id`
- Index: `loggedDate` (for timeline queries)
- Index: `moodValue` (for pattern analysis)
- Compound Index: `[loggedDate, moodValue]` (for insights)

**Validation Rules**:
- `moodValue` must be one of predefined options
- `loggedDate` cannot be in the future
- `loggedTime` cannot be in the future
- `notes` max length: 500 characters

**Relationships**:
- None (standalone entries)

---

### Store: `journalEntries`

**Purpose**: Store emotional journal entries and AI responses

**Schema**:
```typescript
interface JournalEntry {
  id: string;                      // UUID v4
  content: string;                // User's journal entry text
  aiResponse: string | null;      // AI-generated empathetic response (nullable until processed)
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  entryDate: Date;                // Date of entry
  entryTime: Date;                 // Time of entry (ISO 8601)
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
- Primary: `id`
- Index: `entryDate` (for timeline queries)
- Index: `processingStatus` (for queue management)

**Validation Rules**:
- `content` must not be empty (min 10 characters, max 5000)
- `entryDate` cannot be in the future
- `entryTime` cannot be in the future

**Relationships**:
- None (standalone entries)

---

### Store: `ingredientLists`

**Purpose**: Store user's available ingredients for meal suggestions

**Schema**:
```typescript
interface IngredientList {
  id: string;                     // UUID v4
  ingredients: string[];          // Array of ingredient names
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
- Primary: `id`
- Index: `createdAt` (for recent lists)

**Validation Rules**:
- `ingredients` array must contain at least 1 item
- Each ingredient must be non-empty string (min 2 characters, max 50)
- Max 50 ingredients per list

**Relationships**:
- One-to-many with `mealSuggestions` (via `sourceIngredientListId`)

---

### Store: `mealSuggestions`

**Purpose**: Store AI-generated meal suggestions

**Schema**:
```typescript
interface MealSuggestion {
  id: string;                      // UUID v4
  mealName: string;               // Name of the meal
  description: string;            // Meal description
  ingredients: string[];          // Required ingredients
  preparationNotes: string | null; // Optional preparation guidance
  adaptedForConditions: boolean;   // Whether adapted for health conditions
  adaptedForEnergyLevel: boolean; // Whether adapted for energy level
  sourceIngredientListId: string;  // Reference to IngredientList
  aiGenerated: boolean;           // Always true for AI suggestions
  isFavorite: boolean;            // User favorited this suggestion
  createdAt: Date;
}
```

**Indexes**:
- Primary: `id`
- Index: `sourceIngredientListId` (for linking to ingredient lists)
- Index: `isFavorite` (for favorite filtering)
- Index: `createdAt` (for recent suggestions)

**Validation Rules**:
- `mealName` must not be empty (min 3 characters, max 100)
- `description` must not be empty (min 10 characters, max 500)
- `ingredients` array must contain at least 1 item

**Relationships**:
- Many-to-one with `ingredientLists` (via `sourceIngredientListId`)

---

### Store: `reminderSettings`

**Purpose**: Store user's reminder preferences

**Schema**:
```typescript
interface ReminderSettings {
  id: string;                      // UUID v4
  reminderType: ReminderType;
  enabled: boolean;
  time: string;                    // HH:mm format (24-hour)
  frequency: 'daily' | 'weekdays' | 'custom';
  customDays?: number[];          // 0-6 (Sunday-Saturday) for custom frequency
  createdAt: Date;
  updatedAt: Date;
}

type ReminderType = 'hydration' | 'meals' | 'sleep' | 'mood';
```

**Indexes**:
- Primary: `id`
- Index: `reminderType` (for filtering by type)
- Index: `enabled` (for active reminders)

**Validation Rules**:
- `time` must be valid HH:mm format
- `reminderType` must be one of predefined types
- `frequency` must be one of predefined options
- `customDays` must be array of 0-6 if frequency is 'custom'

**Relationships**:
- None (user preferences)

---

### Store: `insights`

**Purpose**: Store AI-generated insights linking mood, sleep, and nutrition patterns

**Schema**:
```typescript
interface Insight {
  id: string;                      // UUID v4
  insightType: 'mood-sleep-nutrition' | 'mood-pattern' | 'nutrition-pattern';
  description: string;            // Insight text
  dataPoints: {
    moodEntries?: string[];        // References to MoodEntry IDs
    symptomEntries?: string[];     // References to SymptomEntry IDs
    mealSuggestions?: string[];    // References to MealSuggestion IDs
  };
  generatedDate: Date;
  aiGenerated: boolean;            // Always true
  createdAt: Date;
}
```

**Indexes**:
- Primary: `id`
- Index: `insightType` (for filtering by type)
- Index: `generatedDate` (for recent insights)

**Validation Rules**:
- `description` must not be empty (min 20 characters, max 1000)
- `insightType` must be one of predefined types
- `dataPoints` must reference at least one entry type

**Relationships**:
- References to `moodEntries`, `symptomEntries`, `mealSuggestions` (via IDs in `dataPoints`)

---

### Store: `userPreferences`

**Purpose**: Store user settings and preferences

**Schema**:
```typescript
interface UserPreferences {
  id: string;                      // UUID v4 (singleton, always same ID)
  healthConditions: string[];     // References to HealthCondition IDs
  energyLevelPreference: 'low' | 'medium' | 'high' | null;
  reminderPreferences: string[];  // References to ReminderSettings IDs
  dataSharingConsent: boolean;    // Explicit consent for data transmission
  dataSharingConsentDate: Date | null; // When consent was given
  theme: 'light' | 'dark' | 'system';
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
- Primary: `id` (singleton)

**Validation Rules**:
- Singleton pattern: only one UserPreferences record exists
- `dataSharingConsent` must be explicitly set (cannot be null)
- `theme` must be one of predefined options

**Relationships**:
- References to `healthConditions` (via IDs in array)
- References to `reminderSettings` (via IDs in array)

---

## Data Versioning & Migration

### Version Schema

**Store**: `dbVersion`

**Schema**:
```typescript
interface DBVersion {
  version: number;                // Current database version
  lastMigration: Date;            // Last migration timestamp
}
```

**Migration Strategy**:
- Start with version 1
- Increment version for schema changes
- Implement migration functions in `db.ts`
- Preserve user data during migrations
- Test migrations thoroughly before deployment

---

## Validation Functions

### Medical Record Validation

```typescript
function validateMedicalRecord(record: Partial<MedicalRecord>): ValidationResult {
  // File size check
  if (record.fileSize && record.fileSize > 10 * 1024 * 1024) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }
  
  // File type check
  if (record.fileType && !['text', 'image', 'pdf'].includes(record.fileType)) {
    return { valid: false, error: 'Unsupported file type' };
  }
  
  // Filename check
  if (record.filename && record.filename.trim().length === 0) {
    return { valid: false, error: 'Filename cannot be empty' };
  }
  
  return { valid: true };
}
```

### Symptom Entry Validation

```typescript
function validateSymptomEntry(entry: Partial<SymptomEntry>): ValidationResult {
  // Symptoms text check
  if (entry.symptoms) {
    if (entry.symptoms.trim().length < 3) {
      return { valid: false, error: 'Symptom description must be at least 3 characters' };
    }
    if (entry.symptoms.length > 1000) {
      return { valid: false, error: 'Symptom description exceeds 1000 characters' };
    }
  }
  
  // Date validation
  if (entry.loggedDate && entry.loggedDate > new Date()) {
    return { valid: false, error: 'Symptom date cannot be in the future' };
  }
  
  return { valid: true };
}
```

### Mood Entry Validation

```typescript
function validateMoodEntry(entry: Partial<MoodEntry>): ValidationResult {
  const validMoods = ['very-happy', 'happy', 'neutral', 'sad', 'very-sad', 
                      'anxious', 'stressed', 'calm', 'energetic', 'tired'];
  
  if (entry.moodValue && !validMoods.includes(entry.moodValue)) {
    return { valid: false, error: 'Invalid mood value' };
  }
  
  if (entry.loggedDate && entry.loggedDate > new Date()) {
    return { valid: false, error: 'Mood date cannot be in the future' };
  }
  
  return { valid: true };
}
```

---

## Data Relationships Summary

```
UserPreferences (1)
  ├── healthConditions (many) → HealthCondition (many)
  │                              └── sourceRecordId → MedicalRecord (many)
  └── reminderPreferences (many) → ReminderSettings (many)

IngredientList (many)
  └── sourceIngredientListId → MealSuggestion (many)

MoodEntry (many) ──┐
SymptomEntry (many)├──→ Insight.dataPoints (many)
MealSuggestion (many) ┘

JournalEntry (many) [standalone]
```

---

## Privacy & Security Considerations

### Encryption

- Medical record file content stored as `ArrayBuffer` (can be encrypted before storage)
- Sensitive text fields (journal entries, symptom notes) stored as-is in IndexedDB (browser-level security)
- Consider client-side encryption for file content if additional security needed

### Data Deletion

- Cascade deletion: Deleting `MedicalRecord` should offer to delete linked `HealthCondition`
- User-initiated deletion: All stores support individual record deletion
- Full data wipe: Delete all stores when user requests complete data deletion

### Export Format

- JSON export: All entities serialized to JSON with ISO 8601 date formatting
- CSV export: Flattened structure for spreadsheet compatibility
- Include metadata: Export includes schema version and export timestamp

---

## Performance Considerations

### Indexing Strategy

- Index frequently queried fields (`loggedDate`, `moodValue`, `processingStatus`)
- Compound indexes for common query patterns
- Limit index count to avoid performance degradation

### Query Optimization

- Use indexes for date range queries (timeline views)
- Limit result sets (pagination for large datasets)
- Cache frequently accessed data in React state

### Storage Limits

- Monitor IndexedDB usage (browsers have quotas)
- Implement cleanup for old data if needed
- Compress large file content before storage

---

## Next Steps

1. Implement database initialization in `src/db.ts`
2. Create migration functions for schema versioning
3. Implement validation functions
4. Create TypeScript interfaces matching schemas
5. Build custom hooks for each store (`useMedicalRecords`, `useSymptomEntries`, etc.)

