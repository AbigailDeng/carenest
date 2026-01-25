# Quickstart: Companion Character System

**Date**: 2026-01-23  
**Feature**: Companion Character System

## Overview

This guide provides a quick start for integrating the companion character system into CareNest. It covers setup, basic usage, and common integration patterns.

## Prerequisites

- Existing CareNest app with React 18.x, TypeScript 5.x
- IndexedDB setup (`db.ts` and `services/storage/`)
- LLM service integration (`services/llmService.ts`)
- React Router configured

## Setup Steps

### 1. Install Dependencies

No new dependencies required - uses existing CareNest stack:
- React 18.x (already installed)
- TypeScript 5.x (already installed)
- Tailwind CSS (already installed)
- Date-fns (already installed)

### 2. Create Directory Structure

```bash
mkdir -p src/components/companion
mkdir -p src/hooks
mkdir -p src/services/storage
mkdir -p src/config/characters
mkdir -p src/assets/characters/baiqi/illustrations
mkdir -p src/assets/characters/baiqi/backgrounds
```

### 3. Add Character Configuration

Create `src/config/characters/baiqi.json` (see `data-model.md` for full schema):

```json
{
  "id": "baiqi",
  "name": {
    "en": "Bai Qi",
    "zh": "白起"
  },
  "avatarUrl": "/assets/characters/baiqi/avatar.png",
  "illustrationUrls": {
    "default": "/assets/characters/baiqi/illustrations/default.png",
    "happy": "/assets/characters/baiqi/illustrations/happy.png"
  },
  "dialogueTemplates": {
    "greetings": {
      "morning": ["Good morning! How are you feeling today?"]
    }
  }
}
```

### 4. Add Character Assets

Place character images in `src/assets/characters/baiqi/`:
- `avatar.png` (circular avatar, ~64x64px)
- `illustrations/default.png` (full character illustration)
- `backgrounds/morning.png` (background scene)

### 5. Extend IndexedDB Schema

Add stores to `src/db.ts`:

```typescript
// Add to existing DB setup
const characterStateStore = {
  name: 'characterState',
  keyPath: 'id',
  indexes: [{ name: 'id', unique: true }]
};

const conversationsStore = {
  name: 'conversations',
  keyPath: 'id',
  indexes: [
    { name: 'id', unique: true },
    { name: 'characterId' },
    { name: 'timestamp' }
  ]
};
```

### 6. Add i18n Translations

Add to `src/i18n/locales/en.ts` and `zh.ts`:

```typescript
// en.ts
export default {
  companion: {
    title: "Companion",
    greeting: "Good morning! How are you feeling today?",
    // ... more dialogue text
  }
};
```

## Basic Usage

### Display Companion Screen

```typescript
// In src/components/shared/Layout.tsx
import CompanionScreen from '../companion/CompanionScreen';

<Route path="/companion" element={<CompanionScreen />} />
```

### Initialize Character State

```typescript
// In CompanionScreen.tsx
import { useCompanion } from '../../hooks/useCompanion';

function CompanionScreen() {
  const { characterState, initializeCharacter } = useCompanion('baiqi');
  
  useEffect(() => {
    initializeCharacter(); // Creates initial state if doesn't exist
  }, []);
  
  // ... render conversation interface
}
```

### Generate Dialogue

```typescript
// In companionService.ts
import { generateCompanionDialogue } from '../../services/companionService';

const response = await generateCompanionDialogue({
  characterId: 'baiqi',
  userMessage: "I'm feeling stressed",
  characterState: currentState,
  conversationHistory: recentMessages,
  triggerType: 'user_initiated',
  userEmotionalState: 'stressed'
});
```

## Integration Patterns

### Pattern 1: Proactive Greeting on App Open

```typescript
// In CompanionScreen.tsx
import { useProactiveDialogue } from '../../hooks/useProactiveDialogue';

function CompanionScreen() {
  const { shouldInitiate, triggerType } = useProactiveDialogue(characterState);
  
  useEffect(() => {
    if (shouldInitiate) {
      initiateProactiveDialogue(triggerType);
    }
  }, [shouldInitiate]);
}
```

