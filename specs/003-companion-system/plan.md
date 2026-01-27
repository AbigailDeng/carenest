# Implementation Plan: Companion Character System

**Branch**: `003-companion-system` | **Date**: 2026-01-27 | **Spec**: `/specs/003-companion-system/spec.md`
**Input**: Feature specification from `/specs/003-companion-system/spec.md`

## Summary

This feature introduces a companion character system (Bai Qi) that transforms CareNest from a utility-first tool into a relationship-driven experience. The companion is a 2D anime male character that users interact with daily, providing emotional support and gentle guidance for health, nutrition, and emotional well-being activities. Key features include: home screen with character greeting, conversation interface at `/emotional` route, character state management (mood, closeness, energy), AI-powered dialogue generation with boyfriend/psychologist fusion personality, memory continuity, emotional variation, and response delays for authentic conversation experience.

## Technical Context

**Language/Version**: TypeScript 5.2.2, React 18.2.0, ES2020  
**Primary Dependencies**: React Router DOM 6.20.0, Framer Motion 11.18.2, lucide-react 0.563.0, idb 7.1.1, date-fns 2.30.0  
**Storage**: IndexedDB (via `idb` library) for local persistence of conversation history, character state, and user data  
**Testing**: Jest/Vitest (to be configured)  
**Target Platform**: Progressive Web App (PWA), mobile-first web application, iOS/Android browsers  
**Project Type**: Single-page web application (React SPA)  
**Performance Goals**: Dialogue generation response within 2 seconds (NFR-001), character state updates within 500ms (NFR-002), 60fps animations, conversation history support for 1 year (365 conversations × 10 messages = 3,650 messages)  
**Constraints**: Offline-capable core features, graceful AI degradation, <200ms UI interactions, mobile-first touch targets (44x44px minimum), WCAG 2.1 AA compliance  
**Scale/Scope**: Single-user application, local-first architecture, conversation history stored locally, no cloud sync required

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Wellmate Constitution Compliance Checklist:**

- [x] **Principle 1 (Non-Diagnostic)**: Feature does NOT provide medical diagnoses, prescriptions, or treatment recommendations. All suggestions are clearly labeled as lifestyle/dietary guidance only. Companion provides emotional support and gentle guidance only (FR-044, FR-045).
- [x] **Principle 2 (Empathetic Tone)**: All user-facing text maintains supportive, empathetic, non-judgmental tone. Error messages are encouraging. AI responses use boyfriend/psychologist fusion personality with warm, caring language (FR-044, FR-045).
- [x] **Principle 3 (Privacy-First)**: Health data stored locally (IndexedDB). No sensitive data transmitted without explicit user consent. Clear data deletion options. Conversation history stored locally in IndexedDB (FR-008, FR-045).
- [x] **Principle 4 (Low Cognitive Burden)**: UI is simple, intuitive, minimal steps. Navigation ≤3 levels deep. Core actions completable in <30 seconds. Chat-style interface reduces complexity (FR-043).
- [x] **Principle 5 (Mobile-First)**: Touch-optimized (44x44px minimum). PWA with offline support. WCAG 2.1 AA compliance. All interactive elements meet touch target requirements (FR-043).
- [x] **Principle 6 (Offline Support)**: Core features work offline. AI features degrade gracefully with clear messaging. Conversation history works offline, AI features have template fallback (FR-006, NFR-006).
- [x] **Principle 7 (Transparent AI)**: AI usage clearly indicated. Users understand why AI made suggestions. AI responses distinguishable from factual data. AI-generated dialogue marked with metadata (FR-006, FR-045).
- [x] **Principle 8 (Data Ownership)**: Users can export data (JSON/CSV). Deletion is permanent and verifiable. Clear ownership statements. Conversation history can be exported and deleted (FR-008, NFR-009).

**Architecture Compliance:**
- [x] Uses React + TypeScript (confirmed from package.json and codebase)
- [x] IndexedDB for local persistence (via `db.ts` and `services/storage/`) (confirmed from codebase structure)
- [x] External APIs isolated in `services/` directory (LLM calls in `services/llmService.ts` and `services/companionService.ts`)
- [x] Follows established folder structure (`src/components/`, `src/hooks/`, `src/services/`, etc.) (confirmed from codebase structure)

## Project Structure

### Documentation (this feature)

