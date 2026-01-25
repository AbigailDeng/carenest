# Research: Companion Character System

**Date**: 2026-01-23  
**Feature**: Companion Character System  
**Purpose**: Resolve technical decisions and identify best practices for implementing companion character dialogue system

## Research Topics

### 1. LLM Dialogue Generation for Companion Characters

**Decision**: Use existing Gemini API via HyperEcho Proxy (`vibe-coding-app-gemini` model) with context-aware prompts that include character state (mood, closeness, energy, time-of-day) and conversation history.

**Rationale**: 
- Already integrated in CareNest for other AI features (health summaries, meal suggestions, emotional support)
- Consistent API reduces complexity and maintenance burden
- Gemini model supports conversational context and emotional tone calibration
- Response time target (<2s) achievable with existing infrastructure

**Alternatives Considered**:
- **Dedicated dialogue API**: Rejected - adds complexity, requires new service integration, no clear benefit over existing LLM service
- **Rule-based dialogue system**: Rejected - insufficient flexibility for context-aware, empathetic responses. Would require extensive template management.
- **Hybrid approach (templates + LLM)**: Accepted as fallback - predefined templates used when AI service unavailable (NFR-006)

**Implementation Notes**:
- Dialogue generation prompts must include:
  - Character personality traits (empathetic, supportive, non-judgmental)
  - Current character state (mood, closeness, energy, time-of-day)
  - Recent conversation history (last 5-10 messages for context)
  - User's emotional state (if expressed)
  - Integration hints (gentle guidance toward Health/Nutrition/Emotion modules)
- Fallback templates stored in character configuration JSON, selected based on character state

---

### 2. Character State Management and Persistence

**Decision**: Store character state (mood, closeness, energy, relationshipStage) in IndexedDB using existing `db.ts` infrastructure, with dedicated store `characterState`. State updates trigger UI reactivity via React hooks.

**Rationale**:
- Consistent with existing CareNest architecture (all data in IndexedDB)
- Local-first approach aligns with privacy-first principle
- State updates must be fast (<500ms) - IndexedDB operations are synchronous for reads, async for writes
- State persistence ensures relationship continuity across app sessions

**Alternatives Considered**:
- **In-memory state only**: Rejected - loses relationship progress on app close, violates user expectation of persistent relationship
- **Cloud sync**: Rejected - violates privacy-first principle (CON-005: no cloud sync)
- **LocalStorage**: Rejected - less structured than IndexedDB, size limitations, not suitable for complex state objects

**Implementation Notes**:
- Character state store schema:
  ```typescript
  {
    id: string; // Character ID (e.g., "baiqi")
    closeness: number; // 0-100
    mood: CharacterMood;
    energy: "low" | "medium" | "high";
    lastInteractionTime: Date;
    totalInteractions: number;
    relationshipStage: string;
  }
  ```
- State update triggers:
  - Daily interaction → increase closeness (small increment, e.g., +1 per day)
  - User expresses emotion → adjust mood (e.g., user sadness → character mood becomes "concerned")
  - Time passage → update energy (e.g., morning → "high", evening → "medium")
  - Closeness thresholds → update relationshipStage (e.g., 0-20: "stranger", 21-40: "acquaintance", etc.)

---

### 3. Proactive Dialogue Initiation Timing

**Decision**: Implement time-based and activity-based proactive initiation:
- **Time-based**: Morning (6-10 AM), Evening (6-9 PM), after inactivity period (4+ hours)
- **Activity-based**: After user completes action in functional module (Health/Nutrition/Emotion), pattern detection (e.g., no symptom logging for 3+ days)

**Rationale**:
- Balances companionship (proactive engagement) with user autonomy (not overwhelming)
- Time-based greetings feel natural and expected (matches real-world interaction patterns)
- Activity-based initiation provides contextually relevant support without being pushy
- Frequency controlled by character energy level (low energy → less frequent, high energy → more frequent)

**Alternatives Considered**:
- **Fully passive (user-initiated only)**: Rejected - loses "companion" feel, doesn't address loneliness reduction goal
- **Very frequent (hourly)**: Rejected - violates low cognitive burden principle, feels intrusive
- **Fixed schedule (once per day)**: Rejected - too rigid, doesn't adapt to user patterns or character state

