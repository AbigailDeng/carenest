# Quickstart: Nutrition Module Enhancement

**Feature**: Enhanced Nutrition Module  
**Date**: 2025-01-27  
**Status**: Ready for Implementation

## Overview

This guide provides a quick reference for implementing the enhanced Nutrition module with daily food reflection, time-aware meal suggestions, and the hidden sugar reduction easter egg feature.

---

## Architecture Overview

### Components

```
src/components/nutrition/
├── NutritionInputScreen.tsx      # Enhanced ingredient input
├── MealSuggestionsScreen.tsx      # Time-aware meal suggestions
├── MealDetailScreen.tsx           # Meal detail view
├── FoodReflectionScreen.tsx       # NEW: Daily food reflection
└── SugarReductionEasterEgg.tsx   # NEW: Hidden playful feature
```

### Hooks

```
src/hooks/
├── useIngredientLists.ts          # Existing (may need enhancement)
├── useMealSuggestions.ts          # Existing (may need enhancement)
└── useFoodReflection.ts           # NEW: Food reflection hook
```

### Services

```
src/services/
├── llmService.ts                  # Enhanced with time-aware suggestions
└── storage/
    └── indexedDB.ts              # Enhanced with food reflection storage
```

### Data Model

```
src/types.ts                       # Add FoodReflection, SugarReductionCup types
src/db.ts                          # Add foodReflections, sugarReductionCups stores
```

---

## Implementation Steps

### Step 1: Database Schema Updates

**File**: `src/db.ts`

1. **Increment database version** (e.g., version 1 → version 2)
2. **Add new object stores**:
   - `foodReflections` (with `date` unique index)
   - `sugarReductionCups` (singleton pattern)
3. **Enhance existing store**:
   - Add `timeAwareGuidance` and `isFlexible` fields to `mealSuggestions`
4. **Create migration function**:
   ```typescript
   export async function migrateToVersion2(db: IDBPDatabase<WellmateDB>) {
     // Create foodReflections store
     // Create sugarReductionCups store
     // Update existing mealSuggestions records
   }
   ```

**Reference**: See `data-model.md` for detailed schema definitions.

---

### Step 2: Type Definitions

**File**: `src/types.ts`

Add new types:

```typescript
export type FoodReflectionType = 'light' | 'normal' | 'indulgent';

export interface FoodReflection extends BaseEntity {
  date: string;                     // ISO date (YYYY-MM-DD)
  reflection: FoodReflectionType;
  notes: string | null;
}

export interface SugarReductionCup extends BaseEntity {
  smallCups: number;                // 0-4
  largeCups: number;                // Accumulated
  lastPourDate: string | null;     // ISO date (YYYY-MM-DD)
}
```

Enhance existing type:

```typescript
export interface MealSuggestion extends BaseEntity {
  // ... existing fields ...
  timeAwareGuidance: string | null;  // NEW
  isFlexible: boolean;                // NEW (default: true)
}
```

---

### Step 3: Storage Service Methods

**File**: `src/services/storage/indexedDB.ts`

Add food reflection methods:

```typescript
export async function saveFoodReflection(reflection: FoodReflection): Promise<FoodReflection> {
  // Validate input
  // Check if exists for date
  // Save or update
}

export async function getFoodReflection(date: string): Promise<FoodReflection | null> {
  // Query by date index
}

export async function getFoodReflections(startDate: string, endDate: string): Promise<FoodReflection[]> {
  // Query date range
}

export async function deleteFoodReflection(date: string): Promise<void> {
  // Delete by date
}
```

Add sugar reduction cup methods:

```typescript
export async function getSugarReductionCups(): Promise<SugarReductionCup> {
  // Get or create singleton
}

export async function pourSugarReductionCup(): Promise<SugarReductionCup> {
  // Increment small cups, form large cup if needed
}

export async function resetSugarReductionCups(): Promise<SugarReductionCup> {
  // Reset to zero
}
```

**Reference**: See `contracts/storage-service.md` for detailed method signatures.

---

### Step 4: LLM Service Enhancement

**File**: `src/services/llmService.ts`

Enhance `generateMealSuggestions`:

```typescript
export async function generateMealSuggestions(
  input: MealSuggestionInput,
  options?: MealSuggestionOptions
): Promise<MealSuggestion[]> {
  // Detect late night (if timeAware enabled)
  // Build prompt with time-aware guidance if late night
  // Add flexibility instructions if flexible
  // Call LLM API
  // Parse response with timeAwareGuidance field
  // Return suggestions
}
```

