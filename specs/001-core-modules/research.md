# Research: Wellmate Core Modules

**Created**: 2025-01-27  
**Purpose**: Resolve technical decisions and research findings for Wellmate implementation

## Technology Stack Decisions

### Frontend Framework: React + TypeScript

**Decision**: Use React 18+ with TypeScript 5+ for the frontend application.

**Rationale**:
- Constitution mandates React + TypeScript (Principle: Architectural Constraints)
- React provides component-based architecture suitable for modular health tracking features
- TypeScript ensures type safety for health data models and API contracts
- Large ecosystem and community support for PWA capabilities
- Excellent mobile-first responsive design support

**Alternatives Considered**:
- Vue.js: Similar capabilities but less alignment with team expertise assumptions
- Svelte: Excellent performance but smaller ecosystem for PWA features
- Vanilla JavaScript: Too low-level, would increase development time significantly

### State Management: React Context + Custom Hooks

**Decision**: Use React Context API with custom hooks for state management, avoiding external state libraries initially.

**Rationale**:
- Local-first architecture means minimal shared state across components
- IndexedDB operations abstracted through custom hooks (`useLocalStorage`, `useIndexedDB`)
- Reduces bundle size and complexity
- Can migrate to Zustand or Jotai later if needed without breaking changes

**Alternatives Considered**:
- Redux: Overkill for local-first app with minimal shared state
- Zustand: Good option but adds dependency; can adopt later if needed
- Recoil: Too complex for current scope

### Local Storage: IndexedDB

**Decision**: Use IndexedDB via `idb` library (lightweight wrapper) for all persistent data storage.

**Rationale**:
- Constitution mandates IndexedDB (Principle 3: Privacy-First Architecture)
- Supports structured data storage (objects, arrays, blobs for medical records)
- Handles large files (medical records up to 10MB)
- Works offline (Principle 6: Offline Support)
- Better than localStorage for complex data structures
- Native browser API, no external dependencies for core functionality

**Alternatives Considered**:
- localStorage: Insufficient for file storage and complex queries
- SQLite (via WebAssembly): Overkill, adds complexity and bundle size
- Dexie.js: Good option but `idb` is lighter; can migrate if needed

### AI/LLM Integration: Gemini API via HyperEcho Proxy

**Decision**: Use Gemini API via HyperEcho Proxy (`vibe-coding-app-gemini` model) via service layer with explicit user consent.

**API Configuration**:
- **Model Name**: `vibe-coding-app-gemini`
- **Base URL**: `https://hyperecho-proxy.aelf.dev/v1`
- **API Key**: `hy-iAce_nUcM7-gHGJY2ZJvdqa2H6nVpDZfLoZT4HndpLk` (store in environment variables, never commit)
- **API Format**: OpenAI-compatible API (uses `/v1/chat/completions` endpoint)

**Rationale**:
- Constitution requires explicit opt-in consent for data transmission (Principle 3)
- Medical record processing requires advanced language understanding
- Gemini model provides strong language understanding capabilities
- HyperEcho Proxy provides OpenAI-compatible interface for easy integration
- Service layer isolation (`services/llmService.ts`) allows easy provider switching
- Clear separation of concerns: local storage vs. external processing

**Alternatives Considered**:
- OpenAI GPT-4: Similar capabilities but different API endpoint
- Anthropic Claude: Similar capabilities but different API endpoint
- Local LLM (via WebAssembly): Insufficient performance and model quality for medical text understanding
- Self-hosted LLM: Requires infrastructure, increases complexity and cost
- Hybrid approach: Start with external API, can add local processing later for simple tasks

**Implementation Notes**:
- Use OpenAI SDK or fetch API with OpenAI-compatible format
- All AI requests must include safety guardrails in prompts
- User must explicitly consent before any data transmission
- Queue requests when offline, process when online
- Clear visual indicators when AI is processing
- Store API key in environment variable (`VITE_LLM_API_KEY`) for security
- Use base URL from environment variable (`VITE_LLM_BASE_URL`) for flexibility

### PWA Framework: Workbox

**Decision**: Use Workbox for service worker management and offline caching strategies.

**Rationale**:
- Constitution requires PWA with offline capabilities (Principle 5, 6)
- Workbox provides robust caching strategies for offline support
- Handles service worker updates and cache invalidation
- Industry standard for PWA development
- Good integration with build tools (Vite/Webpack)

**Alternatives Considered**:
- Manual service worker: Too complex, error-prone
- Workbox is the standard solution with excellent documentation

### Build Tool: Vite

**Decision**: Use Vite as the build tool and development server.

**Rationale**:
- Fast development experience (HMR)
- Excellent TypeScript support
- PWA plugin support (vite-plugin-pwa)
- Small bundle output
- Modern tooling with good ecosystem

**Alternatives Considered**:
- Create React App: Deprecated, slower, less flexible
- Webpack: More complex configuration, slower builds
- Next.js: Overkill for single-page PWA, adds server-side complexity

### UI Framework: Tailwind CSS

