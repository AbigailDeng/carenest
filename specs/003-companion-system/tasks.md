---
description: "Task list for Companion Character System feature implementation"
---

# Tasks: Companion Character System

**Input**: Design documents from `/specs/003-companion-system/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Manual testing and visual verification (no automated test suite specified per plan.md)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `public/` at repository root
- **Web app**: React SPA with component-based architecture
- Paths shown below assume single project structure per plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 [P] Verify project structure matches plan.md (src/components/companion/, src/hooks/, src/services/, src/config/characters/)
- [X] T002 [P] Verify TypeScript 5.x and React 18.x dependencies in package.json
- [X] T003 [P] Verify Tailwind CSS configuration supports glassmorphism (backdrop-filter, rgba backgrounds)
- [X] T004 [P] Verify IndexedDB setup (idb library) in src/db.ts
- [X] T005 [P] Verify Framer Motion dependency for animations
- [X] T006 [P] Verify Lucide React dependency for icons
- [X] T007 [P] Verify date-fns dependency for time-of-day awareness
- [X] T008 [P] Verify i18n setup (src/i18n/locales/zh.ts, en.ts) with companion-related translations

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Data Model & Types

- [X] T009 [P] Verify CharacterState type definition in src/types.ts (id, closeness, mood, energy, lastInteractionTime, totalInteractions, relationshipStage, createdAt, updatedAt)
- [X] T010 [P] Verify ConversationMessage type definition in src/types.ts (id, characterId, timestamp, sender, content, messageType, choices?, characterImageUrl?, context?)
- [X] T011 [P] Verify CharacterConfig type definition in src/types.ts (id, name, avatarUrl, illustrationUrls, backgroundUrls, dialogueTemplates, stateThresholds, personality)
- [X] T012 [P] Verify CharacterMood and RelationshipStage type definitions in src/types.ts
- [X] T013 [P] Verify CompanionDialogueInput and CompanionDialogueOutput types in src/types.ts

### IndexedDB Stores

- [X] T014 Verify characterStates object store exists in src/db.ts with id as key path and lastInteractionTime index
- [X] T015 Verify conversations object store exists in src/db.ts with characterId, timestamp, and characterId_timestamp compound index
- [X] T016 Verify database migration logic handles characterStates and conversations stores creation

### Character Configuration

- [X] T017 [P] Create character configuration file src/config/characters/baiqi.json with name, avatarUrl, illustrationUrls, backgroundUrls, dialogueTemplates, stateThresholds, personality
- [X] T018 [P] Verify getCharacterConfig function in src/config/characters/index.ts loads baiqi.json correctly
- [X] T019 [P] Add character name translations to src/i18n/locales/zh.ts and en.ts (companion.characterName: "白起" / "Bai Qi")

### Storage Services

- [X] T020 [P] Verify characterStateStorage.ts exists in src/services/storage/ with getCharacterState, saveCharacterState, updateCharacterState, incrementCloseness functions
- [X] T021 [P] Verify conversationStorage.ts exists in src/services/storage/ with saveMessage, getConversationHistory, deleteConversationHistory functions
- [X] T022 [P] Verify indexedDB.ts helper exists in src/services/storage/ for low-level IndexedDB operations

### Core Hooks

- [X] T023 [P] Verify useCharacterState hook exists in src/hooks/useCharacterState.ts with state loading, updateMood, incrementCloseness, updateEnergy, updateEnergyByTimeOfDay, getRelationshipStage
- [X] T024 [P] Verify useCompanion hook exists in src/hooks/useCompanion.ts wrapping useCharacterState with initializeCharacter and updateState
- [X] T025 [P] Verify useConversation hook exists in src/hooks/useConversation.ts with sendMessage, loadHistory, clearHistory functions
- [X] T026 [P] Verify useProactiveDialogue hook exists in src/hooks/useProactiveDialogue.ts with shouldTriggerProactive, generateProactiveMessage functions

### LLM Service Integration

- [X] T027 Verify llmService.ts exists in src/services/llmService.ts with callLLM function for Gemini API via HyperEcho Proxy
- [X] T028 Verify companionService.ts exists in src/services/companionService.ts with generateGreeting, generateResponse, updateCharacterState, incrementCloseness functions
- [X] T029 Verify companionService.ts implements template fallback when LLM fails or times out (>2 seconds)
- [X] T030 Verify companionService.ts includes safety guardrails (non-diagnostic, empathetic tone) per Principle 1 and 2

### Shared UI Components

- [X] T031 [P] Verify ImageBackground component exists in src/components/shared/ImageBackground.tsx with breathing animation (scale 1.0-1.03, translateY 0px to -10px, 7s cycle)
- [X] T032 [P] Verify CharacterLayer component exists in src/components/companion/CharacterLayer.tsx for character illustration display
- [X] T033 [P] Verify CharacterAvatar component exists in src/components/companion/CharacterAvatar.tsx for avatar display (hardcoded to /images/images.jpg per spec)
- [X] T034 [P] Verify ConversationBubble component exists in src/components/companion/ConversationBubble.tsx with glassmorphism styling (rgba(255,255,255,0.15), backdrop-filter blur(25px), border 1px rgba(255,255,255,0.4))
- [X] T035 [P] Verify FloatingParticles component exists in src/components/companion/FloatingParticles.tsx for decorative particles

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Daily Companion Interaction (Priority: P1) 🎯 MVP

**Goal**: Users want to feel like they're interacting with a real person who cares about them, reducing loneliness and providing emotional support through daily conversations.

**Independent Test**: Can be fully tested by opening the app, receiving a greeting from the companion, engaging in conversation, and feeling emotionally supported. Works independently of functional modules.

### Implementation for User Story 1

#### Home Screen (Root Path "/")

- [X] T036 [US1] Verify HomeScreen component exists in src/components/companion/HomeScreen.tsx
- [X] T037 [US1] Implement full-screen ImageBackground in HomeScreen with background image `/images/DM_20260123234921_001.jpg` per spec Session 2026-01-25
- [X] T038 [US1] Implement CharacterLayer in HomeScreen displaying character illustration with breathing animation (only character floats, other UI static) per spec Session 2026-01-25
- [X] T039 [US1] Implement FloatingParticles in HomeScreen for decorative effect (count 20)
- [X] T040 [US1] Implement state-aware greeting dialogue bubble in HomeScreen using useCompanion and companionService.generateGreeting
- [X] T041 [US1] Verify greeting reflects time-of-day (morning, afternoon, evening, night) using date-fns
- [X] T042 [US1] Verify greeting reflects character state (mood, closeness, relationshipStage) from useCompanion
- [X] T043 [US1] Implement CharacterAvatar in greeting dialogue bubble per FR-026 (hardcoded to /images/images.jpg)
- [X] T044 [US1] Verify greeting dialogue uses glassmorphism styling per FR-030B

#### Function Spheres Navigation

- [X] T045 [US1] Implement FunctionSpheres component in src/components/companion/FunctionSpheres.tsx with three circular glassmorphism buttons (Health, Nutrition, Emotion) vertically stacked per FR-031I
- [X] T046 [US1] Verify FunctionSpheres positioned at upper right corner (right-5, top: safe-area-inset-top + 20px) per FR-031I
- [X] T047 [US1] Verify FunctionSpheres uses glassmorphism styling per FR-030B (background rgba(255,255,255,0.2), backdrop-filter blur(20px), border 1px rgba(255,255,255,0.5))
- [X] T048 [US1] Verify FunctionSpheres icons use lucide-react (HeartPulse for Health, Leaf for Nutrition, Heart or Smile for Emotion), color #FF7E9D, size 48x48px per FR-031I
- [X] T049 [US1] Verify FunctionSpheres navigation: top sphere → /health, middle sphere → /nutrition, bottom sphere → /emotional per FR-031I
- [X] T050 [US1] Add FunctionSpheres to HomeScreen component (/) per FR-031I
- [X] T051 [US1] Verify FunctionSpheres appears ONLY on home screen (/) per spec Session 2026-01-25 clarification (NOT on /health, /nutrition, /emotional routes)

#### Companion Screen (Conversation Interface)

- [X] T052 [US1] Verify CompanionScreen component exists in src/components/companion/CompanionScreen.tsx
- [X] T053 [US1] Implement conversation interface in CompanionScreen with chat-like bubbles (character left-aligned, user right-aligned) per FR-024
- [X] T054 [US1] Implement useConversation hook integration in CompanionScreen for message history
- [X] T055 [US1] Implement user message input in CompanionScreen with send functionality
- [X] T056 [US1] Implement companion response generation in CompanionScreen using companionService.generateResponse
- [X] T057 [US1] Verify companion responses reflect character state (mood, closeness, relationshipStage) and conversation context
- [X] T058 [US1] Implement CharacterAvatar next to character messages per FR-026 (hardcoded to /images/images.jpg)
- [X] T059 [US1] Implement conversation history persistence using conversationStorage.saveMessage
- [X] T060 [US1] Implement conversation history loading using conversationStorage.getConversationHistory
- [X] T061 [US1] Verify conversation messages display with timestamps and proper formatting
- [X] T062 [US1] Implement scene background in CompanionScreen (cityscape with floral overlays) that can change based on time-of-day or mood per FR-025
- [X] T063 [US1] Implement navigation header in CompanionScreen with back button, character name, and optional action buttons per FR-028
- [X] T064 [US1] Implement call-to-action footer in CompanionScreen (e.g., "Contact by phone", "Chat freely") per FR-029

#### Proactive Dialogue

- [X] T065 [US1] Implement proactive greeting trigger in HomeScreen using useProactiveDialogue hook
- [X] T066 [US1] Verify proactive greeting triggers on app open
- [X] T067 [US1] Verify proactive greeting triggers based on time-of-day (morning/evening)
- [X] T068 [US1] Verify proactive greeting triggers after inactivity period (several hours)
- [X] T069 [US1] Verify proactive greeting reflects character state (closeness, mood, energy) per FR-004

#### Character State Updates

- [X] T070 [US1] Implement closeness increment after user interaction in CompanionScreen using useCompanion.incrementCloseness
- [X] T071 [US1] Verify closeness increases with daily interactions (increment 1-5 points based on interaction type)
- [X] T072 [US1] Implement relationshipStage update when closeness threshold crossed using CharacterConfig.stateThresholds
- [X] T073 [US1] Implement mood update based on user interactions and time-of-day using useCompanion.updateMood
- [X] T074 [US1] Implement energy update based on time-of-day and interaction frequency using useCompanion.updateEnergyByTimeOfDay
- [X] T075 [US1] Verify character state persists to IndexedDB after each update

#### Relationship Metrics Display

- [X] T076 [US1] Implement RelationshipBadge component in src/components/companion/RelationshipBadge.tsx displaying closeness level visually per FR-009
- [X] T077 [US1] Display RelationshipBadge on character avatar or in navigation header
- [X] T078 [US1] Verify RelationshipBadge shows relationshipStage (stranger, acquaintance, friend, close_friend, intimate) based on closeness thresholds

#### Choice-Based Dialogue (Limited Use)

- [X] T079 [US1] Implement ChoiceDialogue component in src/components/companion/ChoiceDialogue.tsx for 2-5 predefined response options per FR-007
- [X] T080 [US1] Verify ChoiceDialogue uses glassmorphism styling per FR-030B
- [X] T081 [US1] Implement occasional choice-based dialogue in CompanionScreen (very limited use per FR-007)

#### Character Illustration Embedding

- [X] T082 [US1] Implement support for embedding full character illustrations within dialogue bubbles per FR-027
- [X] T083 [US1] Verify characterImageUrl field in ConversationMessage is used to display illustrations in dialogue

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Users can open the app, receive greetings, engage in conversation, see relationship metrics, and feel emotionally supported.

---

## Phase 4: User Story 2 - Companion-Guided Health Activities (Priority: P2)

**Goal**: Users want to engage in health tracking activities (symptom logging, meal recording) framed as "doing things together" with the companion, rather than completing tasks alone.

**Independent Test**: Can be fully tested by the companion suggesting a health activity, user completing it through conversation, and receiving encouraging feedback. Integrates with existing Health module.

### Implementation for User Story 2

#### Activity Suggestion Dialogue

- [X] T084 [US2] Implement activity suggestion dialogue in CompanionScreen using companionService.generateResponse with integrationHint
- [X] T085 [US2] Verify companion suggests logging symptoms or meals based on time-of-day (meal times) per FR-016
- [X] T086 [US2] Verify companion suggests activities based on pattern detection (inactive health logging for several days) per FR-017
- [X] T087 [US2] Verify activity suggestions use empathetic, non-pushy tone per FR-019

#### Navigation to Functional Modules

- [X] T088 [US2] Implement navigation from companion dialogue to Health module screens (e.g., /health/symptoms) when user accepts suggestion
- [X] T089 [US2] Implement navigation from companion dialogue to Nutrition module screens when user accepts suggestion
- [X] T090 [US2] Verify navigation maintains companion context (character state, conversation history)

#### Health Details Page ("Private Ledger" Layout)

- [X] T091 [US2] Verify HealthHomeScreen component exists in src/components/shared/Layout.tsx
- [X] T092 [US2] Implement ImageBackground wrapper in HealthHomeScreen with character illustration `/images/1cb7398bea6d251b67d50b965c4295130983e2771863c5-oVQb7P_fw658webp.webp` per spec Session 2026-01-25
- [X] T093 [US2] Implement SceneBackground and FloatingParticles in HealthHomeScreen (same as home screen) per FR-036
- [X] T094 [US2] Implement CharacterLayer in HealthHomeScreen with breathing animation per FR-036
- [X] T095 [US2] Remove "上传医疗记录" (Upload Medical Record) card from HealthHomeScreen per spec Session 2026-01-25
- [X] T096 [US2] Implement "Private Ledger" layout with two overlapping fan-shaped glassmorphism cards per FR-035: "记录症状" (Log Symptoms), "查看时间线" (View Timeline)
- [X] T097 [US2] Verify cards use glassmorphism styling: background rgba(255,255,255,0.15), backdrop-filter blur(25px), border 1px solid rgba(255,255,255,0.6) per FR-036
- [X] T098 [US2] Verify cards positioned in middle-lower screen area with fan overlap (vertical stack, staggered positioning) per spec Session 2026-01-25
- [X] T099 [US2] Implement companion dialogue bubble above cards: "这是我为你整理的记录，想先看哪一部分？" per FR-035
- [X] T100 [US2] Verify dialogue bubble uses glassmorphism styling and CharacterAvatar per FR-030B
- [X] T101 [US2] Implement glassmorphism back button (56x56px) in top-left corner per FR-035, FR-036
- [X] T102 [US2] Verify back button navigates to home page (/) per FR-035
- [X] T103 [US2] Verify bottom navigation bar hidden on /health route per FR-034

#### Companion Presence in Health Screens

- [X] T104 [US2] Verify SymptomLogScreen (/health/symptoms route) displays character illustration background (same as Health Details Page) per spec Session 2026-01-25
- [X] T105 [US2] Implement ImageBackground, SceneBackground, FloatingParticles, CharacterLayer in SymptomLogScreen per FR-037
- [X] T106 [US2] Implement character dialogue bubble at Bai Qi's shoulder level (top-20, left-aligned) with CharacterAvatar per FR-037
- [X] T107 [US2] Verify dialogue bubble displays "哪里不舒服吗？别瞒着我。" / "What's bothering you? Don't hide it from me." per FR-037
- [X] T108 [US2] Verify dialogue bubble uses premium glassmorphism styling (background rgba(255,255,255,0.15), backdrop-filter blur(35px), border 1.5px solid rgba(255,255,255,0.4)) per FR-037
- [X] T109 [US2] Verify dialogue bubble positioned at top-20 (80px from top) with content area starting at paddingTop: 180px to prevent overlap per spec Session 2026-01-25
- [X] T110 [US2] Implement simplified conversational form: single "自由描述区" (free description area) textarea, remove severity selector and notes field per FR-037
- [X] T111 [US2] Implement border-free input styling: subtle bottom border or background depth variation per FR-037
- [X] T112 [US2] Implement dynamic emotional placeholder text (rotating 2-3 variations) per FR-037
- [X] T113 [US2] Implement paperclip icon (28-32px) at top-right of textarea container for image upload per FR-037
- [X] T114 [US2] Implement separate upload preview area below textarea with "已上传的病历" label per FR-037
- [X] T115 [US2] Implement Polaroid-style image previews (white border, shadow, tilted rotation) per FR-037
- [X] T116 [US2] Implement AI conclusion dialogue bubble replacement: initial prompt bubble replaced by AI analysis results per spec Session 2026-01-25
- [X] T117 [US2] Verify AI conclusion uses same positioning and styling as initial prompt bubble per spec Session 2026-01-25
- [X] T118 [US2] Verify AI conclusion uses conversational boyfriend tone (not formal manual-style language) per spec Session 2026-01-25 UX Refinements
- [X] T119 [US2] Implement conversational button labeling: "交给他看看" / "Let him take a look" instead of "AI Diagnosis" per spec Session 2026-01-25
- [X] T120 [US2] Add i18n keys: health.symptoms.letHimLook, health.symptoms.analyzing ("他正在为你分析症状"), health.symptoms.rememberedInHeart per spec Session 2026-01-25
- [X] T121 [US2] Implement fixed bottom buttons (equal width, glassmorphism styling) per FR-037
- [X] T122 [US2] Implement glassmorphism back button in top-left corner (no title text) per FR-037
- [X] T123 [US2] Verify SymptomAnalysisScreen (/health/symptoms/:id route) uses same background styling as SymptomLogScreen per spec Session 2026-01-25
- [X] T124 [US2] Verify dialogue bubble scrolling: AI analysis bubble has fixed outer height 180px, inner content scrollable per spec Session 2026-01-25

#### Activity Acknowledgment

- [X] T125 [US2] Implement activity acknowledgment dialogue in CompanionScreen when user returns from functional module
- [X] T126 [US2] Verify companion acknowledges user actions (symptom logged, meal recorded) with encouraging feedback per FR-018
- [X] T127 [US2] Verify acknowledgment dialogue reflects character state and uses "doing things together" framing per FR-019
- [X] T128 [US2] Implement closeness increment after activity completion using useCompanion.incrementCloseness

#### Nutrition Module Integration

- [X] T129 [US2] Implement Nutrition Details Page (/nutrition route) with "Private Ledger" layout matching Health Details Page per spec Session 2026-01-25
- [X] T130 [US2] Verify Nutrition Details Page uses different character illustration from Health page per spec Session 2026-01-25
- [X] T131 [US2] Implement Nutrition Timeline Calendar Screen in src/components/nutrition/NutritionTimelineScreen.tsx (visual + layout parity with /health/timeline?view=calendar) per spec Session 2026-01-25 clarification
- [X] T132 [US2] Add discoverable entry to /nutrition/timeline from /nutrition page in src/components/shared/Layout.tsx (Private Ledger card) per spec Session 2026-01-25 clarification
- [X] T133 [US2] Implement Nutrition Reflection Screen (/nutrition/reflection route) style consistency: ImageBackground with nutrition-specific illustration, FloatingParticles, CharacterAvatar dialogue bubble, glassmorphism for all UI elements per spec Session 2026-01-25 clarification
- [X] T134 [US2] Implement Nutrition Reflection "saved record detail mode" in src/components/nutrition/FoodReflectionScreen.tsx for /nutrition/reflection?date=YYYY-MM-DD&mealType=MealType per spec Session 2026-01-25
- [X] T135 [US2] Add /nutrition/reflection/:id route to src/components/shared/Layout.tsx routing configuration (mirroring /health/symptoms/:id pattern) per FR-040
- [X] T136 [US2] Create NutritionReflectionDetailScreen component in src/components/nutrition/NutritionReflectionDetailScreen.tsx for /nutrition/reflection/:id route (read-only detail page) per FR-040
- [X] T137 [US2] Implement NutritionReflectionDetailScreen: load FoodReflection by ID, display record details, show processingStatus states, render AI analysis as structured sections per FR-040
- [X] T138 [US2] Verify NutritionReflectionDetailScreen visual consistency with SymptomAnalysisScreen except background illustration per FR-040
- [X] T139 [US2] Update NutritionTimelineScreen handleView function: change timeline list item click navigation to /nutrition/reflection/:id (using FoodReflection.id) per FR-040
- [X] T140 [US2] Verify back button on /nutrition/reflection route navigates to /nutrition/timeline per spec Session 2026-01-27 clarification
- [X] T141 [US2] Verify AI analysis results displayed ONLY in dialogue bubble on Nutrition Reflection creation page (not structured sections) per spec Session 2026-01-27 clarification
- [X] T142 [US2] Implement toast notification for save success feedback on Nutrition Reflection page per spec Session 2026-01-27 clarification
- [X] T143 [US2] Update Nutrition Input Screen (/nutrition/input route) visual consistency and integrate meal suggestions per FR-041: ImageBackground with nutrition-specific illustration `/images/008fP45sly1hreaeb88b2j323s35s1l1.jpg`, FloatingParticles (count 20), CharacterAvatar dialogue bubble at top-20 left-aligned with nutrition.input.prompt i18n key, glassmorphism styling (background rgba(255,255,255,0.85), blur(10px)), back button navigates to /nutrition, fixed bottom buttons with equal width, integrate meal suggestions directly into screen (NO separate /nutrition/suggestions route), display suggestions below input form in scrollable area when "Generate Suggestions" clicked, input form remains visible above suggestions, replace "Generate Suggestions" button with "New Search" after suggestions displayed, remove /nutrition/suggestions route from routing configuration in src/components/nutrition/NutritionInputScreen.tsx and src/navigation/routes.tsx

#### Integration with Existing Modules

- [X] T144 [US2] Verify companion dialogue suggestions integrate with existing Health module routes (/health, /health/symptoms, /health/timeline)
- [X] T145 [US2] Verify companion dialogue suggestions integrate with existing Nutrition module routes
- [X] T146 [US2] Verify functional module interfaces remain independent (users can access via function spheres, radial menu, bottom nav, or companion dialogue) per FR-017

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Users can receive activity suggestions, complete health activities with companion presence, and receive encouraging feedback.

---

## Phase 5: User Story 3 - Emotional Support Through Conversation (Priority: P2)

**Goal**: Users want to express feelings, receive empathetic responses, and feel less alone through natural conversation with the companion.

**Independent Test**: Can be fully tested by user expressing emotions in conversation, receiving empathetic responses, and feeling emotionally supported. Works independently but complements Emotional module.

### Implementation for User Story 3

#### Emotional Response Generation

- [X] T147 [US3] Enhance companionService.generateResponse to detect emotional content in user messages
- [X] T148 [US3] Verify companion responses to emotional expressions are empathetic and non-judgmental per Principle 2
- [X] T149 [US3] Verify companion responses reflect current closeness level (higher closeness → more intimate support) per FR-015
- [X] T150 [US3] Verify companion responses reflect character mood (concerned mood → more empathetic tone) per FR-011
- [X] T151 [US3] Verify companion responses do not provide medical advice (only emotional support and gentle guidance) per Principle 1
- [X] T152 [US3] Verify companion responses use conversational boyfriend tone (not formal manual-style language) per spec Session 2026-01-25 UX Refinements

#### Context-Aware Dialogue

- [X] T153 [US3] Implement conversation context tracking in CompanionScreen (recent messages, emotional state)
- [X] T154 [US3] Verify companion responses reference previous conversation context when appropriate
- [X] T155 [US3] Verify companion responses adapt based on user's emotional state (sad → supportive, stressed → calming)

#### Gentle Guidance to Functional Modules

- [X] T156 [US3] Implement gentle guidance dialogue in CompanionScreen when user shares health concerns
- [X] T157 [US3] Verify companion gently guides toward relevant functional modules (Health, Nutrition, Emotion) without being pushy per FR-016
- [X] T158 [US3] Verify guidance dialogue maintains emotional support focus (not task-oriented) per FR-019

#### Relationship Stage Influence

- [X] T159 [US3] Verify companion responses adapt based on relationshipStage (stranger → warm but appropriate, intimate → more personal) per FR-015
- [X] T160 [US3] Verify low closeness level responses are warm but appropriately distant per spec User Story 3

#### Emotional Support Dialogue Templates

- [X] T161 [US3] Verify CharacterConfig.dialogueTemplates.responses includes emotion-based templates per data-model.md
- [X] T162 [US3] Verify template fallback uses emotional support templates when LLM fails per FR-006

#### /emotional Route - Chat-Style Conversation Interface (FR-042, FR-043)

- [X] T199 [US3] Implement home page conversation input navigation to /emotional route: when user sends message on home page (clicks send button), immediately navigate to /emotional route with user's message in src/components/companion/HomeScreen.tsx per FR-042
- [X] T200 [US3] Create EmotionalScreen component in src/components/companion/EmotionalScreen.tsx for /emotional route per FR-043
- [X] T201 [US3] Implement chat-style layout in EmotionalScreen: message bubbles (user messages right-aligned with user avatar, AI messages left-aligned with CharacterAvatar) per FR-043
- [X] T202 [US3] Implement full-screen character illustration background in EmotionalScreen using ImageBackground component with character illustration from public/images directory (different from Health and Nutrition pages) per FR-043
- [X] T203 [US3] Implement FloatingParticles component in EmotionalScreen (count 20) with same breathing animation as other pages per FR-043
- [X] T204 [US3] Implement glassmorphism styling for message bubbles in EmotionalScreen: background rgba(255,255,255,0.15), backdrop-filter blur(25px), border 1px solid rgba(255,255,255,0.4) per FR-043
- [X] T205 [US3] Implement conversation history display in EmotionalScreen: scrollable area with messages and timestamps per FR-043
- [X] T206 [US3] Implement input field in EmotionalScreen: fixed at bottom of screen, glassmorphism styling matching other pages, text input and send button per FR-043
- [X] T207 [US3] Verify input field does NOT overlap with message area in EmotionalScreen per FR-043
- [X] T208 [US3] Implement navigation header in EmotionalScreen: glassmorphism back button (44x44px minimum) in top-left corner navigating to home page (/) per FR-043
- [X] T209 [US3] Verify bottom navigation bar hidden on /emotional route (same as /health and /nutrition routes) in src/components/shared/Layout.tsx per FR-043
- [X] T210 [US3] Implement continuous conversation flow in EmotionalScreen: support multiple messages, display AI responses with CharacterAvatar icon on left side per FR-043
- [X] T211 [US3] Verify visual consistency: same typography (#4A4A4A text color) and color scheme as Health and Nutrition pages per FR-043
- [X] T212 [US3] Add /emotional route to routing configuration in src/components/shared/Layout.tsx pointing to EmotionalScreen component per FR-043

#### AI Personality Blending - Boyfriend + Psychologist Fusion (FR-044)

- [X] T213 [US3] Enhance companionService.generateResponse to implement blended boyfriend/psychologist fusion personality: simultaneously embody both traits naturally integrated per FR-044
- [X] T214 [US3] Update LLM prompt construction in companionService.ts to include blended personality guidelines: caring boyfriend who also provides professional psychological support per FR-044
- [X] T215 [US3] Verify AI responses avoid formal clinical language, use conversational first-person tone (e.g., "我注意到你提到...这让我有点担心" / "I noticed you mentioned...this worries me a bit") per FR-044
- [X] T216 [US3] Verify AI responses balance emotional support with professional insights per FR-044
- [X] T217 [US3] Verify AI maintains consistent personality throughout conversation (not switching between roles) per FR-044
- [X] T218 [US3] Update dialogue templates in CharacterConfig to reflect blended personality (warmth + professional guidance) per FR-044

#### Realistic Conversation Mechanisms (FR-045)

- [X] T219 [US3] Implement memory continuity in companionService.generateResponse: AI MUST remember previous conversation content, reference past topics, demonstrate memory of user's shared information (e.g., "你之前提到过..." / "You mentioned before...") per FR-045
- [X] T220 [US3] Enhance conversationStorage.getConversationHistory to support querying recent messages (last 10-20 messages) for memory continuity context per FR-045
- [X] T221 [US3] Update companionService.generateResponse to incorporate context from previous messages in same conversation session per FR-045
- [X] T222 [US3] Implement emotional variation display in EmotionalScreen: AI MUST display different emotional states (happy, concerned, comforting, energetic, etc.) based on conversation content per FR-045
- [X] T223 [US3] Implement dynamic character mood updates in EmotionalScreen: character mood changes based on user's emotional expressions per FR-045
- [X] T224 [US3] Implement visual indicators for emotional state in EmotionalScreen: CharacterAvatar expression changes, dialogue bubble styling variations reflect emotional state per FR-045
- [X] T225 [US3] Implement response delay simulation in EmotionalScreen: "typing..." indicator (animated dots or typing animation) before displaying AI message per FR-045
- [X] T226 [US3] Verify response delay is reasonable (1-3 seconds minimum, up to 5 seconds for longer responses) and varies slightly (not fixed timing) per FR-045
- [X] T227 [US3] Verify typing indicator appears immediately after user sends message and disappears when AI response is ready to display per FR-045
- [X] T228 [US3] Create useEmotionalConversation hook in src/hooks/useEmotionalConversation.ts for dedicated emotional conversation management with memory continuity, emotional variation, and response delay support per FR-045
- [X] T229 [US3] Integrate useEmotionalConversation hook in EmotionalScreen component per FR-045
- [X] T230 [US3] Update ConversationContext type in src/types.ts to include emotionalState field for tracking character's emotional state during message per data-model.md updates

**Checkpoint**: At this point, all user stories should be independently functional. Users can express emotions, receive empathetic responses, and feel emotionally supported through natural conversation. The /emotional route provides dedicated chat-style conversation interface with realistic conversation mechanisms (memory continuity, emotional variation, response delay) and blended boyfriend/psychologist AI personality.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### UI/UX Polish

- [X] T163 [P] Verify all dialogue bubbles use consistent glassmorphism styling per FR-030B across all screens
- [X] T164 [P] Verify all character illustrations use consistent breathing animation (only character floats, other UI static) per spec Session 2026-01-25
- [ ] T165 [P] Verify otome/dating-sim aesthetic (ornate decorative elements, romantic color palette, elaborate borders) per FR-030
- [ ] T166 [P] Verify mobile-first design (44x44px minimum touch targets, 20-24px screen edge padding) per FR-034, FR-035, FR-036
- [ ] T167 [P] Verify WCAG 2.1 AA compliance (4.5:1 text contrast, keyboard navigation, screen reader support) per FR-035
- [X] T168 [P] Verify full-screen background and edge-to-edge layout: ImageBackground uses position fixed, body/html background transparent, content layer uses relative positioning per spec Session 2026-01-25
- [X] T169 [P] Verify Nutrition Details Page (/nutrition route) matches Health Details Page styling: ImageBackground, FloatingParticles, CharacterLayer, glassmorphism cards per spec Session 2026-01-25
- [X] T170 [P] Verify all character avatars use hardcoded `/images/images.jpg` path per spec Session 2026-01-25
- [X] T171 [P] Verify home screen uses `/images/DM_20260123234921_001.jpg` background per spec Session 2026-01-25
- [X] T172 [P] Verify health screens use `/images/1cb7398bea6d251b67d50b965c4295130983e2771863c5-oVQb7P_fw658webp.webp` character illustration per spec Session 2026-01-25
- [X] T173 [P] Remove all "AI" references from user-facing text: "AI 正在分析症状" → "他正在为你分析症状", "AI处理中" → "处理中" per spec Session 2026-01-25
- [X] T174 [P] Verify nutrition pages use `/images/008fP45sly1hreaeb88b2j323s35s1l1.jpg` character illustration per spec Session 2026-01-25

### Performance Optimization

- [ ] T175 [P] Verify character dialogue generation response time <2 seconds per NFR-001
- [ ] T176 [P] Verify character state updates complete <500ms without blocking UI per NFR-002
- [ ] T177 [P] Verify character image loading <1 second for cached assets per NFR-003
- [ ] T178 [P] Verify 60fps animations for character breathing and UI transitions
- [ ] T179 [P] Verify smooth scrolling and touch interactions on mobile devices
- [X] T180 [P] Verify home screen greeting generation occurs exactly once per page load per NFR-008

### Error Handling & Offline Support

- [X] T181 [P] Verify graceful degradation when LLM API fails (template fallback) per NFR-006
- [X] T182 [P] Verify clear error messaging when offline (encouraging, non-judgmental tone) per Principle 2
- [X] T183 [P] Verify conversation history loads correctly from IndexedDB after page refresh

### Data Management

- [ ] T184 [P] Verify conversation history supports at least 1 year (3,650 messages estimated) per NFR-004
- [X] T185 [P] Verify users can delete conversation history per NFR-009
- [X] T186 [P] Verify character state persists correctly across sessions

### Internationalization

- [X] T187 [P] Verify all companion dialogue text is internationalized (zh.ts, en.ts) per FR-022
- [X] T188 [P] Verify character names are internationalized per FR-022
- [X] T189 [P] Verify UI elements (buttons, labels) are internationalized
- [X] T190 [P] Add nutrition.ledgerPrompt i18n key for Nutrition Details Page dialogue per spec Session 2026-01-25
- [X] T191 [P] Add nutrition.reflection.prompt i18n key for Nutrition Reflection Screen dialogue per spec Session 2026-01-25
- [X] T192 [P] Add nutrition.input dialogue i18n keys for Nutrition Input Screen per FR-041

### Documentation & Testing

- [ ] T193 [P] Update component documentation in src/components/companion/ README if needed
- [ ] T194 [P] Run quickstart.md validation scenarios per quickstart.md test scenarios
- [ ] T195 [P] Verify all acceptance criteria from spec.md User Stories are met
- [ ] T196 [P] Manual testing: Daily Companion Interaction (User Story 1) per quickstart.md
- [ ] T197 [P] Manual testing: Companion-Guided Health Activities (User Story 2) per quickstart.md
- [ ] T198 [P] Manual testing: Emotional Support Through Conversation (User Story 3) per quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately ✅ Complete
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories ✅ Complete
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P2)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories ✅ Complete
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1 (uses companion dialogue) but should be independently testable - Mostly complete, T143 remaining
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Enhances US1 conversation but should be independently testable ✅ Complete

### Within Each User Story

- Core components before integration
- Character state management before dialogue generation
- Dialogue generation before UI display
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel ✅ Complete
- All Foundational tasks marked [P] can run in parallel (within Phase 2) ✅ Complete
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Components within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all component creation tasks for User Story 1 together:
Task: "Verify HomeScreen component exists in src/components/companion/HomeScreen.tsx"
Task: "Implement FunctionSpheres component in src/components/companion/FunctionSpheres.tsx"
Task: "Verify CompanionScreen component exists in src/components/companion/CompanionScreen.tsx"
Task: "Implement RelationshipBadge component in src/components/companion/RelationshipBadge.tsx"
Task: "Implement ChoiceDialogue component in src/components/companion/ChoiceDialogue.tsx"

# Launch all character state tasks together:
Task: "Implement closeness increment after user interaction"
Task: "Implement relationshipStage update when closeness threshold crossed"
Task: "Implement mood update based on user interactions"
Task: "Implement energy update based on time-of-day"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup ✅
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories) ✅
3. Complete Phase 3: User Story 1 ✅
4. **STOP and VALIDATE**: Test User Story 1 independently per quickstart.md
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready ✅
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!) ✅
3. Add User Story 2 → Test independently → Deploy/Demo (T143 remaining)
4. Add User Story 3 → Test independently → Deploy/Demo ✅
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together ✅
2. Once Foundational is done:
   - Developer A: User Story 1 ✅
   - Developer B: User Story 2 (T143 remaining)
   - Developer C: User Story 3 ✅
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Many tasks are "Verify" because some infrastructure may already exist - verify before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All character illustrations should use breathing animation (only character floats)
- All dialogue bubbles should use glassmorphism styling per FR-030B
- All companion dialogue should maintain empathetic, non-judgmental tone per Principle 2
- FunctionSpheres MUST appear ONLY on home screen (/) per latest spec Session 2026-01-25 clarification (NOT on /health, /nutrition, /emotional)

---

## Summary

**Total Task Count**: 230 tasks

**Task Count per Phase**:
- Phase 1 (Setup): 8 tasks ✅ All completed (100%)
- Phase 2 (Foundational): 27 tasks ✅ All completed (100%)
- Phase 3 (User Story 1 - P1 MVP): 48 tasks ✅ All completed (100%)
- Phase 4 (User Story 2 - P2): 63 tasks - 62 tasks completed, 1 remaining (T143 - Nutrition Input Screen visual consistency and meal suggestions integration) (98%)
- Phase 5 (User Story 3 - P2): 48 tasks - 19 tasks completed, 29 remaining (T201-T230 - /emotional route implementation, AI personality blending, realistic conversation mechanisms) (40%)
- Phase 6 (Polish): 36 tasks - 20 tasks completed, 16 remaining (56%)

**Parallel Opportunities Identified**:
- Setup phase: 8 parallel tasks ✅ Complete
- Foundational phase: 18 parallel tasks (marked [P]) ✅ Complete
- User Story 1: Multiple component creation tasks can run in parallel ✅ Complete
- User Story 2: Can run in parallel with User Story 3 after Foundational - T143 remaining
- Polish phase: 33 parallel tasks (16 remaining)

**Independent Test Criteria**:
- **User Story 1**: Open app → receive greeting → engage in conversation → feel emotionally supported ✅
- **User Story 2**: Companion suggests activity → user completes → receives encouraging feedback (T143 remaining: Nutrition Input Screen visual consistency and meal suggestions integration)
- **User Story 3**: Express emotions → receive empathetic responses → feel emotionally supported. NEW: Send message on home page → navigate to /emotional → chat-style conversation with memory continuity, emotional variation, response delay, blended boyfriend/psychologist personality (T199-T230 remaining)

**Suggested MVP Scope**: User Story 1 (Daily Companion Interaction) ✅ Complete

**Format Validation**: ✅ All tasks follow checklist format (checkbox, ID, labels, file paths)

**Remaining Critical Tasks**:
- T143 [US2]: Nutrition Input Screen visual consistency and meal suggestions integration per FR-041 (high priority: integrate suggestions into /nutrition/input, remove /nutrition/suggestions route)
- T201-T212 [US3]: /emotional route implementation per FR-042, FR-043 (high priority: chat-style interface, visual consistency) - T199, T200, T212 completed
- T213-T218 [US3]: AI personality blending per FR-044 (high priority: boyfriend/psychologist fusion personality)
- T219-T230 [US3]: Realistic conversation mechanisms per FR-045 (high priority: memory continuity, emotional variation, response delay)
- T165-T167 [P]: UI/UX polish verification (aesthetic, mobile-first, accessibility)
- T175-T179 [P]: Performance optimization verification
- T184 [P]: Data management verification (conversation history capacity)
- T190-T192 [P]: Internationalization keys for nutrition module
- T193-T198 [P]: Documentation and testing validation
