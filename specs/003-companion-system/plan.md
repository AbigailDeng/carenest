# Implementation Plan: Companion Character System

**Branch**: `003-companion-ui-polish` | **Date**: 2026-01-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-companion-system/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature introduces a companion character system to CareNest that transforms the app from a utility-first tool into a relationship-driven experience. The companion is a 2D anime male character (Bai Qi) that users interact with daily, providing emotional support and gentle guidance for health, nutrition, and emotional well-being activities. The system uses glassmorphism UI design, full-screen character illustrations with breathing animations, and conversational AI interactions to create an immersive otome/dating-sim game aesthetic while maintaining functional access to existing Health, Nutrition, and Emotion modules.

**Core Philosophy**: "I'm not using a tool, I'm spending time with someone."

**Technical Approach**: React 18.x + TypeScript 5.x frontend with IndexedDB for local storage, Gemini API via HyperEcho Proxy for AI dialogue generation, glassmorphism UI components with framer-motion animations, and config-driven character assets.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18.x  
**Primary Dependencies**: 
- React 18.x (UI framework)
- TypeScript 5.x (type safety)
- Tailwind CSS (styling - soft, elegant aesthetic with glassmorphism support: backdrop-filter, semi-transparent backgrounds)
- IndexedDB (via idb for local storage)
- LLM Service Provider: Gemini API via HyperEcho Proxy (for dialogue generation)
- React Router (screen navigation)
- Date-fns (time-of-day awareness)
- CSS backdrop-filter API (for glassmorphism effects)
- Framer Motion (animations for character interactions and UI transitions)
- Lucide React (linear icons for professional appearance)

**Storage**: IndexedDB (local browser storage) for conversation history and character state

**Character Assets**: 
- Configuration: `src/config/characters/` (JSON/YAML files)
- Images: `src/assets/characters/` and `public/images/` (avatars, illustrations, backgrounds)
- i18n: `src/i18n/locales/` (dialogue text, character names)

**Testing**: Manual testing and visual verification (no automated test suite specified)

**Target Platform**: Progressive Web App (PWA) - Mobile-first web application, iOS/Android browsers, desktop browsers

**Project Type**: Single-page web application (React SPA)

**Performance Goals**: 
- Character dialogue generation: <2 seconds response time (NFR-001)
- Character state updates: <500ms without blocking UI (NFR-002)
- Character image loading: <1 second for cached assets (NFR-003)
- 60fps animations for character breathing and UI transitions
- Smooth scrolling and touch interactions

**Constraints**: 
- All data stored locally (IndexedDB) - no cloud sync required
- AI features degrade gracefully when offline (NFR-006)
- Mobile-first design: 44x44px minimum touch targets, WCAG 2.1 AA compliance
- Maximum 3 navigation levels deep (Principle 4)
- Core actions completable in <30 seconds (Principle 4)

**Scale/Scope**: 
- Single companion character (Bai Qi) for MVP
- Support conversation history for at least 1 year (365 conversations × 10 messages = 3,650 messages) (NFR-004)
- Multilingual support (i18n) for character dialogue and UI elements
- Configurable character assets (not hardcoded) for future extensibility

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Wellmate Constitution Compliance Checklist:**

- [x] **Principle 1 (Non-Diagnostic)**: Feature does NOT provide medical diagnoses, prescriptions, or treatment recommendations. All suggestions are clearly labeled as lifestyle/dietary guidance only. Character provides emotional support and gentle guidance, not medical advice (FR-019, CON-002).

- [x] **Principle 2 (Empathetic Tone)**: All user-facing text maintains supportive, empathetic, non-judgmental tone. Error messages are encouraging. AI responses use conversational, boyfriend-like tone (FR-037(9), Session 2026-01-25 UX Refinements Q1).

- [x] **Principle 3 (Privacy-First)**: Health data stored locally (IndexedDB). No sensitive data transmitted without explicit user consent. Clear data deletion options. Conversation history stored locally (FR-008, NFR-008, NFR-010).

- [x] **Principle 4 (Low Cognitive Burden)**: UI is simple, intuitive, minimal steps. Navigation ≤3 levels deep. Core actions completable in <30 seconds. Simplified conversational form design (FR-037(2)).

- [x] **Principle 5 (Mobile-First)**: Touch-optimized (44x44px minimum). PWA with offline support. WCAG 2.1 AA compliance. Mobile-first layout with 20-24px screen edge padding (FR-034, FR-035, FR-036).

- [x] **Principle 6 (Offline Support)**: Core features work offline. AI features degrade gracefully with clear messaging. Template fallback for AI dialogue generation (NFR-006, FR-006).

- [x] **Principle 7 (Transparent AI)**: AI usage clearly indicated. Users understand why AI made suggestions. AI responses distinguishable from factual data. Character dialogue clearly shows AI is analyzing (health.symptoms.analyzing: "他正在为你分析症状").

