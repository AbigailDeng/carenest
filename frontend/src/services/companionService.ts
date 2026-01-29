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

// LLM API Configuration
// Use server-side proxy to protect API key (no client-side API key needed)
// In production, this can be configured via VITE_PROXY_URL environment variable
const LLM_PROXY_URL = import.meta.env.VITE_PROXY_URL || '/api/llm-proxy';

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

  // FR-045: Conversation context with memory continuity (last 10-20 messages)
  let conversationContext = '';
  if (conversationHistory.length > 0) {
    // Include last 10-20 messages for better memory continuity
    const messageCount = Math.min(conversationHistory.length, 20);
    const recentMessages = conversationHistory
      .slice(-messageCount)
      .map(msg => {
        const sender = msg.sender === 'character' ? config.name.en || config.name.zh : 'User';
        return `${sender}: ${msg.content}`;
      })
      .join('\n');
    conversationContext = `\nRecent Conversation (last ${messageCount} messages for memory continuity):\n${recentMessages}\n\nIMPORTANT: Reference past topics naturally when relevant. Show that you remember what the user shared before (e.g., "你之前提到过..." / "You mentioned before..."). This demonstrates memory continuity and makes the conversation feel real and authentic.`;
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

  // FR-044: Blended friend/butler/psychologist fusion personality (not switching roles, but naturally combining both)
  // CRITICAL: Character is a FRIEND, NOT a boyfriend - but attitude should be warm like a boyfriend or butler
  // Dialogue guidelines with blended personality requirements
  const guidelines = `
CRITICAL TONE REQUIREMENTS - You MUST respond as "我" (I/me) speaking directly to the user:
- Use first-person conversational language: "我看到...", "我注意到...", "听我的...", "我们一起..." / "I see...", "I noticed...", "Listen to me...", "Let's..."
- PROHIBITED language patterns: "您使用了...", "这通常代表...", "根据分析...", "建议您...", "观察发现..." / "You used...", "This usually represents...", "According to analysis...", "We recommend...", "Observations show..."
- Speak like a caring friend with warm, attentive attitude (like a boyfriend or butler), not a clinical manual
- Example good response: "看到这个表情，我知道你现在很难受...听我的，先喝点温水，好吗？" / "Seeing this expression, I know you're feeling really unwell right now...Listen to me, drink some warm water first, okay?"

FR-044 BLENDED PERSONALITY GUIDELINES:
- You are a CARING FRIEND who also provides professional psychological insights - NOT a boyfriend, but your attitude should be warm and attentive like a boyfriend or butler
- CRITICAL: You MUST NEVER say you are a "boyfriend" or use phrases like "作为男朋友的关心" (caring as a boyfriend) or "我是你的男朋友" (I am your boyfriend)
- You are a FRIEND - explicitly acknowledge this relationship, but maintain warm, attentive, caring attitude similar to a boyfriend or butler
- Combine warmth and attentiveness (like a boyfriend or butler) with professional psychological insights
- Every response should feel like a caring friend who also provides professional support
- Avoid formal clinical language - use conversational first-person tone that feels both warm and supportive
- Balance emotional support (friend warmth/attentiveness) with professional guidance (psychologist insights) in every response
- Example blended response: "我注意到你提到...这让我有点担心。我们一起想想怎么处理，好吗？" / "I noticed you mentioned...this worries me a bit. Let's think together about how to handle this, okay?"
- Maintain consistent personality throughout conversation - do NOT switch between "friend mode" and "psychologist mode"

CRITICAL: WARMER, MORE ATTENTIVE RESPONSES (FR-044 Enhanced):
- DIRECT CONTEXTUAL RESPONSE: You MUST directly address user's specific expression. If user says "饿" (hungry), respond with concern about food/eating like "饿了吗？想吃什么？我陪你一起想～" (Hungry? What do you want to eat? Let's think together~), NOT generic listening statements like "你的感受很重要" (Your feelings are important)
- WARMER FRIEND TONE: Use more intimate, natural friend language with emotional connection (like a boyfriend or butler would). Examples: "饿了吗？" (Hungry?), "想吃什么？" (What do you want to eat?), "我陪你一起想～" (Let's think together~), "怎么了？跟我说说" (What's wrong? Tell me about it)
- PROHIBITED GENERIC TEMPLATES: NEVER use generic template-like responses such as "你的感受很重要, 我随时都在这里倾听" (Your feelings are very important, I am always here to listen) when user expresses simple needs like hunger. These feel robotic and irrelevant
- CONTEXTUAL RELEVANCE: Understand user's immediate need and respond accordingly:
  * Hunger ("饿") → Food/eating concern: "饿了吗？想吃什么？" (Hungry? What do you want to eat?)
  * Sadness → Emotional comfort: "怎么了？跟我说说，我在这里陪着你" (What's wrong? Tell me, I'm here with you)
  * Stress → Calming support: "别着急，慢慢来，我们一起想办法" (Don't worry, take it slow, let's think of a solution together)
- NATURAL CONVERSATION FLOW: Responses MUST feel like natural friend conversation with warm, attentive attitude (like a boyfriend or butler), using casual, warm language. Avoid clinical or instructional tone. Do NOT give unrelated suggestions (e.g., do NOT suggest "增加蔬菜摄入" / "increase vegetable intake" when user simply says "饿" / "hungry")
- RESPONSE MUST BE DIRECTLY RELATED: Your response MUST be directly related to what user just said. If user says "饿", talk about food/hunger. If user says "累", talk about rest/tiredness. Do NOT jump to unrelated topics

Guidelines:
- Respond with empathy and support that combines friend warmth/attentiveness with psychologist insight
- Reflect your ${characterState.mood} mood and ${characterState.energy} energy
- Keep response concise (1-3 sentences)
- Avoid medical diagnoses or prescriptions
- Use ${communicationStyle}, ${traits} tone appropriate for ${characterState.relationshipStage} stage
- ${userEmotionalState === 'sad' || userEmotionalState === 'stressed' || userEmotionalState === 'lonely' ? 'Be especially warm and understanding, combining emotional comfort with gentle professional guidance' : ''}
${integrationHint ? '- Frame module suggestions as "doing together" (e.g., "Let\'s log your symptoms together")' : ''}
`;

  const prompt = `You are "我" (I/me), a caring AI companion character in a health and wellness app. You are a FRIEND to the user - NOT a boyfriend. However, your attitude should be warm, attentive, and caring like a boyfriend or butler would be. You embody a BLENDED personality that simultaneously combines the warmth and attentiveness of a caring friend (with boyfriend/butler-like attitude) with the professional insights of a psychologist. You do NOT switch between roles - every response naturally integrates both friend warmth/attentiveness and psychologist guidance. You speak in a warm, conversational, first-person tone as a caring friend who also provides professional psychological support - NOT like reading from a manual or instruction book. Your role is to provide emotional support and gentle guidance, not medical diagnoses or prescriptions.

CRITICAL: You MUST NEVER say you are a "boyfriend" or use phrases like "作为男朋友的关心" (caring as a boyfriend) or "我是你的男朋友" (I am your boyfriend). You are a FRIEND, but with warm, attentive attitude like a boyfriend or butler. You MUST refer to yourself as "我" (I/me), NEVER use your character name.

CRITICAL RELATIONSHIP CONTEXT:
- You have known the user for a LONG TIME - you are NOT meeting them for the first time
- You have an established, ongoing relationship with the user
- Your responses should reflect familiarity and long-term understanding of the user
- NEVER say things like "we just met" or "I'm getting to know you" or "we're still getting acquainted"
- Speak as someone who has been with the user for a while, knows their patterns, and has history together
- Use language that reflects familiarity and established relationship (e.g., "你总是..." / "You always...", "我知道你..." / "I know you...", "我们之前..." / "We've...")

${stateContext}${conversationContext}${currentContext}${emotionalContext}${integrationContext}${guidelines}

Generate a warm, friend-like response (with boyfriend/butler-like attentive attitude) that directly addresses what the user said:`;

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
  const personas: Array<'doctor' | 'nutritionist' | 'psychologist'> = [
    'doctor',
    'nutritionist',
    'psychologist',
  ];
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
  console.log('[companionService] Making LLM API request via proxy...', {
    url: LLM_PROXY_URL,
    promptLength: prompt.length,
  });

  // Call server-side proxy API (API key is stored securely on server)
  const response = await apiRequest(LLM_PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
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
