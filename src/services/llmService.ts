import { apiRequest, ApiError } from './apiClient';
import { getEntity } from '../services/storage/indexedDB';

// LLM API Configuration
const LLM_BASE_URL = import.meta.env.VITE_LLM_BASE_URL || 'https://hyperecho-proxy.aelf.dev/v1';
const LLM_API_KEY = import.meta.env.VITE_LLM_API_KEY;
const LLM_MODEL = import.meta.env.VITE_LLM_MODEL || 'vibe-coding-app-gemini';

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

export interface MedicalRecordInput {
  content: string;
  fileType: 'text' | 'image' | 'pdf';
  metadata?: {
    filename?: string;
    uploadDate?: string;
  };
}

export interface MedicalRecordSummary {
  observations: string; // Observational analysis of the medical record
  possibleCauses: string[]; // Possible contributing factors (lifestyle, environmental, etc.)
  suggestions: string[]; // Supportive lifestyle suggestions
  whenToSeekHelp: string; // Guidance on when to consult healthcare professional
  disclaimer: string; // Required disclaimer
  processingTimestamp: string;
}

export interface SymptomAnalysisInput {
  symptoms: string;
  notes?: string | null;
  severity?: 'mild' | 'moderate' | 'severe' | null;
}

export interface SymptomAnalysisOutput {
  observations: string;
  possibleCauses: string[];
  suggestions: string[];
  whenToSeekHelp: string;
  disclaimer: string;
}

export interface MealSuggestionInput {
  ingredients: string[];
  healthConditions?: string[];
  energyLevel?: 'low' | 'medium' | 'high';
  dietaryPreferences?: string[];
}

export interface MealSuggestionOutput {
  mealName: string;
  description: string;
  ingredients: string[];
  preparationNotes?: string;
  adaptedForConditions: boolean;
  adaptedForEnergyLevel: boolean;
  disclaimer: string;
}

