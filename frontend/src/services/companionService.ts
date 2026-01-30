/**
 * Companion Service
 * Handles companion character dialogue generation via backend API
 */

import { getCharacterConfig } from '../config/characters';
import {
  CharacterState,
  CompanionDialogueInput,
  CompanionDialogueOutput,
} from '../types';
import { backendPost } from './backendApi';
import { getEntity } from './storage/indexedDB';

/**
 * Get time of day (morning, afternoon, evening, night)
 */
export function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

/**
 * Get user language preference
 */
async function getUserLanguage(): Promise<'zh' | 'en'> {
  try {
    const preferences = await getEntity('userPreferences', 'singleton') as any;
    return preferences?.language === 'zh' ? 'zh' : 'en';
  } catch {
    return 'en';
  }
}

/**
 * Select dialogue template as fallback when AI service unavailable
 */
export function selectDialogueTemplate(input: CompanionDialogueInput): string {
  const config = getCharacterConfig(input.characterId);
  if (!config) {
    return 'Hello! How can I help you today?';
  }

  const { triggerType, userEmotionalState } = input;
  const templates = config.dialogueTemplates;

  // Randomly select persona for variety (doctor/nutritionist/psychologist)
  const personas: Array<'doctor' | 'nutritionist' | 'psychologist'> = ['doctor', 'nutritionist', 'psychologist'];
  const selectedPersona = personas[Math.floor(Math.random() * personas.length)];

  // Check if persona dialogue templates exist
  if ((templates as any).personaDialogue?.[selectedPersona]) {
    const personaTemplates = (templates as any).personaDialogue[selectedPersona];
    if (personaTemplates && personaTemplates.length > 0) {
      return personaTemplates[Math.floor(Math.random() * personaTemplates.length)];
    }
  }

  // Fallback to standard template selection
  let category: 'greetings' | 'responses' | 'proactive' = 'greetings';
  let key: string = 'morning';

  if (triggerType === 'morning_greeting' || triggerType === 'evening_greeting') {
    category = 'greetings';
    key = triggerType === 'morning_greeting' ? 'morning' : 'evening';
  } else if (triggerType === 'inactivity' || triggerType === 'activity_acknowledgment') {
    category = 'proactive';
    key = triggerType;
  } else if (userEmotionalState) {
    category = 'responses';
    key = userEmotionalState;
  } else {
    // Default to time-based greeting
    category = 'greetings';
    key = getTimeOfDay();
  }

  // Get templates for category and key
  const templateArray = templates[category]?.[key];
  if (!templateArray || templateArray.length === 0) {
    // Fallback to default greeting
    const defaultGreetings =
      templates.greetings?.[getTimeOfDay()] || templates.greetings?.morning || [];
    if (defaultGreetings.length > 0) {
      return defaultGreetings[Math.floor(Math.random() * defaultGreetings.length)];
    }
    return 'Hello! How can I help you today?';
  }

  // Randomly select from available templates
  const selectedTemplate = templateArray[Math.floor(Math.random() * templateArray.length)];
  return selectedTemplate;
}

/**
 * Build conversation history for backend
 */
function buildConversationHistory(
  input: CompanionDialogueInput
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const history: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  for (const msg of input.conversationHistory.slice(-10)) {
    history.push({
      role: msg.sender === 'character' ? 'assistant' : 'user',
      content: msg.content,
    });
  }

  return history;
}

/**
 * Generate companion dialogue (LLM via backend or template fallback)
 */
