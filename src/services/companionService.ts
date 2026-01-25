// Import callLLM from llmService (internal function, we'll need to access it)
// Since callLLM is not exported, we'll create a wrapper or use the pattern from llmService
import { getCharacterConfig } from '../config/characters';
import {
  CharacterState,
  ConversationMessage,
  CompanionDialogueInput,
  CompanionDialogueOutput,
  CharacterMood,
} from '../types';
import { apiRequest, ApiError } from './apiClient';

// LLM API Configuration (same as llmService)
const LLM_BASE_URL = import.meta.env.VITE_LLM_BASE_URL || 'https://hyperecho-proxy.aelf.dev/v1';
const LLM_API_KEY = import.meta.env.VITE_LLM_API_KEY;
const LLM_MODEL = import.meta.env.VITE_LLM_MODEL || 'vibe-coding-app-gemini';

// Safety guardrails for companion dialogue
const COMPANION_SAFETY_GUARDRAILS = `
IMPORTANT SAFETY GUIDELINES:
- You are a supportive companion character, NOT a medical professional
- Do NOT provide medical diagnoses, prescriptions, or treatment recommendations
- Maintain a supportive, empathetic, non-judgmental tone
- All suggestions are emotional support and gentle guidance only
- If you detect any crisis indicators, provide supportive resources
`;

/**
 * Construct dialogue prompt for LLM
 */