**Implementation Notes**:
- Proactive initiation logic:
  ```typescript
  // Check on app open, visibility change, or time passage
  if (shouldInitiateProactiveDialogue()) {
    const trigger = determineTrigger(); // "morning_greeting" | "evening_greeting" | "inactivity" | "activity_acknowledgment"
    const dialogue = generateProactiveDialogue(trigger, characterState);
    displayDialogue(dialogue);
  }
  ```
- Energy level influence:
  - Low energy: Only morning/evening greetings, no activity-based
  - Medium energy: Morning/evening + activity acknowledgment
  - High energy: All triggers active, more frequent check-ins

---

### 4. Fallback Dialogue Template System

**Decision**: Store predefined dialogue templates in character configuration JSON (`src/config/characters/baiqi.json`), organized by trigger type (greetings, responses, proactive) and character state. When AI service unavailable, select template based on current state and trigger.

**Rationale**:
- Ensures graceful degradation (NFR-006) - companion remains functional offline
- Templates provide consistent character voice even when AI unavailable
- Configuration-driven approach supports i18n and easy updates
- Templates serve as "seed" examples for AI generation (few-shot learning)

**Alternatives Considered**:
- **No fallback (show error)**: Rejected - violates graceful degradation principle, breaks companion experience
- **Single generic template**: Rejected - loses character personality and state-aware responses
- **AI-only (no templates)**: Rejected - requires connectivity, violates offline support principle

**Implementation Notes**:
- Template structure in character config:
  ```json
  {
    "dialogueTemplates": {
      "greetings": {
        "morning": ["Good morning! How are you feeling today?", "Morning! Ready to start the day together?"],
        "evening": ["Good evening! How was your day?", "Evening! Let's check in together."]
      },
      "responses": {
        "sadness": ["I'm here with you. Would you like to talk about what's bothering you?"],
        "stress": ["I understand. Stress can be really hard. Let's work through this together."]
      },
      "proactive": {
        "inactivity": ["I missed you! How have you been?"],
        "activity_acknowledgment": ["I saw you logged your symptoms today. That's really good!"]
      }
    }
  }
  ```
- Template selection algorithm:
  1. Determine trigger type (greeting, response, proactive)
  2. Filter templates by trigger type
  3. Apply character state filters (mood, closeness) if available
  4. Randomly select from filtered templates (adds variety)
  5. Apply i18n translation if needed

---

### 5. Conversation History Storage and Retrieval

**Decision**: Store conversation messages in IndexedDB with dedicated store `conversations`, indexed by timestamp and character ID. Retrieve recent messages (last 10-20) for context in dialogue generation. Support pagination for conversation history viewing.

**Rationale**:
- Local storage aligns with privacy-first principle
- IndexedDB supports efficient querying by timestamp and character ID
- Recent message context needed for coherent dialogue generation
- Conversation history viewing requires efficient pagination for large histories

**Alternatives Considered**:
- **In-memory only**: Rejected - loses conversation history on app close, violates user expectation
- **LocalStorage**: Rejected - size limitations (5-10MB), not suitable for 3,650+ messages per year
- **Cloud sync**: Rejected - violates privacy-first principle

**Implementation Notes**:
- Conversation message store schema:
  ```typescript
  {
    id: string; // UUID
    timestamp: Date;
    characterId: string; // "baiqi"
    sender: "character" | "user";
    content: string;
    messageType: "text" | "image" | "choice_prompt";
    choices?: string[];
    characterImageUrl?: string;
    context: {
      mood: CharacterMood;
      closeness: number;
      timeOfDay: string;
    };
  }
  ```
- Query patterns:
  - Recent messages for context: `getMessages(characterId, limit: 10, order: 'desc')`
  - Conversation history pagination: `getMessages(characterId, limit: 20, offset: number, order: 'desc')`
  - Date range queries: `getMessages(characterId, startDate, endDate)`

---

### 6. Character Asset Loading and Caching

**Decision**: Load character images (avatars, illustrations, backgrounds) as static assets from `src/assets/characters/`, referenced by URL paths in character configuration. Use browser image caching for performance. Support lazy loading for illustrations embedded in dialogue.

**Rationale**:
- Static assets ensure fast loading (<1s for cached assets, NFR-003)
- Browser caching reduces network requests
- Configuration-driven paths support easy asset updates
- Lazy loading prevents blocking initial conversation display

