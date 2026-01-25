# Tasks: Companion Character System

**Input**: Design documents from `/specs/003-companion-system/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL - not explicitly requested in feature specification, so test tasks are excluded.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., [US1], [US2], [US3])
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/` at repository root
- Paths shown below follow single project structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Add lucide-react dependency to package.json (for linear icons replacing emoji)
- [X] T002 [P] Create directory structure: src/components/companion/, src/hooks/, src/services/storage/, src/config/characters/, src/assets/characters/
- [X] T003 [P] Create placeholder character asset directories: src/assets/characters/baiqi/avatar.png, src/assets/characters/baiqi/illustrations/, src/assets/characters/baiqi/backgrounds/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Extend src/types.ts with CharacterState, ConversationMessage, CharacterConfig, CharacterMood, RelationshipStage interfaces per data-model.md
- [X] T005 Extend src/db.ts with IndexedDB stores: characterState store (keyPath: 'id') and conversations store (keyPath: 'id', indexes: characterId, timestamp, characterId_timestamp compound) per data-model.md
- [X] T006 [P] Create src/config/characters/baiqi.json with character configuration (name, avatarUrl, illustrationUrls, backgroundUrls, dialogueTemplates, stateThresholds, personality) per data-model.md
- [X] T007 [P] Create src/config/characters/index.ts to load and export character configurations
- [X] T008 [P] Create src/services/storage/characterStateStorage.ts with functions: getCharacterState(id), saveCharacterState(state), updateCharacterState(id, updates), initializeCharacterState(id) per data-model.md
- [X] T009 [P] Create src/services/storage/conversationStorage.ts with functions: saveMessage(message), getMessages(characterId, options), deleteMessages(characterId), exportConversations(characterId) per data-model.md
- [X] T010 Create src/services/companionService.ts with generateCompanionDialogue(input) function integrating with existing llmService.ts per contracts/companion-service.md
- [X] T011 Implement selectDialogueTemplate(input) fallback function in src/services/companionService.ts per contracts/companion-service.md
- [X] T012 Create src/hooks/useCharacterState.ts hook for character state management (load state, update state, derive relationshipStage from closeness)
- [X] T013 Create src/hooks/useConversation.ts hook for conversation history management (load messages, save message, pagination)
- [X] T014 Create src/hooks/useProactiveDialogue.ts hook for proactive dialogue initiation logic (time-of-day detection, inactivity detection, trigger determination)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Daily Companion Interaction (Priority: P1) 🎯 MVP

**Goal**: Users can interact with companion character through daily conversations, receiving empathetic responses that reflect character state (mood, closeness, energy, time-of-day). Character proactively initiates greetings and responds contextually to user messages.

**Independent Test**: Can be fully tested by opening the app, receiving a greeting from the companion, engaging in conversation, and feeling emotionally supported. Works independently of functional modules.

### Implementation for User Story 1

