/**
 * Service Interface Contracts: Companion Character System
 * 
 * These TypeScript interfaces define the contracts for internal services
 * used by the Companion Character System. All services are local (no REST API).
 * 
 * Feature: 003-companion-system
 * Date: 2026-01-25
 */

import { CharacterState, ConversationMessage, CharacterConfig, CharacterMood, RelationshipStage } from '../../../src/types';

/**
 * Companion Service
 * 
 * Handles character dialogue generation, state management, and interaction logic.
 * Location: src/services/companionService.ts
 */
export interface CompanionService {
  /**
   * Generate greeting message based on character state and time-of-day
   * 
   * @param characterId - Character identifier (e.g., "baiqi")
   * @param timeOfDay - Current time-of-day: "morning" | "afternoon" | "evening" | "night"
   * @returns Promise<string> - Generated greeting message
   * 
   * Requirements:
   * - Response time <2 seconds (NFR-001)
   * - Uses AI generation with template fallback (FR-006, NFR-006)
   * - Reflects character state (mood, closeness, relationshipStage)
   * - Uses conversational, boyfriend-like tone (not formal)
   */
  generateGreeting(characterId: string, timeOfDay: string): Promise<string>;

  /**
   * Generate response to user message
   * 
   * @param characterId - Character identifier
   * @param userMessage - User's message content
   * @param context - Current conversation context
   * @returns Promise<string> - Generated response message
   * 
   * Requirements:
   * - Response time <2 seconds (NFR-001)
   * - Uses AI generation with template fallback
   * - Reflects character state and context
   * - Uses empathetic, conversational tone (Principle 2)
   * - Does not provide medical advice (Principle 1)
   */
  generateResponse(
    characterId: string,
    userMessage: string,
    context: ConversationContext
  ): Promise<string>;

  /**
   * Update character state after interaction
   * 
   * @param characterId - Character identifier
   * @param updates - Partial state updates
   * @returns Promise<void>
   * 
   * Requirements:
   * - Update completes within 500ms (NFR-002)
   * - Does not block UI thread
   * - Persists to IndexedDB
   * - Updates relationshipStage if closeness threshold crossed
   */
  updateCharacterState(
    characterId: string,
    updates: Partial<CharacterState>
  ): Promise<void>;

  /**
   * Increment closeness level after interaction
   * 
   * @param characterId - Character identifier
   * @param delta - Closeness increment (typically 1-5 points)
   * @returns Promise<void>
   * 
   * Requirements:
   * - Closeness stays within 0-100 range
   * - Updates relationshipStage if threshold crossed
   * - Persists to IndexedDB
   */
  incrementCloseness(characterId: string, delta: number): Promise<void>;

  /**
   * Check if proactive dialogue should be triggered
   * 
   * @param characterId - Character identifier
   * @returns Promise<boolean> - True if proactive dialogue should trigger
   * 
   * Requirements:
   * - Checks time-of-day, last interaction time, character energy
   * - Returns true if conditions met for proactive initiation (FR-004)
   */
  shouldTriggerProactiveDialogue(characterId: string): Promise<boolean>;
}

/**
 * LLM Service (Enhanced)
 * 
 * Handles AI dialogue generation via Gemini API.
 * Location: src/services/llmService.ts
 */
export interface LLMService {
  /**
   * Generate character dialogue using LLM
   * 
   * @param prompt - Dialogue generation prompt
   * @param characterState - Current character state
   * @param context - Additional context (time-of-day, user message, etc.)
   * @returns Promise<string> - Generated dialogue text
   * 
   * Requirements:
   * - Uses Gemini API via HyperEcho Proxy
   * - Includes safety guardrails (no medical advice)
   * - Response time <2 seconds
   * - Throws error if generation fails (caller handles fallback)
   */
  generateDialogue(
    prompt: string,
    characterState: CharacterState,
    context?: DialogueContext
  ): Promise<string>;

  /**
   * Generate data interpretation for chart panels
   * 
   * @param chartData - Chart data to interpret
   * @param characterState - Current character state
   * @returns Promise<string> - Generated interpretation text
   * 
   * Requirements:
   * - Used for radial menu data panels only (FR-031H)
   * - Response time <2 seconds
   * - Concise (1-2 sentences)
   * - Contextually relevant to chart data
   */
  generateDataInterpretation(
    chartData: any,
    characterState: CharacterState
  ): Promise<string>;
}

/**
 * Character State Storage Service
 * 
 * Handles IndexedDB operations for character state.
 * Location: src/services/storage/characterStateStorage.ts
 */
export interface CharacterStateStorage {
  /**
   * Get character state by ID
   * 
   * @param characterId - Character identifier
   * @returns Promise<CharacterState | null> - Character state or null if not found
   */
  getCharacterState(characterId: string): Promise<CharacterState | null>;

