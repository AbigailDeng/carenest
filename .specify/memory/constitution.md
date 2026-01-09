<!--
Sync Impact Report:
Version: 0.1.0 → 1.0.0 (MAJOR: Initial constitution creation)
Modified Principles: N/A (new file)
Added Sections: All sections (new constitution)
Removed Sections: N/A
Templates Requiring Updates:
  ✅ .specify/templates/plan-template.md (updated with Wellmate-specific constitution checks)
  ✅ .specify/templates/spec-template.md (updated with constitution compliance section)
  ✅ .specify/templates/tasks-template.md (already aligned, no changes needed)
  ✅ .specify/templates/commands/constitution.md (created)
Follow-up TODOs: None
-->

# Project Constitution: Wellmate

**Version:** 1.0.0  
**Ratification Date:** 2025-01-27  
**Last Amended:** 2025-01-27

---

## Purpose

This constitution establishes the foundational principles, governance, and architectural constraints for the Wellmate project—an AI-powered personal health companion application. It serves as the single source of truth for all development decisions, feature specifications, and implementation guidelines.

---

## Project Overview

**Project Name:** Wellmate  
**Project Type:** Mobile-First Web Application (PWA)  
**Primary Domain:** Personal Health & Wellness Companion

Wellmate is an AI-powered personal health companion designed to help users manage their physical health, daily nutrition, and emotional well-being in a gentle, non-medical, companion-like way. The application emphasizes privacy, empathy, and low cognitive burden while providing supportive health tracking, nutrition guidance, and emotional support features.

---

## Core Principles

### Principle 1: Non-Diagnostic, Non-Prescriptive

**MUST:** Wellmate MUST NOT provide medical diagnoses, prescriptions, or treatment recommendations. All health-related suggestions are lifestyle and dietary guidance only, clearly labeled as such.

**MUST:** All AI-generated health summaries and suggestions MUST include appropriate disclaimers indicating they are not medical advice and that users should consult healthcare professionals for medical concerns.

**MUST:** The application MUST avoid language that implies medical authority or clinical expertise.

**Rationale:** Legal protection, user safety, and maintaining appropriate boundaries between wellness support and medical care.

---

### Principle 2: Supportive, Empathetic Tone

**MUST:** All user-facing text, AI responses, and interactions MUST maintain a supportive, empathetic, and non-judgmental tone.

**MUST:** Error messages and empty states MUST be encouraging and helpful rather than technical or dismissive.

**MUST:** AI-generated responses MUST be calibrated to acknowledge user feelings and provide gentle guidance.

**Rationale:** Users managing health issues or emotional challenges need compassion, not clinical detachment. The companion-like nature of the app requires warmth and understanding.

---

### Principle 3: Privacy-First Architecture

**MUST:** All user health data, medical records, mood logs, and personal information MUST be stored locally using IndexedDB or encrypted local storage. No sensitive health data SHOULD be transmitted to external servers without explicit, informed user consent.

**MUST:** Any data transmission (e.g., for AI processing) MUST use end-to-end encryption and require explicit user opt-in with clear explanation of what data is shared and why.

**MUST:** Users MUST have clear, accessible options to view, export, and permanently delete all their data at any time.

**MUST:** The application MUST comply with applicable data protection regulations (GDPR, HIPAA considerations for health data, etc.).

**Rationale:** Health data is highly sensitive. Users must trust that their information remains private and under their control.

---

### Principle 4: Low Cognitive Burden

**MUST:** User interfaces MUST be simple, intuitive, and require minimal steps to complete core actions.

**MUST:** Navigation MUST be shallow (maximum 3 levels deep) and clearly labeled.

**MUST:** Forms and inputs MUST be minimal, with progressive disclosure for advanced features.

**MUST:** Daily interactions (mood check-ins, reminders) MUST be completable in under 30 seconds.

**MUST:** The application MUST use clear, plain language—avoid medical jargon and technical terms unless necessary.

**Rationale:** Users managing health issues may have reduced energy or cognitive capacity. The app should reduce friction, not add to it.

---

### Principle 5: Mobile-First, Touch-Optimized Design

**MUST:** All interfaces MUST be designed for mobile devices first, with touch-optimized targets (minimum 44x44px).

**MUST:** The application MUST function as a Progressive Web App (PWA) with offline capabilities for core features.

**MUST:** All interactive elements MUST meet accessibility standards (WCAG 2.1 AA minimum).

**MUST:** Spacing, typography, and layout MUST follow mobile-first design principles (20-24px screen edge padding, 8px spacing scale, etc.).

**Rationale:** Health tracking and mood logging are most effective when accessible throughout the day on users' primary devices.

---

### Principle 6: Graceful Degradation & Offline Support

**MUST:** Core features (symptom logging, mood check-ins, local data viewing) MUST function without network connectivity.

**MUST:** AI-powered features MUST degrade gracefully when offline, with clear messaging about what requires connectivity.

**MUST:** Data synchronization (if implemented) MUST be resilient to network interruptions and resume automatically when connectivity is restored.

**Rationale:** Users may be in areas with poor connectivity or prefer to minimize data usage. Core functionality should remain available.

---

### Principle 7: Transparent AI Interactions

