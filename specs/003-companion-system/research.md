# Research & Design Decisions: Companion Character System

**Feature**: 003-companion-system  
**Date**: 2026-01-25  
**Status**: Complete

## Overview

This document consolidates research findings and design decisions for the Companion Character System. Most technical decisions were resolved through clarifications in spec.md rather than separate research tasks.

## Research Areas

### 1. Glassmorphism UI Implementation

**Decision**: Use CSS backdrop-filter API with rgba backgrounds, blur effects, and white borders

**Rationale**: 
- Provides premium transparent glass effect matching otome game aesthetic (FR-030B)
- Native browser support (backdrop-filter) ensures performance
- Consistent with modern mobile UI trends
- Achieves "transparent glass floating on beautiful poster" effect

**Implementation Details**:
- Background: `rgba(255, 255, 255, 0.15)` (extremely transparent white)
- Backdrop filter: `blur(25px)` (strong blur effect)
- Border: `1px solid rgba(255, 255, 255, 0.4)` (subtle bright border)
- Box shadow: `0 4px 24px rgba(255, 255, 255, 0.2)` (soft white outer glow)
- Text color: `#4A4A4A` (dark gray for readability)

**Alternatives Considered**:
- SVG filters: More complex, less performant
- Canvas-based effects: Overkill for static backgrounds
- Pre-rendered glass images: Not flexible, increases bundle size

**Status**: ✅ Resolved via FR-030B and clarifications

---

### 2. Character Animation Patterns

**Decision**: Use CSS @keyframes for breathing animation on character illustrations only

**Rationale**:
- Subtle animation creates living character presence
- CSS animations are GPU-accelerated and performant
- Simple implementation, no JavaScript overhead
- Only character illustration animates (other UI elements remain static)

**Implementation Details**:
- Animation: `breathingAnimation 7s ease-in-out infinite`
- Transform: `scale(1.0) translateY(0px)` → `scale(1.03) translateY(-10px)`
- Transform origin: `center bottom` (for character illustrations)
- Applied only to ImageBackground component character layer

**Alternatives Considered**:
- Framer Motion animations: More complex, JavaScript-based
- SVG animations: Not needed for simple scale/translate
- JavaScript-based animation loops: Less performant than CSS

**Status**: ✅ Resolved via Session 2026-01-25 clarifications

---

### 3. LLM Integration Pattern

**Decision**: Use Gemini API via HyperEcho Proxy with template fallback

**Rationale**:
- Provides personalized, context-aware dialogue (FR-006)
- Template fallback ensures reliability when AI unavailable (NFR-006)
- HyperEcho Proxy handles API routing and error handling
- Response time <2 seconds meets performance requirements (NFR-001)

**Implementation Details**:
- Primary: LLM-generated dialogue via `llmService.generateDialogue()`
- Fallback: Predefined templates from `CharacterConfig.dialogueTemplates`
- Timeout: 2 seconds before fallback activates
- Error handling: Graceful degradation, no user-facing errors

**Alternatives Considered**:
- Template-only approach: Less personalized, but more reliable
- Multiple LLM providers: Adds complexity, current solution sufficient
- Local LLM: Not feasible for mobile PWA, requires significant resources

**Status**: ✅ Resolved via FR-006, NFR-006

---

### 4. State Management Approach

**Decision**: Use React hooks (useCompanion, useCharacterState) with IndexedDB persistence

**Rationale**:
- Hooks provide clean, reusable state management
- IndexedDB ensures data persistence across sessions (NFR-007)
- Local storage maintains privacy (Principle 3, NFR-008)
- Follows established architecture patterns (services/storage/)

**Implementation Details**:
- `useCompanion(characterId)` - Main hook for character interactions
- `useCharacterState(characterId)` - Character state management
- `useConversation(characterId)` - Conversation history management
- Storage layer: `services/storage/characterStateStorage.ts`, `conversationStorage.ts`

**Alternatives Considered**:
- Redux/Context API: Overkill for single character state
- LocalStorage: Limited storage capacity, IndexedDB better for large conversation history
- Cloud sync: Violates privacy-first principle (Principle 3)

**Status**: ✅ Resolved via FR-003, FR-008, FR-010

---

### 5. Navigation Architecture

**Decision**: Function spheres navigate directly to routes; radial menu triggers data panels

**Rationale**:
- Function spheres provide quick access to existing modules (FR-031I)
- Radial menu creates immersive game-like interaction (FR-031D)
- Clear separation: shortcuts vs. immersive experience
- Maintains direct access to original functionality

**Implementation Details**:
- Function spheres: Direct React Router navigation (useNavigate)
- Radial menu: Icon expansion transition to full-screen data panels (FR-031E)
- Route mapping: Health → /health, Nutrition → /nutrition, Emotion → /emotional
- No intermediate transitions for function spheres

**Alternatives Considered**:
- Single navigation pattern: Less flexible, doesn't support both use cases
- All radial menu: Removes quick access, violates user expectation
- All function spheres: Removes immersive experience, less engaging

**Status**: ✅ Resolved via FR-031I, FR-031E clarifications

---

### 6. Character Asset Management

