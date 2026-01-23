# Research: Nutrition Module Enhancement

**Feature**: Enhanced Nutrition Module with Gentle, Non-Restrictive Design  
**Date**: 2025-01-27  
**Status**: Complete

## Research Questions

### 1. Time-Aware Meal Suggestions

**Question**: How to provide gentle guidance vs. strict recommendations based on time of day (late night scenarios)?

**Decision**: Implement time-aware suggestions that detect late-night context (after 9 PM local time) and provide gentle, supportive guidance rather than strict meal recommendations.

**Rationale**: 
- Late-night eating patterns differ from daytime eating
- Users opening the app late at night may be seeking comfort or dealing with stress
- Strict meal recommendations at night can feel judgmental or restrictive
- Gentle guidance maintains supportive tone while acknowledging context

**Implementation Approach**:
- Detect current time using `new Date()` and user's local timezone
- Define "late night" as after 9:00 PM (21:00) local time
- When late night detected, modify AI prompt to emphasize:
  - Gentle, supportive language
  - Light, comforting options
  - No judgment about eating times
  - Emphasis on self-care rather than strict nutrition
- Display time-aware message in UI: "It's late - here are some gentle suggestions for you"

**Alternatives Considered**:
- User-configurable "late night" threshold → Rejected: Adds cognitive burden, default is sufficient
- Different suggestions entirely for late night → Rejected: Too complex, gentle guidance is better
- No time awareness → Rejected: Misses opportunity for empathetic, context-aware support

**References**:
- Wellmate Constitution Principle 2 (Empathetic Tone)
- Wellmate Constitution Principle 4 (Low Cognitive Burden)

---

### 2. Food Reflection Patterns

**Question**: What are non-judgmental ways to track eating patterns without calorie counting or scoring?

**Decision**: Implement simple daily food reflection with three neutral categories: "light", "normal", "indulgent" - no calorie tracking, no scoring, no judgment.

**Rationale**:
- Three categories provide enough granularity without complexity
- Labels are neutral and descriptive, not judgmental
- "Indulgent" acknowledges that sometimes eating more is okay and part of self-care
- No scoring prevents users from feeling like they're "failing" or "succeeding"
- Optional notes allow users to add context without pressure

**Implementation Approach**:
- Single screen with three large, equally-sized buttons
- Labels: "Light" (🌱), "Normal" (🍽️), "Indulgent" (✨)
- Optional notes field (collapsible, not required)
- One entry per day (overwrite if user reflects multiple times)
- No history tracking or patterns (keeps it simple, low pressure)
- Visual design: Soft, rounded buttons with claymorphic style

**Alternatives Considered**:
- More categories (5-7 options) → Rejected: Too many choices increases cognitive burden
- Slider/scale (1-10) → Rejected: Implies scoring/judgment, too granular
- Text-only input → Rejected: Too much effort, defeats purpose of simplicity
- Calorie tracking with "don't show numbers" option → Rejected: Still implies tracking/restriction

**References**:
- Wellmate Constitution Principle 2 (Empathetic Tone)
- Wellmate Constitution Principle 4 (Low Cognitive Burden)
- User requirement: "No calorie counting, no scoring, no judgment"

---

### 3. Hidden Feature Implementation

**Question**: What are UX patterns for easter egg features that are discoverable but not intrusive?

**Decision**: Implement hidden sugar reduction feature accessible via:
1. Long-press on a specific UI element (e.g., the nutrition icon in bottom tabs)
2. Or a hidden button in settings (small, unobtrusive)
3. Once discovered, feature becomes accessible via main navigation

**Rationale**:
- Long-press is discoverable but not obvious (reduces accidental activation)
- Hidden button provides alternative discovery method
- Once discovered, feature becomes part of normal navigation (not hidden forever)
- Playful, optional nature aligns with "easter egg" concept
- No pressure to use - completely optional

**Implementation Approach**:
- **Discovery**: Long-press (500ms) on nutrition tab icon reveals feature
- **Visual Feedback**: Subtle animation/glow when long-press detected
- **Feature UI**: Small virtual cup that fills when user "pours" (tap gesture)
- **Accumulation**: Multiple small cups (e.g., 5) form one large cup
- **Storage**: Track cups in IndexedDB (local only, no sync needed)
- **Visual Design**: Playful, cute icons (🍵 for small cup, 🫖 for large cup)
- **No Prompts**: Feature never prompts user to use it - completely passive

