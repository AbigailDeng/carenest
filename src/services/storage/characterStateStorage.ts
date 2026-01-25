import { getDB } from '../../db';
import { CharacterState, CharacterMood, RelationshipStage } from '../../types';

/**
 * Get character state by character ID
 */
export async function getCharacterState(characterId: string): Promise<CharacterState | null> {
  const db = await getDB();
  const state = await db.get('characterState', characterId);
  return state || null;
}

/**
 * Save character state (creates new or updates existing)
 */
export async function saveCharacterState(state: CharacterState): Promise<void> {
  const db = await getDB();
  const now = new Date().toISOString();
  
  const stateToSave: CharacterState = {
    ...state,
    updatedAt: now,
    createdAt: state.createdAt || now,
  };
  
  await db.put('characterState', stateToSave);
}

/**
 * Update character state fields
 */
export async function updateCharacterState(
  characterId: string,
  updates: Partial<Omit<CharacterState, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const db = await getDB();
  const existing = await db.get('characterState', characterId);
  
  if (!existing) {
    throw new Error(`Character state not found for ID: ${characterId}`);
  }
  
  const updated: CharacterState = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  await db.put('characterState', updated);
}

/**
 * Reset character state to initial values
 * Optionally preserves closeness level
 */
export async function resetCharacterState(
  characterId: string,
  preserveCloseness: boolean = false
): Promise<void> {
  const db = await getDB();
  const existing = await db.get('characterState', characterId);
  
  if (!existing) {
    return; // Nothing to reset
  }
  
  const now = new Date().toISOString();
  const resetState: CharacterState = {
    id: characterId,
    closeness: preserveCloseness ? existing.closeness : 0,
    mood: 'calm',
    energy: 'medium',
    lastInteractionTime: now,
    totalInteractions: 0,
    relationshipStage: preserveCloseness ? existing.relationshipStage : 'stranger',
    createdAt: existing.createdAt,
    updatedAt: now,
  };
  
  await db.put('characterState', resetState);
}

/**
 * Derive relationship stage from closeness level
 */
export function deriveRelationshipStage(closeness: number): RelationshipStage {
  if (closeness >= 81) return 'intimate';
  if (closeness >= 61) return 'close_friend';
  if (closeness >= 41) return 'friend';
  if (closeness >= 21) return 'acquaintance';
  return 'stranger';
}

/**
 * Create initial character state
 */
export function createInitialCharacterState(characterId: string): CharacterState {
  const now = new Date().toISOString();
  return {
    id: characterId,
    closeness: 0,
    mood: 'calm',
    energy: 'medium',
    lastInteractionTime: now,
    totalInteractions: 0,
    relationshipStage: 'stranger',
    createdAt: now,
    updatedAt: now,
  };
}