- [x] **Principle 8 (Data Ownership)**: Users can export data (JSON/CSV). Deletion is permanent and verifiable. Clear ownership statements. Conversation history can be deleted (NFR-009).

**Architecture Compliance:**
- [x] Uses React + TypeScript
- [x] IndexedDB for local persistence (via `db.ts` and `services/storage/`)
- [x] External APIs isolated in `services/` directory (llmService.ts, companionService.ts)
- [x] Follows established folder structure (`src/components/`, `src/hooks/`, `src/services/`, etc.)

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
├── components/
│   ├── companion/       # Companion character components
│   │   ├── CharacterAvatar.tsx
│   │   ├── CharacterIllustration.tsx
│   │   ├── CharacterLayer.tsx
│   │   ├── ChartCompanionElement.tsx
│   │   ├── ChoiceDialogue.tsx
│   │   ├── CompanionScreen.tsx
│   │   ├── ConversationBubble.tsx
│   │   ├── FloatingParticles.tsx
│   │   ├── FullScreenChartPanel.tsx
│   │   ├── FunctionSpheres.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── IconExpansionTransition.tsx
│   │   ├── NeonGlowChart.tsx
│   │   ├── RadialMenu.tsx
│   │   ├── RelationshipBadge.tsx
│   │   └── SceneBackground.tsx
│   ├── health/          # Health module screens (existing, enhanced with companion)
│   ├── nutrition/       # Nutrition module screens (existing, enhanced with companion)
│   └── shared/          # Shared UI components
│       ├── ImageBackground.tsx
│       ├── Layout.tsx
│       └── ...
├── hooks/
│   ├── useCharacterState.ts
│   ├── useCompanion.ts
│   ├── useConversation.ts
│   └── useProactiveDialogue.ts
├── services/
│   ├── companionService.ts    # Character state and dialogue management
│   ├── llmService.ts          # LLM API calls for dialogue generation
│   └── storage/
│       ├── characterStateStorage.ts
│       ├── conversationStorage.ts
│       └── indexedDB.ts
├── config/
│   └── characters/
│       └── baiqi.json         # Character configuration (name, dialogue templates, state thresholds)
├── i18n/
│   └── locales/
│       ├── en.ts
│       └── zh.ts
├── types.ts             # Shared TypeScript types (CharacterState, ConversationMessage, CharacterConfig)
└── db.ts                # Low-level IndexedDB operations

public/
├── images/              # Character illustrations and backgrounds
│   ├── DM_20260123234921_001.jpg
│   ├── images.jpg
│   └── 1cb7398bea6d251b67d50b965c4295130983e2771863c5-oVQb7P_fw658webp.webp
└── assets/
    └── characters/
        └── baiqi/       # Character assets (avatars, backgrounds, illustrations)
