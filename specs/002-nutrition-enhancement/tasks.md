# Tasks: Nutrition Module Enhancement

**Input**: Design documents from `/specs/002-nutrition-enhancement/`
**Prerequisites**: plan.md ✅, data-model.md ✅, contracts/ ✅, research.md ✅, quickstart.md ✅

**Tests**: Tests are OPTIONAL - not explicitly requested in feature specification, so test tasks are excluded.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## User Stories (Derived from plan.md)

- **US1 (P1 - MVP)**: Daily Food Reflection - Users can optionally mark how they ate today (light/normal/indulgent) without calorie counting or judgment
- **US2 (P2)**: Time-Aware Meal Suggestions - Meal suggestions adapt to late-night context with gentle guidance
- **US3 (P2)**: Enhanced Ingredient Input - Emphasize ingredient flexibility (optional, not required)
- **US4 (P3)**: Sugar Reduction Easter Egg - Hidden playful feature for reducing sugary drinks

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema updates and type definitions that all user stories depend on

- [X] T001 Increment database version from 1 to 2 in src/db.ts
- [X] T002 [P] Add FoodReflection type definition to src/types.ts
- [X] T003 [P] Add SugarReductionCup type definition to src/types.ts
- [X] T004 [P] Enhance MealSuggestion type with timeAwareGuidance and isFlexible fields in src/types.ts
- [X] T005 Create foodReflections object store with date unique index in src/db.ts
- [X] T006 Create sugarReductionCups object store in src/db.ts
- [X] T007 Enhance mealSuggestions object store with new indexes in src/db.ts
- [X] T008 Implement migrateToVersion2 function in src/db.ts

**Checkpoint**: Database schema ready for all user stories

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core storage and service infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T009 Implement saveFoodReflection function in src/services/storage/indexedDB.ts
- [X] T010 Implement getFoodReflection function in src/services/storage/indexedDB.ts
- [X] T011 Implement getFoodReflections function in src/services/storage/indexedDB.ts
- [X] T012 Implement deleteFoodReflection function in src/services/storage/indexedDB.ts
- [X] T013 [P] Implement getSugarReductionCups function in src/services/storage/indexedDB.ts
- [X] T014 [P] Implement pourSugarReductionCup function in src/services/storage/indexedDB.ts
- [X] T015 [P] Implement resetSugarReductionCups function in src/services/storage/indexedDB.ts
- [X] T016 Add validation function validateFoodReflection in src/utils/validation.ts
- [X] T017 Add validation function validateSugarReductionCup in src/utils/validation.ts
- [X] T018 Implement isLateNight helper function in src/services/llmService.ts
- [X] T019 Enhance generateMealSuggestions with time-aware prompt modification in src/services/llmService.ts
- [X] T020 Enhance generateMealSuggestions with flexibility instructions in src/services/llmService.ts
- [X] T021 Update generateMealSuggestions to return timeAwareGuidance field in src/services/llmService.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Daily Food Reflection (Priority: P1) 🎯 MVP

**Goal**: Users can optionally mark how they ate today (light/normal/indulgent) with optional notes. No calorie counting, no scoring, no judgment. One reflection per day (overwrites if multiple entries).

**Independent Test**: User can open nutrition tab, navigate to food reflection, select light/normal/indulgent, optionally add notes, save, and see their reflection for today. Can update reflection multiple times per day (overwrites).

### Implementation for User Story 1

- [X] T022 [P] [US1] Create useFoodReflection custom hook in src/hooks/useFoodReflection.ts
- [X] T023 [US1] Implement FoodReflectionScreen component in src/components/nutrition/FoodReflectionScreen.tsx
- [X] T024 [US1] Add food reflection route to src/navigation/routes.tsx
- [X] T025 [US1] Add food reflection navigation link in NutritionHomeScreen in src/components/shared/Layout.tsx
- [X] T026 [US1] Add food reflection translation keys to src/i18n/locales/en.ts
- [X] T027 [US1] Add food reflection translation keys to src/i18n/locales/zh.ts
- [X] T028 [US1] Apply claymorphic styling to FoodReflectionScreen (soft, rounded buttons, 44x44px minimum touch targets)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Users can reflect on their daily eating without judgment.

---