**Alternatives Considered**:
- **Base64 encoding in config**: Rejected - increases config file size, reduces cacheability, harder to update
- **CDN hosting**: Rejected - adds external dependency, violates privacy-first (asset requests could be tracked)
- **Dynamic generation**: Rejected - not applicable (2D anime character images are pre-designed assets)

**Implementation Notes**:
- Asset path structure:
  ```
  src/assets/characters/{characterId}/
    avatar.png
    illustrations/{mood}.png
    backgrounds/{timeOfDay}.png
  ```
- Configuration references:
  ```json
  {
    "avatarUrl": "/assets/characters/baiqi/avatar.png",
    "illustrationUrls": {
      "default": "/assets/characters/baiqi/illustrations/default.png",
      "happy": "/assets/characters/baiqi/illustrations/happy.png"
    }
  }
  ```
- Lazy loading: Use React `lazy()` or `<img loading="lazy">` for illustrations embedded in dialogue bubbles

---

### 7. Integration with Existing Modules (Health/Nutrition/Emotion)

**Decision**: Companion provides conversational entry point and emotional support, but functional modules (Health/Nutrition/Emotion) maintain independent interfaces. Companion can:
- Guide users toward modules through dialogue
- Acknowledge user actions when they return to conversation
- Frame activities as "doing things together"

**Rationale**:
- Maintains separation of concerns - companion for emotional support, modules for functional tasks
- Prevents conversation system from becoming bottleneck for functional access
- Allows users to access modules directly if preferred (flexibility)
- Companion integration is additive, not replacement

**Alternatives Considered**:
- **Fully conversational (all actions through dialogue)**: Rejected - violates low cognitive burden (complex tasks like file uploads need dedicated UI), loses functional module benefits
- **Companion-only (no direct module access)**: Rejected - too restrictive, users may prefer direct access for efficiency

**Implementation Notes**:
- Integration points:
  1. **Navigation**: Companion dialogue can include gentle suggestions like "Would you like to log your symptoms together?" → navigates to `/health/symptoms`
  2. **Acknowledgment**: When user returns from functional module, companion checks for recent actions and acknowledges: "I saw you logged your symptoms today. That's really good!"
  3. **Framing**: Dialogue uses "together" language: "Let's log your meal together" rather than "Log your meal"
- State sharing: Companion can read (but not write) data from functional modules to provide context-aware acknowledgments

---

### 8. Home Screen Design with Character Entry Point

**Decision**: Implement home screen at root path "/" displaying medium-sized character illustration (30-40% screen height) at top, state-aware dialogue bubble asking "Which one would you like to choose?", and three entry cards (Health, Nutrition, Emotion) below character. Character and entry cards visible simultaneously - users can click cards immediately without waiting for dialogue.

**Rationale**:
- Character serves as unified entry layer (clarification from spec)
- Visual hierarchy guides users naturally (character → dialogue → entry cards)
- Non-blocking interaction maintains low cognitive burden
- State-aware dialogue personalizes experience without overwhelming

**Alternatives Considered**:
- **Character-only screen (no entry cards)**: Rejected - requires conversation before accessing modules, violates low cognitive burden
- **Entry cards only (no character)**: Rejected - loses companion feel, doesn't align with "character as unified entry layer" design
- **Sequential display (character first, then cards)**: Rejected - blocks interaction, violates non-blocking requirement

**Implementation Notes**:
- Home screen component: `src/components/companion/HomeScreen.tsx`
- Route configuration: Root path "/" renders HomeScreen (replaces current redirect to "/health")
- Character illustration: Load based on current mood and time-of-day
- Dialogue generation: Use same LLM service with simplified prompt for home screen greeting
- Entry cards: Styled with otome game aesthetic (ornate borders, decorative elements, romantic colors)
- State-aware dialogue examples:
  - Morning + high closeness: "Good morning! Where would you like to start today?"
  - Evening + low closeness: "Hello, which function would you like to choose?"
  - Afternoon + medium closeness: "Afternoon! What would you like to do together?"

---

### 9. Otome Game Visual Aesthetic Implementation

