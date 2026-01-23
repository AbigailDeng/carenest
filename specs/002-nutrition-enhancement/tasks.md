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
- **US5 (P2)**: Meal Detail View - Clickable meal suggestion cards open detail view with detailed preparation method, LLM-generated image, and complete meal information
- **US6 (P2)**: Save Meal as Eaten - Users can save meal suggestions as FoodReflection records, displayed on calendar with same visual markers

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

**Goal**: Replace one-by-one ingredient addition with single textarea for free-form text input. Users type all ingredients as plain text, and LLM parses them. Emphasize that ingredients are optional suggestions, not requirements.

**Independent Test**: User opens ingredient input screen, sees single textarea (no "Add" button or ingredient list). User types ingredients as free-form text (e.g., "tomato, pasta, cheese" or "chicken rice"), generates meal suggestions. LLM parses ingredients from text. AI suggestions use some or all identified ingredients.

### Implementation for User Story 3

- [X] T036 [US3] Replace one-by-one ingredient input with single textarea in src/components/nutrition/NutritionInputScreen.tsx (remove "Add" button, ingredient list display, and handleAddIngredient/handleRemoveIngredient functions)
- [X] T037 [US3] Update state management to use single string (ingredientsText) instead of array (ingredients) in NutritionInputScreen
- [X] T038 [US3] Update MealSuggestionInput interface to accept ingredients as string instead of string[] in src/services/llmService.ts
- [X] T039 [US3] Update generateMealSuggestions to pass ingredients as string directly to LLM (no parsing) in src/services/llmService.ts
- [X] T040 [US3] Update prompt template to instruct LLM to parse ingredients from free-form text in src/services/llmService.ts
- [X] T041 [US3] Update MealSuggestionsScreen to handle ingredients as string from location state in src/components/nutrition/MealSuggestionsScreen.tsx
- [X] T042 [US3] Update ingredient input placeholder text to guide free-form input in src/components/nutrition/NutritionInputScreen.tsx
- [X] T043 [US3] Add ingredient flexibility translation keys (updated for textarea) to src/i18n/locales/en.ts
- [X] T044 [US3] Add ingredient flexibility translation keys (updated for textarea) to src/i18n/locales/zh.ts
- [X] T045 [US3] Ensure generateMealSuggestions defaults flexible option to true in src/services/llmService.ts
- [X] T046 [US3] Display isFlexible indicator in meal suggestion cards in src/components/nutrition/MealSuggestionsScreen.tsx

**Checkpoint**: At this point, User Story 3 should be fully functional. Ingredient input uses single textarea for free-form text, LLM parses ingredients, and meal suggestions reflect flexibility.

---

## Phase 6: User Story 4 - Sugar Reduction Easter Egg (Priority: P3)

**Goal**: Hidden playful feature accessible via long-press on nutrition tab icon. Users can pour small virtual cups when resisting sugary drinks. 5 small cups form 1 large cup. Feature is optional, hidden, and playful.

**Independent Test**: User long-presses nutrition tab icon (500ms), easter egg feature appears. User can pour cups, see accumulation. 5 small cups automatically form 1 large cup. Feature remains hidden until discovered.

### Implementation for User Story 4

- [ ] T047 [P] [US4] Create SugarReductionEasterEgg component in src/components/nutrition/SugarReductionEasterEgg.tsx
- [ ] T048 [US4] Implement long-press detection on nutrition tab icon in src/components/shared/BottomTabs.tsx
- [ ] T049 [US4] Add easter egg route to src/navigation/routes.tsx
- [ ] T050 [US4] Implement cup pouring animation/interaction in SugarReductionEasterEgg component
- [ ] T051 [US4] Implement small cup to large cup conversion logic (5 small = 1 large)
- [ ] T052 [US4] Add celebration animation when large cup is formed
- [ ] T053 [US4] Add easter egg translation keys to src/i18n/locales/en.ts
- [ ] T054 [US4] Add easter egg translation keys to src/i18n/locales/zh.ts
- [ ] T055 [US4] Apply playful, cute styling to easter egg component (claymorphic design)

