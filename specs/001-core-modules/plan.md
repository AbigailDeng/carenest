# Implementation Plan: Wellmate Core Modules

**Branch**: `001-core-modules` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-core-modules/spec.md`

## Summary

Build a mobile-first Progressive Web App (PWA) **application** (not a static website) for personal health companion functionality including health tracking, nutrition guidance, and emotional support. The application uses React + TypeScript with Tailwind CSS for styling, IndexedDB for local-first data storage, integrates with AI/LLM services for summaries and suggestions, and maintains strict privacy-first architecture with offline support for core features. 

**UI Navigation Structure:**
- **Bottom Tab Navigation**: Three main tabs (Health Tracking, Nutrition Assistant, Emotional Support) for primary feature access
- **Settings Drawer**: Privacy & Data management accessible via gear icon in top-right corner
- **Screen-based navigation**: App-style experience with persistent state and user flows (not page-based)
- All styling uses Tailwind CSS (hard constraint)

## Technical Context

**Language/Version**: TypeScript 5.x, React 18.x  
**Primary Dependencies**: 
- React 18.x (UI framework)
- TypeScript 5.x (type safety)
- **Tailwind CSS** (styling solution - **hard constraint for MVP**)
- Vite (build tooling)
- IndexedDB (via idb or Dexie.js for local storage)
- LLM Service Provider: Gemini API via HyperEcho Proxy
  - Model: vibe-coding-app-gemini
  - Base URL: https://hyperecho-proxy.aelf.dev/v1
  - API Key: Configured via environment variables
- React Router (navigation - screen-based routing, not page-based)
- Date-fns (date handling)
- File handling libraries (for PDF/image processing)

**Storage**: IndexedDB (local browser storage) via `db.ts` and `services/storage/`  
**Testing**: Vitest or Jest + React Testing Library  
**Target Platform**: Modern browsers (Chrome, Safari, Firefox, Edge) with PWA support, mobile-first (iOS Safari 14+, Chrome Android)  
**Project Type**: Single web **application** (PWA) - app-style experience with persistent state and user flows, not a static website  
**UI Architecture**: 
- Bottom tab navigation with three main tabs (Health Tracking, Nutrition Assistant, Emotional Support)
- Settings drawer for Privacy & Data management (accessible via gear icon in top-right)
- Screen-based navigation (not page-based), mobile-first behavior where applicable
- All UI styling via Tailwind CSS (hard constraint)  
**Performance Goals**: 
- Initial page load < 3 seconds
- Core actions (mood check-in, symptom logging) completable in < 30 seconds
- Timeline views load 30 days of data in < 2 seconds
- AI processing with clear status indicators (5-30 second latency acceptable)

**Constraints**: 
- **Hard Constraints (MVP)**:
  - Tailwind CSS as styling solution (required - all UI must use Tailwind)
  - Bottom tab navigation with three tabs (Health Tracking, Nutrition Assistant, Emotional Support)
  - Settings drawer for Privacy & Data (gear icon in top-right corner)
  - Application-style experience (not static website)
  - Screen-based navigation (not page-based)
  - Persistent state and user flows
  - Mobile-first behavior where applicable
- Offline-first: Core features must work without network connectivity
- Privacy-first: All sensitive data stored locally, explicit consent for transmission
- Mobile-optimized: Touch targets minimum 44x44px, WCAG 2.1 AA compliance
- File size limits: Medical records max 10MB per file
- Browser storage limits: IndexedDB typically 50% of disk space (handle gracefully)

**Scale/Scope**: 
- Single-user application (no multi-user or sharing features)
- Expected data volume: ~100-1000 medical records, ~1000-10000 symptom/mood entries per user
- **Navigation Structure**:
  - 3 main tabs in bottom navigation (Health, Nutrition, Emotional)
  - Settings drawer for Privacy & Data management
  - ~10-15 main screens (app-style navigation, not pages)
- ~50-100 React components
- Persistent application state across user sessions

## UI Layout Update Requirements

**User Request**: Update project layout with bottom tab navigation and settings drawer.

**Requirements**:
1. **Bottom Tab Navigation**: 
   - Three main tabs: Health Tracking, Nutrition Assistant, Emotional Support
   - Fixed at bottom of screen (mobile-first design)
   - Active tab clearly indicated
   - Icons + labels for each tab
   - Tailwind CSS styling only

2. **Settings Drawer**:
   - Privacy & Data module moved to settings drawer
   - Accessible via gear icon in top-right corner
   - Drawer slides in from right (mobile) or side (desktop)
   - Contains Privacy & Data management screens
   - Tailwind CSS styling only

3. **Styling Constraint**:
   - All UI styling must use Tailwind CSS (hard constraint)
   - No custom CSS files for styling
   - Utility-first Tailwind approach

4. **Business Logic**:
   - All existing business logic preserved
   - Only navigation/UI structure changes
   - No changes to data models, services, or hooks

**Implementation Notes**:
- Create `BottomTabs.tsx` component for tab navigation
- Create `SettingsDrawer.tsx` component for settings access
- Update `Layout.tsx` to integrate tabs and drawer
- Update routing to work with tab-based navigation
- Move Privacy routes to drawer context
- Ensure mobile-first responsive design

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Wellmate Constitution Compliance Checklist:**

- [x] **Principle 1 (Non-Diagnostic)**: Feature does NOT provide medical diagnoses, prescriptions, or treatment recommendations. All suggestions are clearly labeled as lifestyle/dietary guidance only.
- [x] **Principle 2 (Empathetic Tone)**: All user-facing text maintains supportive, empathetic, non-judgmental tone. Error messages are encouraging.
- [x] **Principle 3 (Privacy-First)**: Health data stored locally (IndexedDB). No sensitive data transmitted without explicit user consent. Clear data deletion options.
- [x] **Principle 4 (Low Cognitive Burden)**: UI is simple, intuitive, minimal steps. Navigation ≤3 levels deep. Core actions completable in <30 seconds.
- [x] **Principle 5 (Mobile-First)**: Touch-optimized (44x44px minimum). PWA with offline support. WCAG 2.1 AA compliance.
- [x] **Principle 6 (Offline Support)**: Core features work offline. AI features degrade gracefully with clear messaging.
- [x] **Principle 7 (Transparent AI)**: AI usage clearly indicated. Users understand why AI made suggestions. AI responses distinguishable from factual data.
- [x] **Principle 8 (Data Ownership)**: Users can export data (JSON/CSV). Deletion is permanent and verifiable. Clear ownership statements.

**Architecture Compliance:**
- [x] Uses React + TypeScript
- [x] IndexedDB for local persistence (via `db.ts` and `services/storage/`)
- [x] External APIs isolated in `services/` directory
- [x] Follows established folder structure (`src/components/`, `src/hooks/`, `src/services/`, etc.)

**Status**: ✅ All gates passed. Architecture aligns with constitution requirements.

## Project Structure

### Documentation (this feature)

```text
specs/001-core-modules/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── llm-service.md   # LLM API contract
│   └── storage-api.md   # IndexedDB storage contract
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/           # React components
│   ├── health/          # Health tracking components
│   ├── nutrition/       # Nutrition companion components
│   ├── emotional/       # Emotional support components
│   ├── privacy/         # Privacy & data management components
│   └── shared/          # Shared UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── BottomTabs.tsx      # Bottom tab navigation component
│       ├── SettingsDrawer.tsx   # Settings drawer component
│       └── Layout.tsx           # Main layout with tabs and drawer
├── hooks/               # Custom React hooks
│   ├── useHealthData.ts
│   ├── useMoodTracking.ts
│   ├── useOffline.ts
│   └── useLocalStorage.ts
├── services/            # External APIs & LLM calls
│   ├── llmService.ts    # LLM integration (Gemini API)
│   ├── apiClient.ts     # Base HTTP client wrapper
│   └── storage/         # IndexedDB persistence
│       ├── indexedDB.ts  # Storage implementation
│       └── types.ts      # Storage types
├── types.ts             # Shared TypeScript types
├── db.ts                # Low-level IndexedDB operations
├── utils/               # Utility functions
│   ├── sanitize.ts      # Input sanitization
│   ├── validation.ts    # Data validation
│   └── export.ts        # Data export utilities
├── App.tsx              # Main app component with bottom tabs
└── main.tsx             # Entry point

public/
├── manifest.json        # PWA manifest
├── service-worker.js    # Service worker for offline support
└── icons/               # PWA icons

tests/
├── unit/                # Unit tests
├── integration/        # Integration tests
└── e2e/                 # End-to-end tests (optional)
```

**Structure Decision**: Single web application (PWA) structure. All code in `src/` directory following React + TypeScript conventions. Components organized by feature module. 

**Navigation Structure**:
- Bottom tab navigation component (`BottomTabs.tsx`) with three tabs
- Settings drawer component (`SettingsDrawer.tsx`) for Privacy & Data access
- Main layout (`Layout.tsx`) coordinates tabs, drawer, and screen content
- All styling via Tailwind CSS (hard constraint)

Services isolated for external API calls and storage. Tests mirror source structure.

## Complexity Tracking

> **No violations identified** - Architecture aligns with constitution requirements.