**Decision**: Use Tailwind CSS as the styling solution. **This is a hard constraint for MVP.**

**Rationale**:
- **Hard constraint**: Required for MVP implementation
- Mobile-first design system aligns with Tailwind's approach
- Consistent spacing scale (8px base) matches constitution requirements (20-24px screen edge padding, 8px spacing scale)
- Utility-first approach enables rapid development
- Small bundle size with purging unused styles
- Excellent responsive design utilities for mobile-first approach
- Easy to maintain design system consistency

**Alternatives Considered**:
- Material-UI: Too opinionated, larger bundle size, not Tailwind
- Chakra UI: Good option but not Tailwind (hard constraint)
- Styled Components: Runtime overhead, harder to optimize, not Tailwind
- Plain CSS: Too verbose, harder to maintain consistency, not Tailwind

**Implementation Notes**:
- Configure Tailwind for mobile-first breakpoints
- Use Tailwind's spacing scale (4px, 8px, 16px, 24px, 32px, etc.) to match constitution
- Ensure touch targets meet 44x44px minimum using Tailwind sizing utilities
- Use Tailwind's responsive utilities for mobile-first behavior

### File Upload: Native File API + PDF.js

**Decision**: Use native File API for uploads, PDF.js for PDF text extraction.

**Rationale**:
- Browser-native File API handles drag-and-drop and file picker
- PDF.js extracts text from PDFs client-side (privacy-preserving)
- Image files can be processed directly or sent to AI for OCR
- No external dependencies for basic file handling

**Alternatives Considered**:
- File upload libraries: Add unnecessary dependencies for simple use case
- Server-side processing: Violates privacy-first principle

### Date/Time Handling: date-fns

**Decision**: Use date-fns for date manipulation and formatting.

**Rationale**:
- Lightweight, tree-shakeable
- Immutable API (safer than moment.js)
- Good TypeScript support
- Handles timezone conversions needed for symptom/mood logging

**Alternatives Considered**:
- Moment.js: Deprecated, large bundle size
- Day.js: Good alternative, date-fns has better TypeScript support
- Native Date API: Too verbose, timezone handling is complex

### Form Validation: React Hook Form + Zod

**Decision**: Use React Hook Form for form management with Zod for schema validation.

**Rationale**:
- React Hook Form minimizes re-renders (performance)
- Zod provides TypeScript-first schema validation
- Type-safe form handling for health data
- Good error message handling
- Small bundle size

**Alternatives Considered**:
- Formik: More re-renders, larger bundle
- Yup: Less TypeScript-friendly than Zod
- Native HTML5 validation: Insufficient for complex health data validation

## Architecture Patterns

### Service Layer Pattern

**Decision**: Isolate all external API calls in `services/` directory.

**Rationale**:
- Constitution requirement (Architectural Constraints)
- Clear separation: local storage vs. external services
- Easy to mock for testing
- Single point of change for API provider switching

### Custom Hooks Pattern

**Decision**: Create custom hooks for IndexedDB operations and data fetching.

**Rationale**:
- Encapsulates IndexedDB complexity
- Reusable across components
- Type-safe with TypeScript
- Follows React best practices

**Examples**:
- `useMedicalRecords()` - CRUD operations for medical records
- `useSymptomLogs()` - Symptom entry management
- `useMoodEntries()` - Mood check-in management
- `useMealSuggestions()` - Meal suggestion generation

### Error Boundary Pattern

**Decision**: Implement React Error Boundaries to prevent crashes from affecting user data.

**Rationale**:
- Constitution requirement (Security & Safety)
- Health data integrity is critical
- Graceful degradation when errors occur
- User-friendly error messages (Principle 2: Empathetic Tone)

## Performance Considerations

### Code Splitting

**Decision**: Implement route-based code splitting for main modules.

**Rationale**:
- Reduces initial bundle size
- Faster time-to-interactive
- Each module can load independently
- Aligns with user story independence

### Image Optimization

**Decision**: Compress medical record images before storage, use WebP format when possible.

**Rationale**:
- Reduces IndexedDB storage usage
- Faster loading times
- Maintains quality for AI processing
- Browser support is widespread

### Lazy Loading

**Decision**: Lazy load AI-generated content and insights.

**Rationale**:
- Initial page load focuses on core features
- AI processing happens asynchronously
- Better perceived performance
- Aligns with offline-first approach

## Security Considerations

### Input Sanitization

**Decision**: Sanitize all user inputs before storage and AI processing.

**Rationale**:
- Constitution requirement (Security & Safety)
- Prevents XSS attacks
- Protects against malicious file uploads
- Ensures data integrity

**Implementation**:
- Use DOMPurify for HTML content sanitization
- Validate file types and sizes before upload
- Sanitize text inputs before IndexedDB storage

### AI Prompt Safety

**Decision**: Include safety guardrails in all AI prompts to prevent medical advice generation.

**Rationale**:
- Constitution Principle 1: Non-Diagnostic, Non-Prescriptive
- Legal protection
- User safety

