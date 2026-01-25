# Tasks: Companion Character System

**Input**: Design documents from `/specs/003-companion-system/`  
**Prerequisites**: plan.md ✅, spec.md ✅, data-model.md ✅, contracts/companion-service.md ✅, research.md ✅

**Tests**: Tests are OPTIONAL - not explicitly requested in spec, so no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., [US1], [US2], [US3])
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths shown below assume single project structure per plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create character configuration directory structure `src/config/characters/` and `src/assets/characters/baiqi/` per plan.md
- [X] T002 [P] Add framer-motion dependency to package.json (for spring animations in radial menu and icon expansion transitions)
- [X] T003 [P] Add lucide-react dependency to package.json (for linear icons replacing emoji)
- [X] T004 [P] Verify Tailwind CSS configuration supports backdrop-filter for glassmorphism effects
- [X] T005 [P] Create character configuration loader `src/config/characters/index.ts` to load character JSON configs

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Extend IndexedDB schema in `src/db.ts` to add `characterState` store (id as keyPath, indexes: id)
- [X] T007 Extend IndexedDB schema in `src/db.ts` to add `conversations` store (id as keyPath, indexes: id, characterId, timestamp, characterId_timestamp compound)
- [X] T008 [P] Create character state storage service `src/services/storage/characterStateStorage.ts` with CRUD operations (getCharacterState, saveCharacterState, updateCharacterState)
- [X] T009 [P] Create conversation storage service `src/services/storage/conversationStorage.ts` with CRUD operations (getMessages, saveMessage, getRecentMessages, getMessagesByDateRange)
- [X] T010 [P] Create character state management hook `src/hooks/useCharacterState.ts` (load state, update closeness, update mood, update energy, derive relationshipStage)
- [X] T011 [P] Create conversation history management hook `src/hooks/useConversation.ts` (load messages, save message, pagination)
- [X] T012 [P] Create companion service `src/services/companionService.ts` with generateCompanionDialogue function (prompt construction, LLM integration, template fallback)
- [X] T013 [P] Create proactive dialogue hook `src/hooks/useProactiveDialogue.ts` (time-of-day awareness, inactivity detection, proactive initiation logic)
- [X] T014 [P] Create character configuration file `src/config/characters/baiqi.json` with name, avatarUrl, illustrationUrls, backgroundUrls, dialogueTemplates, stateThresholds, personality per data-model.md
- [X] T015 [P] Add CharacterState and ConversationMessage TypeScript interfaces to `src/types.ts` per data-model.md
- [X] T016 [P] Create CharacterAvatar component `src/components/companion/CharacterAvatar.tsx` (displays character avatar image, supports size prop: "sm" | "md" | "lg")
- [X] T017 [P] Create CharacterIllustration component `src/components/companion/CharacterIllustration.tsx` (displays full character illustration, supports mood prop for different illustrations)
- [X] T018 [P] Create ImageBackground component `src/components/shared/ImageBackground.tsx` (full-screen background image with gradient overlay, per FR-031)
- [X] T019 [P] Create SceneBackground component `src/components/companion/SceneBackground.tsx` (floral overlays, z-index 1, per FR-036) - Note: Located in companion/ directory
- [X] T020 [P] Create FloatingParticles component `src/components/companion/FloatingParticles.tsx` (random floating light particles, z-index 2, count prop, per FR-031B, FR-036) - Note: Located in companion/ directory
- [X] T021 [P] Create CharacterLayer component `src/components/companion/CharacterLayer.tsx` (character illustration with floating animation, z-index 3, floatAnimation: translateY(-12px) scale(1.02) over 4s ease-in-out infinite, per FR-036) - Note: Located in companion/ directory

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Daily Companion Interaction (Priority: P1) 🎯 MVP

**Goal**: Users feel like they're interacting with a real person who cares about them, reducing loneliness and providing emotional support through daily conversations.

**Independent Test**: Open the app, receive a greeting from the companion based on time-of-day and relationship state, engage in conversation, express emotions, receive empathetic responses, see relationship metrics (closeness level) increase with daily interaction.

### Implementation for User Story 1

