# Implementation Plan: Nutrition Module Enhancement

**Branch**: `002-nutrition-enhancement` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification for enhanced Nutrition module with gentle, non-restrictive design

## Summary

Enhance the Nutrition module with a gentle, non-restrictive design that focuses on flexibility, low pressure, and supportive guidance. The enhancement includes daily meal suggestions based on optional ingredients, simple daily food reflection without calorie counting, time-aware suggestions for late-night interactions, and a hidden playful feature for reducing sugary drinks. All features maintain a supportive, empathetic tone with no punishment or failure states.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18.x  
**Primary Dependencies**: 
- React 18.x (UI framework)
- TypeScript 5.x (type safety)
- Tailwind CSS (styling solution - hard constraint)
- Vite (build tooling)
- IndexedDB (via idb for local storage)
- LLM Service Provider: Gemini API via HyperEcho Proxy
  - Model: vibe-coding-app-gemini
  - Base URL: https://hyperecho-proxy.aelf.dev/v1
  - API Key: Configured via environment variables
- React Router (screen-based navigation)
- Date-fns (date handling for time-aware features)

**Storage**: IndexedDB (local browser storage) via `db.ts` and `services/storage/`  
**Testing**: Vitest + React Testing Library  
**Target Platform**: Modern browsers (Chrome, Safari, Firefox, Edge) with PWA support, mobile-first (iOS Safari 14+, Chrome Android)  
**Project Type**: Single web application (React PWA)  
**Performance Goals**: 
- Meal suggestion generation: <10s response time
- UI interactions: <100ms response time
- Offline support for core features

**Constraints**: 
- Mobile-first design (44x44px touch targets minimum)
- Offline support for ingredient input and food reflection
- No calorie tracking or scoring systems
- No judgmental language or failure states
- PWA with offline capabilities

**Scale/Scope**: 
- Single user application (local-first)
- Support for unlimited ingredient lists and meal suggestions
- Daily food reflection entries (one per day)
- Hidden easter egg feature (optional, playful)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Wellmate Constitution Compliance Checklist:**

- [x] **Principle 1 (Non-Diagnostic)**: Feature does NOT provide medical diagnoses, prescriptions, or treatment recommendations. All suggestions are clearly labeled as lifestyle/dietary guidance only. Meal suggestions are optional and flexible, not prescriptive.
- [x] **Principle 2 (Empathetic Tone)**: All user-facing text maintains supportive, empathetic, non-judgmental tone. Food reflection uses neutral labels (light/normal/indulgent) without judgment. Error messages are encouraging.
- [x] **Principle 3 (Privacy-First)**: All nutrition data (ingredients, meal suggestions, food reflections) stored locally in IndexedDB. No sensitive data transmitted without explicit user consent. Clear data deletion options.
- [x] **Principle 4 (Low Cognitive Burden)**: UI is simple, intuitive, minimal steps. Food reflection is a single tap. Ingredient input is optional and flexible. Navigation ≤3 levels deep. Core actions completable in <30 seconds.
- [x] **Principle 5 (Mobile-First)**: Touch-optimized (44x44px minimum). PWA with offline support. WCAG 2.1 AA compliance. Claymorphic design with soft, puffy elements.
- [x] **Principle 6 (Offline Support)**: Core features (ingredient input, food reflection) work offline. AI meal suggestions degrade gracefully with clear messaging when offline.
- [x] **Principle 7 (Transparent AI)**: AI usage clearly indicated when generating meal suggestions. Users understand why AI made suggestions. AI responses distinguishable from user-entered data.
- [x] **Principle 8 (Data Ownership)**: Users can export data (JSON/CSV). Deletion is permanent and verifiable. Clear ownership statements.

**Architecture Compliance:**
- [x] Uses React + TypeScript
- [x] IndexedDB for local persistence (via `db.ts` and `services/storage/`)
- [x] External APIs isolated in `services/` directory
- [x] Follows established folder structure (`src/components/`, `src/hooks/`, `src/services/`, etc.)

## Project Structure

### Documentation (this feature)

```text
specs/002-nutrition-enhancement/
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
│   ├── nutrition/
│   │   ├── NutritionInputScreen.tsx      # Enhanced ingredient input (optional, flexible)
│   │   ├── MealSuggestionsScreen.tsx      # AI meal suggestions with time-aware guidance
│   │   ├── MealDetailScreen.tsx           # Meal detail view
│   │   ├── FoodReflectionScreen.tsx       # NEW: Daily food reflection (light/normal/indulgent)
│   │   └── SugarReductionEasterEgg.tsx     # NEW: Hidden playful feature
│   └── shared/
│       ├── Button.tsx
│       ├── Card.tsx
│       └── AIIndicator.tsx
├── hooks/
│   ├── useIngredientLists.ts              # Existing hook (may need enhancement)
│   ├── useMealSuggestions.ts              # Existing hook (may need enhancement)
│   └── useFoodReflection.ts               # NEW: Hook for daily food reflection
├── services/
│   ├── llmService.ts                      # Enhanced with time-aware meal suggestions
│   └── storage/
│       └── indexedDB.ts                    # Enhanced with food reflection storage
├── types.ts                               # Enhanced with FoodReflection type
└── db.ts                                  # Enhanced with foodReflections object store
```