**MUST:** When AI processes user data (summaries, suggestions, responses), the application MUST clearly indicate that AI is being used and provide context about what the AI is doing.

**MUST:** Users MUST be able to understand why AI made specific suggestions (e.g., "Based on your logged symptoms...").

**MUST:** AI responses MUST be clearly distinguishable from factual information or user-entered data.

**Rationale:** Trust requires transparency. Users should understand when and how AI is assisting them.

---

### Principle 8: Data Ownership & Portability

**MUST:** Users MUST be able to export all their data in a standard format (JSON, CSV, or both) at any time.

**MUST:** Data deletion MUST be permanent and verifiable, with confirmation dialogs to prevent accidental loss.

**MUST:** Users MUST retain full ownership of their data, with no claims by the application or service providers.

**Rationale:** User autonomy and compliance with data protection regulations require clear data ownership and portability.

---

## Architectural Constraints

### Technology Stack

**MUST:** Use React with TypeScript for the frontend application.

**MUST:** Use IndexedDB for local data persistence (via `db.ts` and `services/storage/`).

**MUST:** External API calls (including LLM services) MUST be isolated in `services/` directory.

**MUST:** Follow the established folder structure:
- `src/components/` - React components
- `src/hooks/` - Custom React hooks
- `src/services/` - External APIs & LLM calls
- `src/services/storage/` - IndexedDB persistence
- `src/types.ts` - Shared TypeScript types
- `src/db.ts` - Low-level IndexedDB operations

**Rationale:** Consistency, maintainability, and clear separation of concerns.

---

### Data Models

**MUST:** Health records, symptoms, mood logs, and nutrition data MUST be stored locally in IndexedDB with appropriate schemas.

**MUST:** Data models MUST support versioning to enable future schema migrations.

**MUST:** Sensitive data fields MUST be clearly identified and handled with appropriate encryption if transmitted.

**Rationale:** Local-first architecture ensures privacy and offline functionality.

---

### Security & Safety

**MUST:** All user inputs MUST be sanitized before processing or storage.

**MUST:** AI prompts MUST include safety guardrails to prevent generation of medical advice or harmful content.

**MUST:** The application MUST include appropriate disclaimers and terms of service regarding health information use.

**MUST:** Error boundaries MUST be implemented to prevent application crashes from affecting user data.

**Rationale:** User safety, data integrity, and legal protection.

---

## Feature Scope

### Core Modules

1. **Health Analysis & Tracking**
   - Medical record upload and AI summarization (plain language)
   - Lifestyle and diet suggestions (avoid/prefer/general advice)
   - Daily symptom and note logging
   - Timeline view of health changes

2. **Daily Nutrition Companion**
   - Ingredient input and AI meal suggestions
   - Optional adaptation based on health conditions or energy level
   - Simple, accessible meal ideas

3. **Mental & Emotional Support**
   - Daily mood check-ins
   - Emotional journaling with empathetic AI responses
   - Supportive conversations (loneliness, stress, confusion)
   - No clinical therapy claims

4. **Additional Features**
   - Gentle daily reminders (hydration, meals, sleep, mood)
   - AI-generated insights linking mood, sleep, and nutrition
   - Clear data privacy and deletion options

---

## Governance

### Amendment Procedure

1. Proposed amendments MUST be documented with rationale and impact assessment.
2. Amendments affecting core principles (1-8) require MAJOR version bump.
3. Amendments adding new principles or architectural constraints require MINOR version bump.
4. Clarifications, typo fixes, and non-semantic changes require PATCH version bump.
5. All amendments MUST update the "Last Amended" date.

### Versioning Policy

- **MAJOR (X.0.0):** Backward incompatible changes, principle removals, or fundamental redefinitions.
- **MINOR (0.X.0):** New principles, sections, or materially expanded guidance.
- **PATCH (0.0.X):** Clarifications, wording improvements, typo fixes, non-semantic refinements.

### Compliance Review

- All feature specifications MUST reference relevant principles.
- Implementation reviews MUST verify adherence to architectural constraints.
- User-facing content MUST be reviewed for tone and safety compliance.
- Data handling implementations MUST be audited for privacy compliance.

---

## Target Users

- People managing chronic or recurring health issues
- People living alone or feeling emotionally unsupported
- Users seeking a calm, AI-assisted daily health companion

---

## Safety & Disclaimer Considerations

**MUST:** The application MUST include prominent disclaimers that:
- Wellmate is not a medical device or diagnostic tool
- AI-generated summaries and suggestions are informational only
- Users should consult healthcare professionals for medical concerns
- The application does not replace professional medical advice

**MUST:** Disclaimers MUST be accessible from the main interface and included in onboarding flows.

**Rationale:** Legal protection and user safety require clear boundaries about the application's scope and limitations.

---

## Compliance & Legal

**MUST:** The application MUST comply with applicable regulations:
- GDPR (if serving EU users)
- Health data handling best practices (HIPAA considerations, though not a covered entity)
- Accessibility standards (WCAG 2.1 AA)

**MUST:** Terms of Service and Privacy Policy MUST be clear, accessible, and regularly reviewed.

---

## End of Constitution

This constitution is a living document. All team members and contributors are expected to familiarize themselves with these principles and refer to them when making development decisions.
