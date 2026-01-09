---
description: "Task list for Wellmate Core Modules implementation"
---

# Tasks: Wellmate Core Modules

**Input**: Design documents from `/specs/001-core-modules/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL and not explicitly requested in the feature specification, so no test tasks are included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths follow React + TypeScript structure from plan.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project structure with Vite + React + TypeScript template
- [x] T002 Initialize package.json with core dependencies (React 18.x, TypeScript 5.x, Tailwind CSS, Vite)
- [x] T003 [P] Install and configure Tailwind CSS in tailwind.config.js
- [x] T004 [P] Configure Vite build tooling in vite.config.ts
- [x] T005 [P] Setup TypeScript configuration in tsconfig.json
- [x] T006 [P] Configure ESLint and Prettier for code quality
- [x] T007 Create basic folder structure: src/components/, src/hooks/, src/services/, src/utils/, src/types.ts
- [x] T008 [P] Setup PWA configuration (manifest.json, service worker basics)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T009 Create shared TypeScript types in src/types.ts (base entity interfaces, common types)
- [x] T010 [P] Implement IndexedDB database initialization in src/db.ts (openDB, schema definition)
- [x] T011 [P] Create database schema versioning and migration framework in src/db.ts
- [x] T012 [P] Implement base storage service in src/services/storage/indexedDB.ts (CRUD operations)
- [x] T013 [P] Create storage types in src/services/storage/types.ts
- [x] T014 [P] Implement input sanitization utility in src/utils/sanitize.ts
- [x] T015 [P] Implement data validation utility in src/utils/validation.ts
- [x] T016 [P] Create data export utility in src/utils/export.ts (JSON/CSV export functions)
- [x] T017 Implement base HTTP client wrapper in src/services/apiClient.ts
- [x] T018 [P] Create .env file with LLM API configuration (VITE_LLM_BASE_URL=https://hyperecho-proxy.aelf.dev/v1, VITE_LLM_API_KEY, VITE_LLM_MODEL=vibe-coding-app-gemini)
- [x] T019 [P] Add .env to .gitignore to prevent committing API keys
- [x] T020 Create LLM service interface in src/services/llmService.ts (Gemini API via HyperEcho Proxy, OpenAI-compatible format, with consent checks)
- [x] T021 [P] Create shared UI components in src/components/shared/Button.tsx (Tailwind CSS, 44x44px touch target)
- [x] T022 [P] Create shared UI components in src/components/shared/Card.tsx (Tailwind CSS, mobile-first)
- [x] T023 [P] Create shared UI components in src/components/shared/Disclaimer.tsx (for medical disclaimers)
- [x] T024 [P] Create shared UI components in src/components/shared/AIIndicator.tsx (visual AI usage indicator)
- [x] T025 Implement React Error Boundary component in src/components/shared/ErrorBoundary.tsx
- [x] T026 Setup React Router for screen-based navigation in src/App.tsx
- [x] T027 Create main app layout component in src/components/shared/Layout.tsx (mobile-first, Tailwind CSS)
- [x] T028 Create screens directory structure in src/screens/ (HealthScreen, NutritionScreen, EmotionalScreen, RemindersScreen, PrivacyScreen)
- [x] T029 Implement base navigation routes configuration in src/navigation/routes.tsx
- [x] T030 Implement offline detection hook in src/hooks/useOffline.ts
- [x] T031 Create AI processing queue system in src/services/aiQueue.ts (for offline queue management)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Health Analysis & Tracking (Priority: P1) 🎯 MVP

**Goal**: Users can upload medical records, view AI-generated plain-language summaries, log symptoms, and view health timeline. Delivers foundational health tracking capability.

**Independent Test**: Can be fully tested by uploading a medical record, viewing the AI-generated plain-language summary, logging daily symptoms, and viewing the health timeline. Delivers value independently without requiring other modules.

### Implementation for User Story 1

- [x] T032 [P] [US1] Create MedicalRecord type interface in src/types.ts
- [x] T033 [P] [US1] Create HealthCondition type interface in src/types.ts
- [x] T034 [P] [US1] Create SymptomEntry type interface in src/types.ts
- [x] T035 [US1] Implement IndexedDB stores for medicalRecords, healthConditions, symptomEntries in src/db.ts
- [x] T036 [US1] Create validation functions for MedicalRecord in src/utils/validation.ts
- [x] T037 [US1] Create validation functions for SymptomEntry in src/utils/validation.ts
- [x] T038 [P] [US1] Create custom hook useMedicalRecords in src/hooks/useMedicalRecords.ts
- [x] T039 [P] [US1] Create custom hook useHealthConditions in src/hooks/useHealthConditions.ts
- [x] T040 [P] [US1] Create custom hook useSymptomEntries in src/hooks/useSymptomEntries.ts
- [x] T041 [US1] Implement medical record upload handler in src/services/fileUpload.ts (text/image/PDF, 10MB limit)
- [x] T042 [US1] Implement PDF text extraction using PDF.js in src/services/fileUpload.ts
- [x] T043 [US1] Implement LLM medical record summarization in src/services/llmService.ts (Gemini API, with safety guardrails)
- [x] T044 [US1] Create HealthUploadScreen component in src/components/health/HealthUploadScreen.tsx (Tailwind CSS, mobile-first)
- [x] T045 [US1] Create HealthSummaryScreen component in src/components/health/HealthSummaryScreen.tsx (with disclaimers, AI indicator)
- [x] T046 [US1] Create LifestyleSuggestionsScreen component in src/components/health/LifestyleSuggestionsScreen.tsx (avoid/prefer/general categories)
- [x] T047 [US1] Create SymptomLogScreen component in src/components/health/SymptomLogScreen.tsx (form with validation, <30s completion)
- [x] T048 [US1] Create HealthTimelineScreen component in src/components/health/HealthTimelineScreen.tsx (chronological view, <2s load for 30 days)
- [x] T049 [US1] Implement AI processing status indicator in HealthUploadScreen (pending/processing/completed/failed)
- [x] T050 [US1] Add error handling for file upload failures (corrupted, too large, unsupported format) with supportive messages
- [x] T051 [US1] Implement offline queue for medical record processing in src/services/aiQueue.ts
- [x] T052 [US1] Add route for Health module screens in src/App.tsx (screen-based navigation)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 5 - Data Privacy & Management (Priority: P1)

**Goal**: Users have full control over their health data - viewing, exporting, and permanently deleting all information. Essential for trust and privacy compliance.

**Independent Test**: Can be fully tested by viewing all stored data, exporting data in standard format (JSON/CSV), and permanently deleting data with confirmation. Works independently and is essential for trust.

### Implementation for User Story 5

- [x] T053 [P] [US5] Create UserPreferences type interface in src/types.ts
- [x] T054 [US5] Implement IndexedDB store for userPreferences in src/db.ts (singleton pattern)
- [x] T055 [US5] Create custom hook useUserPreferences in src/hooks/useUserPreferences.ts
- [x] T056 [US5] Implement data viewing functionality (all stores) in src/utils/export.ts
- [x] T057 [US5] Implement JSON export functionality in src/utils/export.ts (<5s export time)
- [x] T058 [US5] Implement CSV export functionality in src/utils/export.ts
- [x] T059 [US5] Implement selective deletion (individual records) in src/services/storage/indexedDB.ts
- [x] T060 [US5] Implement full data deletion with confirmation in src/services/storage/indexedDB.ts (<10s deletion time)
- [x] T061 [US5] Create PrivacySettingsScreen component in src/components/privacy/PrivacySettingsScreen.tsx (Tailwind CSS, mobile-first)
- [x] T062 [US5] Create DataViewScreen component in src/components/privacy/DataViewScreen.tsx (list all stored data)
- [x] T063 [US5] Create DataExportScreen component in src/components/privacy/DataExportScreen.tsx (JSON/CSV options)
- [x] T064 [US5] Create DataDeletionScreen component in src/components/privacy/DataDeletionScreen.tsx (with confirmation dialog)
- [x] T065 [US5] Implement consent management UI in PrivacySettingsScreen (data sharing opt-in/opt-out)
- [x] T066 [US5] Add route for Privacy module screens in src/App.tsx

**Checkpoint**: At this point, User Stories 1 AND 5 should both work independently

---

## Phase 5: User Story 2 - Daily Nutrition Companion (Priority: P2)

**Goal**: Users can input available ingredients and receive simple AI-generated meal suggestions, optionally adapted to health conditions or energy level.

**Independent Test**: Can be fully tested by entering available ingredients, receiving meal suggestions, optionally selecting health conditions or energy level, and viewing adapted suggestions. Works independently of other modules.

### Implementation for User Story 2

- [ ] T067 [P] [US2] Create IngredientList type interface in src/types.ts
- [ ] T068 [P] [US2] Create MealSuggestion type interface in src/types.ts
- [ ] T069 [US2] Implement IndexedDB stores for ingredientLists and mealSuggestions in src/db.ts
- [ ] T070 [US2] Create validation functions for IngredientList in src/utils/validation.ts
- [ ] T071 [P] [US2] Create custom hook useIngredientLists in src/hooks/useIngredientLists.ts
- [ ] T072 [P] [US2] Create custom hook useMealSuggestions in src/hooks/useMealSuggestions.ts
- [ ] T073 [US2] Implement LLM meal suggestion generation in src/services/llmService.ts (Gemini API, with dietary guidance disclaimers)
- [ ] T074 [US2] Implement meal adaptation logic (health conditions, energy level) in src/services/llmService.ts
- [ ] T075 [US2] Create NutritionInputScreen component in src/components/nutrition/NutritionInputScreen.tsx (ingredient input, Tailwind CSS)
- [ ] T076 [US2] Create MealSuggestionsScreen component in src/components/nutrition/MealSuggestionsScreen.tsx (AI indicator, disclaimers)
- [ ] T077 [US2] Create MealDetailScreen component in src/components/nutrition/MealDetailScreen.tsx (meal details, favorite toggle)
- [ ] T078 [US2] Implement empty ingredient list handling with helpful guidance in NutritionInputScreen
- [ ] T079 [US2] Implement favorite meal suggestions storage in src/services/storage/indexedDB.ts
- [ ] T080 [US2] Add health condition adaptation toggle in MealSuggestionsScreen (if health conditions exist)
- [ ] T081 [US2] Add energy level selector in MealSuggestionsScreen (low/medium/high)
- [ ] T082 [US2] Implement AI processing status indicator in MealSuggestionsScreen (<10s response time)
- [ ] T083 [US2] Add route for Nutrition module screens in src/App.tsx

**Checkpoint**: At this point, User Stories 1, 2, and 5 should all work independently

---

## Phase 6: User Story 3 - Mental & Emotional Support (Priority: P2)

**Goal**: Users can complete daily mood check-ins, write emotional journal entries, and receive empathetic AI responses. Provides emotional support value independently.

**Independent Test**: Can be fully tested by completing a daily mood check-in, writing an emotional journal entry, receiving an empathetic AI response, and engaging in supportive conversation. Delivers emotional support value independently.

### Implementation for User Story 3

- [ ] T084 [P] [US3] Create MoodEntry type interface in src/types.ts (with MoodValue type)
- [ ] T085 [P] [US3] Create JournalEntry type interface in src/types.ts
- [ ] T086 [US3] Implement IndexedDB stores for moodEntries and journalEntries in src/db.ts
- [ ] T087 [US3] Create validation functions for MoodEntry in src/utils/validation.ts
- [ ] T088 [US3] Create validation functions for JournalEntry in src/utils/validation.ts
- [ ] T089 [P] [US3] Create custom hook useMoodEntries in src/hooks/useMoodEntries.ts
- [ ] T090 [P] [US3] Create custom hook useJournalEntries in src/hooks/useJournalEntries.ts
- [ ] T091 [US3] Implement LLM empathetic response generation in src/services/llmService.ts (Gemini API, with therapy disclaimers)
- [ ] T092 [US3] Create MoodCheckInScreen component in src/components/emotional/MoodCheckInScreen.tsx (emoji/brief descriptors, <15s completion)
- [ ] T093 [US3] Create JournalEntryScreen component in src/components/emotional/JournalEntryScreen.tsx (free-text input, supportive UI)
- [ ] T094 [US3] Create JournalResponseScreen component in src/components/emotional/JournalResponseScreen.tsx (AI response with disclaimers)
- [ ] T095 [US3] Create MoodTimelineScreen component in src/components/emotional/MoodTimelineScreen.tsx (visual mood patterns)
- [ ] T096 [US3] Implement mood acknowledgment response in MoodCheckInScreen (brief supportive message)
- [ ] T097 [US3] Implement multiple mood check-ins per day handling (timestamps or update existing)
- [ ] T098 [US3] Implement offline journaling (save locally, queue AI response) in src/services/aiQueue.ts
- [ ] T099 [US3] Add sensitive content detection and resources in JournalEntryScreen (crisis indicators)
- [ ] T100 [US3] Implement edit/delete functionality for journal entries
- [ ] T101 [US3] Add route for Emotional Support module screens in src/App.tsx

**Checkpoint**: At this point, User Stories 1, 2, 3, and 5 should all work independently

---

## Phase 7: User Story 4 - Daily Reminders & Insights (Priority: P3)

**Goal**: Users receive gentle reminders for wellness activities and view AI-generated insights linking mood, sleep, and nutrition patterns.

**Independent Test**: Can be fully tested by enabling reminders, receiving gentle notifications, viewing AI-generated insights linking mood/sleep/nutrition, and understanding the connections. Requires data from other modules but can be tested once those exist.

### Implementation for User Story 4

- [ ] T102 [P] [US4] Create ReminderSettings type interface in src/types.ts
- [ ] T103 [P] [US4] Create Insight type interface in src/types.ts
- [ ] T104 [US4] Implement IndexedDB stores for reminderSettings and insights in src/db.ts
- [ ] T105 [US4] Create validation functions for ReminderSettings in src/utils/validation.ts
- [ ] T106 [P] [US4] Create custom hook useReminderSettings in src/hooks/useReminderSettings.ts
- [ ] T107 [P] [US4] Create custom hook useInsights in src/hooks/useInsights.ts
- [ ] T108 [US4] Implement local notification system for reminders (offline-capable) in src/services/notifications.ts
- [ ] T109 [US4] Implement LLM insight generation (mood-sleep-nutrition patterns) in src/services/llmService.ts (Gemini API)
- [ ] T110 [US4] Create RemindersSettingsScreen component in src/components/reminders/RemindersSettingsScreen.tsx (enable/disable, times, frequency)
- [ ] T111 [US4] Create InsightsScreen component in src/components/reminders/InsightsScreen.tsx (AI-generated insights with clear labeling)
- [ ] T112 [US4] Implement reminder scheduling logic in src/services/notifications.ts (hydration, meals, sleep, mood)
- [ ] T113 [US4] Implement dismiss/snooze functionality for reminders
- [ ] T114 [US4] Implement insufficient data handling in InsightsScreen (encouraging guidance)
- [ ] T115 [US4] Implement pattern visualization in InsightsScreen (simple visual representations)
- [ ] T116 [US4] Add route for Reminders & Insights module screens in src/App.tsx

**Checkpoint**: All user stories should now be independently functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T117 [P] Implement PWA service worker with Workbox in public/service-worker.js (offline caching)
- [ ] T118 [P] Configure PWA manifest.json with app metadata and icons
- [ ] T119 [P] Add loading states and skeletons across all screens (Tailwind CSS)
- [ ] T120 [P] Implement consistent error handling with supportive messages across all modules
- [ ] T121 [P] Add accessibility features (ARIA labels, keyboard navigation, focus management) across all components
- [ ] T122 [P] Ensure all touch targets meet 44x44px minimum (Tailwind CSS sizing utilities)
- [ ] T123 [P] Implement responsive design for tablet/desktop breakpoints (Tailwind CSS responsive utilities)
- [ ] T124 [P] Add dark mode support (Tailwind CSS dark mode)
- [ ] T125 Optimize IndexedDB queries for performance (indexes, pagination for large datasets)
- [ ] T126 Implement code splitting for route-based lazy loading
- [ ] T127 Add performance monitoring and optimization (bundle size, load times)
- [ ] T128 Implement comprehensive input sanitization across all forms
- [ ] T129 Add data migration testing and validation
- [ ] T130 Create onboarding flow with disclaimers and consent management
- [ ] T131 Implement analytics for user flows (privacy-compliant, local-only)
- [ ] T132 Code cleanup and refactoring across all modules
- [ ] T133 Documentation updates (README, component docs, API docs)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1 - Health)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 5 (P1 - Privacy)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2 - Nutrition)**: Can start after Foundational (Phase 2) - May reference health conditions from US1 but independently testable
- **User Story 3 (P2 - Emotional)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 4 (P3 - Reminders)**: Can start after Foundational (Phase 2) - Uses data from US1, US2, US3 but independently testable once those exist

### Within Each User Story

- Types/interfaces before database stores
- Database stores before hooks
- Hooks before services
- Services before components
- Components before routes
- Core implementation before integration

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, user stories can start in parallel (if team capacity allows)
- Type interfaces within a story marked [P] can run in parallel
- Hooks within a story marked [P] can run in parallel
- Components within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all type interfaces for User Story 1 together:
Task: "Create MedicalRecord type interface in src/types.ts"
Task: "Create HealthCondition type interface in src/types.ts"
Task: "Create SymptomEntry type interface in src/types.ts"

# Launch all hooks for User Story 1 together:
Task: "Create custom hook useMedicalRecords in src/hooks/useMedicalRecords.ts"
Task: "Create custom hook useHealthConditions in src/hooks/useHealthConditions.ts"
Task: "Create custom hook useSymptomEntries in src/hooks/useSymptomEntries.ts"

# Launch all components for User Story 1 together:
Task: "Create HealthUploadScreen component in src/components/health/HealthUploadScreen.tsx"
Task: "Create HealthSummaryScreen component in src/components/health/HealthSummaryScreen.tsx"
Task: "Create SymptomLogScreen component in src/components/health/SymptomLogScreen.tsx"
Task: "Create HealthTimelineScreen component in src/components/health/HealthTimelineScreen.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 5 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Health Analysis & Tracking)
4. Complete Phase 4: User Story 5 (Data Privacy & Management)
5. **STOP and VALIDATE**: Test User Stories 1 & 5 independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP Part 1)
3. Add User Story 5 → Test independently → Deploy/Demo (MVP Part 2 - Privacy Essential)
4. Add User Story 2 → Test independently → Deploy/Demo
5. Add User Story 3 → Test independently → Deploy/Demo
6. Add User Story 4 → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Health)
   - Developer B: User Story 5 (Privacy)
   - Developer C: User Story 2 (Nutrition) - can start in parallel
3. After US1/US5 complete:
   - Developer A: User Story 3 (Emotional)
   - Developer B: User Story 4 (Reminders)
   - Developer C: Polish & optimization
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All components must use Tailwind CSS (hard constraint)
- All screens must be mobile-first with 44x44px touch targets
- All AI features must include clear indicators and disclaimers
- All error messages must be supportive and empathetic (Principle 2)

---

## Task Summary

- **Total Tasks**: 133
- **Setup Tasks**: 8 (Phase 1: T001-T008)
- **Foundational Tasks**: 23 (Phase 2: T009-T031)
- **User Story 1 Tasks**: 21 (Phase 3: T032-T052 - Health Analysis & Tracking)
- **User Story 5 Tasks**: 14 (Phase 4: T053-T066 - Data Privacy & Management)
- **User Story 2 Tasks**: 17 (Phase 5: T067-T083 - Daily Nutrition Companion)
- **User Story 3 Tasks**: 18 (Phase 6: T084-T101 - Mental & Emotional Support)
- **User Story 4 Tasks**: 15 (Phase 7: T102-T116 - Daily Reminders & Insights)
- **Polish Tasks**: 17 (Phase 8: T117-T133)

**Suggested MVP Scope**: User Stories 1 & 5 (Health Tracking + Privacy Management) - 35 tasks after foundational setup (T032-T066)