**Structure Decision**: Single React application following established patterns. New components added to `src/components/nutrition/`, new hooks to `src/hooks/`, and data model enhancements to `src/types.ts` and `src/db.ts`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

## Phase 0: Outline & Research

### Research Tasks

1. **Time-aware meal suggestions**: Research best practices for providing gentle guidance vs. strict recommendations based on time of day (late night scenarios)
2. **Food reflection patterns**: Research non-judgmental ways to track eating patterns without calorie counting or scoring
3. **Hidden feature implementation**: Research UX patterns for easter egg features that are discoverable but not intrusive
4. **Ingredient flexibility**: Research how to make ingredient-based suggestions flexible (not requiring all ingredients)

### Unknowns to Resolve

- How to detect "late night" context (time threshold, user timezone handling)
- Best UI pattern for food reflection (single tap vs. multi-step)
- Storage pattern for daily food reflection (one entry per day, overwrite vs. append)
- Easter egg discovery mechanism (how users find it without explicit UI)
- Integration with existing meal suggestion flow

## Phase 1: Design & Contracts

### Data Model Enhancements

**New Entity: FoodReflection**
- `id`: string (unique identifier)
- `date`: string (ISO date, one entry per day)
- `reflection`: 'light' | 'normal' | 'indulgent'
- `notes`: string | null (optional user notes)
- `createdAt`: string (ISO timestamp)
- `updatedAt`: string (ISO timestamp)

**Enhanced Entity: MealSuggestion**
- Add `timeAwareGuidance`: string | null (gentle guidance for late-night context)
- Add `isFlexible`: boolean (indicates ingredients are optional)

### API Contracts

**LLM Service Contract** (`contracts/llm-service.md`):
- `generateMealSuggestions(input, options)`: Enhanced with time-aware guidance
  - Input: ingredients (array), healthConditions (optional), energyLevel (optional), currentTime (optional)
  - Output: meal suggestions with time-aware guidance if late night
  - Options: `timeAware`: boolean (enable time-aware suggestions)

**Storage Service Contract** (`contracts/storage-service.md`):
- `saveFoodReflection(reflection)`: Save or update daily food reflection
- `getFoodReflection(date)`: Get food reflection for specific date
- `getFoodReflections(startDate, endDate)`: Get food reflections for date range

### Component Design

1. **FoodReflectionScreen**: Simple screen with three large buttons (light/normal/indulgent), optional notes field, save button
2. **Enhanced MealSuggestionsScreen**: Add time-aware messaging when opened late at night
3. **Enhanced NutritionInputScreen**: Emphasize ingredient flexibility (optional, not required)
4. **SugarReductionEasterEgg**: Hidden component accessible via special gesture or hidden button

## Phase 0: Complete ✅

**Output**: `research.md` - All research questions resolved:
- ✅ Time-aware meal suggestions (late night detection after 9 PM)
- ✅ Food reflection patterns (three neutral categories: light/normal/indulgent)
- ✅ Hidden feature implementation (long-press discovery mechanism)
- ✅ Ingredient flexibility (explicit UI and prompt communication)

## Phase 1: Complete ✅

**Outputs**:
- ✅ `data-model.md` - Complete data model with FoodReflection and SugarReductionCup entities
- ✅ `contracts/llm-service.md` - Enhanced LLM service contract with time-aware prompts
- ✅ `contracts/storage-service.md` - Storage service contract for new entities
- ✅ `quickstart.md` - Implementation guide with step-by-step instructions

## Phase 2: Implementation Tasks

*Note: This section will be populated by `/speckit.tasks` command, not by `/speckit.plan`*

## Next Steps

1. ✅ Phase 0 research complete (`research.md`)
2. ✅ Phase 1 design complete (`data-model.md`, `contracts/`, `quickstart.md`)
3. Run `/speckit.tasks` to generate implementation tasks
4. Begin implementation following task order

## Summary

The implementation plan for the Nutrition module enhancement is complete. All research questions have been resolved, data models defined, API contracts specified, and a quickstart guide provided. The plan is ready for task generation and implementation.

