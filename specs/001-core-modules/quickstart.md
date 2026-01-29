# Quickstart Guide: Wellmate Core Modules

**Purpose**: Provide a quick reference for developers to understand the system architecture and get started with implementation

## Architecture Overview

Wellmate is a **React + TypeScript Progressive Web App (PWA) application** (not a static website) with a **local-first architecture** using IndexedDB for data persistence. The UI is structured around **screens and navigation** (not pages), designed as an **app-style experience** with persistent state and user flows. AI features are provided through external LLM services, with graceful offline degradation.

### Key Architectural Decisions

1. **Application-Style**: App-style experience with persistent state and user flows (not a static website)
2. **Screen-Based Navigation**: UI structured around screens and navigation, not pages
3. **Tailwind CSS**: Hard constraint - Tailwind CSS is the styling solution for MVP
4. **Local-First**: All user data stored locally in IndexedDB (privacy-first)
5. **Offline-Capable**: Core features work without network connectivity
6. **AI Integration**: LLM services isolated in `services/llmService.ts` with explicit user consent
7. **Mobile-First**: PWA design with touch-optimized interfaces, mobile-first behavior where applicable

---

## Technology Stack

### Frontend
- **React 18+** with TypeScript
- **Tailwind CSS** for styling (**hard constraint for MVP**)
- **Vite** for build tooling
- **React Router** for screen-based navigation (not page-based)
- **PWA** capabilities (service worker, manifest)
- **Application-style** UI with persistent state and user flows

### Storage
- **IndexedDB** via `idb` library (or native API)
- **Local Storage** for non-sensitive preferences

### AI/LLM
- **External LLM Service** (OpenAI, Anthropic, or similar)
- Service isolated in `src/services/llmService.ts`
- Requires explicit user consent before data transmission

### Testing
- **Vitest** for unit tests
- **React Testing Library** for component tests
- **Playwright** for E2E tests (optional)

---

## Project Structure

```
src/
├── screens/               # Screen components (app-style navigation)
│   ├── HealthScreen.tsx
│   ├── NutritionScreen.tsx
│   ├── EmotionalScreen.tsx
│   ├── RemindersScreen.tsx
│   └── PrivacyScreen.tsx
├── components/           # React components
│   ├── health/           # Health tracking components
│   ├── nutrition/        # Nutrition companion components
│   ├── emotional/       # Emotional support components
│   ├── reminders/        # Reminders & insights components
│   ├── privacy/          # Privacy & data management components
│   └── shared/          # Shared UI components (Button, Card, etc.)
├── hooks/                # Custom React hooks
│   ├── useMedicalRecords.ts
│   ├── useSymptoms.ts
│   ├── useMood.ts
│   ├── useMealSuggestions.ts
│   └── useStorage.ts
├── services/             # External APIs & LLM calls
│   ├── llmService.ts     # LLM integration
│   ├── apiClient.ts      # Base HTTP client
│   └── storage/          # IndexedDB persistence
│       ├── indexedDB.ts
│       └── types.ts
├── navigation/           # Navigation configuration (screen-based)
│   └── routes.tsx
├── types.ts              # Shared TypeScript types
├── db.ts                 # Low-level IndexedDB operations
├── App.tsx               # Main app component (screen router)
└── main.tsx              # Entry point
```

---

## Getting Started

### 1. Initialize Project

```bash
npm create vite@latest wellmate -- --template react-ts
cd wellmate
npm install
```

### 2. Install Core Dependencies

```bash
# Tailwind CSS (hard constraint for MVP)
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# IndexedDB wrapper
npm install idb

# PWA support
npm install vite-plugin-pwa -D

# Navigation (screen-based, not page-based)
npm install react-router-dom

# UI utilities
npm install date-fns                # For date handling
npm install @headlessui/react       # Accessible components (optional, works with Tailwind)
```

### 2a. Configure Tailwind CSS

