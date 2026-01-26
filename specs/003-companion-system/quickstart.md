# Quickstart Guide: Companion Character System

**Feature**: 003-companion-system  
**Date**: 2026-01-25  
**Status**: Design Phase

## Overview

This document provides test scenarios, acceptance criteria, and quickstart instructions for validating the Companion Character System implementation.

## Test Scenarios

### User Story 1: Daily Companion Interaction (Priority: P1)

**Goal**: Users feel like they're interacting with a real person who cares about them, reducing loneliness through daily conversations.

#### Scenario 1.1: Initial App Open - Character Greeting

**Given**: User opens the app for the first time  
**When**: Home screen loads  
**Then**: 
- Character (Bai Qi) illustration is displayed with breathing animation
- Character greets user with appropriate message based on time-of-day
- Greeting uses conversational, boyfriend-like tone (not formal)
- Character state shows closeness: 0, relationshipStage: "stranger"

**Acceptance Criteria**:
- [ ] Character illustration visible with breathing animation (scale 1.0-1.03, translateY 0px to -10px, 7s cycle)
- [ ] Dialogue bubble displays greeting (e.g., "Hello! I'm Bai Qi. Let's get to know each other.")
- [ ] Greeting text matches time-of-day (morning/afternoon/evening/night)
- [ ] Character state initialized correctly in IndexedDB

**Test Steps**:
1. Open app in browser
2. Navigate to home screen (/)
3. Verify character illustration displays
4. Verify dialogue bubble shows greeting
5. Check IndexedDB `characterStates` store for initial state

#### Scenario 1.2: Conversation Interaction

**Given**: User is on home screen with character greeting displayed  
**When**: User types a message and sends it  
**Then**: 
- User message appears in conversation (right-aligned)
- Character responds with context-aware dialogue
- Response reflects current character state (mood, closeness)
- Conversation history saved to IndexedDB

**Acceptance Criteria**:
- [ ] User message displayed in chat bubble (right-aligned, glassmorphism style)
- [ ] Character response generated within 2 seconds (NFR-001)
- [ ] Response uses conversational, empathetic tone (not clinical)
- [ ] Response contextually relevant to user message
- [ ] Both messages saved to IndexedDB `conversations` store

**Test Steps**:
1. Type message: "I'm feeling a bit tired today"
2. Send message
3. Verify user message appears
4. Wait for character response (<2 seconds)
5. Verify response is empathetic and relevant
6. Check IndexedDB for saved messages

#### Scenario 1.3: Proactive Greeting After Inactivity

**Given**: User has not interacted for several hours  
**When**: User returns to app  
**Then**: 
- Character proactively initiates conversation
- Greeting acknowledges time since last interaction
- Tone is warm but not pushy

**Acceptance Criteria**:
- [ ] Character initiates conversation without user input
- [ ] Greeting references time-of-day appropriately
- [ ] Message acknowledges absence gently (e.g., "Welcome back! I missed you.")
- [ ] Closeness level affects greeting intimacy

**Test Steps**:
1. Set `lastInteractionTime` to 5 hours ago in IndexedDB
2. Open app
3. Verify character proactively greets user
4. Verify greeting is contextually appropriate

#### Scenario 1.4: Relationship Progression

**Given**: User has interacted daily for one week  
**When**: User checks relationship state  
**Then**: 
- Closeness level has increased (e.g., from 0 to 20-30)
- Relationship stage may have progressed (e.g., "stranger" → "acquaintance")
- Character dialogue reflects increased closeness

**Acceptance Criteria**:
- [ ] Closeness value increases with daily interactions
- [ ] Relationship stage updates based on closeness thresholds
- [ ] Character dialogue becomes more personal/intimate as closeness increases
- [ ] Relationship badge/indicator displays current stage

**Test Steps**:
1. Simulate 7 days of daily interactions
2. Check CharacterState.closeness value
3. Verify relationshipStage updated if threshold crossed
4. Verify character dialogue reflects higher closeness

### User Story 2: Companion-Guided Health Activities (Priority: P2)

**Goal**: Users engage in health tracking activities framed as "doing things together" with the companion.

#### Scenario 2.1: Companion Suggests Health Activity