export async function generateCompanionDialogue(
  input: CompanionDialogueInput
): Promise<CompanionDialogueOutput> {
  const startTime = Date.now();

  try {
    const language = await getUserLanguage();
    const config = getCharacterConfig(input.characterId);

    // Build user message from input
    let userMessage = input.userMessage || '';
    if (!userMessage && input.triggerType) {
      // For proactive triggers, create a context message
      userMessage = `[Trigger: ${input.triggerType}]`;
      if (input.userEmotionalState) {
        userMessage += ` [Emotional state: ${input.userEmotionalState}]`;
      }
      if (input.integrationHint) {
        userMessage += ` [Suggest: ${input.integrationHint}]`;
      }
    }

    // Call backend API
    const response = await backendPost<{ response: string }>('/api/companion-dialogue', {
      userMessage,
      characterState: {
        mood: input.characterState.mood,
        energy: input.characterState.energy,
        closeness: input.characterState.closeness,
        relationshipStage: input.characterState.relationshipStage,
      },
      conversationHistory: buildConversationHistory(input),
      language,
      characterName: config?.name.en || config?.name.zh || 'Companion',
      triggerType: input.triggerType,
      userEmotionalState: input.userEmotionalState,
      integrationHint: input.integrationHint,
      timeOfDay: getTimeOfDay(),
    });

    const processingTime = Date.now() - startTime;

    return {
      content: response.response,
      messageType: 'text',
      metadata: {
        aiGenerated: true,
        processingTime,
      },
    };
  } catch (error: any) {
    // Fallback to template
    console.warn('Backend dialogue generation failed, using template fallback:', error);
    const templateContent = selectDialogueTemplate(input);
    const processingTime = Date.now() - startTime;

    return {
      content: templateContent,
      messageType: 'text',
      metadata: {
        aiGenerated: false,
        templateId: 'fallback',
        processingTime,
      },
    };
  }
}

/**
 * Generate chart data interpretation (AI-first with template fallback) - FR-031H
 */
export interface ChartDataInterpretationInput {
  characterId: string;
  characterState: CharacterState;
  chartData: Array<{ x: number | string; y: number }>;
  chartType: 'health' | 'nutrition' | 'emotion';
}

export async function generateChartDataInterpretation(
  input: ChartDataInterpretationInput
): Promise<string> {
  const { characterId, characterState, chartData, chartType } = input;
  const config = getCharacterConfig(characterId);

  if (!config) {
    return '数据看起来不错，继续保持。';
  }

  try {
    const language = await getUserLanguage();

    // Calculate chart statistics
    const values = chartData.map(d => d.y);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const trend = values.length > 1 ? values[values.length - 1] - values[0] : 0;

    // Call backend with chart context (with 2s timeout)
    const response = await Promise.race([
      backendPost<{ response: string }>('/api/companion-dialogue', {
        userMessage: `[Chart interpretation request] Type: ${chartType}, Avg: ${avg.toFixed(1)}, Max: ${max}, Min: ${min}, Trend: ${trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable'}`,
        characterState: {
          mood: characterState.mood,
          energy: characterState.energy,
          closeness: characterState.closeness,
          relationshipStage: characterState.relationshipStage,
        },
        conversationHistory: [],
        language,
        characterName: config?.name.en || config?.name.zh || 'Companion',
        timeOfDay: getTimeOfDay(),
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000)),
    ]);

    return response.response;
  } catch (error: any) {
    // Fallback to template
    console.warn('Chart interpretation failed, using template:', error);
    return selectChartInterpretationTemplate(input);
  }
}

/**
 * Select chart interpretation template as fallback
 */
function selectChartInterpretationTemplate(input: ChartDataInterpretationInput): string {
  const { characterId, chartType } = input;
  const config = getCharacterConfig(characterId);

  if (!config) {
    return '数据看起来不错，继续保持。';
  }

  // Check if dataInterpretation templates exist
  const templates = (config.dialogueTemplates as any).dataInterpretation;
  if (!templates || !templates[chartType]) {
    return '数据看起来不错，继续保持。';
  }

  const chartTemplates = templates[chartType];
  if (chartTemplates.length === 0) {
    return '数据看起来不错，继续保持。';
  }

  // Select random template
  return chartTemplates[Math.floor(Math.random() * chartTemplates.length)];
}
