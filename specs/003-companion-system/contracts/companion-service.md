# API Contract: Companion Service

**Date**: 2026-01-23  
**Feature**: Companion Character System  
**Service**: `src/services/companionService.ts`

## Overview

The Companion Service provides dialogue generation for the companion character system, integrating with the existing LLM service (Gemini API via HyperEcho Proxy) to generate context-aware, empathetic responses.

## Dialogue Generation API

### `generateCompanionDialogue(input: CompanionDialogueInput): Promise<CompanionDialogueOutput>`

Generates a dialogue response from the companion character based on user input, character state, and conversation history.

**Input**:
```typescript
interface CompanionDialogueInput {
  characterId: string; // Character identifier (e.g., "baiqi")
  userMessage?: string; // User's message (optional for proactive dialogue)
  characterState: CharacterState; // Current character state
  conversationHistory: ConversationMessage[]; // Last 5-10 messages for context
  triggerType?: "user_initiated" | "morning_greeting" | "evening_greeting" | "inactivity" | "activity_acknowledgment";
  userEmotionalState?: "sad" | "stressed" | "lonely" | "happy" | "neutral"; // If user expressed emotion
  integrationHint?: "health" | "nutrition" | "emotion" | null; // Gentle guidance toward module
}
```

**Output**:
```typescript
interface CompanionDialogueOutput {
  content: string; // Generated dialogue text
  messageType: "text" | "image" | "choice_prompt";
  choices?: string[]; // For choice-based dialogue (2-5 options)
  characterImageUrl?: string; // URL to character illustration (if applicable)
  suggestedMood?: CharacterMood; // Suggested mood update based on dialogue
  metadata: {
    aiGenerated: boolean; // True if LLM-generated, false if template fallback
    templateId?: string; // Template ID if fallback used
    processingTime: number; // Milliseconds
  };
}
```

**Behavior**:
1. If AI service unavailable → fallback to predefined templates (see Fallback Logic)
2. If AI service available → generate context-aware dialogue via LLM
3. Response time target: <2 seconds (NFR-001)
4. Dialogue tone reflects character state (mood, closeness, energy, time-of-day)

**Error Handling**:
- AI service timeout → fallback to templates
- AI service error → fallback to templates
- Invalid input → throw validation error

---

## Fallback Template Selection

### `selectDialogueTemplate(input: CompanionDialogueInput): string`

Selects a predefined dialogue template when AI service is unavailable.

**Input**: Same as `generateCompanionDialogue` input

**Output**: Dialogue text string from character configuration templates

**Selection Logic**:
1. Determine template category:
   - `triggerType` = "morning_greeting" or "evening_greeting" → `greetings` category
   - `triggerType` = "activity_acknowledgment" or "inactivity" → `proactive` category
   - `userEmotionalState` present → `responses` category
   - Default → `greetings` category
2. Filter templates by character state:
   - Apply mood filter (if templates have mood-specific variants)
   - Apply closeness filter (if templates have closeness-specific variants)
3. Randomly select from filtered templates
4. Apply i18n translation if needed

**Example**:
```typescript
// Input: triggerType = "morning_greeting", characterState.mood = "calm", closeness = 30
// Template category: "greetings"
// Filter: time-of-day = "morning"
// Selected: "Good morning! How are you feeling today?"
```

---

## LLM Prompt Construction

### Prompt Structure

The service constructs prompts for the LLM that include:

1. **Character Personality**:
   - Traits: empathetic, supportive, gentle, patient
   - Communication style: warm, non-judgmental
   - Role: emotional companion, not medical advisor

2. **Character State**:
   - Current mood: [mood]
   - Closeness level: [closeness]/100
   - Energy level: [energy]
   - Relationship stage: [relationshipStage]
   - Time of day: [timeOfDay]

3. **Conversation Context**:
   - Recent messages (last 5-10)
   - User's emotional state (if expressed)
   - Integration hint (if applicable)

4. **Dialogue Guidelines**:
   - Maintain supportive, empathetic tone
   - Reflect character state in response
   - Avoid medical advice or diagnoses
   - Frame activities as "doing together" when suggesting modules
   - Keep responses concise (1-3 sentences)

**Example Prompt**:
```
You are Bai Qi, a supportive companion character in a health and wellness app. Your role is to provide emotional support and gentle guidance, not medical advice.

Character State:
- Mood: calm
- Closeness: 30/100 (acquaintance stage)
- Energy: medium
- Time of day: morning

Recent Conversation:
User: "I'm feeling stressed about work"
Character: "I understand. Stress can be really hard. Would you like to talk about what's on your mind?"

User's Current Message: "I just feel overwhelmed"

Guidelines:
- Respond with empathy and support
- Reflect your calm mood and medium energy
- Keep response concise (1-2 sentences)
- Avoid medical advice
- Use warm, gentle tone appropriate for acquaintance stage

Generate a supportive response:
```

---

## Integration with Existing LLM Service

The Companion Service uses the existing `llmService.ts` infrastructure:

```typescript
// In companionService.ts
import { generateText } from '../services/llmService';

async function generateCompanionDialogue(input: CompanionDialogueInput): Promise<CompanionDialogueOutput> {
  const prompt = constructDialoguePrompt(input);
  
  try {
    const response = await generateText({
      model: 'vibe-coding-app-gemini',
      prompt: prompt,
      maxTokens: 150, // Keep responses concise
      temperature: 0.8, // Slightly creative for natural dialogue
    });
    
    return {
      content: response.text,
      messageType: 'text',
      metadata: {
        aiGenerated: true,
        processingTime: response.processingTime,
      },
    };
  } catch (error) {
    // Fallback to templates
    return selectDialogueTemplate(input);
  }
}
```

---

## State Update Suggestions

The service may suggest character state updates based on dialogue:

```typescript
interface StateUpdateSuggestion {
  mood?: CharacterMood; // Suggested mood change
  closenessIncrement?: number; // Suggested closeness increase (typically 0-1)
  energy?: "low" | "medium" | "high"; // Suggested energy change
}
```

**Update Rules**:
- `closeness`: Increment by 1 per daily interaction (capped at 100)
- `mood`: Update based on user emotional expressions:
  - User sadness → character mood becomes "concerned"
  - User stress → character mood becomes "concerned"
  - Positive interaction → character mood becomes "happy"
- `energy`: Update based on time-of-day (handled separately, not by dialogue service)

---

## Testing Requirements

### Unit Tests

- `generateCompanionDialogue`: Test with various inputs, verify response structure
- `selectDialogueTemplate`: Test template selection logic, verify fallback behavior
- Prompt construction: Verify prompt includes all required context

### Integration Tests

- LLM service integration: Test actual API calls (mock in tests)
- Fallback behavior: Test fallback when LLM unavailable
- Response time: Verify <2s response time (NFR-001)

### Edge Cases

- Empty conversation history
- Very long user messages
- Invalid character state
- Missing character configuration

---

## Performance Considerations

- **Caching**: Cache character configuration to avoid repeated file reads
- **Prompt Optimization**: Keep prompts concise to reduce token usage and latency
- **Batch Processing**: Not applicable (single dialogue generation per request)
- **Rate Limiting**: Respect LLM service rate limits (handled by existing `llmService.ts`)

---

## Privacy & Security

- **Data Transmission**: Only dialogue context sent to LLM (no sensitive health data)
- **Local Fallback**: Templates stored locally, no external dependency for fallback
- **User Consent**: Implicit consent for dialogue generation (part of companion feature)
- **Data Retention**: LLM service may log prompts/responses (check HyperEcho Proxy policy)