**Given**: User is in conversation with companion  
**When**: Companion suggests logging symptoms  
**Then**: 
- Companion provides encouraging, context-aware suggestion
- User can navigate to symptom logging screen
- Suggestion feels like invitation, not command

**Acceptance Criteria**:
- [ ] Companion suggests activity in conversational tone
- [ ] Suggestion includes navigation to functional module (/health/symptoms)
- [ ] Suggestion acknowledges user's current state (mood, time-of-day)
- [ ] Navigation works correctly

**Test Steps**:
1. Engage in conversation
2. Wait for or trigger activity suggestion
3. Verify suggestion is conversational and encouraging
4. Click suggestion or navigate manually
5. Verify navigation to /health/symptoms

#### Scenario 2.2: Acknowledgment After Activity Completion

**Given**: User completed symptom logging  
**When**: User returns to conversation  
**Then**: 
- Companion acknowledges the action
- Feedback is encouraging and context-aware
- Closeness level increases slightly

**Acceptance Criteria**:
- [ ] Companion acknowledges completed activity
- [ ] Feedback is encouraging (e.g., "I saw you logged your symptoms. That's really good!")
- [ ] Feedback reflects current closeness level
- [ ] Closeness increment applied (e.g., +2-5 points)

**Test Steps**:
1. Complete symptom logging in /health/symptoms
2. Return to conversation screen
3. Verify companion acknowledges action
4. Check CharacterState.closeness increased

#### Scenario 2.3: Gentle Reminder for Inactive Health Logging

**Given**: User has not logged symptoms for 3+ days  
**When**: Companion detects inactivity pattern  
**Then**: 
- Companion gently reminds user
- Reminder is empathetic, not pushy
- No aggressive notifications

**Acceptance Criteria**:
- [ ] Companion detects inactivity pattern (3+ days without logging)
- [ ] Reminder message is gentle and empathetic
- [ ] Reminder does not feel like nagging
- [ ] Reminder includes encouragement, not guilt

**Test Steps**:
1. Set last symptom log date to 4 days ago
2. Engage in conversation
3. Verify companion mentions inactivity gently
4. Verify reminder tone is supportive

### User Story 3: Emotional Support Through Conversation (Priority: P2)

**Goal**: Users express feelings and receive empathetic responses, feeling less alone.

#### Scenario 3.1: Expressing Negative Emotions

**Given**: User expresses sadness or stress  
**When**: Companion responds  
**Then**: 
- Response is empathetic and non-judgmental
- Response reflects current closeness level
- Response provides emotional support

**Acceptance Criteria**:
- [ ] Companion response acknowledges user's feelings
- [ ] Response is empathetic (e.g., "I understand. That sounds really hard.")
- [ ] Response does not minimize or dismiss feelings
- [ ] Response reflects relationship stage (more intimate if higher closeness)

**Test Steps**:
1. Send message: "I've been feeling really stressed lately"
2. Verify companion response is empathetic
3. Verify response acknowledges stress without judgment
4. Check response reflects current closeness level

#### Scenario 3.2: Sharing Health Concerns

**Given**: User shares concern about health  
**When**: Companion responds  
**Then**: 
- Response is supportive
- Response may gently guide toward functional modules
- Response does not provide medical advice

**Acceptance Criteria**:
- [ ] Companion response is supportive and caring
- [ ] Response may suggest relevant functional module (e.g., symptom logging)
- [ ] Response includes appropriate disclaimers (not medical advice)
- [ ] Response maintains companion character tone

**Test Steps**:
1. Send message: "I've been having headaches"
2. Verify companion response is supportive
3. Verify response may suggest symptom logging
4. Verify response includes disclaimer if medical topic

#### Scenario 3.3: Early Relationship Stage Responses

**Given**: User has low closeness level (0-20)  
**When**: User expresses emotions  
**Then**: 
- Companion responds warmly but appropriately
- Response reflects early relationship stage
- Response does not assume intimacy

**Acceptance Criteria**:
- [ ] Companion response is warm but not overly intimate
- [ ] Response uses appropriate language for early stage
- [ ] Response does not assume deep relationship
- [ ] Response encourages continued interaction