## Phase 4: User Story 2 - Time-Aware Meal Suggestions (Priority: P2)

**Goal**: When users open meal suggestions late at night (after 9 PM), provide gentle, supportive guidance instead of strict recommendations. Display time-aware messaging in UI.

**Independent Test**: User opens meal suggestions screen after 9 PM local time, sees gentle time-aware message, receives meal suggestions with timeAwareGuidance field populated. Same screen works normally during daytime.

### Implementation for User Story 2

- [X] T029 [P] [US2] Enhance MealSuggestionsScreen with time detection logic in src/components/nutrition/MealSuggestionsScreen.tsx
- [X] T030 [US2] Add time-aware messaging UI component in MealSuggestionsScreen (display when late night detected)
- [X] T031 [US2] Update generateMealSuggestions call to pass timeAware option in MealSuggestionsScreen
- [X] T032 [US2] Display timeAwareGuidance field in meal suggestion cards when present
- [X] T033 [US2] Add time-aware translation keys to src/i18n/locales/en.ts
- [X] T034 [US2] Add time-aware translation keys to src/i18n/locales/zh.ts
- [X] T035 [US2] Apply claymorphic styling to time-aware messaging (soft, supportive colors)

**Checkpoint**: At this point, User Story 2 should be fully functional. Meal suggestions adapt to late-night context with gentle guidance.

---

## Phase 5: User Story 3 - Enhanced Ingredient Input (Priority: P2)

**Goal**: Emphasize that ingredients are optional suggestions, not requirements. Update UI and AI prompts to communicate flexibility clearly.

**Independent Test**: User opens ingredient input screen, sees clear messaging that ingredients are optional suggestions. Can generate meal suggestions with partial ingredients. AI suggestions use some or all ingredients.

### Implementation for User Story 3

- [X] T036 [P] [US3] Enhance NutritionInputScreen with flexibility messaging in src/components/nutrition/NutritionInputScreen.tsx
- [X] T037 [US3] Update ingredient input placeholder text to emphasize optional nature
- [X] T038 [US3] Ensure generateMealSuggestions defaults flexible option to true
- [X] T039 [US3] Display isFlexible indicator in meal suggestion cards
- [X] T040 [US3] Add ingredient flexibility translation keys to src/i18n/locales/en.ts
- [X] T041 [US3] Add ingredient flexibility translation keys to src/i18n/locales/zh.ts
- [X] T042 [US3] Update existing useMealSuggestions hook if needed to support flexibility

**Checkpoint**: At this point, User Story 3 should be fully functional. Ingredient input clearly communicates flexibility, and meal suggestions reflect this.

---

## Phase 6: User Story 4 - Sugar Reduction Easter Egg (Priority: P3)

**Goal**: Hidden playful feature accessible via long-press on nutrition tab icon. Users can pour small virtual cups when resisting sugary drinks. 5 small cups form 1 large cup. Feature is optional, hidden, and playful.

**Independent Test**: User long-presses nutrition tab icon (500ms), easter egg feature appears. User can pour cups, see accumulation. 5 small cups automatically form 1 large cup. Feature remains hidden until discovered.

### Implementation for User Story 4

- [X] T043 [P] [US4] Create SugarReductionEasterEgg component in src/components/nutrition/SugarReductionEasterEgg.tsx
- [X] T044 [US4] Implement long-press detection on nutrition tab icon in src/components/shared/BottomTabs.tsx
- [X] T045 [US4] Add easter egg route to src/navigation/routes.tsx
- [X] T046 [US4] Implement cup pouring animation/interaction in SugarReductionEasterEgg component
- [X] T047 [US4] Implement small cup to large cup conversion logic (5 small = 1 large)
- [X] T048 [US4] Add celebration animation when large cup is formed
- [X] T049 [US4] Add easter egg translation keys to src/i18n/locales/en.ts
- [X] T050 [US4] Add easter egg translation keys to src/i18n/locales/zh.ts
- [X] T051 [US4] Apply playful, cute styling to easter egg component (claymorphic design)

