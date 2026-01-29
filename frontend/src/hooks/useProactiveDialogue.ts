import { useState, useEffect, useCallback } from 'react';
import { CharacterState } from '../types';
import { getTimeOfDay } from '../services/companionService';

export type ProactiveTriggerType = 
  | 'morning_greeting' 
  | 'evening_greeting' 
  | 'inactivity' 
  | 'activity_acknowledgment' 
  | null;

/**
 * Check if proactive dialogue should be initiated
 */
function shouldInitiateProactiveDialogue(
  characterState: CharacterState | null,
  lastProactiveTime: Date | null
): boolean {
  if (!characterState) return false;

  const now = new Date();
  const timeOfDay = getTimeOfDay();
  
  // Check if enough time has passed since last proactive dialogue (at least 4 hours)
  if (lastProactiveTime) {
    const hoursSinceLastProactive = (now.getTime() - lastProactiveTime.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastProactive < 4) {
      return false;
    }
  }

  // Check time-based triggers
  if (timeOfDay === 'morning' || timeOfDay === 'evening') {
    return true;
  }

  // Check inactivity (more than 4 hours since last interaction)
  const lastInteractionTime = new Date(characterState.lastInteractionTime);
  const hoursSinceInteraction = (now.getTime() - lastInteractionTime.getTime()) / (1000 * 60 * 60);
  if (hoursSinceInteraction >= 4) {
    return true;
  }

  return false;
}

/**
 * Determine trigger type for proactive dialogue
 */
function determineTrigger(
  characterState: CharacterState | null,
  lastProactiveTime: Date | null
): ProactiveTriggerType {
  if (!characterState) return null;

  const now = new Date();
  const timeOfDay = getTimeOfDay();
  
  // Time-based triggers
  if (timeOfDay === 'morning') {
    return 'morning_greeting';
  }
  if (timeOfDay === 'evening') {
    return 'evening_greeting';
  }

  // Inactivity trigger
  const lastInteractionTime = new Date(characterState.lastInteractionTime);
  const hoursSinceInteraction = (now.getTime() - lastInteractionTime.getTime()) / (1000 * 60 * 60);
  if (hoursSinceInteraction >= 4) {
    return 'inactivity';
  }

  return null;
}

export function useProactiveDialogue(
  characterState: CharacterState | null,
  onInitiate: (triggerType: ProactiveTriggerType) => void
) {
  const [lastProactiveTime, setLastProactiveTime] = useState<Date | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  /**
   * Check if proactive dialogue should be initiated
   */
  const checkProactiveDialogue = useCallback(() => {
    if (!characterState) return;

    const shouldInitiate = shouldInitiateProactiveDialogue(characterState, lastProactiveTime);
    if (shouldInitiate && !hasChecked) {
      const triggerType = determineTrigger(characterState, lastProactiveTime);
      if (triggerType) {
        onInitiate(triggerType);
        setLastProactiveTime(new Date());
        setHasChecked(true);
      }
    }
  }, [characterState, lastProactiveTime, hasChecked, onInitiate]);

  // Check on mount
  useEffect(() => {
    if (!hasChecked) {
      checkProactiveDialogue();
    }
  }, [checkProactiveDialogue, hasChecked]);

  // Check on visibility change (when user returns to app)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && characterState) {
        // Reset check flag to allow re-checking after some time
        const now = new Date();
        if (!lastProactiveTime || (now.getTime() - lastProactiveTime.getTime()) / (1000 * 60 * 60) >= 4) {
          setHasChecked(false);
          checkProactiveDialogue();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkProactiveDialogue, characterState, lastProactiveTime]);

  return {
    shouldInitiate: shouldInitiateProactiveDialogue(characterState, lastProactiveTime),
    triggerType: determineTrigger(characterState, lastProactiveTime),
  };
}

// Export helper functions for use in other modules
export { shouldInitiateProactiveDialogue, determineTrigger };