```text
specs/003-companion-system/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── companion-service.md
│   └── service-interfaces.ts
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/          # React components
│   ├── companion/      # Companion character components
│   │   ├── CharacterAvatar.tsx
│   │   ├── CharacterLayer.tsx
│   │   ├── ConversationBubble.tsx
│   │   ├── FloatingParticles.tsx
│   │   ├── FunctionSpheres.tsx
│   │   ├── HomeScreen.tsx
│   │   └── [new] EmotionalScreen.tsx  # /emotional route component
│   ├── health/          # Health module components
│   ├── nutrition/       # Nutrition module components
│   └── shared/          # Shared UI components
├── hooks/
│   ├── useCharacterState.ts
│   ├── useCompanion.ts
│   ├── useConversation.ts  # Conversation management hook
│   └── [new] useEmotionalConversation.ts  # /emotional conversation hook
├── services/
│   ├── companionService.ts  # Companion dialogue generation
│   ├── llmService.ts       # LLM API calls
│   └── storage/
│       ├── conversationStorage.ts  # Conversation history storage
│       └── characterStateStorage.ts
├── config/
│   └── characters/
│       └── baiqi.json      # Character configuration
├── types.ts                # TypeScript type definitions
├── db.ts                   # IndexedDB operations
└── navigation/
    └── routes.tsx          # Route configuration
```

**Structure Decision**: Single-page web application (React SPA) structure. The `/emotional` route will be implemented as a new component `EmotionalScreen.tsx` in `src/components/companion/`. Conversation functionality will extend existing `useConversation.ts` hook or create `useEmotionalConversation.ts` for dedicated emotional conversation management. All conversation history will be stored via `services/storage/conversationStorage.ts` using IndexedDB.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. All architecture decisions align with Wellmate Constitution principles.

---

## Phase 0: Research & Design Decisions

**Status**: ✅ Complete

**Research Document**: `research.md` (already exists, reviewed and confirmed)

**Key Decisions Resolved**:
1. Glassmorphism UI implementation (CSS backdrop-filter API)
2. Character animation patterns (CSS @keyframes for breathing)
3. LLM integration pattern (Gemini API via HyperEcho Proxy with template fallback)
4. State management approach (React hooks + IndexedDB)
5. Navigation architecture (function spheres + radial menu)
6. Character asset management (config-driven JSON files)

**New Requirements from Clarifications (Session 2026-01-27)**:
- `/emotional` route with chat-style conversation interface
- Home page conversation input → immediate navigation to `/emotional`
- AI personality: blended boyfriend/psychologist fusion style
- Real conversation mechanisms: memory continuity, emotional variation, response delay

**No Additional Research Required**: All technical decisions align with existing architecture and research findings.

---

## Phase 1: Design & Contracts

**Status**: ✅ Complete

### Data Model

**Document**: `data-model.md` (updated with `/emotional` conversation requirements)

**Key Entities**:
- `CharacterState` - Character relationship and state (closeness, mood, energy)
- `ConversationMessage` - Conversation history with memory continuity support
- `CharacterConfig` - Character configuration and dialogue templates

**Updates Made**:
- Added `emotionalState` field to `ConversationContext` for emotional variation tracking
- Added memory continuity support notes to `ConversationMessage` retention policy
- Confirmed IndexedDB storage structure supports conversation history queries

### API Contracts

**Document**: `contracts/companion-service.md` (updated with `/emotional` conversation requirements)

**Key Endpoints**:
- `generateCompanionDialogue(input: CompanionDialogueInput): Promise<CompanionDialogueOutput>`

**Updates Made**:
- Added memory continuity requirement (reference past topics, demonstrate memory)
- Added emotional variation requirement (display different emotional states)
- Added response delay requirement (1-3 second typing simulation)
- Updated prompt construction guidelines to include blended boyfriend/psychologist personality
- Extended conversation context to include last 10-20 messages (increased from 5-10)

### Quickstart

**Document**: `quickstart.md` (exists, may need updates for `/emotional` route)

**Status**: To be reviewed and updated if needed during implementation phase.

---

## Phase 2: Implementation Planning

**Status**: Ready for `/speckit.tasks` command

**Next Steps**:
1. Run `/speckit.tasks` to generate detailed implementation tasks
2. Tasks will be organized by user story priority (P1, P2, P3)
3. Implementation will follow MVP-first approach (User Story 1 first)

**Key Implementation Areas**:
1. Home page conversation input → `/emotional` navigation (FR-042)
2. `/emotional` route chat-style interface (FR-043)
3. AI personality blending (FR-044)
4. Real conversation mechanisms (FR-045)
5. Conversation history storage and memory continuity
6. Emotional variation display
7. Response delay simulation

---

## Summary

All Phase 0 and Phase 1 deliverables are complete. The implementation plan is ready for task generation. Key technical decisions are documented, data models are defined, and API contracts are specified. The `/emotional` route requirements from Session 2026-01-27 clarifications have been integrated into the design documents.