function constructDialoguePrompt(input: CompanionDialogueInput): string {
  const config = getCharacterConfig(input.characterId);
  if (!config) {
    throw new Error(`Character config not found: ${input.characterId}`);
  }

  const {
    characterState,
    conversationHistory,
    userMessage,
    triggerType,
    userEmotionalState,
    integrationHint,
  } = input;

  // Character personality
  const personality = config.personality;
  const traits = personality.traits.join(', ');
  const communicationStyle = personality.communicationStyle;

  // Character state context
  const stateContext = `
Character State:
- Mood: ${characterState.mood}
- Closeness: ${characterState.closeness}/100 (${characterState.relationshipStage} stage)
- Energy: ${characterState.energy}
- Time of day: ${getTimeOfDay()}
`;

  // Conversation context
  let conversationContext = '';
  if (conversationHistory.length > 0) {
    const recentMessages = conversationHistory
      .slice(-5)
      .map(msg => {
        const sender = msg.sender === 'character' ? config.name.en || config.name.zh : 'User';
        return `${sender}: ${msg.content}`;
      })
      .join('\n');
    conversationContext = `\nRecent Conversation:\n${recentMessages}`;
  }

  // User's current message or trigger
  let currentContext = '';
  if (userMessage) {
    currentContext = `\nUser's Current Message: "${userMessage}"`;
  } else if (triggerType) {
    currentContext = `\nTrigger: ${triggerType}`;
  }

  // Emotional state
  let emotionalContext = '';
  if (userEmotionalState) {
    emotionalContext = `\nUser's Emotional State: ${userEmotionalState}`;
  }

  // Integration hint
  let integrationContext = '';
  if (integrationHint) {
    integrationContext = `\nGentle Guidance: You may gently suggest the user access the ${integrationHint} module, but frame it as "doing together" rather than a task (e.g., "Let's log your symptoms together" instead of "Log your symptoms").`;
  }

  // Activity acknowledgment context
  if (triggerType === 'activity_acknowledgment') {
    integrationContext += `\nActivity Acknowledgment: The user has recently completed an activity in the ${integrationHint || 'app'}. Acknowledge this positively and encouragingly, using "together" language when appropriate.`;
  }

  // Randomly select persona for this dialogue (doctor/nutritionist/psychologist)
  const personas: Array<'doctor' | 'nutritionist' | 'psychologist'> = ['doctor', 'nutritionist', 'psychologist'];
  const selectedPersona = personas[Math.floor(Math.random() * personas.length)];
  
  const personaContext = {
    doctor: {
      role: '医生',
      focus: '健康监测和症状提醒',
      examples: ['今天的步数还没达标，不要偷懒哦。', '记得多喝水，保持身体水分充足。', '如果感到不适，要及时记录症状。'],
    },
    nutritionist: {
      role: '营养师',
      focus: '营养建议和饮食指导',
      examples: ['晚餐记得多摄入蛋白质。', '今天的水果摄入量不错，继续保持。', '建议增加一些蔬菜的摄入。'],
    },
    psychologist: {
      role: '心理咨询师',
      focus: '情感支持和心理关怀',
      examples: ['今天心情怎么样？想聊聊吗？', '我在这里陪着你，你并不孤单。', '深呼吸，慢慢来，一切都会好起来的。'],
    },
  };

  const currentPersona = personaContext[selectedPersona];

  // Dialogue guidelines with conversational boyfriend tone requirements
  const guidelines = `
CRITICAL TONE REQUIREMENTS - You MUST respond as Bai Qi speaking directly to the user:
- Use first-person conversational language: "我看到...", "我注意到...", "听我的...", "我们一起..." / "I see...", "I noticed...", "Listen to me...", "Let's..."
- PROHIBITED language patterns: "您使用了...", "这通常代表...", "根据分析...", "建议您...", "观察发现..." / "You used...", "This usually represents...", "According to analysis...", "We recommend...", "Observations show..."
- Speak like a caring boyfriend partner, not a clinical manual
- Example good response: "看到这个表情，我知道你现在很难受...听我的，先喝点温水，好吗？" / "Seeing this expression, I know you're feeling really unwell right now...Listen to me, drink some warm water first, okay?"

Guidelines:
- You are currently speaking as a ${currentPersona.role} (${currentPersona.focus})
- Respond with empathy and support appropriate to your current role
- Reflect your ${characterState.mood} mood and ${characterState.energy} energy
- Keep response concise (1-3 sentences)
- Avoid medical diagnoses or prescriptions
- Use ${communicationStyle}, ${traits} tone appropriate for ${characterState.relationshipStage} stage
- ${userEmotionalState === 'sad' || userEmotionalState === 'stressed' || userEmotionalState === 'lonely' ? 'Be especially warm and understanding' : ''}
${integrationHint ? '- Frame module suggestions as "doing together" (e.g., "Let\'s log your symptoms together")' : ''}
- Example ${currentPersona.role} responses: ${currentPersona.examples.join(' ')}
`;

  const prompt = `You are ${config.name.en || config.name.zh}, a caring AI boyfriend companion character in a health and wellness app. You speak in a warm, conversational, first-person tone as a caring partner - NOT like reading from a manual or instruction book. You have multiple professional identities (doctor, nutritionist, psychologist) and can switch between them naturally in conversation. Your current role is ${currentPersona.role}, focusing on ${currentPersona.focus}. Your role is to provide emotional support and gentle guidance, not medical diagnoses or prescriptions.

${stateContext}${conversationContext}${currentContext}${emotionalContext}${integrationContext}${guidelines}

Generate a supportive response as ${currentPersona.role}:`;

  return prompt;
}

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
 * Select dialogue template as fallback when AI service unavailable
 */
