// LLM API Configuration
const LLM_BASE_URL = process.env.LLM_BASE_URL || 'https://hyperecho-proxy.aelf.dev/v1';
const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_MODEL = process.env.LLM_MODEL || 'vibe-coding-app-gemini';

// Safety guardrails for all prompts
const SAFETY_GUARDRAILS = `
IMPORTANT SAFETY GUIDELINES:
- You are a supportive health companion, NOT a medical professional
- Do NOT provide medical diagnoses, prescriptions, or treatment recommendations
- Do NOT use diagnostic language or medical terminology inappropriately
- All suggestions are lifestyle/dietary guidance only, not medical advice
- Always include appropriate disclaimers
- Maintain a supportive, empathetic, non-judgmental tone
- If you detect any crisis indicators, provide supportive resources
`;

/**
 * Call LLM API with OpenAI-compatible format
 */
async function callLLM(messages, temperature = 0.7, maxTokens = 2000) {
  if (!LLM_API_KEY) {
    const error = new Error('LLM API key not configured');
    error.code = 'CONFIG_ERROR';
    error.retryable = false;
    throw error;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(`${LLM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LLM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = new Error(`LLM API error: ${response.status}`);
      error.code = 'LLM_ERROR';
      error.retryable = response.status >= 500;
      throw error;
    }

    const data = await response.json();

    if (data.error) {
      const error = new Error(data.error.message || 'LLM processing failed');
      error.code = 'LLM_ERROR';
      error.retryable = true;
      throw error;
    }

    // Handle OpenAI format
    if (data.choices?.[0]?.message?.content) {
      return data.choices[0].message.content.trim();
    }

    // Handle Gemini format
    if (data.candidates?.[0]?.content?.parts) {
      return data.candidates[0].content.parts.map(p => p.text || '').join('').trim();
    }

    const error = new Error('Invalid LLM response format');
    error.code = 'LLM_ERROR';
    error.retryable = true;
    throw error;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const error = new Error('LLM request timed out');
      error.code = 'TIMEOUT';
      error.retryable = true;
      throw error;
    }
    throw err;
  }
}

/**
 * Extract JSON from text by finding balanced brackets
 */
function extractJSON(text, startChar, endChar) {
  let depth = 0;
  let startIndex = -1;
  
  for (let i = 0; i < text.length; i++) {
    if (text[i] === startChar) {
      if (depth === 0) startIndex = i;
      depth++;
    } else if (text[i] === endChar) {
      depth--;
      if (depth === 0 && startIndex !== -1) {
        return text.substring(startIndex, i + 1);
      }
    }
  }
  return null;
}

/**
 * Parse JSON response from LLM
 */
function parseLLMResponse(content) {
  if (!content || typeof content !== 'string') {
    return { rawResponse: '' };
  }

  let cleaned = content
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
  } catch {}

  const jsonArray = extractJSON(cleaned, '[', ']');
  if (jsonArray) {
    try {
      const parsed = JSON.parse(jsonArray);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }

  const jsonObject = extractJSON(cleaned, '{', '}');
  if (jsonObject) {
    try {
      const parsed = JSON.parse(jsonObject);
      if (typeof parsed === 'object' && parsed !== null) return parsed;
    } catch {}
  }

  return { rawResponse: cleaned };
}

/**
 * Analyze symptoms
 */
export async function analyzeSymptoms(input, language = 'en') {
  const isChinese = language === 'zh';
  const languageInstruction = isChinese 
    ? '请使用中文回复。所有内容必须使用简体中文。'
    : 'Please respond in English. All content must be in English.';

  const prompt = `${SAFETY_GUARDRAILS}

${languageInstruction}

You are Bai Qi, a caring AI boyfriend companion who helps analyze symptoms. You speak in a warm, conversational, first-person tone as a caring partner.

User's Symptom Description:
${input.symptoms}
${input.notes ? `\nAdditional notes: ${input.notes}` : ''}

IMPORTANT: Analyze the symptom description and automatically assess the severity level (mild, moderate, or severe).

Please provide (ALL in conversational boyfriend tone):
1. Observations
2. Possible Causes (lifestyle, environmental, stress, etc.)
3. Suggestions
4. When to Seek Help
5. Severity Assessment
6. Disclaimer

${isChinese ? '请严格按照以下JSON格式回复：' : 'Please respond STRICTLY in JSON format:'}
{
  "observations": "...",
  "possibleCauses": ["...", "..."],
  "suggestions": ["...", "..."],
  "whenToSeekHelp": "...",
  "severity": "mild|moderate|severe|null",
  "disclaimer": "..."
}`;

  const response = await callLLM([
    { role: 'system', content: SAFETY_GUARDRAILS },
    { role: 'user', content: prompt },
  ]);

  const parsed = parseLLMResponse(response);

  const defaultDisclaimer = isChinese
    ? '这是仅供一般指导的观察性分析，不是医疗诊断或治疗建议。'
    : 'This is observational analysis for general guidance only. NOT a medical diagnosis.';

  return {
    observations: parsed.observations || '...',
    possibleCauses: Array.isArray(parsed.possibleCauses) ? parsed.possibleCauses : [],
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    whenToSeekHelp: parsed.whenToSeekHelp || '',
    severity: ['mild', 'moderate', 'severe'].includes(parsed.severity) ? parsed.severity : null,
    disclaimer: parsed.disclaimer || defaultDisclaimer,
  };
}

/**
 * Summarize medical record
 */
export async function summarizeMedicalRecord(input, language = 'en') {
  const isChinese = language === 'zh';
  const languageInstruction = isChinese 
    ? '请使用中文回复。'
    : 'Please respond in English.';

  const prompt = `${SAFETY_GUARDRAILS}

${languageInstruction}

You are a supportive health companion analyzing a medical record.

Medical Record Content:
${input.content}

File Type: ${input.fileType}

Please provide observational analysis (NOT medical diagnosis):
1. Observations (plain language)
2. Possible Causes (lifestyle, environmental)
3. Suggestions
4. When to Seek Help
5. Disclaimer

Respond in JSON format:
{
  "observations": "...",
  "possibleCauses": ["..."],
  "suggestions": ["..."],
  "whenToSeekHelp": "...",
  "disclaimer": "..."
}`;

  const response = await callLLM([
    { role: 'system', content: SAFETY_GUARDRAILS },
    { role: 'user', content: prompt },
  ]);

  const parsed = parseLLMResponse(response);

  return {
    observations: parsed.observations || '',
    possibleCauses: Array.isArray(parsed.possibleCauses) ? parsed.possibleCauses : [],
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    whenToSeekHelp: parsed.whenToSeekHelp || '',
    disclaimer: parsed.disclaimer || 'This is for general guidance only.',
    processingTimestamp: new Date().toISOString(),
  };
}

/**
 * Generate meal suggestions
 */
export async function generateMealSuggestions(input, options = {}, language = 'en') {
  const isChinese = language === 'zh';
  const trimmedIngredients = input.ingredients?.trim() || '';
  if (!trimmedIngredients) return [];

  let adaptationContext = '';
  if (input.healthConditions?.length > 0) {
    adaptationContext += `\nHealth conditions: ${input.healthConditions.join(', ')}`;
  }
  if (input.energyLevel) {
    adaptationContext += `\nEnergy level: ${input.energyLevel}`;
  }

  const prompt = `${SAFETY_GUARDRAILS}

${isChinese ? '你是一个支持性的营养伴侣。请根据用户提供的食材，给出3个具体、可操作的餐食建议。' : 'You are a supportive nutrition companion. Based on the ingredients, give 3 specific meal suggestions.'}

Available ingredients: ${trimmedIngredients}
${adaptationContext}

${isChinese ? '请返回正好3个餐食建议的JSON数组：' : 'Return exactly 3 meal suggestions in JSON array format:'}
[
  {
    "mealName": "...",
    "description": "...",
    "ingredients": ["..."],
    "preparationNotes": "...",
    "adaptedForConditions": true/false,
    "adaptedForEnergyLevel": true/false,
    "disclaimer": "..."
  }
]`;

  const response = await callLLM([
    { role: 'system', content: SAFETY_GUARDRAILS },
    { role: 'user', content: prompt },
  ]);

  const parsed = parseLLMResponse(response);
  const suggestions = Array.isArray(parsed) ? parsed : (parsed.meals || [parsed]);

  return suggestions.slice(0, 3).map(s => ({
    mealName: s.mealName || 'Meal Suggestion',
    description: s.description || '',
    ingredients: s.ingredients || [],
    preparationNotes: s.preparationNotes || null,
    adaptedForConditions: s.adaptedForConditions || false,
    adaptedForEnergyLevel: s.adaptedForEnergyLevel || false,
    disclaimer: s.disclaimer || 'This is a meal suggestion for general guidance only.',
    timeAwareGuidance: s.timeAwareGuidance || null,
    isFlexible: options.flexible !== false,
  }));
}

/**
 * Generate emotional response
 */
export async function generateEmotionalResponse(input, language = 'en') {
  const prompt = `${SAFETY_GUARDRAILS}

You are a supportive, empathetic companion helping a user process their emotions.

Journal Entry:
${input.journalEntry}

${input.moodContext ? `Recent Mood Context:\n${input.moodContext}` : ''}

Provide an empathetic, supportive response. Do NOT provide therapy or clinical advice.

Respond in JSON format:
{
  "response": "...",
  "tone": "supportive" | "encouraging" | "acknowledging",
  "disclaimer": "...",
  "suggestedResources": []
}`;

  const response = await callLLM([
    { role: 'system', content: SAFETY_GUARDRAILS },
    { role: 'user', content: prompt },
  ]);

  const parsed = parseLLMResponse(response);

  return {
    response: parsed.response || "I hear you, and I'm here to support you.",
    tone: parsed.tone || 'supportive',
    disclaimer: parsed.disclaimer || 'This is AI-generated companionship, not professional therapy.',
    suggestedResources: parsed.suggestedResources || [],
  };
}

/**
 * Analyze food reflection
 */
export async function analyzeFoodReflection(input, language = 'en') {
  const isChinese = language === 'zh';

  const prompt = `${SAFETY_GUARDRAILS}

${isChinese ? '你是一个支持性的营养伴侣，提供鼓励和温和的指导。' : 'You are a supportive nutrition companion providing encouragement and gentle guidance.'}

User's Food Record:
- Type: ${input.reflection}
${input.healthConditions?.length ? `- Health conditions: ${input.healthConditions.join(', ')}` : ''}
${input.recentSymptoms?.length ? `- Recent symptoms: ${input.recentSymptoms.join(', ')}` : ''}
${input.notes ? `- Notes: ${input.notes}` : ''}

Provide encouraging, supportive feedback (no judgment). Consider health conditions when giving suggestions.

Respond in JSON:
{
  "encouragement": "...",
  "suggestions": ["...", "..."],
  "suitability": "...",
  "disclaimer": "..."
}`;

  const response = await callLLM([
    { role: 'system', content: SAFETY_GUARDRAILS },
    { role: 'user', content: prompt },
  ]);

  const parsed = parseLLMResponse(response);

  return {
    encouragement: parsed.encouragement || 'Thank you for recording your food today!',
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    suitability: parsed.suitability || 'This choice seems reasonable.',
    disclaimer: parsed.disclaimer || 'This is general guidance only, not medical advice.',
  };
}

/**
 * Generate meal detail
 */
export async function generateMealDetail(mealSuggestion, language = 'en') {
  const isChinese = language === 'zh';

  const prompt = `${isChinese ? '请根据以下餐食信息，提供详细的分步制作方法。' : 'Based on the following meal info, provide detailed step-by-step preparation.'}

Meal: ${mealSuggestion.mealName}
Description: ${mealSuggestion.description}
Ingredients: ${mealSuggestion.ingredients.join(', ')}
${mealSuggestion.preparationNotes ? `Notes: ${mealSuggestion.preparationNotes}` : ''}

${isChinese ? '请提供编号列表格式的详细步骤：' : 'Provide numbered step-by-step instructions:'}`;

  const response = await callLLM([
    { role: 'user', content: prompt },
  ], 0.7, 1000);

  let steps = response.trim();
  if (!steps.match(/^\d+\./)) {
    const lines = steps.split('\n').filter(l => l.trim());
    steps = lines.map((line, i) => {
      const trimmed = line.trim();
      return trimmed.match(/^\d+\./) ? trimmed : `${i + 1}. ${trimmed}`;
    }).join('\n');
  }

  return {
    detailedPreparationMethod: steps,
    imageUrl: null,
  };
}