**Decision**: Config-driven approach with JSON files and image assets in public/images/

**Rationale**:
- Allows character customization without code changes (FR-023)
- Supports i18n for character names and dialogue (FR-022)
- Image assets in public/ enable direct URL access
- JSON config files are easy to edit and version control

**Implementation Details**:
- Config: `src/config/characters/baiqi.json` (dialogue templates, state thresholds)
- Images: `public/images/` (character illustrations, avatars)
- i18n: `src/i18n/locales/` (character names, dialogue text)
- Hardcoded image paths: `/images/images.jpg` for avatars, `/images/DM_20260123234921_001.jpg` for home screen

**Alternatives Considered**:
- Hardcoded character data: Not flexible, violates FR-023
- Database storage: Overkill, JSON files sufficient
- CDN hosting: Adds complexity, local assets sufficient for MVP

**Status**: ✅ Resolved via FR-020, FR-021, FR-022, FR-023

---

## Design Patterns

### Pattern 1: Glassmorphism Component Structure

**Pattern**: Layered component structure with fixed background and scrollable content

```
ImageBackground (z-index: 0, fixed, breathing animation)
  ↓
FloatingParticles (z-index: 2)
  ↓
Content Layer (z-index: 1, relative, scrollable)
  ↓
Dialogue Bubbles (z-index: 40, fixed)
  ↓
Navigation/Buttons (z-index: 50, fixed)
```

**Rationale**: Ensures background illustration remains visible while content scrolls, maintains visual hierarchy

---

### Pattern 2: Template Fallback Strategy

**Pattern**: AI-first with graceful template fallback

```
1. Attempt LLM generation (timeout: 2s)
2. If success → Use LLM response
3. If failure/timeout → Select random template from CharacterConfig
4. Apply character state modifiers (mood, closeness) to template
```

**Rationale**: Balances personalization with reliability, ensures system always responds

---

### Pattern 3: State-Driven Dialogue

**Pattern**: Dialogue generation considers multiple state factors

```
Dialogue = f(characterState, timeOfDay, userMessage, previousMessages)
  where:
    - characterState.mood → affects tone
    - characterState.closeness → affects intimacy level
    - characterState.relationshipStage → affects formality
    - timeOfDay → affects topic selection
```

**Rationale**: Creates context-aware, personalized dialogue that reflects relationship growth

---

## Performance Considerations

### Image Loading Strategy

**Decision**: Eager loading for character illustrations, lazy loading for non-critical assets

**Rationale**: Character illustrations are core to experience, should load immediately

**Implementation**:
- Character illustrations: `loading="eager"` on ImageBackground
- Background images: Preload in ImageBackground component
- Avatar images: Eager load (small file size)

---

### Animation Performance

**Decision**: Use CSS animations for character breathing, framer-motion for UI interactions

**Rationale**: 
- CSS animations are GPU-accelerated (better performance)
- Framer-motion provides spring physics for UI interactions
- Separates concerns: character animation vs. UI animation

**Implementation**:
- Character breathing: CSS @keyframes (7s ease-in-out infinite)
- Card interactions: Framer Motion spring animations (stiffness: 300, damping: 25)
- Dialogue transitions: CSS transitions (200-300ms)

---

## Security & Privacy Considerations

### Data Storage

**Decision**: All data stored locally in IndexedDB, no cloud sync

**Rationale**: 
- Maintains privacy (Principle 3, NFR-008)
- Enables offline functionality (Principle 6)
- User retains full data ownership (Principle 8)

**Implementation**:
- Character state: IndexedDB `characterStates` store
- Conversation history: IndexedDB `conversations` store
- No external data transmission without explicit consent

---

### AI Service Integration

**Decision**: AI service calls include user data only with explicit consent

**Rationale**:
- Privacy-first architecture (Principle 3)
- Users understand what data is shared (Principle 7)
- Clear opt-in required for sensitive data

**Implementation**:
- Dialogue generation: User messages sent to LLM (explicit in conversation flow)
- Health data: Not sent to AI without user consent
- Error handling: No sensitive data in error logs

---

## Accessibility Considerations

### Touch Target Sizes

**Decision**: Minimum 44x44px for all interactive elements, larger for primary actions

**Rationale**: 
- Meets WCAG 2.1 AA requirements (Principle 5)
- Ensures comfortable one-handed operation
- Exceeds minimum for critical actions (back button: 56x56px)

---

### Screen Reader Support

**Decision**: Semantic HTML with ARIA labels for all interactive elements

**Rationale**: 
- Ensures accessibility for users with disabilities
- Maintains functionality without visual interface
- Required for WCAG 2.1 AA compliance

**Implementation**:
- Buttons: `aria-label` attributes
- Dialogue bubbles: Appropriate ARIA roles
- Character avatars: Descriptive alt text

---

## Conclusion

All major technical decisions have been resolved through:
1. Spec clarifications (Session 2026-01-25)
2. Existing architecture patterns (constitution compliance)
3. Performance requirements (NFR-001 through NFR-010)
4. User experience requirements (FR-030 through FR-037)

No additional research tasks required. Implementation can proceed with confidence that technical approach is sound and aligned with project goals.