**Checkpoint**: At this point, User Story 4 should be fully functional. Hidden easter egg feature is discoverable and playful.

---

## Phase 7: User Story 5 - Meal Detail View (Priority: P2)

**Goal**: Meal suggestion cards are clickable. Clicking opens a modal/bottom drawer detail view with detailed step-by-step preparation method, LLM-generated image (generated on-demand), ingredients list, time-aware guidance (if applicable), and flexibility note.

**Independent Test**: User clicks on a meal suggestion card, detail view opens as modal/bottom drawer. Detail view displays detailed preparation method (step-by-step numbered list), ingredients list, LLM-generated image (generated when detail opens), time-aware guidance (if applicable), and flexibility note. User can close detail view to return to suggestions list.

### Implementation for User Story 5

- [X] T068 [P] [US5] Enhance MealSuggestion type with detailedPreparationMethod and imageUrl fields in src/types.ts
- [X] T069 [US5] Implement generateMealDetail function in src/services/llmService.ts (generates detailed preparation method and image on-demand)
- [X] T070 [US5] Create MealDetailScreen component as modal/bottom drawer in src/components/nutrition/MealDetailScreen.tsx
- [X] T071 [US5] Implement click handler on meal suggestion cards in src/components/nutrition/MealSuggestionsScreen.tsx
- [X] T072 [US5] Add state management for detail view (selected meal, loading, error) in MealSuggestionsScreen
- [X] T073 [US5] Implement image generation API call in generateMealDetail (using Gemini 2.0 Flash or similar)
- [X] T074 [US5] Display detailed preparation method as step-by-step numbered list in MealDetailScreen
- [X] T075 [US5] Display LLM-generated image in MealDetailScreen (with placeholder if generation fails)
- [X] T076 [US5] Display complete meal information (ingredients, time-aware guidance, flexibility note) in MealDetailScreen
- [X] T077 [US5] Implement close button/gesture for detail view modal in MealDetailScreen
- [X] T078 [US5] Add meal detail translation keys to src/i18n/locales/en.ts
- [X] T079 [US5] Add meal detail translation keys to src/i18n/locales/zh.ts
- [X] T080 [US5] Apply claymorphic styling to MealDetailScreen (modal/drawer, soft rounded corners, 44x44px touch targets)

**Checkpoint**: At this point, User Story 5 should be fully functional. Users can click meal suggestion cards to view detailed information with images.

---

## Phase 8: User Story 6 - Save Meal as Eaten (Priority: P2)

**Goal**: Users can save meal suggestions as FoodReflection records from the detail view. Saved meals appear on calendar with same visual markers as existing FoodReflection records. Auto-infer mealType based on current time, default reflection to 'normal', allow user to modify before saving.

**Independent Test**: User opens meal detail view, clicks "Save as Eaten" button, sees mealType selection (auto-inferred from current time) and reflection selection (default 'normal'), can modify both, saves. Saved meal appears on calendar with visual markers. If record exists for same date+mealType, overwrites existing record.

### Implementation for User Story 6

- [X] T081 [US6] Add "Save as Eaten" button to MealDetailScreen footer in src/components/nutrition/MealDetailScreen.tsx
- [X] T082 [US6] Add state management for mealType and reflection selection in MealDetailScreen (auto-infer mealType from current time, default reflection to 'normal')
- [X] T083 [US6] Implement mealType selection UI (breakfast/lunch/dinner/snack) in MealDetailScreen with auto-inferred default
- [X] T084 [US6] Implement reflection selection UI (light/normal/indulgent) in MealDetailScreen with 'normal' default
- [X] T085 [US6] Implement saveMealAsEaten function that creates FoodReflection from MealSuggestion in MealDetailScreen
- [X] T086 [US6] Use meal name as notes field when creating FoodReflection in saveMealAsEaten function
- [X] T087 [US6] Handle overwrite logic for existing records (same date+mealType) in saveMealAsEaten function
- [X] T088 [US6] Add success feedback after saving meal (toast or message) in MealDetailScreen
- [X] T089 [US6] Close detail view after successful save in MealDetailScreen
- [X] T090 [US6] Add save meal translation keys to src/i18n/locales/en.ts
- [X] T091 [US6] Add save meal translation keys to src/i18n/locales/zh.ts
- [X] T092 [US6] Verify saved meals appear on calendar with correct visual markers in NutritionCalendarScreen

