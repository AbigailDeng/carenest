# LLM Service Contract

**Purpose**: Define the interface for AI/LLM service calls used throughout Wellmate

## API Configuration

**Provider**: Gemini API via HyperEcho Proxy  
**Model**: `vibe-coding-app-gemini`  
**Base URL**: `https://hyperecho-proxy.aelf.dev/v1`  
**API Format**: OpenAI-compatible API (uses `/v1/chat/completions` endpoint)

**Environment Variables**:
- `VITE_LLM_BASE_URL`: `https://hyperecho-proxy.aelf.dev/v1`
- `VITE_LLM_API_KEY`: Set in `.env` file (never commit to git, see `.env.example` for template)
- `VITE_LLM_MODEL`: `vibe-coding-app-gemini`

**API Request Format**:
```typescript
POST {baseUrl}/chat/completions
Headers: {
  "Authorization": "Bearer {apiKey}",
  "Content-Type": "application/json"
}
Body: {
  "model": "vibe-coding-app-gemini",
  "messages": [...],
  "temperature": 0.7,
  "max_tokens": 2000
}
```

## Service Interface

### Medical Record Summarization

**Endpoint**: `summarizeMedicalRecord(record: MedicalRecordInput): Promise<MedicalRecordSummary>`

**Input**:
```typescript
interface MedicalRecordInput {
  content: string; // Extracted text from uploaded file
  fileType: 'text' | 'image' | 'pdf';
  metadata?: {
    filename?: string;
    uploadDate?: string;
  };
}
```

**Output**:
```typescript
interface MedicalRecordSummary {
  plainLanguageSummary: string;
  keyPoints: string[];
  lifestyleSuggestions: {
    avoid: string[];
    prefer: string[];
    general: string[];
  };
  disclaimer: string; // Required disclaimer text
  processingTimestamp: string;
}
```

**Error Handling**:
- Network failures → Return error with retry capability
- Processing timeout → Return error with queue option
- Invalid content → Return error with helpful message

**Safety Requirements**:
- All prompts MUST include safety guardrails preventing medical advice
- All outputs MUST include disclaimers
- Must avoid diagnostic language

---

### Meal Suggestion Generation

**Endpoint**: `generateMealSuggestions(input: MealSuggestionInput): Promise<MealSuggestion[]>`

**Input**:
```typescript
interface MealSuggestionInput {
  ingredients: string[];
  healthConditions?: string[]; // Optional adaptation
  energyLevel?: 'low' | 'medium' | 'high'; // Optional adaptation
  dietaryPreferences?: string[];
}
```

**Output**:
```typescript
interface MealSuggestion {
  mealName: string;
  description: string;
  ingredients: string[];
  preparationNotes?: string;
  adaptedForConditions: boolean;
  adaptedForEnergyLevel: boolean;
  disclaimer: string; // Required disclaimer
}
```

**Error Handling**:
- Empty ingredients → Return helpful guidance message
- Processing failure → Return error with retry option

**Safety Requirements**:
- Must include dietary guidance disclaimers
- Must avoid medical dietary prescriptions

---

### Emotional Support Response

**Endpoint**: `generateEmotionalResponse(input: EmotionalInput): Promise<EmotionalResponse>`

**Input**:
```typescript
interface EmotionalInput {
  journalEntry: string;
  moodContext?: string; // Recent mood entries
  conversationHistory?: Array<{role: 'user' | 'assistant', content: string}>;
}
```

**Output**:
```typescript
interface EmotionalResponse {
  response: string; // Empathetic, supportive response
  tone: 'supportive' | 'encouraging' | 'acknowledging';
  disclaimer: string; // Required: not therapy disclaimer
  suggestedResources?: string[]; // If crisis indicators detected
}
```

**Error Handling**:
- Sensitive content → Return appropriate resources + supportive response
- Processing failure → Return acknowledgment, queue for retry

**Safety Requirements**:
- Must maintain companion-like, non-clinical tone
- Must include disclaimers that this is not therapy
- Must detect crisis indicators and provide resources

---

### Pattern Insight Generation

**Endpoint**: `generateInsights(input: InsightInput): Promise<Insight[]>`

**Input**:
```typescript
interface InsightInput {
  moodEntries: MoodEntry[];
  symptomEntries?: SymptomEntry[];
  nutritionLogs?: any[]; // If nutrition logging added
  dateRange: {
    start: string;
    end: string;
  };
}
```

**Output**:
```typescript
interface Insight {
  insightType: 'mood-pattern' | 'mood-symptom-link' | 'mood-nutrition-link';
  description: string;
  supportingData: {
    dataPoints: number;
    dateRange: string;
  };
  tone: 'supportive' | 'encouraging' | 'observational';
  disclaimer: string; // AI-generated insight disclaimer
}
```

**Error Handling**:
- Insufficient data → Return guidance message
- Processing failure → Return error with retry option

**Safety Requirements**:
- Must be supportive, not diagnostic
- Must clearly indicate AI generation
- Must avoid predictive claims

---

## Common Patterns

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string; // User-friendly, supportive message
    retryable: boolean;
    suggestedAction?: string;
  };
}
```

### Processing Status

```typescript
interface ProcessingStatus {
  status: 'queued' | 'processing' | 'completed' | 'failed';
  estimatedTimeRemaining?: number; // seconds
  progress?: number; // 0-100
}
```

---

## Implementation Notes

- All LLM calls MUST be isolated in `src/services/llmService.ts`
- All prompts MUST include safety guardrails
- All responses MUST include appropriate disclaimers
- Network failures MUST be handled gracefully with offline queueing
- User consent MUST be obtained before transmitting sensitive data