### Pattern 2: Acknowledge User Action

```typescript
// When user returns from functional module
import { acknowledgeUserAction } from '../../services/companionService';

// After user logs symptoms
await acknowledgeUserAction({
  characterId: 'baiqi',
  actionType: 'symptom_logged',
  characterState: currentState
});

// Companion will generate acknowledgment dialogue
```

### Pattern 3: Guide User to Module

```typescript
// In companion dialogue, suggest module access
const dialogue = await generateCompanionDialogue({
  // ... other params
  integrationHint: 'health' // Suggests health module
});

// Dialogue might include: "Would you like to log your symptoms together?"
// User clicks → navigate to /health/symptoms
```

## Common Tasks

### Task 1: Add New Character

1. Create character config: `src/config/characters/newcharacter.json`
2. Add character assets: `src/assets/characters/newcharacter/`
3. Add i18n translations: `src/i18n/locales/*.ts`
4. Initialize character state: `useCompanion('newcharacter').initializeCharacter()`

### Task 2: Customize Dialogue Templates

Edit `src/config/characters/baiqi.json`:
```json
{
  "dialogueTemplates": {
    "greetings": {
      "morning": ["Your custom greeting here"]
    }
  }
}
```

### Task 3: Update Character State

```typescript
import { useCharacterState } from '../../hooks/useCharacterState';

const { updateMood, incrementCloseness } = useCharacterState('baiqi');

// Update mood
await updateMood('happy');

// Increment closeness
await incrementCloseness(1);
```

### Task 4: Export Conversation History

```typescript
import { exportConversationHistory } from '../../services/storage/conversationStorage';

const history = await exportConversationHistory('baiqi');
// Returns JSON array of ConversationMessage objects
```

## Testing

### Unit Test Example

```typescript
// companionService.test.ts
import { generateCompanionDialogue } from './companionService';

test('generates dialogue with character state', async () => {
  const input = {
    characterId: 'baiqi',
    characterState: { mood: 'calm', closeness: 30 },
    conversationHistory: [],
    triggerType: 'morning_greeting'
  };
  
  const output = await generateCompanionDialogue(input);
  
  expect(output.content).toBeTruthy();
  expect(output.metadata.aiGenerated).toBe(true);
});
```

### Integration Test Example

```typescript
// CompanionScreen.test.tsx
import { render, screen } from '@testing-library/react';
import CompanionScreen from './CompanionScreen';

test('displays character greeting', async () => {
  render(<CompanionScreen />);
  
  await waitFor(() => {
    expect(screen.getByText(/good morning/i)).toBeInTheDocument();
  });
});
```

## Troubleshooting

### Issue: Character state not persisting

**Solution**: Verify IndexedDB stores are created in `db.ts`:
```typescript
// Ensure stores are added to DB schema
db.version(1).stores({
  characterState: 'id',
  conversations: 'id, characterId, timestamp'
});
```

### Issue: Dialogue not generating

**Solution**: Check LLM service availability and fallback:
```typescript
// Verify fallback templates exist in character config
// Check network connectivity for LLM service
```

### Issue: Character assets not loading

**Solution**: Verify asset paths in character config match actual file locations:
```typescript
// Check: src/assets/characters/baiqi/avatar.png exists
// Verify: avatarUrl in config matches actual path
```

## Next Steps

1. **Customize Character**: Edit `baiqi.json` to customize dialogue and personality
2. **Add More Characters**: Follow "Add New Character" pattern above
3. **Integrate with Modules**: Use `integrationHint` to guide users to Health/Nutrition/Emotion modules
4. **Enhance Proactive Logic**: Customize proactive initiation timing in `useProactiveDialogue` hook

## References

- **Data Model**: See `data-model.md` for complete entity definitions
- **API Contract**: See `contracts/companion-service.md` for service API details
- **Research**: See `research.md` for technical decisions and rationale