**Checkpoint**: At this point, User Story 6 should be fully functional. Users can save meal suggestions as FoodReflection records, and saved meals appear on calendar.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T056 [P] Update NutritionHomeScreen to show all new features in src/components/shared/Layout.tsx
- [ ] T057 [P] Ensure all nutrition components use claymorphic styling consistently
- [ ] T058 [P] Verify offline support for food reflection (works without network)
- [ ] T059 [P] Verify offline support for ingredient input (works without network)
- [ ] T060 [P] Add error handling and user-friendly error messages across all nutrition components
- [ ] T061 [P] Verify all touch targets meet 44x44px minimum requirement
- [ ] T062 [P] Verify WCAG 2.1 AA accessibility compliance for all nutrition screens
- [ ] T063 [P] Update data export functionality to include foodReflections and sugarReductionCups in src/utils/export.ts
- [ ] T064 [P] Update data deletion functionality to include foodReflections and sugarReductionCups in src/services/storage/indexedDB.ts
- [ ] T065 [P] Run quickstart.md validation checklist
- [ ] T066 [P] Code cleanup and refactoring across nutrition module
- [ ] T067 [P] Performance optimization (ensure <100ms UI interactions, <10s AI response time)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Enhances existing meal suggestions, should work independently
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Enhances existing ingredient input, should work independently
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Completely independent hidden feature
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - Enhances meal suggestions (US2), should work independently
- **User Story 6 (P2)**: Can start after Foundational (Phase 2) - Enhances meal detail view (US5), requires FoodReflection infrastructure (US1)

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
- Translation keys for each story can be added in parallel (T026-T027, T033-T034, T043-T044, T053-T054, T078-T079, T090-T091)
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

- **Total Tasks**: 92 (updated: added US6 for save meal as eaten)
- **Setup Phase**: 8 tasks
- **Foundational Phase**: 13 tasks
- **User Story 1 (P1)**: 7 tasks
- **User Story 2 (P2)**: 7 tasks
- **User Story 3 (P2)**: 11 tasks (updated for single textarea input)
- **User Story 4 (P3)**: 9 tasks
- **User Story 5 (P2)**: 13 tasks (meal detail view with images)
- **User Story 6 (P2)**: 12 tasks (save meal as eaten)
- **Polish Phase**: 12 tasks

### Suggested MVP Scope

**MVP = User Story 1 (Daily Food Reflection)**
- Phase 1: Setup (8 tasks)
- Phase 2: Foundational (13 tasks)
- Phase 3: User Story 1 (7 tasks)
- **Total MVP Tasks**: 28 tasks

**Note**: User Story 3 tasks have been updated to reflect the clarification: single textarea for free-form ingredient input instead of one-by-one addition.

### Independent Test Criteria

- **US1**: User can reflect on daily eating (light/normal/indulgent) with optional notes, one per day
- **US2**: Meal suggestions adapt to late-night context (after 9 PM) with gentle guidance
- **US3**: Ingredient input uses single textarea for free-form text, LLM parses ingredients, suggestions use some or all identified ingredients
- **US4**: Hidden easter egg discoverable via long-press, cup pouring works, 5 small = 1 large
- **US5**: Meal suggestion cards are clickable, detail view opens as modal/drawer with detailed preparation method (step-by-step), LLM-generated image, and complete information
- **US6**: Users can save meal suggestions as FoodReflection records from detail view, saved meals appear on calendar with visual markers, auto-infer mealType and reflection with user modification option

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
✅ All tasks have sequential IDs (T001-T092 for all tasks)
✅ All user story tasks have [Story] labels ([US1], [US2], [US3], [US4], [US5], [US6])
✅ All parallelizable tasks marked with [P]
✅ All tasks include exact file paths
✅ Tasks organized by user story for independent implementation

