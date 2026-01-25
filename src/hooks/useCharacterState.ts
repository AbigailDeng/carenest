import { useState, useEffect, useCallback } from 'react';
import {
  getCharacterState,
  saveCharacterState,
  updateCharacterState,
  deriveRelationshipStage,
  createInitialCharacterState,
} from '../services/storage/characterStateStorage';
import { CharacterState, CharacterMood } from '../types';

export function useCharacterState(characterId: string) {
  const [state, setState] = useState<CharacterState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load character state from storage
   */
  const loadState = useCallback(async () => {
    try {
      setLoading(true);
      let characterState = await getCharacterState(characterId);

      // Create initial state if doesn't exist
      if (!characterState) {
        characterState = createInitialCharacterState(characterId);
        await saveCharacterState(characterState);
      }

      setState(characterState);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load character state');
    } finally {
      setLoading(false);
    }
  }, [characterId]);

  useEffect(() => {
    loadState();
  }, [loadState]);

  /**
   * Get current state (synchronous)
   */
  const getState = useCallback((): CharacterState | null => {
    return state;
  }, [state]);

  /**
   * Update character mood
   */
  const updateMood = useCallback(
    async (mood: CharacterMood) => {
      if (!state) return;

      try {
        await updateCharacterState(characterId, { mood });
        await loadState(); // Reload to get updated state
      } catch (err: any) {
        setError(err.message || 'Failed to update mood');
      }
    },
    [characterId, state, loadState]
  );

  /**
   * Increment closeness level (capped at 100)
   * T068: Handle edge case: character state reaches maximum closeness → system continues interaction
   */
  const incrementCloseness = useCallback(
    async (amount: number = 1) => {
      if (!state) return;

      // T068: Even at max closeness (100), continue incrementing interactions counter
      // This allows the system to continue interaction even at maximum closeness
      const newCloseness = Math.min(100, state.closeness + amount);
      const newRelationshipStage = deriveRelationshipStage(newCloseness);

      try {
        await updateCharacterState(characterId, {
          closeness: newCloseness,
          relationshipStage: newRelationshipStage,
          totalInteractions: state.totalInteractions + 1,
          lastInteractionTime: new Date().toISOString(),
        });
        await loadState(); // Reload to get updated state
      } catch (err: any) {
        setError(err.message || 'Failed to increment closeness');
      }
    },
    [characterId, state, loadState]
  );

  /**
   * Update energy level
   */
  const updateEnergy = useCallback(
    async (energy: 'low' | 'medium' | 'high') => {
      if (!state) return;

      try {
        await updateCharacterState(characterId, { energy });
        await loadState(); // Reload to get updated state
      } catch (err: any) {
        setError(err.message || 'Failed to update energy');
      }
    },
    [characterId, state, loadState]
  );

  /**
   * Update energy based on time-of-day
   * Morning: high, Afternoon: medium, Evening: low
   */
  const updateEnergyByTimeOfDay = useCallback(async () => {
    if (!state) return;

    const hour = new Date().getHours();
    let energy: 'low' | 'medium' | 'high' = 'medium';

    if (hour >= 6 && hour < 12) {
      energy = 'high'; // Morning
    } else if (hour >= 12 && hour < 18) {
      energy = 'medium'; // Afternoon
    } else {
      energy = 'low'; // Evening/Night
    }

    await updateEnergy(energy);
  }, [state, updateEnergy]);

  /**
   * Derive relationship stage from closeness
   */
  const getRelationshipStage = useCallback((): string => {
    if (!state) return 'stranger';
    return deriveRelationshipStage(state.closeness);
  }, [state]);

  return {
    state,
    loading,
    error,
    getState,
    updateMood,
    incrementCloseness,
    updateEnergy,
    updateEnergyByTimeOfDay,
    getRelationshipStage,
    reload: loadState,
  };
}