Add helper function:

```typescript
function isLateNight(currentTime: Date = new Date()): boolean {
  const hour = currentTime.getHours();
  return hour >= 21; // 9 PM or later
}
```

**Reference**: See `contracts/llm-service.md` for detailed prompt templates.

---

### Step 5: Custom Hooks

**File**: `src/hooks/useFoodReflection.ts`

Create hook for food reflection:

```typescript
export function useFoodReflection() {
  const [reflection, setReflection] = useState<FoodReflection | null>(null);
  const [loading, setLoading] = useState(false);
  
  const saveReflection = async (type: FoodReflectionType, notes?: string) => {
    // Get today's date
    // Save reflection
    // Update state
  };
  
  const getTodayReflection = async () => {
    // Get today's date
    // Fetch reflection
    // Update state
  };
  
  return {
    reflection,
    loading,
    saveReflection,
    getTodayReflection,
  };
}
```

---

### Step 6: Food Reflection Screen

**File**: `src/components/nutrition/FoodReflectionScreen.tsx`

Create component:

```typescript
export default function FoodReflectionScreen() {
  const { saveReflection, reflection, loading } = useFoodReflection();
  const [notes, setNotes] = useState('');
  const { t } = useTranslation();
  
  const handleReflection = async (type: FoodReflectionType) => {
    await saveReflection(type, notes);
    // Show success feedback
  };
  
  return (
    <div className="p-6">
      <h1>{t('nutrition.reflection.title')}</h1>
      
      {/* Three large buttons */}
      <div className="grid grid-cols-1 gap-4 mt-6">
        <Button onClick={() => handleReflection('light')}>
          🌱 {t('nutrition.reflection.light')}
        </Button>
        <Button onClick={() => handleReflection('normal')}>
          🍽️ {t('nutrition.reflection.normal')}
        </Button>
        <Button onClick={() => handleReflection('indulgent')}>
          ✨ {t('nutrition.reflection.indulgent')}
        </Button>
      </div>
      
      {/* Optional notes */}
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={t('nutrition.reflection.notesPlaceholder')}
        className="mt-4"
      />
    </div>
  );
}
```

**Design Notes**:
- Use claymorphic styling (soft, rounded buttons)
- Large touch targets (44x44px minimum)
- Simple, single-tap interaction
- Optional notes field (collapsible)

---

### Step 7: Enhanced Meal Suggestions Screen

**File**: `src/components/nutrition/MealSuggestionsScreen.tsx`

Add time-aware messaging:

```typescript
export default function MealSuggestionsScreen() {
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [timeAware, setTimeAware] = useState(false);
  
  useEffect(() => {
    // Detect late night
    const hour = new Date().getHours();
    if (hour >= 21) {
      setTimeAware(true);
    }
  }, []);
  
  const generateSuggestions = async () => {
    const results = await generateMealSuggestions(
      { ingredients: [...] },
      { timeAware: true }
    );
    setSuggestions(results);
  };
  
  return (
    <div className="p-6">
      {timeAware && (
        <Card className="mb-4 border-purple-100">
          <p className="text-purple-800">
            {t('nutrition.timeAware.message')}
          </p>
        </Card>
      )}
      
      {suggestions.map(suggestion => (
        <Card key={suggestion.id}>
          <h3>{suggestion.mealName}</h3>
          <p>{suggestion.description}</p>
          {suggestion.timeAwareGuidance && (
            <p className="text-sm text-gray-600 mt-2">
              {suggestion.timeAwareGuidance}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}
```

---

### Step 8: Sugar Reduction Easter Egg

**File**: `src/components/nutrition/SugarReductionEasterEgg.tsx`

Create hidden component:

```typescript
export default function SugarReductionEasterEgg() {
  const [cups, setCups] = useState<SugarReductionCup | null>(null);
  const [showFeature, setShowFeature] = useState(false);
  
  useEffect(() => {
    loadCups();
  }, []);
  
  const loadCups = async () => {
    const data = await getSugarReductionCups();
    setCups(data);
  };
  
  const handlePour = async () => {
    const updated = await pourSugarReductionCup();
    setCups(updated);
    
    if (updated.smallCups === 0 && updated.largeCups > 0) {
      // Show celebration animation
    }
  };
  
  if (!showFeature) return null;
  
  return (
    <div className="p-6">
      <h2>🍵 {t('nutrition.easterEgg.title')}</h2>
      
      <div className="text-center mt-6">
        <div className="text-6xl mb-4">
          {cups?.smallCups > 0 && '🍵'.repeat(cups.smallCups)}
          {cups?.largeCups > 0 && '🫖'.repeat(cups.largeCups)}
        </div>
        
        <Button onClick={handlePour}>
          {t('nutrition.easterEgg.pour')}
        </Button>
      </div>
    </div>
  );
}
```

**Discovery Mechanism**:
- Long-press (500ms) on nutrition tab icon in `BottomTabs.tsx`
- Or hidden button in settings

---

### Step 9: Navigation Updates

**File**: `src/components/shared/Layout.tsx`

Update `NutritionHomeScreen`:

```typescript
function NutritionHomeScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  return (
    <div className="p-6">
      <h1>{t('home.nutritionCompanion')}</h1>
      
      <div className="grid grid-cols-1 gap-4 mt-6">
        <Button onClick={() => navigate('/nutrition/input')}>
          {t('nutrition.input.title')}
        </Button>
        <Button onClick={() => navigate('/nutrition/reflection')}>
          {t('nutrition.reflection.title')}
        </Button>
      </div>
    </div>
  );
}
```

**File**: `src/navigation/routes.tsx`

Add new routes:

```typescript
nutrition: {
  base: '/nutrition',
  input: '/nutrition/input',
  suggestions: '/nutrition/suggestions',
  detail: '/nutrition/detail',
  reflection: '/nutrition/reflection',  // NEW
  easterEgg: '/nutrition/easter-egg',   // NEW
},
```

---

### Step 10: Translation Keys

**Files**: `src/i18n/locales/en.ts`, `src/i18n/locales/zh.ts`

Add translation keys:

```typescript
nutrition: {
  reflection: {
    title: 'Daily Food Reflection',
    light: 'Light',
    normal: 'Normal',
    indulgent: 'Indulgent',
    notesPlaceholder: 'Optional notes...',
    saved: 'Reflection saved!',
  },
  timeAware: {
    message: "It's late - here are some gentle suggestions for you",
  },
  easterEgg: {
    title: 'Sugar Reduction',
    pour: 'Pour Cup',
    formedLarge: '🎉 Formed a large cup!',
  },
  // ... existing keys
}
```

---

## Testing Checklist

- [ ] Database migration (version 1 → 2) works correctly
- [ ] Food reflection saves/updates correctly (one per day)
- [ ] Time-aware meal suggestions detect late night correctly
- [ ] Sugar reduction cups increment correctly (5 small → 1 large)
- [ ] Easter egg discovery mechanism works (long-press)
- [ ] All UI components render correctly with claymorphic styling
- [ ] Translation keys are complete (English and Chinese)
- [ ] Offline support works for food reflection
- [ ] Error handling works for all new features

---

## Key Design Principles

1. **Flexibility**: Ingredients are suggestions, not requirements
2. **No Judgment**: Food reflection uses neutral labels (light/normal/indulgent)
3. **Time-Aware**: Gentle guidance for late-night interactions
4. **Playful**: Easter egg feature is optional and hidden
5. **Low Pressure**: Simple interactions, no calorie tracking, no scoring

---

## References

- **Data Model**: `data-model.md`
- **LLM Service Contract**: `contracts/llm-service.md`
- **Storage Service Contract**: `contracts/storage-service.md`
- **Research**: `research.md`
- **Plan**: `plan.md`

---

## Next Steps

1. Complete database schema updates (`src/db.ts`)
2. Add type definitions (`src/types.ts`)
3. Implement storage service methods (`src/services/storage/indexedDB.ts`)
4. Enhance LLM service (`src/services/llmService.ts`)
5. Create custom hooks (`src/hooks/useFoodReflection.ts`)
6. Build UI components (`src/components/nutrition/`)
7. Update navigation and routes
8. Add translation keys
9. Test all features
10. Run `/speckit.tasks` to generate detailed implementation tasks

---

## End of Quickstart

This guide provides the foundation for implementing the enhanced Nutrition module. Follow the steps in order, and refer to the detailed documentation in other files as needed.