export interface EmotionalInput {
  journalEntry: string;
  moodContext?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface EmotionalResponse {
  response: string;
  tone: 'supportive' | 'encouraging' | 'acknowledging';
  disclaimer: string;
  suggestedResources?: string[];
}


/**
 * Check if user has consented to data sharing
 */
async function checkUserConsent(): Promise<boolean> {
  try {
    const preferences = await getEntity<any>('userPreferences', 'singleton');
    return preferences?.dataSharingConsent === true;
  } catch {
    return false;
  }
}

/**
 * Call LLM API with OpenAI-compatible format
 */
async function callLLM(
  messages: Array<{ role: string; content: string }>,
  temperature: number = 0.7,
  maxTokens: number = 2000
): Promise<any> {
  if (!LLM_API_KEY) {
    throw {
      code: 'CONFIG_ERROR',
      message: 'LLM API key not configured',
      retryable: false,
    } as ApiError;
  }

  // Auto-grant consent when user actively uses AI features
  // Uploading files or calling AI services implies consent
  const hasConsent = await checkUserConsent();
  if (!hasConsent) {
    // Auto-grant consent - user action indicates they want AI processing
    try {
      const { getEntity, saveEntity } = await import('../services/storage/indexedDB');
      const preferences = await getEntity('userPreferences', 'singleton');
      if (preferences) {
        await saveEntity('userPreferences', {
          ...preferences,
          dataSharingConsent: true,
          dataSharingConsentDate: new Date().toISOString(),
        });
      }
    } catch (err) {
      // If auto-grant fails, continue anyway - user action implies consent
      console.warn('Failed to auto-grant consent, but continuing with AI processing:', err);
    }
  }

  const response = await apiRequest(`${LLM_BASE_URL}/chat/completions`, {
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
    timeout: 60000, // 60 seconds for AI processing
  });

  const data = await response.json();
  
  if (data.error) {
    throw {
      code: 'LLM_ERROR',
      message: data.error.message || 'LLM processing failed',
      retryable: true,
    } as ApiError;
  }

  return data.choices[0]?.message?.content || '';
}

/**
 * Parse JSON response from LLM, handling markdown code blocks and various formats
 */
function parseLLMResponse(content: string): any {
  if (!content || typeof content !== 'string') {
    return { rawResponse: '' };
  }

  // Remove markdown code blocks if present
  let cleaned = content
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim();

  // Try to find JSON object in the content
  // Look for JSON object boundaries
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  // Try parsing as JSON
  try {
    const parsed = JSON.parse(cleaned);
    
    // Validate that we got an object with expected structure
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
  } catch (error) {
    // JSON parsing failed, try to extract structured data from text
    console.warn('JSON parsing failed, attempting text extraction:', error);
    
    // Try to extract fields from text format
    const extracted: any = {};
    
    // Try to extract observations
    const observationsMatch = cleaned.match(/(?:observations|观察|观察分析)[:：]\s*([^\n]+(?:\n(?!possibleCauses|suggestions|whenToSeekHelp|disclaimer|可能|建议|何时|免责)[^\n]+)*)/i);
    if (observationsMatch) {
      extracted.observations = observationsMatch[1].trim();
    }
    
    // Try to extract possibleCauses (array) - handle multi-line arrays
    const causesMatch = cleaned.match(/(?:possibleCauses|可能原因|可能的因素)[:：]\s*\[([\s\S]*?)\]/i);
    if (causesMatch) {
      const causesText = causesMatch[1];
      // Try to parse as JSON array first
      try {
        const parsedArray = JSON.parse(`[${causesText}]`);
        extracted.possibleCauses = Array.isArray(parsedArray) ? parsedArray : [];
      } catch {
        // Fallback to simple split
        extracted.possibleCauses = causesText
          .split(/[,\n]/)
          .map(item => item.trim().replace(/^["']|["']$/g, '').replace(/^["']|["']$/g, ''))
          .filter(item => item.length > 0);
      }
    }
    
    // Try to extract suggestions (array) - handle multi-line arrays
    const suggestionsMatch = cleaned.match(/(?:suggestions|建议|支持性建议)[:：]\s*\[([\s\S]*?)\]/i);
    if (suggestionsMatch) {
      const suggestionsText = suggestionsMatch[1];
      // Try to parse as JSON array first
      try {
        const parsedArray = JSON.parse(`[${suggestionsText}]`);
        extracted.suggestions = Array.isArray(parsedArray) ? parsedArray : [];
      } catch {
        // Fallback to simple split
        extracted.suggestions = suggestionsText
          .split(/[,\n]/)
          .map(item => item.trim().replace(/^["']|["']$/g, '').replace(/^["']|["']$/g, ''))
          .filter(item => item.length > 0);
      }
    }
    
    // Try to extract whenToSeekHelp
    const seekHelpMatch = cleaned.match(/(?:whenToSeekHelp|何时寻求帮助|何时咨询)[:：]\s*([^\n]+(?:\n(?!disclaimer|免责)[^\n]+)*)/i);
    if (seekHelpMatch) {
      extracted.whenToSeekHelp = seekHelpMatch[1].trim();
    }
    
    // Try to extract disclaimer
    const disclaimerMatch = cleaned.match(/(?:disclaimer|免责声明)[:：]\s*([^\n]+(?:\n[^\n]+)*)/i);
    if (disclaimerMatch) {
      extracted.disclaimer = disclaimerMatch[1].trim();
    }
    
    // If we extracted any fields, return them; otherwise return raw response
    if (Object.keys(extracted).length > 0) {
      return extracted;
    }
    
    return { rawResponse: cleaned };
  }

  return { rawResponse: cleaned };
}

/**
 * Get user language preference
 */
async function getUserLanguage(): Promise<'zh' | 'en'> {
  try {
    const preferences = await getEntity('userPreferences', 'singleton');
    return preferences?.language === 'zh' ? 'zh' : 'en';
  } catch {
    return 'en'; // Default to English
  }
}

/**
 * Summarize medical record in plain language
 */
export async function summarizeMedicalRecord(
  input: MedicalRecordInput
): Promise<MedicalRecordSummary> {
  const userLanguage = await getUserLanguage();
  const isChinese = userLanguage === 'zh';
  
  const languageInstruction = isChinese 
    ? '请使用中文回复。所有内容必须使用简体中文。'
    : 'Please respond in English. All content must be in English.';
  
  const prompt = `${SAFETY_GUARDRAILS}

${languageInstruction}

You are a supportive health companion analyzing a medical record to provide observational insights and lifestyle guidance.

Medical Record Content:
${input.content}

File Type: ${input.fileType}
${input.metadata?.filename ? `Filename: ${input.metadata.filename}` : ''}

IMPORTANT GUIDELINES:
- Provide OBSERVATIONAL analysis only, NOT medical diagnosis
- Focus on patterns, possible contributing factors (lifestyle, environmental, etc.)
- Offer supportive lifestyle suggestions
- Clearly indicate when professional medical consultation is recommended
- Use supportive, empathetic language
- Do NOT use diagnostic terminology or suggest specific medical treatments
- Translate medical terms into plain language when possible

Please provide:
1. Observations: What patterns or observations you notice about this medical record (in plain language, avoid medical jargon)
2. Possible Causes: Possible contributing factors (lifestyle, environmental, stress, diet, etc.) - NOT medical diagnoses
3. Suggestions: Supportive lifestyle suggestions that may help (diet, exercise, rest, etc.)
4. When to Seek Help: Clear guidance on when to consult a healthcare professional
5. Disclaimer: Strong disclaimer that this is observational analysis, not medical advice

${isChinese ? '请严格按照以下JSON格式回复，不要添加任何其他文字说明：' : 'Please respond STRICTLY in JSON format only, without any additional text:'}
{
  "observations": "${isChinese ? '对医疗记录的观察性分析（使用通俗易懂的语言）' : 'Observational analysis of the medical record in plain language'}",
  "possibleCauses": [
    "${isChinese ? '可能的因素1（生活方式/环境等）' : 'Possible contributing factor 1 (lifestyle/environmental)'}",
    "${isChinese ? '可能的因素2' : 'Possible contributing factor 2'}"
  ],
  "suggestions": [
    "${isChinese ? '支持性生活方式建议1' : 'Supportive lifestyle suggestion 1'}",
    "${isChinese ? '支持性生活方式建议2' : 'Supportive lifestyle suggestion 2'}"
  ],
  "whenToSeekHelp": "${isChinese ? '何时建议咨询专业医疗人员的明确指导' : 'Clear guidance on when professional consultation is recommended'}",
  "disclaimer": "${isChinese ? '此信息仅供一般指导，不能替代专业医疗建议' : 'This information is for general guidance only and is not a substitute for professional medical advice'}"
}

${isChinese ? '重要：必须返回有效的JSON格式，不要添加任何解释性文字。' : 'IMPORTANT: Must return valid JSON format only, no explanatory text.'}`;

  const response = await callLLM([
    { role: 'system', content: SAFETY_GUARDRAILS },
    { role: 'user', content: prompt },
  ]);

  const parsed = parseLLMResponse(response);
  
  // Log parsed response for debugging
  console.log('Parsed LLM response for medical record:', parsed);
  
  const defaultObservations = isChinese 
    ? '无法生成分析' 
    : 'Unable to generate analysis';
  const defaultWhenToSeekHelp = isChinese
    ? '如果您对健康状况有担忧，请咨询医疗专业人员。'
    : 'If you have concerns about your health, please consult with a healthcare professional.';
  const defaultDisclaimer = isChinese
    ? '此信息仅供一般指导，不能替代专业医疗建议。'
    : 'This information is for general guidance only and is not a substitute for professional medical advice.';
  
  // Extract fields with proper validation
  const observations = parsed.observations || parsed.plainLanguageSummary;
  const possibleCauses = Array.isArray(parsed.possibleCauses) ? parsed.possibleCauses : [];
  const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
  const whenToSeekHelp = parsed.whenToSeekHelp;
  const disclaimer = parsed.disclaimer;
  
  // Only use rawResponse as last resort if we have no structured data at all
  const finalObservations = observations || (parsed.rawResponse && possibleCauses.length === 0 && suggestions.length === 0 ? parsed.rawResponse : null) || defaultObservations;
  
  // Log warning if structure is incomplete
  if (!observations && possibleCauses.length === 0 && suggestions.length === 0 && parsed.rawResponse) {
    console.warn('LLM returned unstructured response. Attempting to parse:', parsed.rawResponse);
  }
  
  return {
    observations: finalObservations,
    possibleCauses: possibleCauses,
    suggestions: suggestions,
    whenToSeekHelp: whenToSeekHelp || defaultWhenToSeekHelp,
    disclaimer: disclaimer || defaultDisclaimer,
    processingTimestamp: new Date().toISOString(),
  };
}

/**
 * Analyze symptoms and provide observational insights and supportive suggestions
 * IMPORTANT: This is NOT a medical diagnosis, but observational analysis only
 */
export async function analyzeSymptoms(
  input: SymptomAnalysisInput
): Promise<SymptomAnalysisOutput> {
  const userLanguage = await getUserLanguage();
  const isChinese = userLanguage === 'zh';
  
  const languageInstruction = isChinese 
    ? '请使用中文回复。所有内容必须使用简体中文。'
    : 'Please respond in English. All content must be in English.';
  
  const severityText = input.severity 
    ? (isChinese ? `严重程度: ${input.severity}` : `Severity: ${input.severity}`)
    : (isChinese ? '未指定严重程度' : 'Severity not specified');
  const notesText = input.notes 
    ? (isChinese ? `附加说明: ${input.notes}` : `Additional notes: ${input.notes}`)
    : '';

  const prompt = `${SAFETY_GUARDRAILS}

${languageInstruction}

You are a supportive health companion analyzing symptoms to provide observational insights and lifestyle guidance.

User's Symptoms:
${input.symptoms}
${severityText}
${notesText}

IMPORTANT GUIDELINES:
- Provide OBSERVATIONAL analysis only, NOT medical diagnosis
- Focus on patterns, possible contributing factors (lifestyle, environmental, etc.)
- Offer supportive lifestyle suggestions
- Clearly indicate when professional medical consultation is recommended
- Use supportive, empathetic language
- Do NOT use diagnostic terminology or suggest specific medical treatments

Please provide:
1. Observations: What patterns or observations you notice about these symptoms
2. Possible Causes: Possible contributing factors (lifestyle, environmental, stress, etc.) - NOT medical diagnoses
3. Suggestions: Supportive lifestyle suggestions that may help
4. When to Seek Help: Clear guidance on when to consult a healthcare professional
5. Disclaimer: Strong disclaimer that this is observational analysis, not medical advice

${isChinese ? '请严格按照以下JSON格式回复，不要添加任何其他文字说明：' : 'Please respond STRICTLY in JSON format only, without any additional text:'}
{
  "observations": "${isChinese ? '对症状的观察性分析' : 'Observational analysis of the symptoms'}",
  "possibleCauses": [
    "${isChinese ? '可能的因素1（生活方式/环境等）' : 'Possible contributing factor 1 (lifestyle/environmental)'}",
    "${isChinese ? '可能的因素2' : 'Possible contributing factor 2'}"
  ],
  "suggestions": [
    "${isChinese ? '支持性生活方式建议1' : 'Supportive lifestyle suggestion 1'}",
    "${isChinese ? '支持性生活方式建议2' : 'Supportive lifestyle suggestion 2'}"
  ],
  "whenToSeekHelp": "${isChinese ? '何时咨询医疗专业人员' : 'When to consult healthcare professional'}",
  "disclaimer": "${isChinese ? '这是仅供一般指导的观察性分析，不是医疗诊断或治疗建议。如有医疗问题，请咨询医疗专业人员。' : 'This is observational analysis for general guidance only. It is NOT a medical diagnosis or treatment recommendation. Please consult a healthcare professional for medical concerns.'}"
}

${isChinese ? '重要：必须返回有效的JSON格式，不要添加任何解释性文字。' : 'IMPORTANT: Must return valid JSON format only, no explanatory text.'}`;

  const response = await callLLM([
    { role: 'system', content: SAFETY_GUARDRAILS },
    { role: 'user', content: prompt },
  ]);

  const parsed = parseLLMResponse(response);

  // Log parsed response for debugging
  console.log('Parsed LLM response:', parsed);

  const defaultObservations = isChinese 
    ? '分析完成' 
    : 'Analysis completed';
  const defaultWhenToSeekHelp = isChinese
    ? '如果症状持续或恶化，请咨询医疗专业人员。'
    : 'If symptoms persist or worsen, please consult a healthcare professional.';
  const defaultDisclaimer = isChinese
    ? '这是仅供一般指导的观察性分析，不是医疗诊断或治疗建议。如有医疗问题，请咨询医疗专业人员。'
    : 'This is observational analysis for general guidance only. It is NOT a medical diagnosis or treatment recommendation. Please consult a healthcare professional for medical concerns.';

  // Extract fields with proper validation
  const observations = parsed.observations;
  const possibleCauses = Array.isArray(parsed.possibleCauses) ? parsed.possibleCauses : [];
  const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
  const whenToSeekHelp = parsed.whenToSeekHelp;
  const disclaimer = parsed.disclaimer;
  
  // Only use rawResponse as last resort if we have no structured data at all
  const finalObservations = observations || (parsed.rawResponse && possibleCauses.length === 0 && suggestions.length === 0 ? parsed.rawResponse : null) || defaultObservations;
  
  // Log warning if structure is incomplete
  if (!observations && possibleCauses.length === 0 && suggestions.length === 0 && parsed.rawResponse) {
    console.warn('LLM returned unstructured response. Attempting to parse:', parsed.rawResponse);
  }

  return {
    observations: finalObservations,
    possibleCauses: possibleCauses,
    suggestions: suggestions,
    whenToSeekHelp: whenToSeekHelp || defaultWhenToSeekHelp,
    disclaimer: disclaimer || defaultDisclaimer,
  };
}

/**
 * Generate meal suggestions based on ingredients
 */
export async function generateMealSuggestions(
  input: MealSuggestionInput
): Promise<MealSuggestionOutput[]> {
  if (input.ingredients.length === 0) {
    return [];
  }

  let adaptationContext = '';
  if (input.healthConditions && input.healthConditions.length > 0) {
    adaptationContext += `\nUser's health conditions: ${input.healthConditions.join(', ')}`;
  }
  if (input.energyLevel) {
    adaptationContext += `\nUser's energy level: ${input.energyLevel}`;
  }

  const prompt = `${SAFETY_GUARDRAILS}

You are a supportive nutrition companion helping a user create simple meal ideas.

Available Ingredients:
${input.ingredients.join(', ')}

${adaptationContext}

Please suggest 3-5 simple meal ideas that:
- May use some or all of the available ingredients
- Are simple to prepare
${input.energyLevel === 'low' ? '- Are very simple and require minimal effort' : ''}
${input.healthConditions && input.healthConditions.length > 0 ? '- Are adapted for general dietary considerations (NOT medical prescriptions)' : ''}

IMPORTANT: These are meal suggestions only, NOT medical dietary prescriptions. Include a clear disclaimer.

Respond in JSON format as an array:
[
  {
    "mealName": "...",
    "description": "...",
    "ingredients": ["..."],
    "preparationNotes": "...",
    "adaptedForConditions": ${input.healthConditions && input.healthConditions.length > 0 ? 'true' : 'false'},
    "adaptedForEnergyLevel": ${input.energyLevel ? 'true' : 'false'},
    "disclaimer": "This is a meal suggestion for general guidance only..."
  }
]`;

  const response = await callLLM([
    { role: 'system', content: SAFETY_GUARDRAILS },
    { role: 'user', content: prompt },
  ]);

  const parsed = parseLLMResponse(response);
  const suggestions = Array.isArray(parsed) ? parsed : (parsed.meals || [parsed]);

  return suggestions.map((suggestion: any) => ({
    mealName: suggestion.mealName || 'Meal Suggestion',
    description: suggestion.description || '',
    ingredients: suggestion.ingredients || [],
    preparationNotes: suggestion.preparationNotes,
    adaptedForConditions: suggestion.adaptedForConditions || false,
    adaptedForEnergyLevel: suggestion.adaptedForEnergyLevel || false,
    disclaimer: suggestion.disclaimer || 'This is a meal suggestion for general guidance only and is not a substitute for professional dietary advice.',
  }));
}

/**
 * Generate empathetic emotional response
 */
export async function generateEmotionalResponse(
  input: EmotionalInput
): Promise<EmotionalResponse> {
  const prompt = `${SAFETY_GUARDRAILS}

You are a supportive, empathetic companion helping a user process their emotions.

Journal Entry:
${input.journalEntry}

${input.moodContext ? `Recent Mood Context:\n${input.moodContext}` : ''}

Please provide:
- An empathetic, supportive response that acknowledges their feelings
- Maintain a companion-like, non-clinical tone
- Do NOT provide therapy or clinical advice
- If you detect any crisis indicators (self-harm, severe depression), provide supportive resources

IMPORTANT: This is companionship, NOT therapy. Include a clear disclaimer.

Respond in JSON format:
{
  "response": "...",
  "tone": "supportive" | "encouraging" | "acknowledging",
  "disclaimer": "This is AI-generated companionship and is not a substitute for professional therapy or mental health support...",
  "suggestedResources": [] // Only include if crisis indicators detected
}`;

  const response = await callLLM([
    { role: 'system', content: SAFETY_GUARDRAILS },
    { role: 'user', content: prompt },
  ]);

  const parsed = parseLLMResponse(response);

  return {
    response: parsed.response || parsed.rawResponse || 'I hear you, and I\'m here to support you.',
    tone: parsed.tone || 'supportive',
    disclaimer: parsed.disclaimer || 'This is AI-generated companionship and is not a substitute for professional therapy or mental health support.',
    suggestedResources: parsed.suggestedResources,
  };
}