Update `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Match constitution spacing scale (8px base)
      spacing: {
        'screen-edge': '20px', // or '24px' for comfortable spacing
      },
    },
  },
  plugins: [],
}
```

Add Tailwind directives to `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 3. Set Up IndexedDB

Create `src/db.ts` with database initialization:

```typescript
import { openDB, DBSchema } from 'idb';

interface WellmateDB extends DBSchema {
  medicalRecords: { key: string; value: MedicalRecord };
  symptomEntries: { key: string; value: SymptomEntry };
  moodEntries: { key: string; value: MoodEntry };
  // ... other stores
}

export const openWellmateDB = () => {
  return openDB<WellmateDB>('wellmate_db', 1, {
    upgrade(db) {
      // Create object stores
      if (!db.objectStoreNames.contains('medicalRecords')) {
        db.createObjectStore('medicalRecords', { keyPath: 'id' });
      }
      // ... other stores
    },
  });
};
```

### 4. Create Storage Service

Create `src/services/storage/indexedDB.ts`:

```typescript
import { openWellmateDB } from '../../db';

export const saveEntity = async <T>(
  storeName: string,
  entity: T
): Promise<T> => {
  const db = await openWellmateDB();
  const tx = db.transaction(storeName, 'readwrite');
  await tx.store.put(entity);
  return entity;
};
```

### 5. Configure LLM Service

Create `.env` file in project root (copy from `.env.example`):

```bash
VITE_LLM_BASE_URL=https://hyperecho-proxy.aelf.dev/v1
VITE_LLM_API_KEY=your-api-key-here
VITE_LLM_MODEL=vibe-coding-app-gemini
```

**Important**: 
- Add `.env` to `.gitignore` to prevent committing API keys (already configured)
- Never commit your `.env` file with real API keys
- Use `.env.example` as a template for other developers

Create `src/services/llmService.ts`:

```typescript
const LLM_BASE_URL = import.meta.env.VITE_LLM_BASE_URL || 'https://hyperecho-proxy.aelf.dev/v1';
const LLM_API_KEY = import.meta.env.VITE_LLM_API_KEY;
const LLM_MODEL = import.meta.env.VITE_LLM_MODEL || 'vibe-coding-app-gemini';

export const summarizeMedicalRecord = async (
  record: MedicalRecordInput
): Promise<MedicalRecordSummary> => {
  // Check user consent first
  if (!hasUserConsent()) {
    throw new Error('User consent required for AI processing');
  }
  
  // Call Gemini API via HyperEcho Proxy (OpenAI-compatible format)
  const response = await fetch(`${LLM_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LLM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [
        {
          role: 'system',
          content: '...', // Safety guardrails preventing medical advice
        },
        {
          role: 'user',
          content: `Summarize this medical record in plain language: ${record.content}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });
  
  if (!response.ok) {
    throw new Error('AI processing failed. Please try again.');
  }
  
  const data = await response.json();
  return parseMedicalRecordSummary(data);
};
```

---

## Key Implementation Patterns

### 1. Screen-Based Navigation (App-Style)

```typescript
// src/navigation/routes.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HealthScreen } from '../screens/HealthScreen';
import { NutritionScreen } from '../screens/NutritionScreen';
// ... other screens

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/health" element={<HealthScreen />} />
        <Route path="/nutrition" element={<NutritionScreen />} />
        {/* ... other screen routes */}
      </Routes>
    </BrowserRouter>
  );
};
```

### 2. Tailwind CSS Styling (Hard Constraint)

```typescript
// Example component using Tailwind CSS
export const MoodCheckIn = () => {
  return (
    <div className="px-5 py-6 bg-white min-h-screen">
      <h1 className="text-2xl font-semibold mb-6">How are you feeling?</h1>
      <button className="w-full h-14 bg-blue-500 text-white rounded-lg">
        I'm doing well
      </button>
    </div>
  );
};
```

**Key Tailwind Patterns**:
- Use `px-5` or `px-6` for screen edge padding (20-24px)
- Use spacing scale: `space-y-2` (8px), `space-y-4` (16px), `space-y-6` (24px)
- Touch targets: `h-11` or `h-14` (44-56px minimum)
- Mobile-first: Base styles for mobile, `md:`, `lg:` for larger screens

### 3. Offline-First Data Flow

```typescript
// Always save locally first
await saveEntity('symptomEntries', symptomEntry);