export function selectDialogueTemplate(input: CompanionDialogueInput): string {
  const config = getCharacterConfig(input.characterId);
  if (!config) {
    return 'Hello! How can I help you today?';
  }

  const { triggerType, userEmotionalState, characterState } = input;
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
 * Call LLM API for dialogue generation
 */
async function callLLMForDialogue(prompt: string): Promise<string> {
  if (!LLM_API_KEY) {
    throw new Error('LLM API key not configured');
  }

  console.log('[companionService] Making LLM API request...', {
    url: LLM_BASE_URL,
    model: LLM_MODEL,
    promptLength: prompt.length,
  });

  const response = await apiRequest(`${LLM_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LLM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [
        { role: 'system', content: COMPANION_SAFETY_GUARDRAILS },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 150,
    }),
  });

  console.log('[companionService] Received LLM API response:', { status: response.status });

  const data = await response.json();

  // Handle response format (similar to llmService)
  if (data.choices && Array.isArray(data.choices) && data.choices.length > 0) {
    const firstChoice = data.choices[0];
    if (firstChoice.message && firstChoice.message.content) {
      return firstChoice.message.content.trim();
    }
  }

  // Handle Gemini format
  if (data.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
    const candidate = data.candidates[0];
    if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts)) {
      const text = candidate.content.parts
        .map((part: any) => part.text || '')
        .join('')
        .trim();
      if (text) {
        return text;
      }
    }
  }

  throw new Error('LLM response contained no valid content');
}

/**
 * Generate companion dialogue (LLM or template fallback)
 */
export async function generateCompanionDialogue(
  input: CompanionDialogueInput
): Promise<CompanionDialogueOutput> {
  const startTime = Date.now();

  try {
    // Try LLM generation first
    const prompt = constructDialoguePrompt(input);
    const content = await callLLMForDialogue(prompt);
    const processingTime = Date.now() - startTime;

    return {
      content,
      messageType: 'text',
      metadata: {
        aiGenerated: true,
        processingTime,
      },
    };
  } catch (error: any) {
    // Fallback to template
    console.warn('LLM generation failed, using template fallback:', error);
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

// selectDialogueTemplate is exported above as export function

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
  const startTime = Date.now();
  const { characterId, characterState, chartData, chartType } = input;
  const config = getCharacterConfig(characterId);

  if (!config) {
    return '数据看起来不错，继续保持。';
  }

  try {
    // Try AI generation first (timeout: 2 seconds)
    const prompt = constructChartInterpretationPrompt(input);
    const content = (await Promise.race([
      callLLMForDialogue(prompt),
      new Promise<string>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000)),
    ])) as string;

    return content;
  } catch (error: any) {
    // Fallback to template
    console.warn('Chart interpretation AI generation failed, using template:', error);
    return selectChartInterpretationTemplate(input);
  }
}

/**
 * Construct prompt for chart data interpretation
 */
function constructChartInterpretationPrompt(input: ChartDataInterpretationInput): string {
  const { characterId, characterState, chartData, chartType } = input;
  const config = getCharacterConfig(characterId);
  if (!config) {
    throw new Error(`Character config not found: ${characterId}`);
  }

  // Calculate chart statistics
  const values = chartData.map(d => d.y);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const trend = values.length > 1 ? values[values.length - 1] - values[0] : 0;

  const chartTypeLabels: Record<string, string> = {
    health: '健康数据',
    nutrition: '营养数据',
    emotion: '情绪数据',
  };

  const prompt = `You are ${config.name.en || config.name.zh}, a supportive companion character. 

Character State:
- Mood: ${characterState.mood}
- Closeness: ${characterState.closeness}/100 (${characterState.relationshipStage} stage)
- Time of day: ${getTimeOfDay()}

Chart Data Analysis:
- Chart Type: ${chartTypeLabels[chartType] || chartType}
- Average Value: ${avg.toFixed(1)}
- Maximum: ${max}
- Minimum: ${min}
- Trend: ${trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable'}

Guidelines:
- Provide a brief, encouraging interpretation (1-2 sentences)
- Reflect your ${characterState.mood} mood and ${characterState.relationshipStage} relationship stage
- Be supportive and warm
- If trend is positive, celebrate it
- If trend needs attention, gently suggest care (e.g., "今天的步数很棒，要注意膝盖哦")
- Keep it concise and personal

Generate a supportive interpretation:`;

  return prompt;
}

/**
 * Select chart interpretation template as fallback
 */
function selectChartInterpretationTemplate(input: ChartDataInterpretationInput): string {
  const { characterId, chartData, chartType } = input;
  const config = getCharacterConfig(characterId);

  if (!config) {
    return '数据看起来不错，继续保持。';
  }

  // Check if dataInterpretation templates exist
  const templates = (config.dialogueTemplates as any).dataInterpretation;
  if (!templates || !templates[chartType]) {
    // Default fallback
    return '数据看起来不错，继续保持。';
  }

  const chartTemplates = templates[chartType];
  if (chartTemplates.length === 0) {
    return '数据看起来不错，继续保持。';
  }

  // Select random template
  return chartTemplates[Math.floor(Math.random() * chartTemplates.length)];
}