**Implementation**:
- System prompts must explicitly prohibit medical advice
- Include disclaimers in all AI-generated content
- Validate AI responses for compliance before display

## Accessibility Decisions

### ARIA Labels and Semantic HTML

**Decision**: Use semantic HTML and ARIA labels for all interactive elements.

**Rationale**:
- Constitution Principle 5: WCAG 2.1 AA compliance
- Screen reader support
- Keyboard navigation support

### Focus Management

**Decision**: Implement proper focus management for modals and navigation.

**Rationale**:
- Accessibility requirement
- Better keyboard navigation
- Screen reader compatibility

## Testing Strategy

### Unit Testing: Vitest

**Decision**: Use Vitest for unit testing (compatible with Vite).

**Rationale**:
- Fast execution
- TypeScript support
- Good React Testing Library integration
- Minimal configuration

### Integration Testing: React Testing Library

**Decision**: Use React Testing Library for component and integration testing.

**Rationale**:
- Tests user interactions, not implementation
- Accessible queries align with accessibility goals
- Industry standard for React testing

### E2E Testing: Playwright (Future)

**Decision**: Consider Playwright for end-to-end testing in future phases.

**Rationale**:
- Better than Cypress for PWA testing
- Cross-browser support
- Good mobile emulation
- Can be added later when needed

## Deployment Considerations

### Hosting: Static Hosting (Vercel/Netlify)

**Decision**: Deploy as static site to Vercel or Netlify.

**Rationale**:
- PWA is static after build
- No server infrastructure needed
- Easy deployment workflow
- Good CDN support
- Free tier sufficient for MVP

**Alternatives Considered**:
- Self-hosted: Requires infrastructure management
- Cloud hosting (AWS/GCP): Overkill for static PWA

### PWA Configuration

**Decision**: Configure PWA manifest and service worker for installability.

**Rationale**:
- Constitution Principle 5: PWA requirement
- Offline functionality (Principle 6)
- Better mobile experience
- App-like feel

## UI Layout & Navigation

### Bottom Tab Navigation

**Decision**: Implement bottom tab navigation with three main tabs (Health Tracking, Nutrition Assistant, Emotional Support) using Tailwind CSS.

**Rationale**:
- Mobile-first design: Bottom tabs are thumb-friendly on mobile devices
- Clear primary navigation: Three main features easily accessible
- Standard mobile pattern: Users familiar with bottom tab navigation
- Tailwind CSS: Utility-first styling aligns with hard constraint

**Implementation Approach**:
- Fixed position at bottom of viewport
- Active tab indicator (color change + optional underline)
- Icons + text labels for clarity
- Smooth transitions between tabs
- Responsive: Adapts to tablet/desktop (may move to side or top)

**Tailwind CSS Patterns**:
- Use `fixed bottom-0` for positioning
- `flex` layout for tab distribution
- `bg-white` or `bg-gray-50` for background
- `border-t` for top border separator
- Active state: `text-primary-600` or `bg-primary-50`
- Touch targets: Minimum 44px height (Tailwind: `h-11` or `h-12`)

**Alternatives Considered**:
- Top navigation: Less thumb-friendly on mobile
- Hamburger menu: Hides navigation, increases cognitive burden
- Side drawer: Takes up screen space, less accessible

### Settings Drawer

**Decision**: Implement slide-in drawer for Privacy & Data management, accessible via gear icon in top-right corner.

**Rationale**:
- Secondary feature: Privacy settings don't need primary navigation
- Space-efficient: Drawer doesn't take permanent screen space
- Standard pattern: Settings icon universally recognized
- Mobile-friendly: Slide-in drawer works well on touch devices
- Tailwind CSS: Can implement with Tailwind utilities + transitions

**Implementation Approach**:
- Gear icon in top-right corner (fixed or in header)
- Drawer slides in from right (mobile) or side (desktop)
- Backdrop overlay when drawer is open
- Close button or click-outside-to-close
- Contains Privacy & Data management screens
- Smooth slide animation (Tailwind transitions)

**Tailwind CSS Patterns**:
- Use `fixed right-0 top-0` for positioning
- `transform translate-x-full` for hidden state
- `transform translate-x-0` for visible state
- `transition-transform` for smooth animation
- `bg-white` or `bg-gray-50` for drawer background
- `shadow-xl` for depth
- `w-80` or `w-96` for drawer width (mobile: `w-full sm:w-96`)
- Backdrop: `fixed inset-0 bg-black bg-opacity-50`

**Alternatives Considered**:
- Modal dialog: More intrusive, less app-like
- Separate route: Breaks navigation flow
- Bottom sheet: Less standard for settings on mobile

## Unresolved Questions

None - all technical decisions resolved based on constitution requirements and best practices.

## Next Steps

1. Create data model schemas based on entities defined in spec
2. Design API contracts for AI service integration
3. Create quickstart guide for development setup
4. Implement bottom tab navigation and settings drawer components
5. Begin implementation following established patterns