// Then queue for AI processing if online
if (navigator.onLine && hasUserConsent()) {
  queueForAIProcessing(symptomEntry);
}
```

### 4. AI Processing Queue

```typescript
// Queue AI requests when offline
const queue: AIRequest[] = [];

export const queueAIRequest = (request: AIRequest) => {
  queue.push(request);
  if (navigator.onLine) {
    processQueue();
  }
};

// Process queue when online
window.addEventListener('online', () => {
  processQueue();
});
```

### 5. Supportive Error Handling

```typescript
try {
  await saveEntity('moodEntries', moodEntry);
} catch (error) {
  // Use supportive, empathetic error messages
  showError('We had trouble saving your mood entry. Please try again - your feelings matter.');
}
```

### 6. Constitution Compliance Checks

```typescript
// Always include disclaimers
const renderHealthSummary = (summary: MedicalRecordSummary) => {
  return (
    <div>
      <div className="ai-indicator">AI-generated summary</div>
      <p>{summary.plainLanguageSummary}</p>
      <Disclaimer text={summary.disclaimer} />
    </div>
  );
};
```

---

## Testing Strategy

### Unit Tests
- Test storage operations in isolation
- Test data validation and sanitization
- Test error handling with supportive messages

### Component Tests
- Test user interactions (mood check-in, symptom logging)
- Test offline behavior
- Test AI indicator visibility

### Integration Tests
- Test full user flows (upload → summarize → view)
- Test data export/import
- Test offline queue processing

---

## Performance Considerations

### Success Criteria Targets
- Mood check-in: <15 seconds (SC-002)
- Symptom logging: <30 seconds (SC-003)
- Meal suggestions: <10 seconds (SC-004)
- Data export: <5 seconds (SC-005)
- Timeline view (30 days): <2 seconds (SC-010)

### Optimization Strategies
- Lazy load AI features (code splitting)
- Index IndexedDB queries for fast timeline views
- Cache AI responses locally when appropriate
- Debounce rapid user inputs

---

## Security & Privacy

### Data Encryption
- Encrypt sensitive fields (medical records) at rest
- Use Web Crypto API for local encryption
- Never store encryption keys in localStorage

### User Consent
- Always request explicit consent before AI processing
- Clear explanation of what data is shared
- Easy opt-out at any time

### Input Sanitization
- Sanitize all user inputs before storage
- Validate file uploads (size, type, content)
- Prevent XSS in user-generated content

---

## Next Steps

1. **Set up development environment** (Vite, TypeScript, Tailwind CSS, ESLint)
2. **Configure Tailwind CSS** (tailwind.config.js, index.css)
3. **Configure LLM API** (create `.env` file with Gemini API credentials)
4. **Set up screen-based navigation** (React Router, screen components)
5. **Implement database schema** (`src/db.ts`)
6. **Create storage service** (`src/services/storage/`)
7. **Implement LLM service** (`src/services/llmService.ts` with Gemini API integration)
8. **Build first user story** (P1: Mood check-in or symptom logging)
9. **Add AI integration** (with consent flow)
10. **Implement offline support** (service worker, queue)
11. **Add PWA capabilities** (manifest, install prompt)

---

## Resources

- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [PWA Guide](https://web.dev/progressive-web-apps/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/?currentsidebar=%23col_customize&levels=aaa)

---

## Support

For questions or issues, refer to:
- Constitution: `.specify/memory/constitution.md`
- Feature Spec: `specs/001-core-modules/spec.md`
- Data Model: `specs/001-core-modules/data-model.md`

