import { CharacterConfig } from '../../types';
import baiqiConfig from './baiqi.json';

// Character configuration cache
const characterConfigCache: Map<string, CharacterConfig> = new Map();

/**
 * Load character configuration by ID
 * Caches loaded configs to avoid repeated file reads
 */
export function getCharacterConfig(characterId: string): CharacterConfig | null {
  // Check cache first
  if (characterConfigCache.has(characterId)) {
    return characterConfigCache.get(characterId)!;
  }

  // Load from config files
  let config: CharacterConfig | null = null;
  
  switch (characterId) {
    case 'baiqi':
      config = baiqiConfig as CharacterConfig;
      break;
    default:
      console.warn(`Character config not found for ID: ${characterId}`);
      return null;
  }

  // Validate config structure
  if (!validateCharacterConfig(config)) {
    console.error(`Invalid character config for ID: ${characterId}`);
    return null;
  }

  // Cache and return
  characterConfigCache.set(characterId, config);
  return config;
}

/**
 * Validate character configuration structure
 */
function validateCharacterConfig(config: any): config is CharacterConfig {
  if (!config || typeof config !== 'object') {
    return false;
  }

  // Required fields
  if (!config.id || typeof config.id !== 'string') {
    return false;
  }
  if (!config.name || typeof config.name !== 'object') {
    return false;
  }
  if (!config.avatarUrl || typeof config.avatarUrl !== 'string') {
    return false;
  }
  if (!config.illustrationUrls || typeof config.illustrationUrls !== 'object') {
    return false;
  }
  if (!config.backgroundUrls || typeof config.backgroundUrls !== 'object') {
    return false;
  }
  if (!config.dialogueTemplates || typeof config.dialogueTemplates !== 'object') {
    return false;
  }
  if (!config.stateThresholds || typeof config.stateThresholds !== 'object') {
    return false;
  }
  if (!config.personality || typeof config.personality !== 'object') {
    return false;
  }

  // Validate illustrationUrls has all required mood variants
  const requiredMoods = ['default', 'happy', 'calm', 'concerned', 'energetic', 'tired'];
  for (const mood of requiredMoods) {
    if (!config.illustrationUrls[mood] || typeof config.illustrationUrls[mood] !== 'string') {
      return false;
    }
  }

  // Validate backgroundUrls has all required time-of-day variants
  const requiredTimes = ['morning', 'afternoon', 'evening', 'night'];
  for (const time of requiredTimes) {
    if (!config.backgroundUrls[time] || typeof config.backgroundUrls[time] !== 'string') {
      return false;
    }
  }

  return true;
}

/**
 * Clear character configuration cache
 * Useful for hot-reloading during development
 */
export function clearCharacterConfigCache(): void {
  characterConfigCache.clear();
}

/**
 * Get all available character IDs
 */
export function getAvailableCharacterIds(): string[] {
  return ['baiqi'];
}
