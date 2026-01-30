# Data Model: Companion Character System

**Feature**: 003-companion-system  
**Date**: 2026-01-25  
**Status**: Design Phase

## Overview

This document defines the data entities, relationships, and storage schemas for the Companion Character System. All data is stored locally in IndexedDB to maintain privacy and enable offline functionality.

## Storage Architecture

**Database**: IndexedDB (browser local storage)  
**Access Layer**: `src/db.ts` (low-level operations)  
**Service Layer**: `src/services/storage/` (high-level abstractions)

### IndexedDB Stores

1. **characterStates** - Character relationship and state data
2. **conversations** - Conversation message history
3. **characterConfigs** - Character configuration metadata (cached from JSON files)

## Entities

### CharacterState

**Store**: `characterStates`  
**Key Path**: `id` (character identifier, e.g., "baiqi")

```typescript
interface CharacterState {
  id: string;                    // Character identifier (e.g., "baiqi")
  closeness: number;             // 0-100, increases with interaction
  mood: CharacterMood;          // "happy" | "calm" | "concerned" | "energetic" | "tired"
  energy: "low" | "medium" | "high";
  lastInteractionTime: Date;    // ISO string format
  totalInteractions: number;     // Count of all interactions
  relationshipStage: RelationshipStage; // "stranger" | "acquaintance" | "friend" | "close_friend" | "intimate"
  createdAt: Date;              // ISO string format
  updatedAt: Date;              // ISO string format
}

type CharacterMood = "happy" | "calm" | "concerned" | "energetic" | "tired";
type RelationshipStage = "stranger" | "acquaintance" | "friend" | "close_friend" | "intimate";
```

**Validation Rules**:
- `closeness` MUST be between 0 and 100 (inclusive)
- `mood` MUST be one of the defined CharacterMood values
- `energy` MUST be one of: "low", "medium", "high"
- `relationshipStage` MUST be one of the defined RelationshipStage values
- `id` MUST match a character configuration file in `src/config/characters/`

**State Transitions**:
- `closeness` increases with daily interactions (increment based on interaction type and frequency)
- `relationshipStage` updates based on `closeness` thresholds (defined in CharacterConfig)
- `mood` updates based on user interactions, time-of-day, and character energy
- `energy` updates based on time-of-day and interaction frequency

**Indexes**:
- `id` (primary key)
- `lastInteractionTime` (for proactive dialogue triggers)

### ConversationMessage

**Store**: `conversations`  
**Key Path**: `id` (UUID or timestamp-based)

```typescript
interface ConversationMessage {
  id: string;                    // UUID or timestamp-based unique identifier
  characterId: string;          // References CharacterState.id
  timestamp: Date;               // ISO string format
  sender: "character" | "user";
  content: string;               // Message text content
  messageType: MessageType;      // "text" | "image" | "choice_prompt"
  choices?: string[];            // For choice-based dialogue (optional)
  characterImageUrl?: string;    // For embedded character illustrations (optional)
  context?: ConversationContext; // Character state at time of message (optional)
}

type MessageType = "text" | "image" | "choice_prompt";

interface ConversationContext {
  mood: CharacterMood;
  closeness: number;
  timeOfDay: string;             // "morning" | "afternoon" | "evening" | "night"
  relationshipStage: RelationshipStage;
  emotionalState?: "happy" | "concerned" | "comforting" | "energetic" | "calm"; // Character's emotional state at message time (FR-045)
}
```

**Validation Rules**:
- `sender` MUST be either "character" or "user"
- `messageType` MUST be one of: "text", "image", "choice_prompt"
- If `messageType` is "choice_prompt", `choices` MUST be present and non-empty array (2-5 choices)
- `content` MUST be non-empty string
- `characterId` MUST reference an existing CharacterState.id

**Indexes**:
- `id` (primary key)
- `characterId` (for querying conversation history by character)
- `timestamp` (for chronological ordering)
- `characterId + timestamp` (compound index for efficient history queries)

**Retention Policy**:
- Messages stored indefinitely (up to 1 year per NFR-004: 3,650 messages estimated)
- Users can delete conversation history (NFR-009)
- Deletion cascades: deleting character state optionally deletes associated messages

**Memory Continuity Support** (FR-045):
- Conversation history MUST be queryable by characterId for memory continuity
- Recent messages (last 10-20) MUST be included in dialogue generation context
- System MUST reference past topics and demonstrate memory of user's shared information
- Indexes support efficient queries for conversation context retrieval

### CharacterConfig

**Store**: `characterConfigs` (cached from JSON files, not primary storage)  
**Source**: `src/config/characters/baiqi.json`

