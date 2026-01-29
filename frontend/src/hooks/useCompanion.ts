import { useCallback } from 'react';
import { useCharacterState } from './useCharacterState';
import { CharacterState } from '../types';
import {
  createInitialCharacterState,
  saveCharacterState,
} from '../services/storage/characterStateStorage';

export function useCompanion(characterId: string) {
  const characterState = useCharacterState(characterId);

  /**
   * Initialize character (create if doesn't exist)
   */
  const initializeCharacter = useCallback(async (): Promise<void> => {
    if (!characterState.state) {
      const initialState = createInitialCharacterState(characterId);
      await saveCharacterState(initialState);
      await characterState.reload();
    }
  }, [characterId, characterState.state, characterState.reload]);

  /**
   * Update character state (wrapper for convenience)
   */
  const updateState = async (updates: Partial<CharacterState>): Promise<void> => {
    if (!characterState.state) return;

    const updated: CharacterState = {
      ...characterState.state,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await saveCharacterState(updated);
    await characterState.reload();
  };

  return {
    characterState: characterState.state,
    loading: characterState.loading,
    error: characterState.error,
    initializeCharacter,
    updateState,
    updateMood: characterState.updateMood,
    incrementCloseness: characterState.incrementCloseness,
    updateEnergy: characterState.updateEnergy,
    updateEnergyByTimeOfDay: characterState.updateEnergyByTimeOfDay, // Already wrapped in useCallback in useCharacterState
    getRelationshipStage: characterState.getRelationshipStage,
  };
}