**Decision**: Implement authentic otome/dating-sim game aesthetic with ornate decorative elements (floral patterns, hearts, stars, ribbons), rich romantic color palette (deep pinks #ec4899, roses #f43f5e, lavenders #a78bfa, purples #9333ea), elaborate borders and frames, detailed character illustrations (not generic placeholders), elegant typography with decorative fonts, luxurious textures and gradients. Avoid plain/minimalist design.

**Rationale**: 
- User requirement explicitly states need for authentic otome game feel
- Visual richness creates immersive romantic atmosphere typical of otome games
- Decorative elements enhance emotional connection and companion feel
- Detailed character illustrations (not placeholders) essential for relationship-building

**Alternatives Considered**:
- **Minimalist design**: Rejected - user explicitly stated "不要弄像你现在这样贼朴素的" (don't make it plain like current design)
- **Moderate decoration**: Rejected - insufficient for authentic otome game feel
- **Overly ornate (cluttered)**: Rejected - must balance visual richness with usability (mobile-first, touch targets)

**Implementation Notes**:
- Color palette: Use Tailwind CSS custom colors for romantic palette:
  ```javascript
  colors: {
    otome: {
      pink: '#ec4899',      // Deep pink
      rose: '#f43f5e',      // Rose
      lavender: '#a78bfa',  // Lavender
      purple: '#9333ea',    // Deep purple
    }
  }
  ```
- Decorative elements: SVG patterns for floral, hearts, stars, ribbons
- Borders: Elaborate frame designs using CSS borders, shadows, and gradients
- Typography: Consider decorative fonts (e.g., "Playfair Display" for headings, "Crimson Text" for body) while maintaining readability
- Character illustrations: Must use actual character artwork, not generic placeholders
- Textures: Subtle gradients and overlays for luxurious feel
- Component styling: All companion-related components must follow otome aesthetic

---

### 10. Glassmorphism (毛玻璃) Design Pattern Implementation

**Decision**: Implement Glassmorphism (毛玻璃) layered design pattern: character illustration as background layer (full-screen or large area), functional modules (entry cards, dialogue bubbles, data panels) displayed as semi-transparent glass cards with `backdrop-filter: blur` effect, maintaining visual immersion while ensuring functional usability. Reference "Love and Producer" (恋与制作人) UI style with modern glassmorphism effects.

**Rationale**:
- User requirement explicitly references "恋与制作人" UI style with glassmorphism effects
- Balances visual immersion (character visible) with functional usability (modules accessible)
- Modern design trend (glassmorphism) enhances aesthetic appeal
- Semi-transparent layers create depth and visual hierarchy without blocking character visibility
- Maintains otome game feel while ensuring practical functionality

**Alternatives Considered**:
- **Opaque cards**: Rejected - blocks character visibility, loses immersive feel
- **Fully transparent**: Rejected - insufficient contrast for readability, poor usability
- **Traditional modal overlays**: Rejected - breaks immersion, feels disconnected from character

**Implementation Notes**:
- CSS properties for glassmorphism:
  ```css
  .glass-card {
    background: rgba(255, 255, 255, 0.1); /* Semi-transparent white */
    backdrop-filter: blur(10px); /* Blur effect */
    -webkit-backdrop-filter: blur(10px); /* Safari support */
    border: 1px solid rgba(255, 255, 255, 0.2); /* Subtle border */
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37); /* Shadow for depth */
  }
  ```
- Layering structure:
  1. Background layer: Character illustration (full-screen or large area)
  2. Glass layer: Semi-transparent cards with backdrop blur (entry cards, dialogue bubbles)
  3. Content layer: Text and interactive elements (maintains readability)
- Browser support: `backdrop-filter` supported in modern browsers (Chrome 76+, Safari 9+, Firefox 103+)
- Fallback: For unsupported browsers, use semi-transparent background without blur
- Tailwind CSS classes: Use custom utilities for glassmorphism effects
- Component application: Home screen entry cards, dialogue bubbles, data panels in modules

---

### 11. Home Screen Greeting Request Behavior

**Decision**: Home screen MUST generate greeting exactly once when character state is ready (not on every render), prevent duplicate requests using React ref flags (`useRef`), if AI generation fails gracefully fallback to default template greeting without error. Ensures single request per page load, avoids frequent API calls, maintains responsive UI performance.

**Rationale**:
- Prevents performance issues from duplicate/frequent API calls
- Ensures responsive UI (no blocking while waiting for greeting)
- Graceful degradation maintains user experience even if AI service unavailable
- Single request per page load aligns with user expectation (greeting appears once, not repeatedly)

**Alternatives Considered**:
- **Request on every render**: Rejected - causes frequent API calls, performance issues, violates NFR-008
- **No fallback (show error)**: Rejected - breaks user experience, violates graceful degradation principle
- **Multiple requests allowed**: Rejected - wastes API resources, causes performance issues

**Implementation Notes**:
- React pattern for single request:
  ```typescript
  const greetingGenerated = useRef(false);
  
  useEffect(() => {
    if (!characterLoading && characterState?.id && !greetingGenerated.current) {
      greetingGenerated.current = true;
      generateGreeting();
    }
  }, [characterLoading, characterState?.id]);
  ```
- Dependencies: Trigger only when `characterLoading` completes and `characterState.id` is available
- Fallback logic: If `generateCompanionDialogue` fails, select template from character config
- Error handling: Catch errors silently, display template greeting (no error UI)
- Performance: Request occurs once per page load, not on re-renders

---

### 12. Refined UI Design: Layering Feel and Transparent Glass Effect

**Decision**: Implement refined UI design that removes "paper feel" and emphasizes "layering feel" with transparent glass floating on beautiful poster. Key elements: (1) Full-screen background with slight dynamic zoom effect (remove center blue avatar block), (2) Refined Glassmorphism dialog boxes with specific styling (background #ffffff66, backdrop-filter: blur(15px), border-radius: 24px, 1px white semi-transparent border, dark gray-pink text #8B5A7A), (3) Floating Bottom Bar navigation (pill-shaped capsule, not full-width, semi-transparent), (4) Random floating semi-transparent light particles (SVG/CSS animation), (5) Soft dreamy color scheme (main #FDEEF4 cherry pink, secondary #FFFFFF white, accent #FFD1DC light pink).

**Rationale**:
- User requirement explicitly states need to remove "paper feel" and add "layering feel"
- Transparent glass floating effect creates depth and immersion
- Refined glassmorphism styling improves readability while maintaining visual appeal
- Floating navigation and particles enhance romantic atmosphere
- Soft color scheme creates cohesive dreamy aesthetic

**Alternatives Considered**:
- **Heavy shadows and borders**: Rejected - creates "paper feel", blocks background visibility
- **Full-width bottom navigation**: Rejected - feels heavy, breaks layering effect
- **Static background**: Rejected - lacks dynamic feel, reduces immersion
- **Bright/harsh colors**: Rejected - conflicts with soft dreamy aesthetic

**Implementation Notes**:
- Refined Glassmorphism CSS:
  ```css
  .refined-glass {
    background: #ffffff66; /* Semi-transparent white */
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.5); /* White semi-transparent border */
    /* Remove heavy shadows */
    color: #8B5A7A; /* Dark gray-pink for readability */
  }
  ```
- Background dynamic zoom: Use CSS `transform: scale()` with subtle animation (1.0 to 1.05 over 20-30s)
- Floating Bottom Bar: Position fixed at bottom, centered horizontally, width ~80% max, pill-shaped (border-radius: 24px), semi-transparent background
- Floating particles: Use CSS keyframe animations or SVG animations, opacity 0.2-0.4, slow movement (3-5s per cycle), random positioning
- Color scheme implementation:
  ```javascript
  colors: {
    dreamy: {
      main: '#FDEEF4',    // Cherry pink
      secondary: '#FFFFFF', // White
      accent: '#FFD1DC',   // Light pink
      text: '#8B5A7A',     // Dark gray-pink
    }
  }
  ```
- Typography: Use Montserrat or PingFang Light for navigation labels (if text included)
- Performance: Ensure animations use GPU acceleration (transform, opacity), limit particle count (10-20 particles max)

---

## Summary

All technical decisions align with existing CareNest architecture and constitution principles. The companion system integrates seamlessly with existing LLM service, storage infrastructure, and module structure. Key design choices prioritize privacy (local storage), graceful degradation (template fallbacks), and user experience (proactive but not intrusive dialogue initiation). Home screen design provides character-guided entry point with non-blocking interaction. Visual aesthetic follows authentic otome game design with ornate decorative elements and rich romantic color palette. Refined UI design emphasizes layering feel with transparent glass floating effect, refined glassmorphism styling, floating navigation, animated particles, and soft dreamy color scheme to create immersive romantic atmosphere while maintaining functional usability.
