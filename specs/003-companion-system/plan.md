# Implementation Plan: Companion Character System

**Branch**: `003-companion-system` | **Date**: 2026-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-companion-system/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature introduces a companion character system (Bai Qi, a 2D anime male character) that transforms CareNest from a utility-first tool into a relationship-driven experience. The companion provides daily interaction, emotional support, and gentle guidance for health, nutrition, and emotional well-being activities. The system uses glassmorphism UI design, LLM-powered dialogue generation with template fallback, and local IndexedDB storage for privacy-first architecture. The companion character appears on home screen and integrates with existing Health/Nutrition/Emotion modules through conversational interactions and visual consistency.

## Technical Context

**Language/Version**: TypeScript 5.2.2, React 18.2.0, React Router 6.20.0  
**Primary Dependencies**: 
- React ecosystem: `react`, `react-dom`, `react-router-dom`
- UI/Animation: `framer-motion` (11.18.2), `lucide-react` (0.563.0), `tailwindcss` (3.3.5)
- Storage: `idb` (7.1.1) for IndexedDB operations
- Utilities: `date-fns` (2.30.0) for date handling
- Build: `vite` (5.0.0), `@vitejs/plugin-react` (4.2.0)

**Storage**: IndexedDB (browser local storage) via `idb` library, accessed through `src/db.ts` and `src/services/storage/` service layer  
**Testing**: Not explicitly configured (project uses Vite, likely Vitest/Jest compatible)  
**Target Platform**: Progressive Web App (PWA), mobile-first web application, iOS/Android browsers  
**Project Type**: Single web application (React SPA)  
**Performance Goals**: 
- Dialogue generation: <2 seconds (NFR-001)
- Character state updates: <500ms (NFR-002)
- Image loading: <1 second for cached assets (NFR-003)
- Animation: 60fps for character breathing and UI interactions
- Home screen greeting: Single request per page load (NFR-008)

**Constraints**: 
- Mobile-first design: 44x44px minimum touch targets, 20-24px screen edge padding
- Offline-capable: Core features work without network (Principle 6)
- Privacy-first: All data stored locally, no cloud sync (Principle 3, NFR-008)
- WCAG 2.1 AA accessibility compliance (Principle 5)
- Low cognitive burden: Navigation ≤3 levels deep, core actions <30 seconds (Principle 4)

**Scale/Scope**: 
- Single user per device (local storage)
- Conversation history: Up to 1 year (3,650 messages estimated per NFR-004)
- Character state: Persistent indefinitely until user deletion
- Multiple character support: Future extensibility (NFR-005) - currently single character (Bai Qi)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Wellmate Constitution Compliance Checklist:**

- [x] **Principle 1 (Non-Diagnostic)**: Feature does NOT provide medical diagnoses, prescriptions, or treatment recommendations. Companion provides emotional support and lifestyle guidance only. AI dialogue explicitly avoids medical language (per spec clarifications).
- [x] **Principle 2 (Empathetic Tone)**: All companion dialogue maintains supportive, empathetic, boyfriend-like tone. Error messages are encouraging. AI responses use conversational, caring language (per FR-037, Session 2026-01-25 clarifications).
- [x] **Principle 3 (Privacy-First)**: All character state and conversation data stored locally in IndexedDB. No sensitive data transmitted without explicit user consent. Data deletion options available (NFR-009).
- [x] **Principle 4 (Low Cognitive Burden)**: UI uses simple glassmorphism design, minimal steps. Navigation ≤3 levels deep. Core interactions (greeting, conversation) completable in <30 seconds.
- [x] **Principle 5 (Mobile-First)**: Touch-optimized (44x44px minimum, 56x56px for back buttons). PWA with offline support. WCAG 2.1 AA compliance (semantic HTML, ARIA labels).
- [x] **Principle 6 (Offline Support)**: Core conversation features work offline (template fallback). AI features degrade gracefully with clear messaging (NFR-006).
- [x] **Principle 7 (Transparent AI)**: AI usage clearly indicated via dialogue generation. Users understand companion responses are AI-generated. AI responses distinguishable from user data (per FR-006, NFR-006).
- [x] **Principle 8 (Data Ownership)**: Users can export conversation data (JSON format). Deletion is permanent and verifiable. Clear ownership statements (NFR-009).

**Architecture Compliance:**
- [x] Uses React + TypeScript (React 18.2.0, TypeScript 5.2.2)
- [x] IndexedDB for local persistence (via `db.ts` and `services/storage/`)
- [x] External APIs isolated in `services/` directory (`llmService.ts`, `companionService.ts`)
- [x] Follows established folder structure (`src/components/`, `src/hooks/`, `src/services/`, etc.)

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── companion/              # Companion character components
│   │   ├── HomeScreen.tsx      # Home screen with character and entry cards
│   │   ├── CompanionScreen.tsx # Conversation interface
│   │   ├── CharacterAvatar.tsx # Character avatar component
│   │   ├── CharacterIllustration.tsx
│   │   ├── CharacterLayer.tsx
│   │   ├── ConversationBubble.tsx
│   │   ├── ChoiceDialogue.tsx
│   │   ├── FloatingParticles.tsx
│   │   ├── FunctionSpheres.tsx # Upper right corner shortcuts
│   │   ├── RadialMenu.tsx      # Radial menu triggered by character click
│   │   └── [other companion components]
│   ├── health/                 # Health module components (existing)
│   ├── nutrition/              # Nutrition module components (existing)
│   ├── shared/                 # Shared UI components
│   │   ├── ImageBackground.tsx # Full-screen background component
│   │   ├── Layout.tsx          # Main layout with routing
│   │   └── [other shared components]
│   └── [other module components]
├── hooks/
│   ├── useCompanion.ts         # Main companion interaction hook
│   ├── useCharacterState.ts    # Character state management
│   ├── useConversation.ts      # Conversation history management
│   └── [other hooks]
├── services/
│   ├── llmService.ts           # LLM API calls (Gemini via HyperEcho)
│   ├── companionService.ts     # Companion-specific business logic
│   └── storage/                # IndexedDB persistence layer
│       ├── indexedDB.ts
│       ├── characterStateStorage.ts
│       ├── conversationStorage.ts
│       └── types.ts
├── config/
│   └── characters/
│       ├── baiqi.json          # Character configuration (dialogue templates, thresholds)
│       └── index.ts
├── i18n/
│   ├── index.ts
│   └── locales/
│       ├── en.ts               # English translations
│       └── zh.ts               # Chinese translations
├── types.ts                     # Shared TypeScript types
├── db.ts                        # Low-level IndexedDB operations
├── App.tsx                      # Root component
└── main.tsx                     # Entry point

public/
├── images/                      # Character illustrations and assets
│   ├── DM_20260123234921_001.jpg    # Home screen background
│   ├── images.jpg                    # Character avatar
│   ├── 1cb7398bea6d251b67d50b965c4295130983e2771863c5-oVQb7P_fw658webp.webp  # Health page illustration
│   └── 008fP45sly1hreaeb88b2j323s35s1l1.jpg  # Nutrition page illustration
└── [other public assets]
```

**Structure Decision**: Single web application (React SPA) following established architecture patterns. Companion system components are integrated into existing `src/components/companion/` directory. Character configuration stored in `src/config/characters/` as JSON files. All data persistence handled through IndexedDB via `src/db.ts` and `src/services/storage/` service layer. External API calls (LLM) isolated in `src/services/llmService.ts`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. All constitution principles are satisfied. The companion system enhances existing architecture without violating constraints.
