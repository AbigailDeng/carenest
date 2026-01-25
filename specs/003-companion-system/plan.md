# Implementation Plan: Companion Character System

**Branch**: `003-companion-system` | **Date**: 2026-01-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification for companion character system with 2D anime character, daily interaction, emotional support, and integration with Health/Nutrition/Emotion modules

## Summary

Implement a companion character system that transforms CareNest from a utility-first tool into a relationship-driven experience. The system features a 2D anime male character that users interact with daily through conversational dialogue, providing emotional support and gentle guidance for health, nutrition, and emotional well-being activities. The companion proactively initiates conversations, responds contextually based on character state (mood, closeness, energy, time-of-day), and frames health activities as "doing things together" rather than task completion. All character assets and dialogue are configurable via JSON/YAML files and resource directories, supporting i18n and future customization.

## Clarifications

### Session 2026-01-25

- Q: How should the three function spheres in the upper right corner behave when clicked? → A: Three function spheres (FunctionSpheres component) in upper right corner MUST navigate directly to original Health, Nutrition, Emotion functional screens (/health, /nutrition, /emotional routes) - they should NOT trigger icon expansion transition to full-screen data panels with line charts. Function spheres serve as quick access shortcuts to existing functional modules, maintaining direct navigation to preserve original Health/Nutrition/Emotion functionality.
- Q: How should the Health Details Page be refined to align with Home Screen visual base and restore layering feel? → A: Health Details Page (/health route) MUST be refined to align with Home Screen visual base: (1) Background layering: MUST use ImageBackground component (same as home screen) wrapping entire HealthHomeScreen component, use same background image URL as home screen (https://i.pinimg.com/564x/a6/39/19/a639190333210fb5da77b4903661354e.jpg), add SceneBackground component (z-index 1) and FloatingParticles component (z-index 2) matching home screen implementation, CharacterLayer component (z-index 3) with same floating animation (floatAnimation: translateY(-12px) scale(1.02) over 4s ease-in-out infinite), completely remove pure color background (#FDEEF4) - creates same atmospheric layering as home screen, (2) Card material refinement: change card background from rgba(255, 255, 255, 0.2) to rgba(255, 255, 255, 0.15) (more transparent), remove red/pink outer shadow (box-shadow: 0 4px 24px rgba(255, 126, 157, 0.3)), replace with 1px inner glow border: border 1px solid rgba(255, 255, 255, 0.6) (bright white semi-transparent, 60% opacity), maintain backdrop-filter blur(25px), (3) Cleanup: completely remove any "图片加载失败" (image loading failed) placeholder elements that break visual aesthetics, move companion dialogue bubble to above cards (60px above top card, horizontally centered), use same glassmorphism style as home screen dialogue bubble, text color #4A4A4A (deep gray-pink matching home screen), (4) Header and navigation: completely hide Header component on /health route (same as home screen: !isHome logic, extend to !isHome && location.pathname !== '/health'), ensure back button uses subtle glassmorphism background (rgba(255, 255, 255, 0.15), blur(20px)) instead of stronger blur, use Lucide ChevronLeft icon (linear icon, not emoji), verify bottom navigation bar remains hidden on /health route, (5) Card positioning: position cards at screen middle-lower area (50% horizontal, 60% vertical - 20% below center), cards should appear to float at character chest position, creating "transparent glass cards floating at Bai Qi's chest, waiting to be browsed" feeling - creates immersive companion feel matching home screen aesthetic, removes office list feeling
- Q: What visual design should data entry screens (e.g., symptom logging /health/symptoms) use for background and containers? → A: Data entry screens (e.g., /health/symptoms route) MUST use full-screen Bai Qi character illustration background (same as Health Details Page) with glassmorphism input containers: background rgba(255, 255, 255, 0.2), backdrop-filter blur(25px), border 1px solid rgba(255, 255, 255, 0.4), box-shadow with soft white glow - maintains visual consistency with Health Details Page and companion system aesthetic (per FR-030B, FR-036), provides emotional context during data entry, creates immersive companion feel.
- Q: What button workflow and labeling should symptom logging screen use for AI diagnosis and saving? → A: Symptom logging screen (/health/symptoms route) MUST use two-step workflow: primary button displays "AI Diagnosis" (or equivalent i18n label) when no AI analysis exists, button changes to "Save Record" (or "Complete"/"Finish") after AI analysis completes or user chooses to skip AI analysis - button label MUST reflect current action state, maintains clear user intent throughout workflow, AI diagnosis is optional step before saving.
- Q: How should character interaction be displayed on data entry screens (e.g., symptom logging)? → A: Data entry screens (e.g., /health/symptoms route) MUST display character avatar (Bai Qi) with dialogue bubble positioned at top of screen (above input fields), using glassmorphism styling per FR-030B, displaying contextual message like "哪里不舒服吗？别瞒着我。" / "What's bothering you? Don't hide it from me." (i18n support) - provides companion presence during data entry, aligns with companion system philosophy (FR-019), maintains emotional connection throughout data entry process.
- Q: What visual feedback should severity selection buttons provide when selected? → A: Severity selection buttons on data entry screens MUST provide clear visual feedback: selected state uses deep pink border (#FF7E9D or darker pink) with subtle breathing glow animation (pulsing box-shadow effect, 2-3 second cycle), unselected state uses gray border (1-2px) with no glow - creates warm, interactive feel matching otome aesthetic (FR-030), provides clear selection state indication, enhances emotional connection through visual warmth.
- Q: What header and navigation design should data entry screens (e.g., symptom logging) use? → A: Data entry screens (e.g., /health/symptoms route) MUST use minimal header design: glassmorphism back button (ChevronLeft icon from lucide-react) in top-left corner with no title text, using same styling as Health Details Page (background rgba(255,255,255,0.2), backdrop-filter blur(25px), border 1px solid rgba(255,255,255,0.4), 44x44px minimum touch target, clicking navigates to previous page) - maintains visual consistency with Health Details Page (FR-034, FR-036), reduces visual clutter, keeps focus on character dialogue and input fields.

### Session 2026-01-23

- Q: How should the companion character integrate with existing Health/Nutrition/Emotion modules? → A: Character serves as unified entry layer - all Health/Nutrition/Emotion functions accessed through conversational interaction with the character, maintaining the "companion" feel rather than direct tool access.
- Q: What is the balance between conversational interaction and direct functional interfaces? → A: Conversations are primarily for emotional support and guidance - functional modules maintain independent interfaces, with character providing emotional support and guiding dialogue only.
- Q: How should the home screen entry point be designed with the companion character? → A: Home screen displays three entry cards (Health, Nutrition, Emotion), character appears with dialogue bubble asking "Which one would you like to choose?" - user clicks entry card to navigate to corresponding module, character provides guidance and support within modules.
- Q: Should users wait for character dialogue before seeing entry cards, or can they interact immediately? → A: Character asks question simultaneously with entry cards visible - users can click entry cards immediately without waiting for dialogue completion, character provides guidance but does not block interaction.
- Q: How should the character be displayed on the home screen? → A: Character displayed as medium-sized illustration (30-40% of screen height) at top of home screen, dialogue bubble positioned next to or below character, three entry cards displayed below character - creates clear visual hierarchy with character as welcoming guide.
- Q: What route path should the home screen with character and entry cards use? → A: Home screen uses root path "/", replacing current redirect to "/health" - users see character and three entry cards when opening app, aligns with "character as unified entry layer" design philosophy.
- Q: Should character dialogue on home screen vary based on character state, or remain fixed? → A: Character dialogue dynamically changes based on state (mood, closeness, time-of-day) but remains concise - e.g., morning with high closeness: "Good morning! Where would you like to start today?", low closeness: "Hello, which function would you like to choose?" - reflects character personality without overwhelming home screen.
- Q: What visual style should the home screen and companion interface use? → A: MUST use authentic otome/dating-sim game aesthetic - ornate decorative elements (floral patterns, hearts, stars, ribbons), rich romantic color palette (deep pinks, roses, lavenders, purples), elaborate borders and frames, detailed character illustrations (not generic placeholders), elegant typography with decorative fonts, luxurious textures and gradients, immersive romantic atmosphere - avoid plain/minimalist design, create visually rich experience typical of otome games.
- Q: When should the companion initiate conversations vs. waiting for user input? → A: Hybrid active+passive mode - character proactively initiates daily greetings and reminders (e.g., morning greetings, meal reminders), while users can also initiate conversations at any time.
- Q: How much should character state (mood, closeness, energy, time-of-day) influence dialogue and functionality? → A: Moderate influence - state affects dialogue tone, topic selection, and proactive initiation frequency, but does not change core functional access.
- Q: How should character assets (2D anime character images, dialogue templates, configuration) be managed? → A: Configuration files + resource directories - character metadata (name, dialogue templates, state thresholds) via JSON/YAML config, image assets stored in directories, with multilingual text resource support.
- Q: How should the home screen entry mechanism work - static entry cards or interactive radial menu? → A: Radial menu (炸裂式菜单) - home screen displays character illustration centered with breathing text at bottom. User clicks character illustration (center/chest area) to trigger radial menu: 4 icons (Health→top-left, Nutrition→top-right, Emotion→bottom-left, Settings→bottom-right) explode outward from click point in circular/arc trajectories with spring animation, glassmorphism styling, subtle glow halos, background blur effect. Clicking background dismisses menu (icons retract to center). Creates immersive "character responding to touch" game-like interaction, avoiding static card feel.
- Q: How should the transition from radial menu icon to full-screen data panel work? → A: Icon expansion transition - when user clicks radial menu icon (e.g., Health), clicked icon instantly scales up to fill screen, seamlessly transitions to full-screen data panel (e.g., health chart panel), panel slides up from bottom with smooth animation - creates visual continuity from icon to content, maintains immersive game-like feel, avoids abrupt navigation jump.
- Q: What visual design style should full-screen health charts use? → A: Neon glow aesthetic with glassmorphism - line charts use purple/pink gradient lines with outer glow effect (filter: drop-shadow or CSS glow), background is semi-transparent glassmorphism (#ffffff33 with backdrop-filter blur), remove coordinate axis grid lines, display only key node numbers, line chart animates left-to-right drawing effect on panel entry - avoid traditional white background black lines office-style charts, create romantic game-like visual experience matching otome aesthetic.
- Q: How should the companion character be displayed in full-screen data panels to maintain companionship feel? → A: Bottom-right corner companion element - small character avatar/silhouette (reduced size, 60-80px) positioned at bottom-right corner of chart panel, accompanied by small dialogue bubble displaying data interpretation text (e.g., "今天的步数很棒，要注意膝盖哦" / "Today's steps look great, but remember to take care of your knees") - character interpretation dynamically generated based on chart data and character state, maintains companionship feel even in data-focused screens, does not obstruct chart visibility.
- Q: How should character data interpretation text in full-screen charts be generated - AI or templates? → A: AI generation with template fallback - system MUST prioritize LLM-generated personalized interpretation based on chart data and character state (mood, closeness), if AI generation fails or times out (>2 seconds) gracefully fallback to predefined template messages from character configuration - ensures reliability while maintaining personalized companion feel, consistent with dialogue generation pattern (FR-006, NFR-006).
- Q: How should the global background and character layer be implemented for premium visual quality? → A: System MUST use full-screen ImageBackground component as base layer covering entire app - remove any blue placeholder boxes or generic character placeholders, use high-quality atmospheric anime background image (e.g., https://i.pinimg.com/564x/a6/39/19/a639190333210fb5da77b4903661354e.jpg or similar light-toned anime scenery), apply subtle white gradient overlay (linear gradient from transparent at top to white at bottom) for text readability, background image must cover entire screen without gaps, create immersive atmospheric foundation for glassmorphism layers.
- Q: How should glassmorphism components be refined for premium transparent glass effect? → A: System MUST implement true glassmorphism with: background color rgba(255, 255, 255, 0.15) (extremely transparent white), backdrop-filter: blur(25px) (strong blur effect), border width 1px with border color rgba(255, 255, 255, 0.4) (subtle bright border), box-shadow: 0 4px 24px rgba(255, 255, 255, 0.2) (soft white outer glow), text color #4A4A4A (dark gray for readability) - apply to all dialog boxes, navigation bars, radial menu icons, and floating UI elements - remove heavy/thick appearance, create premium transparent glass floating effect.
- Q: How should icons be implemented to replace emoji for professional appearance? → A: System MUST use linear icon library (lucide-react or similar) instead of emoji for all navigation and menu icons - Home: Home icon (thin line house), Health: Activity or HeartPulse icon (ECG line), Nutrition: Leaf or Apple icon (minimalist line apple), Emotion: Heart icon (thin line heart), Companion: MessageCircle icon (thin line bubble), Settings: Settings icon - all icons use consistent color #FF7E9D (deep pink), maintain touch target size 44x44px minimum, ensure icons are crisp and scalable.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18.x  
**Primary Dependencies**: 
- React 18.x (UI framework)
- TypeScript 5.x (type safety)
- Tailwind CSS (styling - authentic otome game aesthetic with ornate decorative elements, rich romantic colors, elaborate borders, glassmorphism support)
- IndexedDB (via idb for local storage)
- LLM Service Provider: Gemini API via HyperEcho Proxy
  - Model: vibe-coding-app-gemini
  - Base URL: https://hyperecho-proxy.aelf.dev/v1
  - API Key: Configured via environment variables
- React Router (screen navigation)
- Date-fns (time-of-day awareness)
- CSS backdrop-filter API (for glassmorphism effects - character illustration as background, functional modules as semi-transparent glass cards)
- Framer Motion (for spring animations in radial menu and icon expansion transitions - ✅ ADDED to package.json)
- lucide-react (for linear icons replacing emoji - NEEDS ADDITION: add to package.json dependencies)

**Storage**: IndexedDB (local browser storage) for conversation history and character state via `db.ts` and `services/storage/`  
**Testing**: Vitest + React Testing Library  
**Target Platform**: Modern browsers (Chrome, Safari, Firefox, Edge) with PWA support, mobile-first (iOS Safari 14+, Chrome Android)  
**Project Type**: Single web application (React PWA)  
**Performance Goals**: 
- Character dialogue generation: <2s response time (NFR-001)
- Character state updates: <500ms without blocking UI (NFR-002)
- Character image loading: <1s for cached assets (NFR-003)
- UI interactions: <100ms response time

**Constraints**: 
- Mobile-first design (44x44px touch targets minimum)
- Offline support for conversation history viewing (AI dialogue generation requires connectivity)
- All conversation data stored locally (no cloud sync)
- Character assets configurable (not hardcoded)
- Authentic otome game aesthetic: ornate decorative elements (floral patterns, hearts, stars, ribbons), rich romantic color palette (deep pinks, roses, lavenders, purples), elaborate borders and frames, detailed character illustrations, elegant typography, luxurious textures and gradients - avoid plain/minimalist design
- Glassmorphism (毛玻璃) design pattern: character illustration as background layer, functional modules (entry cards, dialogue bubbles, data panels) displayed as semi-transparent glass cards with backdrop-filter: blur effect, maintaining visual immersion while ensuring functional usability - reference "Love and Producer" (恋与制作人) UI style
- Refined Glassmorphism dialog boxes: background rgba(255, 255, 255, 0.15) (extremely transparent white), backdrop-filter: blur(25px) (strong blur effect), border-radius: 24px, border width 1px with border color rgba(255, 255, 255, 0.4) (subtle bright border), box-shadow: 0 4px 24px rgba(255, 255, 255, 0.2) (soft white outer glow), text color #4A4A4A (dark gray for readability) - apply to all dialog boxes, navigation bars, radial menu icons, and floating UI elements - remove heavy/thick appearance, create premium transparent glass floating effect (FR-030B)
- Full-screen background with dynamic zoom: background image with slight dynamic zoom effect, remove center blue avatar block, create layering feel (FR-031)
- Floating Bottom Bar navigation: pill-shaped capsule floating at screen bottom (not full-width), semi-transparent with glassmorphism effect, remove text labels below icons or use smaller lighter font (Montserrat or PingFang Light), maintain 44x44px touch targets (FR-031A)
- Floating light particles: random floating semi-transparent light particles (SVG or CSS animation) in background for romance feel - subtle, slow-moving, non-interfering (FR-031B)
- Soft dreamy color scheme: main #FDEEF4 (cherry pink), secondary #FFFFFF (white), accent #FFD1DC (light pink) - cohesive romantic atmosphere, avoid harsh contrasts (FR-031C)
- Home screen greeting generation: MUST occur exactly once per page load when character state is ready, prevent duplicate requests using React ref flags, graceful fallback to template greeting if AI generation fails (NFR-008)
- Function spheres (upper right corner): Three circular glassmorphism buttons (Health, Nutrition, Emotion) vertically stacked - when clicked, navigate directly to original functional screens (/health, /nutrition, /emotional routes) using React Router - do NOT trigger icon expansion transition or display data panels - serve as quick access shortcuts (FR-031I)
- Radial menu (炸裂式菜单): Triggered by clicking character illustration (center/chest area), 4 icons explode outward in circular/arc trajectories with spring animation, true glassmorphism styling per FR-030B (rgba(255,255,255,0.15), blur(25px), border, glow), background blur effect - Health→top-left, Nutrition→top-right, Emotion→bottom-left, Settings→bottom-right - icons use linear icons (lucide-react) instead of emoji, color #FF7E9D (FR-031D, FR-033)
- Icon expansion transition (radial menu icons ONLY, NOT function spheres): Clicked radial menu icon scales up to fill screen, seamlessly transitions to full-screen data panel with slide-up animation (300-500ms, ease-out) - creates visual continuity, maintains immersive game-like feel - function spheres navigate directly without this transition (FR-031E)
- Neon glow chart design (radial menu data panels ONLY): Purple/pink gradient lines with outer glow effect, semi-transparent glassmorphism background (#ffffff33, blur(15px)), no coordinate axis grid lines, only key node numbers, left-to-right drawing animation (800-1200ms) - romantic game-like visual matching otome aesthetic - applies to radial menu data panels, NOT to original functional screens accessed via function spheres (FR-031F)
- Character element in full-screen panels (radial menu panels ONLY): Small avatar/silhouette (60-80px) at bottom-right corner with dialogue bubble displaying AI-generated data interpretation (with template fallback) - maintains companionship feel, does not obstruct chart visibility - applies to radial menu data panels, NOT to original functional screens accessed via function spheres (FR-031G)
- Full-screen ImageBackground component: High-quality atmospheric anime background image covering entire app, subtle white gradient overlay (transparent→white), remove blue placeholder boxes, create immersive atmospheric foundation for glassmorphism layers
- Premium glassmorphism styling: True glassmorphism with rgba(255,255,255,0.15) background, blur(25px), 1px border rgba(255,255,255,0.4), box-shadow glow, text color #4A4A4A - apply to all dialog boxes, navigation bars, radial menu icons, floating UI elements
- Linear icon library integration: lucide-react for all navigation and menu icons (Home, Activity/HeartPulse, Leaf/Apple, Heart, MessageCircle, Settings) - replace all emoji, consistent color #FF7E9D, maintain 44x44px touch targets (FR-031G, FR-031H)
- Linear icon library integration: Use lucide-react for all navigation and menu icons (Home, Activity/HeartPulse, Leaf/Apple, Heart, MessageCircle, Settings) - replace all emoji icons, consistent color #FF7E9D (deep pink), maintain 44x44px touch targets, ensure crisp scalable icons (FR-033)
- Health Details Page "The Private Ledger" layout: Three overlapping fan-shaped glassmorphism cards (扇形摊开的档案页) positioned at screen middle-lower area (50% horizontal, 60% vertical), top card rotated -8°, middle -4°, bottom 0°, vertical offset 40px, horizontal offset 20px creating staggered effect, cards use rgba(255, 255, 255, 0.15) background, blur(25px), 1px border rgba(255, 255, 255, 0.6) inner glow (no pink shadow), spring animation on click (400ms, stiffness 300, damping 25), companion dialogue bubble above cards (60px above, horizontally centered) with #4A4A4A text color (FR-035, FR-036)
- Health Details Page visual alignment with Home Screen: MUST use ImageBackground component wrapping HealthHomeScreen (same background image URL as home screen), add SceneBackground (z-index 1) and FloatingParticles (z-index 2, count 20), CharacterLayer (z-index 3) with same floating animation, completely remove pure color background (#FDEEF4), completely hide Header component on /health route (extend Layout.tsx condition to !isHome && location.pathname !== '/health'), back button uses subtle glassmorphism (rgba(255, 255, 255, 0.15), blur(20px)), cards positioned at character chest position creating "transparent glass cards floating at Bai Qi's chest" feeling - removes office list feeling, maintains visual consistency with home screen layering (FR-036)
- Data entry screens (e.g., symptom logging /health/symptoms): MUST implement companion-integrated design with full-screen Bai Qi character illustration background (same as Health Details Page, per FR-036), glassmorphism input containers (rgba(255,255,255,0.2), blur(25px), border, glow), character avatar with dialogue bubble at top (above input fields) displaying contextual message like "哪里不舒服吗？别瞒着我。" / "What's bothering you? Don't hide it from me." (i18n support), minimal glassmorphism back button (no title text) in top-left corner, two-step button workflow ("AI Diagnosis" → "Save Record"), severity selection with pink glow animation for selected state (deep pink border #FF7E9D with breathing glow, 2-3 second cycle) - creates immersive companion feel during data entry, maintains visual consistency, enhances emotional connection (FR-037)

**Scale/Scope**: 
- Single user application (local-first)
- Conversation history: ~3,650 messages per year (365 conversations × 10 messages)
- Character state: single character per user (extensible to multiple characters in future)
- Character assets: avatars, illustrations, background scenes stored as image files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Wellmate Constitution Compliance Checklist:**

- [x] **Principle 1 (Non-Diagnostic)**: Feature does NOT provide medical diagnoses, prescriptions, or treatment recommendations. Companion provides emotional support and gentle guidance only. Functional modules (Health/Nutrition/Emotion) maintain independent interfaces with appropriate disclaimers.
- [x] **Principle 2 (Empathetic Tone)**: All companion dialogue maintains supportive, empathetic, non-judgmental tone. Character responds with warmth and understanding. Error messages are encouraging.
- [x] **Principle 3 (Privacy-First)**: All conversation history and character state stored locally in IndexedDB. No conversation content or character state shared with external services. Users can delete conversation history and reset character state.
- [x] **Principle 4 (Low Cognitive Burden)**: Conversation interface is simple and intuitive. Chat-like bubbles with clear sender indication. Choice-based dialogue is very limited (occasional use). Core interactions completable in <30 seconds.
- [x] **Principle 5 (Mobile-First)**: Touch-optimized (44x44px minimum). PWA with offline support for conversation viewing. WCAG 2.1 AA compliance. Authentic otome game aesthetic with ornate decorative elements, rich romantic colors, elaborate borders, detailed character illustrations.
- [x] **Principle 6 (Offline Support)**: Conversation history viewing works offline. AI dialogue generation degrades gracefully with fallback to predefined dialogue templates when offline.
- [x] **Principle 7 (Transparent AI)**: AI usage clearly indicated when generating dialogue. Users understand when AI is processing. AI responses distinguishable from predefined templates.
- [x] **Principle 8 (Data Ownership)**: Users can export conversation history (JSON/CSV). Deletion is permanent and verifiable. Clear ownership statements.

**Architecture Compliance:**
- [x] Uses React + TypeScript
- [x] IndexedDB for local persistence (via `db.ts` and `services/storage/`)
- [x] External APIs isolated in `services/` directory (LLM service for dialogue generation)
- [x] Follows established folder structure (`src/components/`, `src/hooks/`, `src/services/`, etc.)

## Project Structure

### Documentation (this feature)

```text
specs/003-companion-system/
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
│   ├── companion/
│   │   ├── HomeScreen.tsx              # NEW: Home screen with character illustration, radial menu (炸裂式菜单), breathing text, function spheres
│   │   ├── FunctionSpheres.tsx         # NEW: Three function spheres (Health, Nutrition, Emotion) in upper right corner - direct navigation to functional screens
│   │   ├── RadialMenu.tsx               # NEW: Radial menu component with spring animation, glassmorphism icons
│   │   ├── IconExpansionTransition.tsx  # NEW: Icon expansion transition animation component (for radial menu icons only)
│   │   ├── NeonGlowChart.tsx            # NEW: Neon glow chart component with gradient lines, glow effects (for radial menu data panels)
│   │   ├── ChartCompanionElement.tsx    # NEW: Character element for full-screen charts (bottom-right corner, radial menu panels only)
│   │   ├── CompanionScreen.tsx          # Main companion interaction screen (chat interface)
│   │   ├── ConversationBubble.tsx       # Chat bubble component (character/user)
│   │   ├── CharacterAvatar.tsx          # Character avatar display
│   │   ├── CharacterIllustration.tsx    # Full character illustration component
│   │   ├── SceneBackground.tsx         # Background scene with floral overlays
│   │   ├── ChoiceDialogue.tsx          # Choice-based dialogue component (limited use)
│   │   └── RelationshipBadge.tsx      # Closeness level badge display
│   ├── health/
│   │   ├── SymptomLogScreen.tsx         # UPDATE: Refine to follow FR-037 (companion-integrated data entry design)
│   │   └── ...                          # Other health components
│   └── shared/                          # Existing shared components
├── hooks/
│   ├── useCompanion.ts                  # Companion character state management
│   ├── useConversation.ts               # Conversation history management
│   ├── useCharacterState.ts             # Character state (mood, closeness, energy) logic
│   └── useProactiveDialogue.ts          # Proactive dialogue initiation logic
├── services/
│   ├── companionService.ts              # Companion-specific LLM dialogue generation
│   └── storage/
│       ├── conversationStorage.ts       # Conversation history IndexedDB operations
│       └── characterStateStorage.ts    # Character state IndexedDB operations
├── config/
│   └── characters/
│       ├── baiqi.json                   # Character configuration (name, dialogue templates, thresholds)
│       └── index.ts                    # Character config loader
├── assets/
│   └── characters/
│       ├── baiqi/
│       │   ├── avatar.png              # Character avatar
│       │   ├── illustrations/
│       │   │   ├── default.png
│       │   │   ├── happy.png
│       │   │   ├── calm.png
│       │   │   └── concerned.png
│       │   └── backgrounds/
│       │       ├── morning.png
│       │       ├── afternoon.png
│       │       ├── evening.png
│       │       └── night.png
│       └── overlays/
│           └── floral.png              # Floral overlay pattern
├── i18n/
│   └── locales/
│       ├── en.ts                        # English dialogue text and character names
│       └── zh.ts                        # Chinese dialogue text and character names
├── types.ts                             # Shared TypeScript types (CharacterState, ConversationMessage, etc.)
└── db.ts                                # Existing IndexedDB setup (extend with conversation/character state stores)
```

**Structure Decision**: Single React web application following existing CareNest structure. Companion system integrates as new module with dedicated components, hooks, services, and configuration. Character assets stored in `src/assets/characters/` with subdirectories per character. Configuration files in `src/config/characters/` for easy updates without code changes.

## Complexity Tracking

> **No violations identified - all requirements align with constitution principles**

## Phase 0: Research (Complete)

**Status**: ✅ Complete  
**Output**: `research.md`

All technical decisions resolved:
- LLM dialogue generation using existing Gemini API
- Character state management in IndexedDB
- Proactive dialogue initiation timing
- Fallback dialogue template system
- Conversation history storage
- Character asset loading and caching
- Integration with existing modules
- Home screen design with character entry point
- Otome game visual aesthetic implementation
- Glassmorphism (毛玻璃) design pattern implementation
- Home screen greeting request behavior (single request per page load)
- Radial menu (炸裂式菜单) implementation with spring animation and glassmorphism styling
- Icon expansion transition animation for seamless navigation to full-screen panels
- Neon glow chart design with gradient lines and glow effects
- Character element integration in full-screen data panels
- AI-generated data interpretation with template fallback
- Full-screen ImageBackground component with atmospheric anime background and gradient overlay
- Premium glassmorphism styling (rgba(255,255,255,0.15), blur(25px), border, glow effects)
- Linear icon library (lucide-react) integration replacing emoji icons

## Phase 1: Design & Contracts (Complete)

**Status**: ✅ Complete  
**Outputs**: 
- `data-model.md` - Complete entity definitions and storage schemas
- `contracts/companion-service.md` - API contract for dialogue generation service
- `quickstart.md` - Integration guide and common patterns

**Key Design Decisions**:
- Character state stored in IndexedDB with dedicated `characterState` store
- Conversation messages stored in IndexedDB with `conversations` store, indexed by characterId and timestamp
- Character configuration in JSON files (`src/config/characters/`) for easy updates
- Character assets as static files (`src/assets/characters/`) with browser caching
- Dialogue generation via existing LLM service with template fallback
- Proactive initiation based on time-of-day and activity patterns
- Home screen at root path "/" with character illustration, state-aware dialogue bubble, function spheres (upper right corner), and radial menu (炸裂式菜单) triggered by clicking character
- Function spheres (upper right corner): Three circular glassmorphism buttons navigate directly to original functional screens (/health, /nutrition, /emotional) - quick access shortcuts without icon expansion transition
- Radial menu interaction: 4 icons (Health, Nutrition, Emotion, Settings) explode outward in circular/arc trajectories with spring animation, glassmorphism styling, subtle glow halos, background blur effect
- Icon expansion transition (radial menu icons ONLY): Clicked radial menu icon scales up to fill screen, seamlessly transitions to full-screen data panel with slide-up animation (300-500ms, ease-out) - function spheres navigate directly without this transition
- Neon glow chart design (radial menu data panels ONLY): Purple/pink gradient lines with outer glow effect, semi-transparent glassmorphism background, no coordinate axis grid lines, left-to-right drawing animation (800-1200ms) - applies to radial menu data panels, NOT to original functional screens
- Character element in full-screen panels (radial menu panels ONLY): Small avatar/silhouette (60-80px) at bottom-right corner with dialogue bubble displaying AI-generated data interpretation (with template fallback) - applies to radial menu data panels, NOT to original functional screens
- Authentic otome game visual aesthetic: ornate decorative elements, rich romantic color palette, elaborate borders, detailed character illustrations, elegant typography
- Authentic otome game visual aesthetic: ornate decorative elements, rich romantic color palette, elaborate borders, detailed character illustrations, elegant typography
- Glassmorphism layered design: character illustration as background, functional modules as semi-transparent glass cards with backdrop-filter blur, maintaining visual immersion with functional usability
- Refined Glassmorphism dialog boxes: premium styling (background rgba(255,255,255,0.15), blur(25px), 24px radius, 1px border rgba(255,255,255,0.4), box-shadow glow, text #4A4A4A) to create premium transparent glass floating effect, remove heavy/thick appearance
- Full-screen ImageBackground component: high-quality atmospheric anime background image covering entire app, subtle white gradient overlay (transparent→white), remove blue placeholder boxes, create immersive atmospheric foundation
- Floating Bottom Bar: pill-shaped capsule navigation (not full-width), semi-transparent, minimal text labels
- Floating light particles: subtle animated particles for romance feel
- Soft dreamy color scheme: #FDEEF4 (cherry pink), #FFFFFF (white), #FFD1DC (light pink)
- Home screen greeting: Single request per page load using React ref flags, graceful template fallback on AI failure
- Linear icon library: lucide-react integration for professional icon appearance, replace all emoji with linear icons (Home, Activity/HeartPulse, Leaf/Apple, Heart, MessageCircle, Settings), consistent color #FF7E9D, maintain touch targets

## Next Steps

Run `/speckit.tasks` to generate implementation tasks breakdown.