```typescript
interface CharacterConfig {
  id: string;                    // Character identifier (e.g., "baiqi")
  name: Record<string, string>;  // i18n: { "en": "Bai Qi", "zh": "白起" }
  avatarUrl: string;             // Path to avatar image (e.g., "/images/images.jpg")
  illustrationUrls: {
    default: string;             // Default illustration URL
    happy: string;               // Mood-specific illustrations
    calm: string;
    concerned: string;
    energetic: string;
    tired: string;
  };
  dialogueTemplates: {
    greetings: Record<string, string[]>;     // time-of-day → dialogue options
    responses: Record<string, string[]>;     // emotion → dialogue options
    proactive: Record<string, string[]>;     // trigger → dialogue options
    dataInterpretation: string[];            // Chart data interpretation templates
  };
  stateThresholds: {
    closenessStages: Record<string, number>; // stage → min closeness value
    moodInfluences: Record<string, Record<string, number>>; // mood → dialogue tone modifiers
  };
}
```

**Storage Note**: CharacterConfig is primarily stored as JSON files in `src/config/characters/`. IndexedDB cache is optional for performance (load config once, cache for session).

**Validation Rules**:
- `id` MUST be unique across all character configurations
- `name` MUST have at least one language key (typically "en" and "zh")
- `illustrationUrls` MUST have at least `default` URL
- `dialogueTemplates.greetings` MUST have entries for all time-of-day values
- `stateThresholds.closenessStages` MUST map all RelationshipStage values to numeric thresholds

## Relationships

### CharacterState ↔ CharacterConfig

**Type**: One-to-One  
**Relationship**: CharacterState.id → CharacterConfig.id

- Each CharacterState references exactly one CharacterConfig
- CharacterConfig defines the character's appearance, dialogue templates, and state thresholds
- CharacterState tracks the dynamic relationship state (closeness, mood, etc.)

### ConversationMessage → CharacterState

**Type**: Many-to-One  
**Relationship**: ConversationMessage.characterId → CharacterState.id

- Multiple ConversationMessages belong to one CharacterState
- Conversation history is scoped to a specific character
- Deleting CharacterState optionally cascades to ConversationMessages (user choice per NFR-009)

### ConversationMessage.context → CharacterState

**Type**: Snapshot Reference  
**Relationship**: ConversationMessage.context captures CharacterState at message time

- `context` field stores a snapshot of character state when message was created
- Allows historical analysis of how character state influenced dialogue
- Not a live reference - context is immutable once message is saved

## Data Access Patterns

### Character State Management

**Read Pattern**:
```typescript
// Get current character state
const state = await getCharacterState('baiqi');

// Update closeness after interaction
await updateCloseness('baiqi', 5); // Increment by 5

// Update mood based on time-of-day
await updateCharacterMood('baiqi', 'calm');
```

**Write Pattern**:
```typescript
// Save new character state
await saveCharacterState({
  id: 'baiqi',
  closeness: 30,
  mood: 'happy',
  energy: 'medium',
  // ... other fields
});
```

### Conversation History

**Read Pattern**:
```typescript
// Get recent conversation history
const messages = await getConversationHistory('baiqi', 50); // Last 50 messages

// Get conversation for specific date range
const dateMessages = await getConversationHistoryByDateRange('baiqi', startDate, endDate);
```

**Write Pattern**:
```typescript
// Save new message
await saveMessage({
  id: generateId(),
  characterId: 'baiqi',
  timestamp: new Date(),
  sender: 'character',
  content: 'Hello! How are you today?',
  messageType: 'text',
  context: {
    mood: 'happy',
    closeness: 30,
    timeOfDay: 'morning',
    relationshipStage: 'acquaintance'
  }
});
```

### Character Configuration

**Read Pattern**:
```typescript
// Load character config from JSON file
const config = await loadCharacterConfig('baiqi');

// Access dialogue templates
const greeting = config.dialogueTemplates.greetings['morning'][0];

// Check closeness stage threshold
const minCloseness = config.stateThresholds.closenessStages['friend']; // e.g., 40
```

## Migration & Versioning

**Version Strategy**: 
- Entity interfaces include version field for future schema migrations
- IndexedDB stores support version upgrades via `db.ts` migration logic
- CharacterConfig JSON files are versioned in file system

**Migration Scenarios**:
1. Adding new CharacterMood values → Update type definition, migrate existing records
2. Changing closeness calculation → Update algorithm, recalculate existing states
3. Adding new conversation message types → Update MessageType union, handle legacy messages

## Privacy & Data Ownership

**Local Storage**: All data stored in IndexedDB (browser local storage) - never transmitted to external servers without explicit user consent (NFR-008, NFR-010).

**Data Export**: Users can export all CharacterState and ConversationMessage data as JSON (NFR-009, Principle 8).

**Data Deletion**: 
- Users can delete conversation history (NFR-009)
- Character state can be reset (closeness returns to 0, mood resets to default)
- Deletion is permanent and verifiable (Principle 8)

**Data Retention**: 
- Conversation history: Up to 1 year (3,650 messages estimated per NFR-004)
- Character state: Persisted indefinitely until user deletion
- Character config: Loaded from JSON files, not stored in IndexedDB (or cached only)