**Checkpoint**: At this point, User Story 4 should be fully functional. Hidden easter egg feature is discoverable and playful.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T052 [P] Update NutritionHomeScreen to show all new features in src/components/shared/Layout.tsx
- [X] T053 [P] Ensure all nutrition components use claymorphic styling consistently
- [X] T054 [P] Verify offline support for food reflection (works without network)
- [X] T055 [P] Verify offline support for ingredient input (works without network)
- [X] T056 [P] Add error handling and user-friendly error messages across all nutrition components
- [X] T057 [P] Verify all touch targets meet 44x44px minimum requirement
- [X] T058 [P] Verify WCAG 2.1 AA accessibility compliance for all nutrition screens
- [X] T059 [P] Update data export functionality to include foodReflections and sugarReductionCups in src/utils/export.ts
- [X] T060 [P] Update data deletion functionality to include foodReflections and sugarReductionCups in src/services/storage/indexedDB.ts
- [X] T061 [P] Run quickstart.md validation checklist
- [X] T062 [P] Code cleanup and refactoring across nutrition module
- [X] T063 [P] Performance optimization (ensure <100ms UI interactions, <10s AI response time)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Enhances existing meal suggestions, should work independently
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Enhances existing ingredient input, should work independently
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Completely independent hidden feature

### Within Each User Story

- Hooks before components
- Components before navigation/routes
- Translation keys can be added in parallel
- Core implementation before styling
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002-T004)
- All Foundational storage tasks marked [P] can run in parallel (T013-T015)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Type definitions (T002-T004) can be done in parallel
- Translation keys for each story can be added in parallel (T026-T027, T033-T034, T040-T041, T049-T050)
- Polish tasks marked [P] can all run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch type definition and hook creation in parallel:
Task: "Add FoodReflection type definition to src/types.ts"
Task: "Create useFoodReflection custom hook in src/hooks/useFoodReflection.ts"

# Launch translation keys in parallel:
Task: "Add food reflection translation keys to src/i18n/locales/en.ts"
Task: "Add food reflection translation keys to src/i18n/locales/zh.ts"
```

---

## Parallel Example: Foundational Phase

```bash
# Launch storage service methods in parallel (different functions, no dependencies):
Task: "Implement getSugarReductionCups function in src/services/storage/indexedDB.ts"
Task: "Implement pourSugarReductionCup function in src/services/storage/indexedDB.ts"
Task: "Implement resetSugarReductionCups function in src/services/storage/indexedDB.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (database schema, types)
2. Complete Phase 2: Foundational (storage methods, LLM enhancements)
3. Complete Phase 3: User Story 1 (Daily Food Reflection)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo (optional feature)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Food Reflection)
   - Developer B: User Story 2 (Time-Aware Suggestions)
   - Developer C: User Story 3 (Ingredient Flexibility)
   - Developer D: User Story 4 (Easter Egg) - can start later
3. Stories complete and integrate independently

---

## Task Summary

- **Total Tasks**: 63
- **Setup Phase**: 8 tasks
- **Foundational Phase**: 13 tasks
- **User Story 1 (P1)**: 7 tasks
- **User Story 2 (P2)**: 7 tasks
- **User Story 3 (P2)**: 7 tasks
- **User Story 4 (P3)**: 9 tasks
- **Polish Phase**: 12 tasks

### Suggested MVP Scope

**MVP = User Story 1 (Daily Food Reflection)**
- Phase 1: Setup (8 tasks)
- Phase 2: Foundational (13 tasks)
- Phase 3: User Story 1 (7 tasks)
- **Total MVP Tasks**: 28 tasks

### Independent Test Criteria

- **US1**: User can reflect on daily eating (light/normal/indulgent) with optional notes, one per day
- **US2**: Meal suggestions adapt to late-night context (after 9 PM) with gentle guidance
- **US3**: Ingredient input clearly communicates flexibility, suggestions use some or all ingredients
- **US4**: Hidden easter egg discoverable via long-press, cup pouring works, 5 small = 1 large

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All components must use claymorphic styling (soft, rounded, pastel colors)
- All touch targets must meet 44x44px minimum
- All features must support offline mode where applicable
- No calorie tracking, no scoring, no judgmental language

---

## Format Validation

✅ All tasks follow checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`
✅ All tasks have sequential IDs (T001-T063)
✅ All user story tasks have [Story] labels ([US1], [US2], [US3], [US4])
✅ All parallelizable tasks marked with [P]
✅ All tasks include exact file paths
✅ Tasks organized by user story for independent implementation