- [X] T015 [US1] Create src/components/shared/ImageBackground.tsx component for full-screen background image with subtle white gradient overlay (transparent→white) per FR-031
- [X] T016 [US1] Create src/components/companion/CharacterIllustration.tsx component for full-screen or near-full-screen character image positioned above background but below dialogs (z-index 1-5) per FR-031
- [X] T017 [US1] Create src/components/companion/CharacterAvatar.tsx component for small circular character avatar display per FR-002, FR-026
- [X] T018 [US1] Create src/components/companion/ConversationBubble.tsx component for chat-like bubbles (character left-aligned, user right-aligned) with glassmorphism styling per FR-024, FR-030B
- [X] T019 [US1] Create src/components/companion/RelationshipBadge.tsx component to display closeness level visually per FR-009
- [X] T020 [US1] Create src/components/companion/SceneBackground.tsx component for scene backgrounds with floral overlays that change based on time-of-day or mood per FR-025
- [X] T021 [US1] Create src/components/companion/ChoiceDialogue.tsx component for occasional choice-based dialogue (2-5 options) per FR-007
- [X] T022 [US1] Create src/components/companion/CompanionScreen.tsx main conversation interface with header (back button, character name), scrollable chat body, footer (call-to-action) per FR-024, FR-028, FR-029
- [X] T023 [US1] Integrate useCharacterState hook in CompanionScreen.tsx to load and display character state
- [X] T024 [US1] Integrate useConversation hook in CompanionScreen.tsx to load conversation history and save new messages
- [X] T025 [US1] Implement user message input and send functionality in CompanionScreen.tsx with React Router navigation to /companion route
- [X] T026 [US1] Implement character response generation in CompanionScreen.tsx using companionService.generateCompanionDialogue() with conversation history context
- [X] T027 [US1] Implement character state updates (closeness increment, mood update) after each interaction in CompanionScreen.tsx per FR-010, FR-014
- [X] T028 [US1] Integrate useProactiveDialogue hook in CompanionScreen.tsx to detect when character should proactively initiate conversation per FR-004
- [X] T029 [US1] Implement proactive greeting display when app opens or user returns after inactivity in CompanionScreen.tsx per FR-004
- [X] T030 [US1] Add i18n support for character dialogue and UI elements in CompanionScreen.tsx per FR-022 (update src/i18n/locales/en.ts and src/i18n/locales/zh.ts)
- [X] T031 [US1] Create src/components/companion/HomeScreen.tsx at root path "/" with character illustration, state-aware greeting dialogue bubble (glassmorphism per FR-030B), breathing text animation per FR-031
- [X] T032 [US1] Implement home screen greeting generation in HomeScreen.tsx: generate once when character state ready (use React ref flags), prevent duplicate requests, fallback to template greeting if AI fails per NFR-008
- [X] T033 [US1] Implement time-of-day awareness in HomeScreen.tsx using date-fns to determine morning/afternoon/evening/night for contextually appropriate greetings per FR-013
- [X] T034 [US1] Update src/components/shared/Layout.tsx to route "/" to HomeScreen component instead of redirecting to "/health" per FR-031
- [X] T035 [US1] Add character name and dialogue text to i18n locales (src/i18n/locales/en.ts and src/i18n/locales/zh.ts) per FR-022

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently - users can open app, see character greeting, engage in conversation, receive empathetic responses, and see relationship metrics

---

## Phase 4: User Story 2 - Companion-Guided Health Activities (Priority: P2)

**Goal**: Companion suggests health activities (symptom logging, meal recording) through conversation, frames activities as "doing things together", and acknowledges user actions when they return to conversation.

**Independent Test**: Can be fully tested by the companion suggesting a health activity, user completing it through conversation, and receiving encouraging feedback. Integrates with existing Health module.

### Implementation for User Story 2

- [X] T036 [US2] Extend companionService.ts to support integrationHint parameter ("health" | "nutrition" | "emotion") for gentle guidance toward modules per FR-016
- [X] T037 [US2] Implement activity suggestion logic in useProactiveDialogue.ts hook: detect meal times, detect inactive health logging patterns, suggest activities with empathetic dialogue per FR-019
- [X] T038 [US2] Add activity acknowledgment dialogue templates to src/config/characters/baiqi.json (proactive.activity_acknowledgment) per FR-018
- [X] T039 [US2] Implement activity detection in CompanionScreen.tsx: check for recent actions in Health/Nutrition modules when user returns to conversation per FR-018
- [X] T040 [US2] Implement activity acknowledgment display in CompanionScreen.tsx: show encouraging feedback when user returns after completing health activity per FR-018
- [X] T041 [US2] Add navigation from companion dialogue to functional modules: when companion suggests activity, provide clickable link/navigation to /health, /nutrition, or /emotional routes per FR-016
- [X] T042 [US2] Update companion dialogue generation to frame activities as "doing things together" (e.g., "Let's log your meal together") rather than task completion per FR-019

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - companion can suggest health activities, user can navigate to modules, and companion acknowledges actions

---

## Phase 5: User Story 3 - Emotional Support Through Conversation (Priority: P2)

**Goal**: Companion responds with increased empathy to user emotional expressions, provides supportive dialogue for loneliness/stress, and maintains appropriate tone based on relationship stage.

**Independent Test**: Can be fully tested by user expressing emotions in conversation, receiving empathetic responses, and feeling emotionally supported. Works independently but complements Emotional module.

### Implementation for User Story 3