  /**
   * Save character state
   * 
   * @param state - Character state to save
   * @returns Promise<void>
   * 
   * Requirements:
   * - Creates new record if ID doesn't exist
   * - Updates existing record if ID exists
   * - Sets updatedAt timestamp
   */
  saveCharacterState(state: CharacterState): Promise<void>;

  /**
   * Update closeness level
   * 
   * @param characterId - Character identifier
   * @param delta - Closeness increment (can be negative)
   * @returns Promise<void>
   * 
   * Requirements:
   * - Closeness stays within 0-100 range
   * - Updates relationshipStage if threshold crossed
   * - Updates lastInteractionTime
   * - Increments totalInteractions
   */
  updateCloseness(characterId: string, delta: number): Promise<void>;

  /**
   * Update character mood
   * 
   * @param characterId - Character identifier
   * @param mood - New mood value
   * @returns Promise<void>
   */
  updateMood(characterId: string, mood: CharacterMood): Promise<void>;

  /**
   * Reset character state (for testing or user request)
   * 
   * @param characterId - Character identifier
   * @param preserveCloseness - If true, keep current closeness level
   * @returns Promise<void>
   * 
   * Requirements:
   * - Resets mood, energy to defaults
   * - Optionally resets closeness to 0
   * - Updates relationshipStage based on final closeness
   */
  resetCharacterState(characterId: string, preserveCloseness?: boolean): Promise<void>;
}

/**
 * Conversation Storage Service
 * 
 * Handles IndexedDB operations for conversation messages.
 * Location: src/services/storage/conversationStorage.ts
 */
export interface ConversationStorage {
  /**
   * Save conversation message
   * 
   * @param message - Message to save
   * @returns Promise<void>
   * 
   * Requirements:
   * - Generates unique ID if not provided
   * - Sets timestamp if not provided
   * - Saves to IndexedDB conversations store
   */
  saveMessage(message: ConversationMessage): Promise<void>;

  /**
   * Get conversation history
   * 
   * @param characterId - Character identifier
   * @param limit - Maximum number of messages to return (default: 50)
   * @returns Promise<ConversationMessage[]> - Array of messages, oldest first
   * 
   * Requirements:
   * - Returns messages in chronological order
   * - Limits to specified count (most recent)
   * - Filters by characterId
   */
  getConversationHistory(characterId: string, limit?: number): Promise<ConversationMessage[]>;

  /**
   * Get conversation history for date range
   * 
   * @param characterId - Character identifier
   * @param startDate - Start date (inclusive)
   * @param endDate - End date (inclusive)
   * @returns Promise<ConversationMessage[]> - Array of messages in date range
   */
  getConversationHistoryByDateRange(
    characterId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ConversationMessage[]>;

  /**
   * Delete conversation history
   * 
   * @param characterId - Character identifier
   * @returns Promise<void>
   * 
   * Requirements:
   * - Deletes all messages for character
   * - Permanent deletion (NFR-009)
   * - User can optionally preserve closeness level
   */
  deleteConversationHistory(characterId: string): Promise<void>;
}

/**
 * Character Configuration Service
 * 
 * Handles loading character configuration from JSON files.
 * Location: src/config/characters/index.ts (or new service)
 */
export interface CharacterConfigService {
  /**
   * Load character configuration
   * 
   * @param characterId - Character identifier
   * @returns Promise<CharacterConfig> - Character configuration
   * 
   * Requirements:
   * - Loads from src/config/characters/{characterId}.json
   * - Caches in memory for session
   * - Throws error if config file not found
   */
  loadCharacterConfig(characterId: string): Promise<CharacterConfig>;

  /**
   * Get dialogue template
   * 
   * @param characterId - Character identifier
   * @param templateType - Template type: "greetings" | "responses" | "proactive"
   * @param key - Template key (e.g., "morning" for greetings, "sad" for responses)
   * @returns Promise<string[]> - Array of template strings
   * 
   * Requirements:
   * - Returns random template from array if multiple options
   * - Falls back to default if key not found
   */
  getDialogueTemplate(
    characterId: string,
    templateType: 'greetings' | 'responses' | 'proactive',
    key: string
  ): Promise<string[]>;

  /**
   * Get closeness stage threshold
   * 
   * @param characterId - Character identifier
   * @param stage - Relationship stage
   * @returns Promise<number> - Minimum closeness value for stage
   */
  getClosenessThreshold(characterId: string, stage: RelationshipStage): Promise<number>;
}

/**
 * Supporting Types
 */

export interface ConversationContext {
  mood: CharacterMood;
  closeness: number;
  timeOfDay: string; // "morning" | "afternoon" | "evening" | "night"
  relationshipStage: RelationshipStage;
}

export interface DialogueContext {
  userMessage?: string;
  previousMessages?: ConversationMessage[];
  timeOfDay: string;
  trigger?: 'user_initiated' | 'proactive' | 'activity_acknowledgment';
}