```

**Structure Decision**: Single-page React application with component-based architecture. Companion character system integrates with existing Health, Nutrition, and Emotion modules through shared Layout component and companion-specific hooks/services. Character assets stored in `public/images/` and `public/assets/characters/` for direct URL access. Configuration-driven approach allows character customization without code changes.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | All constitution checks pass | N/A |

## Phase 0: Research & Clarification

### Research Tasks

Based on the Technical Context and spec clarifications, the following research areas have been addressed:

1. **Glassmorphism UI Implementation** - ✅ Resolved: Using CSS backdrop-filter API with rgba backgrounds, blur effects, and white borders per FR-030B
2. **Character Animation Patterns** - ✅ Resolved: Using CSS @keyframes for breathing animation (scale 1.0-1.03, translateY 0px to -10px, 7s cycle) per Session 2026-01-25 clarifications
3. **LLM Integration Pattern** - ✅ Resolved: Using Gemini API via HyperEcho Proxy with template fallback per FR-006, NFR-006
4. **State Management Approach** - ✅ Resolved: Using React hooks (useCompanion, useCharacterState) with IndexedDB persistence per FR-003, FR-010
5. **Navigation Architecture** - ✅ Resolved: Function spheres navigate directly to routes, radial menu triggers data panels per FR-031I, FR-031E. FunctionSpheres component MUST appear on all functional module main pages (/health, /nutrition, /emotional routes) in addition to home screen (/) per Session 2026-01-25 clarification.

**Output**: research.md (✅ Complete - all research areas resolved)

## Phase 1: Design & Contracts

### Data Model

**Entities** (from spec.md Data Model section):

1. **CharacterState** - Character relationship and state tracking
   - Fields: id, closeness (0-100), mood, energy, lastInteractionTime, totalInteractions, relationshipStage
   - Stored in IndexedDB via `services/storage/characterStateStorage.ts`

2. **ConversationMessage** - Individual conversation messages
   - Fields: id, timestamp, sender ("character" | "user"), content, messageType, choices, characterImageUrl, context
   - Stored in IndexedDB via `services/storage/conversationStorage.ts`

3. **CharacterConfig** - Character configuration metadata
   - Fields: id, name (i18n), avatarUrl, illustrationUrls, dialogueTemplates, stateThresholds
   - Stored in `src/config/characters/baiqi.json` (JSON file, not database)

**Relationships**:
- CharacterState.id → CharacterConfig.id (one-to-one)
- ConversationMessage.characterId → CharacterState.id (many-to-one)
- ConversationMessage.context → CharacterState snapshot (immutable reference)

**Output**: data-model.md (✅ Complete - entity schemas and IndexedDB definitions documented)

### Service Contracts

**Internal Services** (no REST API, all local):

1. **CompanionService** (`src/services/companionService.ts`)
   - `generateGreeting(characterId, timeOfDay)` → Promise<string>
   - `generateResponse(characterId, userMessage, context)` → Promise<string>
   - `updateCharacterState(characterId, updates)` → Promise<void>
   - `incrementCloseness(characterId, delta)` → Promise<void>

2. **LLMService** (`src/services/llmService.ts`)
   - `callLLM(prompt)` → Promise<string> (internal, used by companionService)

3. **CharacterStateStorage** (`src/services/storage/characterStateStorage.ts`)
   - `getCharacterState(characterId)` → Promise<CharacterState | null>
   - `saveCharacterState(state)` → Promise<void>
   - `updateCharacterState(characterId, updates)` → Promise<void>
   - `incrementCloseness(characterId, delta)` → Promise<void>

4. **ConversationStorage** (`src/services/storage/conversationStorage.ts`)
   - `saveMessage(message)` → Promise<void>
   - `getConversationHistory(characterId, options)` → Promise<ConversationMessage[]>
   - `deleteConversationHistory(characterId)` → Promise<void>

5. **CharacterConfigService** (`src/config/characters/index.ts`)
   - `getCharacterConfig(characterId)` → CharacterConfig | null

**Output**: contracts/service-interfaces.ts (✅ Complete - TypeScript interfaces for all services)

### Quickstart & Test Scenarios

**Test Scenarios** (from quickstart.md):

1. **User Story 1**: Daily Companion Interaction
   - Initial app open - character greeting
   - Conversation interaction
   - Proactive dialogue initiation
   - Relationship growth over time

2. **User Story 2**: Companion-Guided Health Activities
   - Activity suggestion dialogue
   - Navigation to functional modules
   - Activity acknowledgment

3. **User Story 3**: Emotional Support Through Conversation
   - Emotional response generation
   - Context-aware dialogue
   - Gentle guidance to modules

**Output**: quickstart.md (✅ Complete - test scenarios and acceptance criteria documented)

## Phase 2: Implementation Strategy

### MVP Scope (User Story 1 Only)

**Goal**: Deliver core companion interaction experience that transforms app from tool to companion.

**Deliverables**:
- Home screen with character illustration and greeting
- Conversation interface with chat-like bubbles
- Character state tracking (closeness, mood, energy)
- Proactive dialogue initiation
- Relationship metrics display

**Success Criteria**: Users can open app, receive greeting, engage in conversation, see relationship metrics, and feel emotionally supported.

### Incremental Delivery

**Phase 1**: User Story 1 (P1) - Daily Companion Interaction
- Foundation for all companion features
- Establishes emotional connection
- Independent and testable

**Phase 2**: User Story 2 (P2) - Companion-Guided Health Activities
- Integrates companion with existing Health module
- Adds activity suggestions and acknowledgments
- Builds on User Story 1 foundation

**Phase 3**: User Story 3 (P2) - Emotional Support Through Conversation
- Enhances conversation with emotional intelligence
- Adds context-aware responses
- Complements User Story 1

### Risk Mitigation

**Risk 1**: LLM API failures or slow responses
- **Mitigation**: Template fallback system (NFR-006)
- **Impact**: Reduced personalization, but system remains functional

**Risk 2**: Performance issues with large conversation history
- **Mitigation**: IndexedDB compound indexes, pagination (NFR-004)
- **Impact**: Slower queries, but manageable with proper indexing

**Risk 3**: Character state synchronization issues
- **Mitigation**: Single source of truth (IndexedDB), React hooks for state management
- **Impact**: Potential UI inconsistencies, mitigated by proper state management

## Next Steps

1. ✅ **Generate research.md** - Complete (research.md created with design decisions)
2. ✅ **Generate data-model.md** - Complete (data-model.md created with entity schemas and IndexedDB definitions)
3. ✅ **Generate contracts/** - Complete (contracts/service-interfaces.ts created with TypeScript service interfaces)
4. ✅ **Generate quickstart.md** - Complete (quickstart.md created with test scenarios and acceptance criteria)
5. **Run `/speckit.tasks`** - Ready to generate implementation task breakdown

## Implementation Notes

- All design artifacts are complete and ready for implementation
- Constitution check passed - no violations requiring justification
- Technical decisions resolved through spec clarifications and research
- FunctionSpheres component MUST appear on all functional module main pages (/health, /nutrition, /emotional) per latest clarification
- Implementation can proceed with confidence that technical approach is sound