- [X] T043 [US3] Extend companionService.ts to detect userEmotionalState from user messages ("sad" | "stressed" | "lonely" | "happy" | "neutral") per contracts/companion-service.md
- [X] T044 [US3] Add emotional response dialogue templates to src/config/characters/baiqi.json (responses.sadness, responses.stress, responses.loneliness) per data-model.md
- [X] T045 [US3] Implement emotional state detection in CompanionScreen.tsx: analyze user messages for emotional keywords, pass userEmotionalState to dialogue generation per FR-006
- [X] T046 [US3] Update character mood based on user emotional expressions in CompanionScreen.tsx: user sadness/stress → character mood becomes "concerned", positive interaction → "happy" per FR-011, FR-014
- [X] T047 [US3] Enhance dialogue generation to reflect relationship stage: lower closeness → warmer but appropriate for early stage, higher closeness → more intimate support per FR-015
- [X] T048 [US3] Implement increased empathy for repeated negative emotions: companion responds with increased empathy and may suggest emotional support resources (without being pushy) per EC-007

**Checkpoint**: At this point, all user stories should be independently functional - companion provides emotional support, responds empathetically, and adapts tone based on relationship stage

---

## Phase 6: Home Screen UI Enhancements & Radial Menu

**Purpose**: Implement radial menu (炸裂式菜单) and function spheres for enhanced home screen interaction