**Test Steps**:
1. Set CharacterState.closeness to 15
2. Express emotion in conversation
3. Verify response is warm but appropriately distant
4. Verify response encourages building relationship

## Integration Test Scenarios

### Integration 1: Function Spheres Navigation

**Given**: User is on home screen  
**When**: User clicks function sphere (Health/Nutrition/Emotion)  
**Then**: 
- Navigation occurs directly to functional screen
- No intermediate data panel displayed
- Character remains visible in background

**Acceptance Criteria**:
- [ ] Top sphere (Health) navigates to /health
- [ ] Middle sphere (Nutrition) navigates to /nutrition
- [ ] Bottom sphere (Emotion) navigates to /emotional
- [ ] Navigation is direct (no icon expansion transition)
- [ ] Character illustration remains visible in background

**Test Steps**:
1. Click top function sphere (HeartPulse icon)
2. Verify navigation to /health route
3. Verify no data panel displayed
4. Repeat for Nutrition and Emotion spheres

### Integration 2: Health Page Style Consistency

**Given**: User navigates to /health route  
**When**: Health Details Page loads  
**Then**: 
- Page uses same background illustration as home screen
- Glassmorphism cards display correctly
- Character dialogue bubble visible
- Layout matches spec requirements

**Acceptance Criteria**:
- [ ] Background uses ImageBackground component with Bai Qi illustration
- [ ] FloatingParticles component visible (count 20)
- [ ] Glassmorphism cards display (2 cards: "记录症状", "查看时间线")
- [ ] Dialogue bubble displays above cards
- [ ] Back button visible in top-left corner
- [ ] Bottom navigation bar hidden

**Test Steps**:
1. Navigate to /health route
2. Verify background illustration displays
3. Verify glassmorphism cards visible
4. Verify dialogue bubble positioned correctly
5. Verify back button functional

### Integration 3: Nutrition Page Style Consistency

**Given**: User navigates to /nutrition route  
**When**: Nutrition Details Page loads  
**Then**: 
- Page uses same visual style as Health Details Page
- Same background illustration
- Same glassmorphism card layout
- Same dialogue bubble style

**Acceptance Criteria**:
- [ ] Background matches Health page (same ImageBackground)
- [ ] Glassmorphism cards use same styling
- [ ] Dialogue bubble uses same CharacterAvatar and styling
- [ ] Layout matches Health page pattern

**Test Steps**:
1. Navigate to /nutrition route
2. Compare visual style with /health route
3. Verify consistency in background, cards, dialogue bubble

## Edge Case Scenarios

### Edge Case 1: First-Time User

**Given**: User opens app for first time  
**When**: App loads  
**Then**: 
- Character greets with initial introduction
- Closeness starts at 0
- Relationship stage is "stranger"
- No conversation history exists

**Acceptance Criteria**:
- [ ] Initial greeting displays
- [ ] CharacterState initialized with defaults
- [ ] No errors from missing conversation history

### Edge Case 2: AI Service Unavailable

**Given**: AI service (Gemini API) is unavailable or times out  
**When**: User sends message or companion needs to generate dialogue  
**Then**: 
- System falls back to predefined dialogue templates
- User sees appropriate message
- No error displayed to user
- System logs error for debugging

**Acceptance Criteria**:
- [ ] Template fallback activates within 2 seconds
- [ ] Fallback message is contextually appropriate
- [ ] User does not see technical error
- [ ] Error logged for debugging

**Test Steps**:
1. Disable network or simulate API failure
2. Send message or trigger greeting
3. Verify template fallback activates
4. Verify user sees appropriate message

### Edge Case 3: Long Inactivity Period

**Given**: User has not interacted for 7+ days  
**When**: User returns to app  
**Then**: 
- Character initiates reconnection dialogue
- Dialogue acknowledges absence without judgment
- Closeness level may decrease slightly (optional)

**Acceptance Criteria**:
- [ ] Character proactively greets user
- [ ] Greeting acknowledges absence (e.g., "It's been a while!")
- [ ] Greeting is warm and non-judgmental
- [ ] No guilt-tripping or pushy language

### Edge Case 4: Language Switch