**Alternatives Considered**:
- Always visible but small → Rejected: Defeats purpose of "hidden" easter egg
- Secret code/gesture → Rejected: Too difficult to discover, reduces accessibility
- Promoted feature → Rejected: Adds pressure, contradicts "optional" nature
- No hidden feature → Rejected: User specifically requested this playful element

**References**:
- User requirement: "This feature should be playful, optional, and hidden, not a core function"
- Wellmate Constitution Principle 4 (Low Cognitive Burden) - feature doesn't add cognitive burden because it's optional

---

### 4. Ingredient Flexibility

**Question**: How to make ingredient-based suggestions flexible (not requiring all ingredients)?

**Decision**: Explicitly communicate in UI and AI prompts that ingredients are "suggestions" and meal ideas can use "some or all" of the provided ingredients.

**Rationale**:
- Users may not have all ingredients available
- Flexibility reduces pressure to buy specific items
- Encourages creativity and adaptation
- Aligns with "low pressure" design principle

**Implementation Approach**:
- UI text: "What ingredients do you have? (Optional - suggestions can use some or all)"
- AI prompt includes: "Generate meal suggestions that can use some or all of the provided ingredients. Ingredients are suggestions, not requirements."
- Display meal suggestions with: "Uses: [ingredients from list]" and "Can also use: [common alternatives]"
- No validation requiring all ingredients to be used

**Alternatives Considered**:
- Require all ingredients → Rejected: Too restrictive, contradicts flexibility principle
- Separate "required" vs "optional" ingredients → Rejected: Adds complexity, cognitive burden
- No ingredient input → Rejected: Core feature requirement

**References**:
- User requirement: "Ingredients are optional suggestions, not required to be fully used"
- User requirement: "Focus on flexibility and low pressure"
- Wellmate Constitution Principle 4 (Low Cognitive Burden)

---

## Technical Decisions

### Time Detection

**Decision**: Use browser's `Date` object with local timezone. No server-side time needed.

**Rationale**: 
- PWA runs locally, no server dependency
- User's local time is most relevant for "late night" context
- Simple implementation, no timezone conversion needed

### Food Reflection Storage

**Decision**: One entry per day, overwrite if user reflects multiple times. Store in IndexedDB with date as key.

**Rationale**:
- One reflection per day keeps it simple
- Overwriting prevents accumulation of multiple entries
- Date-based key enables easy lookup and prevents duplicates

### Easter Egg Storage

**Decision**: Store cup count in IndexedDB with simple counter. No complex state management needed.

**Rationale**:
- Simple counter is sufficient for playful feature
- Local storage maintains privacy
- No need for complex state or synchronization

---

## Integration Points

### Existing Components
- `NutritionHomeScreen`: Add link to food reflection
- `MealSuggestionsScreen`: Add time-aware messaging
- `NutritionInputScreen`: Enhance with flexibility messaging

### New Components
- `FoodReflectionScreen`: New component for daily reflection
- `SugarReductionEasterEgg`: New hidden component

### Data Model Changes
- Add `FoodReflection` entity to `types.ts`
- Add `foodReflections` object store to `db.ts`
- Enhance `MealSuggestion` with `timeAwareGuidance` field (optional)

### LLM Service Changes
- Enhance `generateMealSuggestions` with time-aware prompt modification
- Add gentle guidance for late-night context

---

## Open Questions Resolved

✅ **Q1**: How to detect "late night"? → After 9 PM local time  
✅ **Q2**: Best UI pattern for food reflection? → Three large buttons (light/normal/indulgent)  
✅ **Q3**: Storage pattern for food reflection? → One entry per day, overwrite  
✅ **Q4**: Easter egg discovery mechanism? → Long-press on nutrition tab icon  
✅ **Q5**: Integration with meal suggestions? → Time-aware prompt modification in LLM service

---

## Next Steps

1. Create data model (`data-model.md`) with `FoodReflection` entity
2. Create API contracts (`contracts/`) for enhanced LLM service
3. Create quickstart guide (`quickstart.md`) for implementation
4. Generate implementation tasks (`tasks.md` via `/speckit.tasks`)