- [X] T022 [US1] Create HomeScreen component `src/components/companion/HomeScreen.tsx` with ImageBackground, SceneBackground, FloatingParticles, CharacterLayer layering (per FR-031, FR-036)
- [X] T023 [US1] Implement state-aware greeting dialogue bubble in HomeScreen using CharacterAvatar and glassmorphism styling (per FR-030B, FR-031)
- [X] T024 [US1] Integrate useCharacterState hook in HomeScreen to load character state and display relationship metrics
- [X] T025 [US1] Integrate useProactiveDialogue hook in HomeScreen to generate time-of-day aware greeting (single request per page load, per NFR-008)
- [X] T026 [US1] Create ConversationBubble component `src/components/companion/ConversationBubble.tsx` (chat bubble with sender prop, glassmorphism styling, per FR-024, FR-030B)
- [X] T027 [US1] Create CompanionScreen component `src/components/companion/CompanionScreen.tsx` (main chat interface with conversation history, input field, send button)
- [X] T028 [US1] Integrate useConversation hook in CompanionScreen to load and display conversation history
- [X] T029 [US1] Implement user message sending in CompanionScreen (save user message, call generateCompanionDialogue, save character response, update character state)
- [X] T030 [US1] Integrate companionService.generateCompanionDialogue in CompanionScreen with proper error handling and template fallback
- [X] T031 [US1] Implement character state updates after dialogue (increment closeness, update mood based on user emotions, per FR-010, FR-011, FR-014)
- [X] T032 [US1] Create RelationshipBadge component `src/components/companion/RelationshipBadge.tsx` (displays closeness level and relationshipStage, per FR-009)
- [X] T033 [US1] Add RelationshipBadge to CompanionScreen to show relationship metrics (displayed via CharacterAvatar showBadge prop)
- [X] T034 [US1] Update routing in `src/components/shared/Layout.tsx` to add /companion route pointing to CompanionScreen
- [X] T035 [US1] Update routing in `src/components/shared/Layout.tsx` to set HomeScreen as root path "/" (per FR-031)
- [X] T036 [US1] Add i18n keys for companion dialogue and UI text to `src/i18n/locales/en.ts` and `src/i18n/locales/zh.ts` (greetings, responses, proactive messages, relationship stages)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently - users can interact with companion, receive contextual greetings, have conversations, see relationship grow

---

## Phase 4: User Story 2 - Companion-Guided Health Activities (Priority: P2)

**Goal**: Users engage in health tracking activities (symptom logging, meal recording) framed as "doing things together" with the companion, rather than completing tasks alone.

**Independent Test**: Companion suggests logging symptoms or meals through dialogue, user completes activity through conversation or is redirected to functional module, companion acknowledges action with encouraging feedback when user returns. Integrates with existing Health module.

### Implementation for User Story 2

- [X] T037 [US2] Create FunctionSpheres component `src/components/companion/FunctionSpheres.tsx` (three circular glassmorphism buttons in upper right corner, Health/Nutrition/Emotion icons, per FR-031I)
- [X] T038 [US2] Integrate FunctionSpheres in HomeScreen with React Router navigation to /health, /nutrition, /emotional routes (per FR-031I)
- [X] T039 [US2] Create RadialMenu component `src/components/companion/RadialMenu.tsx` (4 icons explode outward with spring animation, glassmorphism styling, per FR-031D)
- [X] T040 [US2] Integrate RadialMenu in HomeScreen triggered by clicking character illustration (center/chest area, per FR-031D)
- [X] T041 [US2] Create IconExpansionTransition component `src/components/companion/IconExpansionTransition.tsx` (icon scales up to fill screen, transitions to full-screen panel, per FR-031E)
- [X] T042 [US2] Create NeonGlowChart component `src/components/companion/NeonGlowChart.tsx` (purple/pink gradient lines with glow, glassmorphism background, left-to-right animation, per FR-031F)
- [X] T043 [US2] Create ChartCompanionElement component `src/components/companion/ChartCompanionElement.tsx` (small avatar at bottom-right with dialogue bubble, AI-generated data interpretation, per FR-031G)
- [X] T044 [US2] Integrate IconExpansionTransition with NeonGlowChart and ChartCompanionElement for radial menu data panels (Health/Nutrition/Emotion charts, per FR-031E, FR-031F, FR-031G)
- [X] T045 [US2] Implement AI data interpretation generation in ChartCompanionElement using companionService with template fallback (per FR-031H)
- [X] T046 [US2] Update companionService to support integrationHint parameter for gentle guidance toward Health/Nutrition/Emotion modules (per FR-016, FR-019)
- [X] T047 [US2] Update CompanionScreen to allow companion to suggest health activities through dialogue (integrationHint: "health" | "nutrition" | "emotion", per FR-016, FR-019)
- [X] T048 [US2] Implement activity acknowledgment in CompanionScreen when user returns from functional modules (per FR-018)
- [X] T049 [US2] Refine Health Details Page `src/components/shared/Layout.tsx` HealthHomeScreen function to align with Home Screen visual base (ImageBackground, SceneBackground, FloatingParticles, CharacterLayer, per FR-036)
- [X] T050 [US2] Update Health Details Page to use "The Private Ledger" layout with three overlapping fan-shaped cards (per FR-035, FR-036)
- [X] T051 [US2] Add companion dialogue bubble to Health Details Page above cards (per FR-035, FR-036)
- [X] T052 [US2] Hide bottom navigation bar on /health route (per FR-034, FR-036)
- [X] T053 [US2] Add glassmorphism back button to Health Details Page (per FR-034, FR-036)
- [X] T054 [US2] Refine SymptomLogScreen `src/components/health/SymptomLogScreen.tsx` to implement companion-integrated data entry design (per FR-037)
- [X] T055 [US2] Update analyzeSymptoms function in `src/services/llmService.ts` to use Bai Qi's conversational boyfriend tone (per FR-037(9) clarification)
- [X] T056 [US2] Add i18n keys for health module companion integration to `src/i18n/locales/en.ts` and `src/i18n/locales/zh.ts` (ledgerPrompt, symptomPrompt, letHimLook, rememberedInHeart, etc.)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - companion guides users to health activities, acknowledges actions, health screens have companion integration