**Given**: User switches app language  
**When**: Character dialogue displays  
**Then**: 
- Dialogue text updates to new language
- Character images remain unchanged
- Character name updates (e.g., "Bai Qi" → "白起")

**Acceptance Criteria**:
- [ ] Dialogue text uses selected language
- [ ] Character name displays in selected language
- [ ] Character illustrations remain same (not language-specific)
- [ ] UI elements update to new language

## Performance Test Scenarios

### Performance 1: Dialogue Generation Speed

**Given**: User sends message  
**When**: Companion generates response  
**Then**: 
- Response appears within 2 seconds (NFR-001)
- UI remains responsive during generation
- Loading indicator displays if generation takes >500ms

**Acceptance Criteria**:
- [ ] Response time <2 seconds (95th percentile)
- [ ] UI does not freeze during generation
- [ ] Loading state visible if generation delayed

### Performance 2: Character State Update Speed

**Given**: User completes interaction  
**When**: Character state updates  
**Then**: 
- State update completes within 500ms (NFR-002)
- UI does not block during update
- State persists correctly to IndexedDB

**Acceptance Criteria**:
- [ ] State update <500ms
- [ ] Update does not block UI thread
- [ ] IndexedDB write succeeds

### Performance 3: Image Loading Speed

**Given**: Character illustration needs to display  
**When**: Image loads  
**Then**: 
- Image loads within 1 second for cached assets (NFR-003)
- Fallback displays if image fails to load
- No broken image placeholders

**Acceptance Criteria**:
- [ ] Cached image loads <1 second
- [ ] Fallback image displays if primary fails
- [ ] No broken image icons visible

## Accessibility Test Scenarios

### Accessibility 1: Screen Reader Support

**Given**: User uses screen reader  
**When**: Navigating companion interface  
**Then**: 
- All interactive elements have ARIA labels
- Character dialogue is readable
- Navigation is logical and sequential

**Acceptance Criteria**:
- [ ] Buttons have aria-label attributes
- [ ] Dialogue bubbles have appropriate roles
- [ ] Character avatars have alt text
- [ ] Navigation order is logical

### Accessibility 2: Touch Target Sizes

**Given**: User interacts with companion interface  
**When**: Tapping interactive elements  
**Then**: 
- All touch targets are minimum 44x44px
- Spacing between targets is minimum 8px
- No overlapping touch targets

**Acceptance Criteria**:
- [ ] Function spheres: 48x48px (meets requirement)
- [ ] Back buttons: 56x56px (exceeds requirement)
- [ ] Dialogue bubbles: adequate touch area
- [ ] Cards: full touch target coverage

## Manual Test Checklist

### Setup
- [ ] Clear browser IndexedDB before testing
- [ ] Verify character config file exists: `src/config/characters/baiqi.json`
- [ ] Verify character images exist in `public/images/`
- [ ] Check network connectivity for AI service

### Core Functionality
- [ ] Character displays on home screen
- [ ] Character greeting appears on app open
- [ ] User can send messages
- [ ] Character responds to messages
- [ ] Conversation history saves to IndexedDB
- [ ] Character state updates after interactions

### UI/UX
- [ ] Glassmorphism styling applied correctly
- [ ] Character breathing animation works
- [ ] Dialogue bubbles positioned correctly
- [ ] No UI elements overlap
- [ ] Touch targets meet size requirements
- [ ] Navigation works smoothly

### Integration
- [ ] Function spheres navigate correctly
- [ ] Health page style matches spec
- [ ] Nutrition page style matches spec
- [ ] Character visible across all pages
- [ ] Background illustrations display correctly

### Edge Cases
- [ ] First-time user experience works
- [ ] AI service failure handled gracefully
- [ ] Long inactivity handled appropriately
- [ ] Language switching works
- [ ] Offline mode degrades gracefully

## Success Criteria

**MVP (User Story 1)**:
- ✅ Character displays and greets user
- ✅ User can have basic conversation
- ✅ Character state tracks and persists
- ✅ Conversation history saves locally

**Full Feature**:
- ✅ All three user stories implemented
- ✅ Integration with Health/Nutrition/Emotion modules
- ✅ UI/UX matches spec requirements
- ✅ Performance meets NFR targets
- ✅ Accessibility meets WCAG 2.1 AA