- [X] T049 [P] Create src/components/companion/FunctionSpheres.tsx component: three circular glassmorphism buttons (Health, Nutrition, Emotion) vertically stacked in upper right corner per FR-031I
- [X] T050 [P] Implement FunctionSpheres styling: background rgba(255,255,255,0.2), backdrop-filter blur(20px), border 1px rgba(255,255,255,0.5), box-shadow with white glow, icons from lucide-react (HeartPulse, Leaf, Heart), color #FF7E9D, size 48x48px, gap 20px per FR-031I
- [X] T051 [P] Implement FunctionSpheres navigation: click handlers navigate directly to /health, /nutrition, /emotional routes using React Router (do NOT trigger icon expansion transition) per FR-031I
- [X] T052 [P] Create src/components/companion/RadialMenu.tsx component: 4 icons (Health, Nutrition, Emotion, Settings) explode outward from click point in circular/arc trajectories per FR-031D
- [X] T053 [P] Implement RadialMenu spring animation using framer-motion: scale (0→1) and opacity (0→1) transitions with elastic bounce effect per FR-031D
- [X] T054 [P] Implement RadialMenu glassmorphism styling: background rgba(255,255,255,0.15), backdrop-filter blur(25px), border 1px rgba(255,255,255,0.4), box-shadow glow per FR-030B, FR-031D
- [X] T055 [P] Implement RadialMenu background blur effect: character illustration blurs slightly (backdrop-filter blur(5px)) when menu is open per FR-031D
- [X] T056 [P] Implement RadialMenu dismiss: clicking background area dismisses menu (icons retract to center with reverse animation) per FR-031D
- [X] T057 [P] Integrate RadialMenu in HomeScreen.tsx: trigger radial menu when user clicks character illustration (center/chest area) per FR-031D
- [X] T058 [P] Create src/components/companion/IconExpansionTransition.tsx component: clicked radial menu icon scales up to fill screen, transitions to full-screen data panel with slide-up animation (300-500ms, ease-out) per FR-031E
- [X] T059 [P] Create src/components/companion/NeonGlowChart.tsx component: purple/pink gradient lines with outer glow effect, semi-transparent glassmorphism background (#ffffff33, blur(15px)), no coordinate axis grid lines, left-to-right drawing animation (800-1200ms) per FR-031F
- [X] T060 [P] Create src/components/companion/ChartCompanionElement.tsx component: small character avatar/silhouette (60-80px) at bottom-right corner with dialogue bubble displaying AI-generated data interpretation per FR-031G
- [X] T061 [P] Implement data interpretation generation in ChartCompanionElement.tsx: prioritize LLM-generated interpretation based on chart data and character state, fallback to templates if AI fails (>2 seconds) per FR-031H
- [X] T062 [P] Integrate FunctionSpheres component in HomeScreen.tsx: display three function spheres in upper right corner (right-5, top: safe-area-inset-top + 20px) per FR-031I
- [X] T063 [P] Update HomeScreen.tsx to display character illustration with breathing text animation at bottom per FR-031

---

## Phase 7: Visual Polish & Cross-Cutting Concerns

**Purpose**: Implement otome game aesthetic, glassmorphism refinements, and UI polish

- [X] T064 [P] Implement Floating Bottom Bar navigation: pill-shaped capsule floating at screen bottom (not full-width), semi-transparent with glassmorphism effect, remove text labels below icons or use smaller lighter font (Montserrat or PingFang Light), maintain 44x44px touch targets per FR-031A
- [X] T065 [P] Add random floating semi-transparent light particles (SVG or CSS animation) in background for romance feel - subtle, slow-moving, non-interfering per FR-031B
- [X] T066 [P] Apply soft dreamy color scheme throughout app: main #FDEEF4 (cherry pink), secondary #FFFFFF (white), accent #FFD1DC (light pink) per FR-031C
- [X] T067 [P] Replace all emoji icons with lucide-react linear icons in bottom navigation bar: Home, Activity/HeartPulse, Leaf/Apple, Heart, MessageCircle, Settings, consistent color #FF7E9D, maintain 44x44px touch targets per FR-033
- [X] T068 [P] Apply premium glassmorphism styling to all dialog boxes, navigation bars, radial menu icons, floating UI elements: background rgba(255,255,255,0.15), backdrop-filter blur(25px), border-radius 24px, border 1px rgba(255,255,255,0.4), box-shadow glow, text color #4A4A4A per FR-030B
- [X] T069 [P] Remove all blue placeholder boxes and generic character placeholders throughout app per FR-031
- [X] T070 [P] Ensure proper z-index layering: character layer (z-index 1-5), dialogs/navbar (z-index 10+) per FR-031
- [X] T071 [P] Add ornate decorative elements (floral patterns, hearts, stars, ribbons) to UI components for authentic otome game aesthetic per FR-030
- [X] T072 [P] Apply rich romantic color palette (deep pinks, roses, lavenders, purples) throughout UI per FR-030
- [X] T073 [P] Add elaborate borders and frames to key UI elements per FR-030
- [X] T074 [P] Ensure elegant typography with decorative fonts for headings per FR-030
- [X] T075 [P] Add luxurious textures and gradients to background elements per FR-030
- [X] T076 [P] Implement error boundaries for companion components to prevent crashes from affecting user data per constitution Principle 3
- [X] T077 [P] Add data export functionality: export conversation history as JSON/CSV per FR-008, constitution Principle 8
- [X] T078 [P] Add data deletion functionality: delete conversation history with confirmation dialog per NFR-009, constitution Principle 8
- [X] T079 [P] Add character state reset functionality: reset character state with option to preserve closeness level per NFR-009, EC-004
- [X] T080 [P] Run quickstart.md validation to ensure all integration patterns work correctly

---

## Phase 8: Health Details Page "The Private Ledger" Layout (FR-035)

**Purpose**: Implement immersive "The Private Ledger" layout for Health Details Page with overlapping fan-shaped cards, full-screen character background, and companion dialogue integration

**Independent Test**: Can be fully tested by navigating to /health route, seeing three overlapping fan-shaped cards with character background, clicking cards to navigate to functions, and seeing companion dialogue bubble above cards.

- [X] T081 [P] Update HealthHomeScreen component in src/components/shared/Layout.tsx: remove standard list layout completely, replace with three overlapping fan-shaped glassmorphism cards positioned in middle-lower screen area per FR-035(1)
- [X] T082 [P] Implement fan-shaped card arrangement in HealthHomeScreen.tsx: top card rotated -8° (counter-clockwise), middle card rotated -4°, bottom card rotated 0°, vertical offset 40px between consecutive cards, horizontal offset 20px creating staggered left-right effect, cards overlap creating depth perception per FR-035(2)
- [X] T083 [P] Add full-screen Bai Qi character illustration background to HealthHomeScreen.tsx: use CharacterLayer component with same breathing animation as home screen (floatAnimation: translateY(-12px) scale(1.02) over 4s ease-in-out infinite), character illustration covers entire screen with z-index below cards per FR-035(3)
- [X] T084 [P] Style fan-shaped cards with glassmorphism and pink glow in HealthHomeScreen.tsx: background rgba(255, 255, 255, 0.2), backdrop-filter blur(25px), border 1px solid #FF7E9D (bright pink glow), box-shadow with pink glow effect (0 4px 24px rgba(255, 126, 157, 0.3)), border-radius 24px, full-width minus padding, equal height per FR-035(4)
- [X] T085 [P] Implement card click interaction with spring animation in HealthHomeScreen.tsx: clicking any visible area triggers React Router navigation to corresponding route (/health/symptoms, /health/upload, /health/timeline), card executes upward spring animation using framer-motion (duration 400ms, stiffness 300, damping 25), upward translation ~20-30px with scale effect (1.0 → 1.05 → 1.0), animation completes before navigation per FR-035(5)
- [X] T086 [P] Add persistent companion dialogue bubble above cards in HealthHomeScreen.tsx: positioned 60px above top card, horizontally centered, uses same glassmorphism style as home screen (background rgba(255, 255, 255, 0.4), backdrop-filter blur(30px), border-radius 24px, border 1px solid rgba(255, 255, 255, 0.55)), contains CharacterAvatar component and text from health.ledgerPrompt i18n key, dialogue bubble remains visible and does not block card interactions per FR-035(6)
- [X] T087 [P] Update back button size in HealthHomeScreen.tsx: increase from 44x44px to 56x56px (significantly larger for one-handed operation), maintain glassmorphism style (background rgba(255, 255, 255, 0.2), backdrop-filter blur(25px), border 1px solid rgba(255, 255, 255, 0.4)), ChevronLeft icon from lucide-react, clicking navigates to home page (/) per FR-035(7)
- [X] T088 [P] Ensure bottom navigation bar remains hidden on /health route in Layout.tsx (already implemented per FR-034, verify it still works) per FR-035(7)

---

## Phase 9: Health Details Page Visual Alignment with Home Screen (FR-036)

**Purpose**: Refine Health Details Page to align with Home Screen visual base, restore layering feel, and refine card materials for premium glassmorphism aesthetic

**Independent Test**: Can be fully tested by navigating to /health route, verifying ImageBackground + SceneBackground + FloatingParticles + CharacterLayer layering matches home screen, checking card materials use refined glassmorphism (rgba(255,255,255,0.15), white inner glow border), verifying Header is hidden, and confirming cards positioned at character chest area (50% horizontal, 60% vertical).

- [X] T089 [P] Wrap HealthHomeScreen component with ImageBackground component in src/components/shared/Layout.tsx: use same background image URL as home screen (https://i.pinimg.com/564x/a6/39/19/a639190333210fb5da77b4903661354e.jpg), remove pure color background (#FDEEF4) from HealthHomeScreen component per FR-036(1)
- [X] T090 [P] Add SceneBackground component to HealthHomeScreen in src/components/shared/Layout.tsx: import SceneBackground from '../companion/SceneBackground', position at z-index 1 (same as home screen), pass characterId 'baiqi' per FR-036(1)
- [X] T091 [P] Add FloatingParticles component to HealthHomeScreen in src/components/shared/Layout.tsx: import FloatingParticles from '../companion/FloatingParticles', position at z-index 2 (same as home screen), set count to 20 per FR-036(1)
- [X] T092 [P] Update CharacterLayer positioning in HealthHomeScreen.tsx: ensure CharacterLayer is positioned at z-index 3 (same as home screen), maintain same floating animation (floatAnimation: translateY(-12px) scale(1.02) over 4s ease-in-out infinite) per FR-036(1)
- [X] T093 [P] Refine card material styling in HealthHomeScreen.tsx: change card background from rgba(255, 255, 255, 0.2) to rgba(255, 255, 255, 0.15) (more transparent), remove red/pink outer shadow (box-shadow: 0 4px 24px rgba(255, 126, 157, 0.3)), replace with 1px inner glow border: border 1px solid rgba(255, 255, 255, 0.6) (bright white semi-transparent, 60% opacity), remove border #FF7E9D pink glow, maintain backdrop-filter blur(25px) per FR-036(2)
- [X] T094 [P] Remove image loading failed placeholder elements from HealthHomeScreen.tsx: completely remove any "图片加载失败" (image loading failed) placeholder elements or error states that break visual aesthetics, ensure CharacterLayer handles loading/error states gracefully without displaying placeholder text per FR-036(3)
- [X] T095 [P] Update companion dialogue bubble styling in HealthHomeScreen.tsx: ensure dialogue bubble uses same glassmorphism style as home screen (background rgba(255, 255, 255, 0.4), backdrop-filter blur(30px), border-radius 24px, border 1px solid rgba(255, 255, 255, 0.55)), text color #4A4A4A (deep gray-pink matching home screen dialogue text) per FR-036(3)
- [X] T096 [P] Hide Header component on /health route in Layout.tsx: extend condition from !isHome to !isHome && location.pathname !== '/health' (same logic as home screen), ensure Header is completely hidden on /health route per FR-036(4)
- [X] T097 [P] Update back button glassmorphism styling in HealthHomeScreen.tsx: change background from rgba(255, 255, 255, 0.2) to rgba(255, 255, 255, 0.15), change backdrop-filter from blur(25px) to blur(20px), maintain border 1px solid rgba(255, 255, 255, 0.4), ensure ChevronLeft icon uses strokeWidth 2, size 28px per FR-036(4)
- [X] T098 [P] Update card positioning in HealthHomeScreen.tsx: change card container positioning to use fixed positioning with transform: translate(-50%, -50%) and top: 60%, left: 50% (50% horizontal, 60% vertical - 20% below center), cards should appear to float at character chest position per FR-036(5)

---

## Phase 10: Data Entry Screens Companion Integration (FR-037)

**Purpose**: Implement companion-integrated data entry screens (e.g., symptom logging /health/symptoms route) with consistent visual design matching Health Details Page aesthetic

**Independent Test**: Can be fully tested by navigating to /health/symptoms route, seeing full-screen Bai Qi character background with glassmorphism input containers, character avatar with dialogue bubble at top, minimal back button header, two-step button workflow (AI Diagnosis → Save Record), and severity selection with pink glow animation.

- [X] T099 [P] [US2] Wrap SymptomLogScreen component with ImageBackground component in src/components/health/SymptomLogScreen.tsx: use same background image URL as Health Details Page (https://i.pinimg.com/564x/a6/39/19/a639190333210fb5da77b4903661354e.jpg), remove pure color background (#FDEEF4 or gray-50) per FR-037(1)
- [X] T100 [P] [US2] Add SceneBackground component to SymptomLogScreen.tsx: import SceneBackground from '../companion/SceneBackground', position at z-index 1, pass characterId 'baiqi' per FR-037(1)
- [X] T101 [P] [US2] Add FloatingParticles component to SymptomLogScreen.tsx: import FloatingParticles from '../companion/FloatingParticles', position at z-index 2, set count to 20 per FR-037(1)
- [X] T102 [P] [US2] Add CharacterLayer component to SymptomLogScreen.tsx: import CharacterLayer from '../companion/CharacterLayer', position at z-index 3, maintain same floating animation (floatAnimation: translateY(-12px) scale(1.02) over 4s ease-in-out infinite) per FR-037(1)
- [X] T103 [US2] Update input container styling in SymptomLogScreen.tsx: replace Card component styling with glassmorphism styling per FR-030B (background rgba(255, 255, 255, 0.2), backdrop-filter blur(25px), border 1px solid rgba(255, 255, 255, 0.4), box-shadow with soft white glow, border-radius 12-16px) per FR-037(2)
- [X] T104 [US2] Update input field styling in SymptomLogScreen.tsx: change textarea and input backgrounds from solid white to semi-transparent (rgba(255, 255, 255, 0.1) or similar), reduce visual weight, create warm inviting feel per FR-037(2)
- [X] T105 [US2] Add character avatar with dialogue bubble at top of SymptomLogScreen.tsx: import CharacterAvatar from '../companion/CharacterAvatar', position dialogue bubble above input fields (top of screen), use glassmorphism styling per FR-030B, display contextual message from health.symptomPrompt i18n key ("哪里不舒服吗？别瞒着我。" / "What's bothering you? Don't hide it from me.") per FR-037(3)
- [X] T106 [US2] Update header design in SymptomLogScreen.tsx: remove title text ("记录症状" / "Log Symptoms"), replace with minimal glassmorphism back button (ChevronLeft icon from lucide-react) in top-left corner, use same styling as Health Details Page (background rgba(255,255,255,0.2), backdrop-filter blur(25px), border 1px solid rgba(255,255,255,0.4), 44x44px minimum touch target), clicking navigates to previous page per FR-037(4)
- [X] T107 [US2] Implement two-step button workflow in SymptomLogScreen.tsx: primary button displays "AI Diagnosis" (or equivalent i18n label) when no AI analysis exists (!aiAnalysis && !isEditMode), button changes to "Save Record" (or "Complete"/"Finish") after AI analysis completes or user chooses to skip AI analysis, button label MUST reflect current action state per FR-037(5)
- [X] T108 [US2] Implement severity selection visual feedback in SymptomLogScreen.tsx: selected state uses deep pink border (#FF7E9D or darker pink) with subtle breathing glow animation (pulsing box-shadow effect using CSS animation, 2-3 second cycle), unselected state uses gray border (1-2px) with no glow, create warm interactive feel matching otome aesthetic per FR-037(6)
- [X] T109 [US2] Add health.symptomPrompt i18n key to src/i18n/locales/en.ts and src/i18n/locales/zh.ts: en: "What's bothering you? Don't hide it from me.", zh: "哪里不舒服吗？别瞒着我。" per FR-037(3)
- [ ] T110 [P] [US2] Apply same FR-037 design pattern to other data entry screens (e.g., meal logging, mood check-in) as needed: wrap with ImageBackground, add SceneBackground/FloatingParticles/CharacterLayer, apply glassmorphism to inputs, add character dialogue bubble, minimal header, consistent button workflows per FR-037

**Checkpoint**: At this point, data entry screens should have immersive companion feel during data entry, maintain visual consistency with Health Details Page, and enhance emotional connection through character presence and warm visual feedback

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P2)
- **Home Screen UI (Phase 6)**: Can start after User Story 1 (Phase 3) - enhances home screen
- **Polish (Phase 7)**: Depends on all desired user stories being complete
- **Health Details Page "The Private Ledger" (Phase 8)**: Can start after Phase 7 or independently - refines Health Details Page layout with immersive companion integration
- **Health Details Page Visual Alignment (Phase 9)**: Can start after Phase 8 or independently - aligns Health Details Page visual base with Home Screen, restores layering feel
- **Data Entry Screens Companion Integration (Phase 10)**: Can start after Phase 9 or independently - implements FR-037 requirements for symptom logging and other data entry screens

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1 but independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1 but independently testable

### Within Each User Story

- Models/types before services
- Services before components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All Phase 6 tasks marked [P] can run in parallel (different components)
- All Phase 7 tasks marked [P] can run in parallel (different UI elements)
- All Phase 8 tasks marked [P] can run in parallel (different aspects of Health Details Page layout)
- All Phase 9 tasks marked [P] can run in parallel (different aspects of visual alignment)
- All Phase 10 tasks marked [P] can run in parallel (different aspects of data entry screen design)
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all component creation tasks for User Story 1 together:
Task: "Create src/components/shared/ImageBackground.tsx component"
Task: "Create src/components/companion/CharacterIllustration.tsx component"
Task: "Create src/components/companion/CharacterAvatar.tsx component"
Task: "Create src/components/companion/ConversationBubble.tsx component"
Task: "Create src/components/companion/RelationshipBadge.tsx component"
Task: "Create src/components/companion/SceneBackground.tsx component"
Task: "Create src/components/companion/ChoiceDialogue.tsx component"
```

---

## Parallel Example: Foundational Phase

```bash
# Launch all storage and config tasks together:
Task: "Create src/config/characters/baiqi.json"
Task: "Create src/config/characters/index.ts"
Task: "Create src/services/storage/characterStateStorage.ts"
Task: "Create src/services/storage/conversationStorage.ts"
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
5. Add Phase 6 (Home Screen UI) → Test independently → Deploy/Demo
6. Add Phase 7 (Polish) → Final polish → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (core conversation)
   - Developer B: User Story 2 (health activities integration)
   - Developer C: User Story 3 (emotional support)
3. Once User Story 1 is done:
   - Developer A: Phase 6 (Home Screen UI enhancements)
   - Developer B: Continue User Story 2/3
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Function spheres (Phase 6) navigate directly to functional screens - do NOT trigger icon expansion transition
- Radial menu icons (Phase 6) trigger icon expansion transition to data panels
- All glassmorphism styling must follow FR-030B specifications (rgba(255,255,255,0.15), blur(25px), etc.)
- All icons must use lucide-react library, color #FF7E9D, maintain 44x44px touch targets
- Character assets (images) stored in src/assets/characters/, configuration in src/config/characters/
- All conversation data stored locally in IndexedDB - no cloud sync
- AI dialogue generation requires connectivity, falls back to templates when offline

---

## Task Summary

### Total Task Count
- **Total Tasks**: 110 (T001-T110)
- **Completed**: 109 (T001-T109)
- **Pending**: 1 (T110 - optional: apply pattern to other data entry screens)

### Task Count by Phase
- **Phase 1 (Setup)**: 3 tasks (T001-T003) - All completed
- **Phase 2 (Foundational)**: 12 tasks (T004-T015) - All completed
- **Phase 3 (User Story 1)**: 20 tasks (T016-T035) - All completed
- **Phase 4 (User Story 2)**: 8 tasks (T036-T043) - All completed
- **Phase 5 (User Story 3)**: 8 tasks (T044-T051) - All completed
- **Phase 6 (Home Screen UI)**: 12 tasks (T052-T063) - All completed
- **Phase 7 (Visual Polish)**: 17 tasks (T064-T080) - All completed
- **Phase 8 (Health Details Page "The Private Ledger")**: 8 tasks (T081-T088) - All completed
- **Phase 9 (Health Details Page Visual Alignment)**: 10 tasks (T089-T098) - All completed
- **Phase 10 (Data Entry Screens Companion Integration)**: 12 tasks (T099-T110) - 11 completed (T099-T109), 1 pending (T110 - optional)

### Parallel Opportunities Identified
- **Phase 1**: 3 parallel tasks (all [P] marked)
- **Phase 2**: 12 parallel tasks (all [P] marked)
- **Phase 9**: 10 parallel tasks (all [P] marked)
- **Phase 10**: 11 parallel tasks (marked [P])
- **Phase 3**: 15 parallel tasks (marked [P])
- **Phase 4**: 6 parallel tasks (marked [P])
- **Phase 5**: 6 parallel tasks (marked [P])
- **Phase 6**: 12 parallel tasks (all [P] marked)
- **Phase 7**: 17 parallel tasks (all [P] marked)
- **Phase 8**: 8 parallel tasks (all [P] marked)

### Independent Test Criteria
- **User Story 1**: Can be fully tested by opening app, receiving greeting, engaging in conversation, feeling emotionally supported - works independently of functional modules
- **User Story 2**: Can be fully tested by companion suggesting health activity, user completing it, receiving encouraging feedback - integrates with existing Health module
- **User Story 3**: Can be fully tested by user expressing emotions, receiving empathetic responses, feeling emotionally supported - works independently but complements Emotional module
- **Phase 8**: Can be fully tested by navigating to /health route, seeing three overlapping fan-shaped cards with character background, clicking cards to navigate, seeing companion dialogue bubble
- **Phase 10**: Can be fully tested by navigating to /health/symptoms route, seeing full-screen Bai Qi character background with glassmorphism input containers, character avatar with dialogue bubble at top, minimal back button header, two-step button workflow, and severity selection with pink glow animation

### Suggested MVP Scope
- **MVP**: User Story 1 (Phase 3) - Core companion interaction experience
- **Next Priority**: Phase 6 (Home Screen UI) - Enhances entry point experience
- **Then**: User Stories 2 & 3 (Phases 4 & 5) - Integrate companion with functional modules
- **Polish**: Phase 7 (Visual Polish) - Apply otome aesthetic throughout
- **Enhancement**: Phase 8 (Health Details Page) - Immersive "Private Ledger" layout

### Format Validation
✅ All tasks follow strict checklist format:
- ✅ Checkbox: `- [ ]` or `- [X]`
- ✅ Task ID: Sequential T001-T110
- ✅ [P] marker: Included for parallelizable tasks
- ✅ [Story] label: Included for user story phase tasks (US1, US2, US3)
- ✅ File paths: All tasks include exact file paths

---

## Task Summary (Legacy)

- **Total Tasks**: 80
- **Phase 1 (Setup)**: 3 tasks
- **Phase 2 (Foundational)**: 11 tasks
- **Phase 3 (User Story 1 - P1)**: 21 tasks
- **Phase 4 (User Story 2 - P2)**: 7 tasks
- **Phase 5 (User Story 3 - P2)**: 6 tasks
- **Phase 6 (Home Screen UI)**: 15 tasks
- **Phase 7 (Polish)**: 17 tasks

**Suggested MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1) = 35 tasks

**Parallel Opportunities**: 
- 3 tasks in Phase 1
- 3 tasks in Phase 2
- Multiple component creation tasks in Phase 3
- All Phase 6 tasks
- All Phase 7 tasks