---

## Phase 5: User Story 3 - Emotional Support Through Conversation (Priority: P2)

**Goal**: Users express feelings, receive empathetic responses, and feel less alone through natural conversation with the companion.

**Independent Test**: User expresses emotions (sadness, stress, loneliness) in conversation, receives empathetic responses that reflect closeness level and mood state, feels emotionally supported. Works independently but complements Emotional module.

### Implementation for User Story 3

- [X] T057 [US3] Enhance companionService to detect user emotional state from messages (sad, stressed, lonely, happy, neutral, per contracts/companion-service.md) - Implemented in CompanionScreen handleSendMessage
- [X] T058 [US3] Update generateCompanionDialogue prompt construction to include userEmotionalState context and adjust tone accordingly (per FR-006, FR-011) - Already includes emotionalContext and conversational tone requirements
- [X] T059 [US3] Implement mood updates based on user emotional expressions in CompanionScreen (user sadness/stress → character mood becomes "concerned", positive interaction → "happy", per data-model.md) - Implemented in CompanionScreen handleSendMessage
- [X] T060 [US3] Update dialogue templates in baiqi.json to include emotional response templates (sadness, stress, lonely, happy, neutral, per data-model.md) - Templates already exist in baiqi.json
- [X] T061 [US3] Enhance ConversationBubble to display character mood through visual indicators (subtle color changes, icon variations, per FR-011) - Border color changes based on mood
- [X] T062 [US3] Add scene background variations based on character mood in CompanionScreen (per FR-025) - SceneBackground now supports mood prop with color variations
- [X] T063 [US3] Update CharacterIllustration component to display mood-specific illustrations based on characterState.mood (per FR-003, FR-011) - CharacterIllustration now supports mood prop
- [X] T064 [US3] Integrate CharacterIllustration mood variations in CompanionScreen and HomeScreen - CharacterLayer (used in both) now supports mood prop
- [X] T065 [US3] Add i18n keys for emotional support dialogue to `src/i18n/locales/en.ts` and `src/i18n/locales/zh.ts` - Companion i18n keys already exist

**Checkpoint**: All user stories should now be independently functional - companion provides emotional support, responds empathetically to user emotions, mood reflects interaction patterns

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T066 [P] Create ChoiceDialogue component `src/components/companion/ChoiceDialogue.tsx` for occasional choice-based dialogue (2-5 options, very limited use, per FR-007)
- [X] T067 [P] Add character illustration embedding support in ConversationBubble (characterImageUrl prop, per FR-027)
- [ ] T068 [P] Implement conversation history export functionality (JSON/CSV format, per data-model.md Privacy section)
- [ ] T069 [P] Implement conversation history deletion functionality with confirmation (per data-model.md Privacy section)
- [ ] T070 [P] Implement character state reset functionality with option to preserve closeness level (per data-model.md Privacy section)
- [ ] T071 [P] Add loading states and error handling for all companion service calls
- [ ] T072 [P] Optimize character image loading and caching (per NFR-003)
- [ ] T073 [P] Add accessibility support (ARIA labels, keyboard navigation, screen reader support, per FR-030 Mobile-First)
- [ ] T074 [P] Verify all glassmorphism components use consistent styling per FR-030B (background rgba(255,255,255,0.15), blur(25px), border, glow)
- [ ] T075 [P] Verify all icons use lucide-react instead of emoji per FR-033
- [ ] T076 [P] Update Layout component `src/components/shared/Layout.tsx` to hide Header on /health route (per FR-036)
- [ ] T077 [P] Verify Floating Bottom Bar navigation hides on /health route (per FR-034, FR-036)
- [ ] T078 [P] Add performance monitoring for dialogue generation response times (verify <2s per NFR-001)
- [ ] T079 [P] Add performance monitoring for character state updates (verify <500ms per NFR-002)
- [ ] T080 [P] Code cleanup and refactoring across all companion components
- [ ] T081 [P] Documentation updates: Add companion system usage guide

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P2)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1 components but should be independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Enhances US1 conversation experience but should be independently testable

### Within Each User Story

- Models/Components before services
- Services before integration
- Core implementation before UI polish
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002, T003, T004, T005)
- All Foundational tasks marked [P] can run in parallel (T008-T021)
- Once Foundational phase completes, User Stories 1, 2, and 3 can start in parallel (if team capacity allows)
- All Polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch foundational storage services together:
Task: "Create character state storage service in src/services/storage/characterStateStorage.ts"
Task: "Create conversation storage service in src/services/storage/conversationStorage.ts"

# Launch foundational hooks together:
Task: "Create character state management hook in src/hooks/useCharacterState.ts"
Task: "Create conversation history management hook in src/hooks/useConversation.ts"
Task: "Create proactive dialogue hook in src/hooks/useProactiveDialogue.ts"

# Launch foundational components together:
Task: "Create CharacterAvatar component in src/components/companion/CharacterAvatar.tsx"
Task: "Create CharacterIllustration component in src/components/companion/CharacterIllustration.tsx"
Task: "Create ImageBackground component in src/components/shared/ImageBackground.tsx"
Task: "Create SceneBackground component in src/components/shared/SceneBackground.tsx"
Task: "Create FloatingParticles component in src/components/shared/FloatingParticles.tsx"
Task: "Create CharacterLayer component in src/components/shared/CharacterLayer.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add Polish → Final release
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (HomeScreen, CompanionScreen, core conversation)
   - Developer B: User Story 2 (FunctionSpheres, RadialMenu, Health integration)
   - Developer C: User Story 3 (Emotional support, mood variations)
3. Stories complete and integrate independently
4. All developers contribute to Polish phase

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All glassmorphism components must follow FR-030B styling consistently
- All icons must use lucide-react (no emoji) per FR-033
- Character dialogue must use conversational boyfriend tone, not formal manual-style language per FR-037(9) clarification

---

## Task Summary

- **Total Tasks**: 81
- **Setup Tasks**: 5 (T001-T005)
- **Foundational Tasks**: 16 (T006-T021)
- **User Story 1 Tasks**: 15 (T022-T036)
- **User Story 2 Tasks**: 20 (T037-T056)
- **User Story 3 Tasks**: 9 (T057-T065)
- **Polish Tasks**: 16 (T066-T081)

### Parallel Opportunities Identified

- **Setup Phase**: 4 parallel tasks (T002-T005)
- **Foundational Phase**: 15 parallel tasks (T008-T021)
- **User Stories**: Can run in parallel after Foundational (US1, US2, US3)
- **Polish Phase**: 16 parallel tasks (T066-T081)

### Independent Test Criteria

- **User Story 1**: Open app → receive greeting → have conversation → see relationship grow → works independently
- **User Story 2**: Companion suggests activity → user completes → companion acknowledges → works independently with Health module integration
- **User Story 3**: User expresses emotion → receives empathetic response → mood reflects interaction → works independently, enhances US1

### Suggested MVP Scope

**MVP = User Story 1 Only** (Phase 3: T022-T036)
- Core companion interaction
- Daily greetings
- Conversation history
- Relationship growth
- Emotional support foundation

This provides the foundational companion experience. User Stories 2 and 3 can be added incrementally.
