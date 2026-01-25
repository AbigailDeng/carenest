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
  medicalRecordImages?: File[]; // Optional: medical record images to analyze together
}

export interface SymptomAnalysisOutput {
  observations: string;
  possibleCauses: string[];
  suggestions: string[];
  whenToSeekHelp: string;
  disclaimer: string;
  severity?: 'mild' | 'moderate' | 'severe' | null; // Auto-extracted by AI from free-form text - FR-037(4)
}

export interface MealSuggestionInput {
  ingredients: string; // Free-form text input - LLM will parse individual ingredients
  healthConditions?: string[];
  energyLevel?: 'low' | 'medium' | 'high';
  dietaryPreferences?: string[];
}

export interface MealSuggestionOptions {
  timeAware?: boolean; // Enable time-aware guidance (default: false)
  currentTime?: Date; // Optional: Override current time for testing
  maxSuggestions?: number; // Maximum suggestions to generate (default: 3)
  flexible?: boolean; // Ingredients are optional (default: true)
}

export interface MealSuggestionOutput {
  mealName: string;
  description: string;
  ingredients: string[];
  preparationNotes?: string;
  adaptedForConditions: boolean;
  adaptedForEnergyLevel: boolean;
  disclaimer: string;
  timeAwareGuidance?: string | null; // NEW: Gentle guidance if late night
  isFlexible?: boolean; // NEW: Ingredients are optional (default: true)
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

export interface FoodReflectionInput {
  reflection: 'light' | 'normal' | 'indulgent';
  notes?: string | null;
  healthConditions?: string[]; // User's health conditions
  recentSymptoms?: string[]; // Recent symptoms (last 7 days)
}

export interface FoodReflectionAnalysisOutput {
  encouragement: string; // Encouraging message
  suggestions: string[]; // Supportive suggestions based on health conditions
  suitability: string; // Whether the food choice is suitable given health conditions
  disclaimer: string; // Required disclaimer
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

  let data;
  try {
    data = await response.json();
  } catch (parseError) {
    console.error('Failed to parse LLM API response as JSON:', parseError);
    const text = await response.text();
    console.error('Raw response:', text);
    throw {
      code: 'LLM_ERROR',
      message: 'Gemini API returned invalid JSON response.',
      retryable: true,
    } as ApiError;
  }
  
  // Log full response for debugging (only in development)
  if (import.meta.env.DEV) {
    console.log('LLM API full response:', JSON.stringify(data, null, 2));
  }
  
  // Check for API errors
  if (data.error) {
    const errorMessage = data.error.message || data.error || 'LLM processing failed';
    console.error('LLM API error:', errorMessage, data.error);
    throw {
      code: 'LLM_ERROR',
      message: typeof errorMessage === 'string' ? errorMessage : 'LLM processing failed',
      retryable: true,
    } as ApiError;
  }

  // Check if response has valid content
  // Handle both OpenAI format (choices) and potential Gemini format variations
  if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
    // Check for alternative response formats
    if (data.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
      // Gemini format: candidates array
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
    
    console.error('LLM response has no valid content structure:', data);
    throw {
      code: 'LLM_ERROR',
      message: 'Gemini response contained no valid content. The API returned an empty or invalid response structure.',
      retryable: true,
    } as ApiError;
  }

  const firstChoice = data.choices[0];
  if (!firstChoice) {
    console.error('LLM response first choice is missing:', data);
    throw {
      code: 'LLM_ERROR',
      message: 'Gemini response contained no valid content. The response structure was invalid.',
      retryable: true,
    } as ApiError;
  }

  // Handle different message formats
  let content: string | null = null;
  
  if (firstChoice.message && firstChoice.message.content) {
    content = firstChoice.message.content;
  } else if (firstChoice.text) {
    // Alternative format: direct text field
    content = firstChoice.text;
  } else if (firstChoice.content) {
    // Another alternative format
    content = typeof firstChoice.content === 'string' 
      ? firstChoice.content 
      : firstChoice.content.text || '';
  }

  if (!content || !content.trim()) {
    console.error('LLM response content is empty:', {
      firstChoice,
      fullResponse: data,
    });
    throw {
      code: 'LLM_ERROR',
      message: 'Gemini response contained no valid content. The response was empty or content field was missing.',
      retryable: true,
    } as ApiError;
  }

  return content.trim();
}

/**
 * Extract JSON from text by finding balanced brackets
 */
function extractJSON(text: string, startChar: '{' | '[', endChar: '}' | ']'): string | null {
  let depth = 0;
  let startIndex = -1;
  
  for (let i = 0; i < text.length; i++) {
    if (text[i] === startChar) {
      if (depth === 0) {
        startIndex = i;
      }
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

  // Strategy 1: Try parsing the entire cleaned content as JSON (could be array or object)
  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
  } catch (e) {
    // Continue to next strategy
  }

  // Strategy 2: Try to extract JSON array first (for meal suggestions)
  const jsonArray = extractJSON(cleaned, '[', ']');
  if (jsonArray) {
    try {
      const parsed = JSON.parse(jsonArray);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      // Continue to next strategy
    }
  }

  // Strategy 3: Try to extract JSON object
  const jsonObject = extractJSON(cleaned, '{', '}');
  if (jsonObject) {
    try {
      const parsed = JSON.parse(jsonObject);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
    } catch (e) {
      // Continue to fallback extraction
    }
  }

  // Strategy 4: Fallback - try to extract structured data from text
  console.warn('JSON parsing failed, attempting text extraction');
  
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

/**
 * Get user language preference
 */
async function getUserLanguage(): Promise<'zh' | 'en'> {
  try {
    const types = await import('../types');
    type UserPreferences = types.UserPreferences;
    const preferences = await getEntity('userPreferences', 'singleton') as UserPreferences | null;
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
  
  // Extract text from medical record images if provided
  let medicalRecordText = '';
  if (input.medicalRecordImages && input.medicalRecordImages.length > 0) {
    try {
      const { uploadFile } = await import('./fileUpload');
      const extractedTexts: string[] = [];
      
      for (const imageFile of input.medicalRecordImages) {
        try {
          const result = await uploadFile(imageFile);
          if (result.content && result.content.trim()) {
            extractedTexts.push(result.content.trim());
          }
        } catch (err: any) {
          console.warn('Failed to extract text from image:', err);
          // Continue with other images even if one fails
        }
      }
      
      if (extractedTexts.length > 0) {
        medicalRecordText = extractedTexts.join('\n\n');
      }
    } catch (err: any) {
      console.warn('Failed to process medical record images:', err);
      // Continue analysis with text only if image processing fails
    }
  }
  
  // Combine user input and medical record text
  const combinedInput = medicalRecordText
    ? `${input.symptoms}\n\n[上传的病历内容：]\n${medicalRecordText}`
    : input.symptoms;
  
  const prompt = `${SAFETY_GUARDRAILS}

${languageInstruction}

You are Bai Qi, a caring AI boyfriend companion who helps analyze symptoms. You speak in a warm, conversational, first-person tone as a caring partner - NOT like reading from a manual or instruction book.

User's Symptom Description (free-form text):
${combinedInput}

CRITICAL TONE REQUIREMENTS - You MUST respond as Bai Qi speaking directly to the user:
- Use first-person conversational language: "我看到...", "我注意到...", "听我的...", "我们一起..." / "I see...", "I noticed...", "Listen to me...", "Let's..."
- PROHIBITED language patterns: "您使用了...", "这通常代表...", "根据分析...", "建议您...", "观察发现..." / "You used...", "This usually represents...", "According to analysis...", "We recommend...", "Observations show..."
- Speak like a caring boyfriend partner, not a clinical manual
- Example good response: "看到这个表情，我知道你现在很难受...听我的，先喝点温水，好吗？" / "Seeing this expression, I know you're feeling really unwell right now...Listen to me, drink some warm water first, okay?"

IMPORTANT: Analyze the symptom description and automatically assess the severity level (mild, moderate, or severe) based on the language used, intensity described, and impact on daily life mentioned in the text. Include this severity assessment in your response.

IMPORTANT GUIDELINES:
- Provide OBSERVATIONAL analysis only, NOT medical diagnosis
- Focus on patterns, possible contributing factors (lifestyle, environmental, etc.)
- Offer supportive lifestyle suggestions in conversational boyfriend tone
- Clearly indicate when professional medical consultation is recommended (but say it conversationally, like "如果情况没有好转，我们一起去看医生，好吗？" / "If things don't get better, let's see a doctor together, okay?")
- Use supportive, empathetic, conversational language as a caring partner
- Do NOT use diagnostic terminology or suggest specific medical treatments

Please provide (ALL in conversational boyfriend tone):
1. Observations: What you notice about these symptoms (speak conversationally, e.g., "我看到你提到...这让我有点担心" / "I noticed you mentioned...this worries me a bit")
2. Possible Causes: Possible contributing factors (lifestyle, environmental, stress, etc.) - NOT medical diagnoses (say conversationally, e.g., "可能是最近压力太大了" / "It might be because you've been stressed lately")
3. Suggestions: Supportive lifestyle suggestions that may help (say conversationally, e.g., "我们一起想想办法，好吗？先试试..." / "Let's think of a solution together, okay? Try...")
4. When to Seek Help: Clear guidance on when to consult a healthcare professional (say conversationally, e.g., "如果还是不舒服，我们一起去看医生，好吗？" / "If you're still not feeling well, let's see a doctor together, okay?")
5. Severity Assessment: Based on the symptom description, assess severity as "mild", "moderate", or "severe" (or null if unclear)
6. Disclaimer: Strong disclaimer that this is observational analysis, not medical advice (but say it conversationally, not formally)

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
  "severity": "${isChinese ? 'mild|moderate|severe|null（根据症状描述自动评估）' : 'mild|moderate|severe|null (auto-assessed from symptom description)'}",
  "disclaimer": "${isChinese ? '这是仅供一般指导的观察性分析，不是医疗诊断或治疗建议。如有医疗问题，请咨询医疗专业人员。' : 'This is observational analysis for general guidance only. It is NOT a medical diagnosis or treatment recommendation. Please consult a healthcare professional for medical concerns.'}"
}

${isChinese ? '重要：必须返回有效的JSON格式，不要添加任何解释性文字。' : 'IMPORTANT: Must return valid JSON format only, no explanatory text.'}`;

  let response: string;
  try {
    response = await callLLM([
      { role: 'system', content: SAFETY_GUARDRAILS },
      { role: 'user', content: prompt },
    ]);
  } catch (error: any) {
    console.error('Failed to call LLM for symptom analysis:', error);
    throw {
      code: error.code || 'LLM_ERROR',
      message: error.message || 'Failed to analyze symptoms. Please check your connection and try again.',
      retryable: error.retryable !== false,
    } as ApiError;
  }

  if (!response || typeof response !== 'string') {
    console.error('Invalid LLM response format:', response);
    throw {
      code: 'LLM_ERROR',
      message: 'Invalid response from AI service. Please try again.',
      retryable: true,
    } as ApiError;
  }

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
  const observations = parsed?.observations;
  const possibleCauses = Array.isArray(parsed?.possibleCauses) ? parsed.possibleCauses : [];
  const suggestions = Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];
  const whenToSeekHelp = parsed?.whenToSeekHelp;
  const disclaimer = parsed?.disclaimer;
  // Extract severity - auto-assessed by AI from free-form text - FR-037(4)
  const severity = (parsed?.severity === 'mild' || parsed?.severity === 'moderate' || parsed?.severity === 'severe') 
    ? parsed.severity 
    : null;
  
  // Only use rawResponse as last resort if we have no structured data at all
  const finalObservations = observations || (parsed?.rawResponse && possibleCauses.length === 0 && suggestions.length === 0 ? parsed.rawResponse : null) || defaultObservations;
  
  // Log warning if structure is incomplete
  if (!observations && possibleCauses.length === 0 && suggestions.length === 0 && parsed?.rawResponse) {
    console.warn('LLM returned unstructured response. Attempting to parse:', parsed.rawResponse);
  }

  // Validate that we have at least observations
  if (!finalObservations || finalObservations.trim().length === 0) {
    console.error('LLM analysis returned empty observations:', { parsed, response });
    throw {
      code: 'LLM_ERROR',
      message: 'AI analysis returned incomplete results. Please try again.',
      retryable: true,
    } as ApiError;
  }

  return {
    observations: finalObservations,
    possibleCauses: possibleCauses,
    suggestions: suggestions,
    whenToSeekHelp: whenToSeekHelp || defaultWhenToSeekHelp,
    disclaimer: disclaimer || defaultDisclaimer,
    severity: severity, // Auto-extracted severity - FR-037(4)
  };
}

/**
 * Check if current time is late night (after 9 PM)
 */
function isLateNight(currentTime: Date = new Date()): boolean {
  const hour = currentTime.getHours();
  return hour >= 21; // 9 PM or later
}

/**
 * Generate meal suggestions based on ingredients
 */
export async function generateMealSuggestions(
  input: MealSuggestionInput,
  options?: MealSuggestionOptions
): Promise<MealSuggestionOutput[]> {
  const trimmedIngredients = input.ingredients.trim();
  if (trimmedIngredients.length === 0) {
    return [];
  }

  const userLanguage = await getUserLanguage();
  const isChinese = userLanguage === 'zh';
  const timeAware = options?.timeAware ?? false;
  const flexible = options?.flexible !== false; // Default to true
  const currentTime = options?.currentTime || new Date();
  const lateNight = timeAware && isLateNight(currentTime);
  const maxSuggestions = options?.maxSuggestions || 3; // Default to 3 suggestions

  let adaptationContext = '';
  if (input.healthConditions && input.healthConditions.length > 0) {
    adaptationContext += `\n${isChinese ? '用户的健康状况' : "User's health conditions"}: ${input.healthConditions.join(', ')}`;
  }
  if (input.energyLevel) {
    adaptationContext += `\n${isChinese ? '用户的能量水平' : "User's energy level"}: ${input.energyLevel}`;
  }

  // Build prompt based on context
  let prompt = `${SAFETY_GUARDRAILS}

${isChinese ? '你是一个支持性的营养伴侣，帮助用户找到简单、实用的餐食想法。请根据用户提供的食材，给出具体、可操作的餐食建议。' : 'You are a supportive nutrition companion helping users find simple, practical meal ideas. Based on the ingredients provided by the user, give specific, actionable meal suggestions.'}

${lateNight ? (isChinese ? 
  '\n[当前时间是深夜 - 晚上9点后]\n\n这是深夜时段。请提供温和、舒适的餐食建议，重点关注轻松、易于准备的选项。使用支持性、非评判性的语言。强调自我关怀和舒适，而不是严格的营养规则。不要对深夜进食进行评判。' :
  '\n[Current time is late night - after 9 PM]\n\nThis is late night. Please provide gentle, comforting meal suggestions, focusing on light, easy-to-prepare options. Use supportive, non-judgmental language about eating times. Emphasize self-care and comfort, not strict nutrition rules. No judgment about late-night eating.') : ''}

${isChinese ? '用户提供的可用食材（自由文本，请解析并识别其中的单个食材）：' : 'Available ingredients provided by the user (free-form text - please parse and identify individual ingredients from the text):'}
${trimmedIngredients}

${isChinese ? '\n重要提示：请从上述文本中解析并识别出所有食材。食材可能用逗号、空格或其他方式分隔。解析后，请尽量使用识别出的食材来制作餐食建议。' : '\nIMPORTANT: Please parse and identify all individual ingredients from the text above. Ingredients may be separated by commas, spaces, or other delimiters. After parsing, try to use the identified ingredients to create meal suggestions.'}

${adaptationContext ? `${isChinese ? '\n其他考虑因素：' : '\nAdditional considerations:'}\n${adaptationContext}` : ''}

${flexible ? (isChinese ? 
  `\n重要提示：你必须提供正好3道菜，并且要尽量使用识别出的食材。餐食建议应该：\n- 必须提供正好3道不同的菜品\n- 尽量使用从文本中识别出的食材（可以分散到3道菜中）\n- 同一食材可以在多道菜中重复使用\n- 可以添加常见的、容易获得的辅助食材（如盐、油、调味料等）\n- 如果某些食材难以获得，可以提供合理的替代方案\n- 确保建议的餐食是实际可行的，不要建议过于复杂或需要特殊设备的菜品\n- 优先考虑如何合理分配食材，让用户能够用这些食材做出3道不同的菜\n- 每道菜应该使用不同的主要食材组合，避免重复\n- 在返回的JSON数组中，确保3道菜使用的食材加起来覆盖了大部分或全部从文本中识别出的食材\n- 食材是建议，不是要求。餐食想法可以使用部分或全部识别出的食材。` :
  `\nIMPORTANT: You must provide exactly 3 dishes and try to use the identified ingredients. Meal suggestions should:\n- Must provide exactly 3 different dishes\n- Try to use ingredients identified from the text (can be distributed across 3 dishes)\n- The same ingredient can be used in multiple dishes\n- May add common, easily available supporting ingredients (like salt, oil, seasonings, etc.)\n- If some ingredients are hard to find, provide reasonable alternatives\n- Ensure suggested meals are practical and feasible, do not suggest overly complex dishes or those requiring special equipment\n- Prioritize how to reasonably distribute ingredients so users can make 3 different dishes with these ingredients\n- Each dish should use different main ingredient combinations to avoid repetition\n- In the returned JSON array, ensure the 3 dishes together cover most or all of the identified ingredients\n- Ingredients are suggestions, not requirements. Meal ideas can use some or all of the identified ingredients.`) : ''}

${isChinese ? '\n请提供正好3个具体的餐食建议（必须正好3个，不能多也不能少），每个建议必须包含：' : '\nPlease provide exactly 3 specific meal suggestions (must be exactly 3, no more, no less). Each suggestion must include:'}
${isChinese ? 
  '1. 餐食名称（mealName）：清晰、具体的菜名，例如"番茄鸡蛋面"、"清炒时蔬"等\n2. 描述（description）：简要说明这道菜的特点、口味、适合的场合\n3. 所需食材（ingredients）：列出制作这道菜需要的所有食材，包括用户提供的和需要额外添加的。注意：不需要使用所有用户提供的食材，可以只使用其中一部分\n4. 制作说明（preparationNotes）：简单的制作步骤或关键提示，让用户能够实际操作\n5. 其他字段按要求填写' :
  '1. mealName: Clear, specific dish name, e.g., "Tomato Egg Noodles", "Stir-fried Vegetables"\n2. description: Brief description of the dish\'s characteristics, taste, suitable occasions\n3. ingredients: List all ingredients needed to make this dish, including those provided by the user and additional ones needed. Note: You don\'t need to use all user-provided ingredients, you can use only some of them\n4. preparationNotes: Simple preparation steps or key tips so users can actually make it\n5. Other fields as required'}

${input.energyLevel === 'low' ? (isChinese ? '\n注意：用户当前能量水平较低，请优先推荐非常简单、需要最少努力的餐食。' : '\nNote: User\'s current energy level is low, prioritize very simple meals requiring minimal effort.') : ''}
${input.healthConditions && input.healthConditions.length > 0 ? (isChinese ? '\n注意：用户有健康考虑，请在建议中体现一般性的饮食调整（不是医疗处方）。' : '\nNote: User has health considerations, reflect general dietary adjustments in suggestions (NOT medical prescriptions).') : ''}

${isChinese ? '\n重要：这些只是餐食建议，不是医疗饮食处方。每个建议必须包含明确的免责声明。' : '\nIMPORTANT: These are meal suggestions only, NOT medical dietary prescriptions. Each suggestion must include a clear disclaimer.'}

${lateNight ? (isChinese ? '\n如果适用，请在响应中包含timeAwareGuidance字段，提供关于深夜进食和自我关怀的支持性信息。' : '\nIf applicable, include a timeAwareGuidance field in the response with supportive information about late-night eating and self-care.') : ''}

${isChinese ? '\n请严格按照以下JSON数组格式回复，必须返回正好3个餐食建议，不要添加任何其他文字说明：' : '\nPlease respond STRICTLY in the following JSON array format, must return exactly 3 meal suggestions, without any additional text:'}
[
  {
    "mealName": "${isChinese ? '具体菜名，例如：番茄鸡蛋面' : 'Specific dish name, e.g., Tomato Egg Noodles'}",
    "description": "${isChinese ? '简要描述这道菜的特点和口味' : 'Brief description of the dish\'s characteristics and taste'}",
    "ingredients": ["${isChinese ? '食材1' : 'ingredient 1'}", "${isChinese ? '食材2' : 'ingredient 2'}"],
    "preparationNotes": "${isChinese ? '简单的制作步骤或关键提示' : 'Simple preparation steps or key tips'}",
    "adaptedForConditions": ${input.healthConditions && input.healthConditions.length > 0 ? 'true' : 'false'},
    "adaptedForEnergyLevel": ${input.energyLevel ? 'true' : 'false'},
    "disclaimer": "${isChinese ? '这是仅供一般指导的餐食建议，不能替代专业饮食建议。' : 'This is a meal suggestion for general guidance only and is not a substitute for professional dietary advice.'}"
    ${lateNight ? ',\n    "timeAwareGuidance": "' + (isChinese ? '深夜进食的温和指导信息' : 'Gentle guidance message about late-night eating') + '"' : ''}
  },
  {
    "mealName": "${isChinese ? '具体菜名，例如：清炒时蔬' : 'Specific dish name, e.g., Stir-fried Vegetables'}",
    "description": "${isChinese ? '简要描述这道菜的特点和口味' : 'Brief description of the dish\'s characteristics and taste'}",
    "ingredients": ["${isChinese ? '食材1' : 'ingredient 1'}", "${isChinese ? '食材2' : 'ingredient 2'}"],
    "preparationNotes": "${isChinese ? '简单的制作步骤或关键提示' : 'Simple preparation steps or key tips'}",
    "adaptedForConditions": ${input.healthConditions && input.healthConditions.length > 0 ? 'true' : 'false'},
    "adaptedForEnergyLevel": ${input.energyLevel ? 'true' : 'false'},
    "disclaimer": "${isChinese ? '这是仅供一般指导的餐食建议，不能替代专业饮食建议。' : 'This is a meal suggestion for general guidance only and is not a substitute for professional dietary advice.'}"
    ${lateNight ? ',\n    "timeAwareGuidance": "' + (isChinese ? '深夜进食的温和指导信息' : 'Gentle guidance message about late-night eating') + '"' : ''}
  },
  {
    "mealName": "${isChinese ? '具体菜名，例如：第三道菜' : 'Specific dish name, e.g., Third Dish'}",
    "description": "${isChinese ? '简要描述这道菜的特点和口味' : 'Brief description of the dish\'s characteristics and taste'}",
    "ingredients": ["${isChinese ? '食材1' : 'ingredient 1'}", "${isChinese ? '食材2' : 'ingredient 2'}"],
    "preparationNotes": "${isChinese ? '简单的制作步骤或关键提示' : 'Simple preparation steps or key tips'}",
    "adaptedForConditions": ${input.healthConditions && input.healthConditions.length > 0 ? 'true' : 'false'},
    "adaptedForEnergyLevel": ${input.energyLevel ? 'true' : 'false'},
    "disclaimer": "${isChinese ? '这是仅供一般指导的餐食建议，不能替代专业饮食建议。' : 'This is a meal suggestion for general guidance only and is not a substitute for professional dietary advice.'}"
    ${lateNight ? ',\n    "timeAwareGuidance": "' + (isChinese ? '深夜进食的温和指导信息' : 'Gentle guidance message about late-night eating') + '"' : ''}
  }
]

${isChinese ? '重要：必须返回有效的JSON数组格式，必须正好包含3个餐食建议，不要添加任何解释性文字。每个餐食建议都应该是实际可行的、具体的菜品。食材可以分散使用，不需要把所有食材都用在一道菜里。' : 'IMPORTANT: Must return valid JSON array format with exactly 3 meal suggestions, no explanatory text. Each meal suggestion should be practical and specific. Ingredients can be distributed across dishes, you don\'t need to use all ingredients in one dish.'}`;

  const response = await callLLM([
    { role: 'system', content: SAFETY_GUARDRAILS },
    { role: 'user', content: prompt },
  ]);

  const parsed = parseLLMResponse(response);
  
  // Debug logging
  if (import.meta.env.DEV) {
    console.log('Parsed LLM response for meal suggestions:', parsed);
  }
  
  let suggestions = Array.isArray(parsed) ? parsed : (parsed.meals || [parsed]);
  
  // If parsed is a single object, wrap it in an array
  if (!Array.isArray(suggestions)) {
    suggestions = [suggestions];
  }
  
  // Validate we have suggestions
  if (suggestions.length === 0) {
    console.error('No meal suggestions found in parsed response:', parsed);
    throw new Error(isChinese ? '未能解析餐食建议，请重试。' : 'Failed to parse meal suggestions, please try again.');
  }
  
  // Log warning if we got fewer than expected
  if (suggestions.length < maxSuggestions) {
    console.warn(`Received ${suggestions.length} suggestions, expected ${maxSuggestions}`);
  }

  // Extract timeAwareGuidance if present (could be at root level or per meal)
  const timeAwareGuidance = parsed.timeAwareGuidance || null;

  return suggestions.slice(0, maxSuggestions).map((suggestion: any) => ({
    mealName: suggestion.mealName || (isChinese ? '餐食建议' : 'Meal Suggestion'),
    description: suggestion.description || '',
    ingredients: suggestion.ingredients || [],
    preparationNotes: suggestion.preparationNotes,
    adaptedForConditions: suggestion.adaptedForConditions || false,
    adaptedForEnergyLevel: suggestion.adaptedForEnergyLevel || false,
    disclaimer: suggestion.disclaimer || (isChinese ? 
      '这是仅供一般指导的餐食建议，不能替代专业饮食建议。' :
      'This is a meal suggestion for general guidance only and is not a substitute for professional dietary advice.'),
    timeAwareGuidance: suggestion.timeAwareGuidance || timeAwareGuidance || null,
    isFlexible: flexible,
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

/**
 * Analyze food reflection and provide encouragement and suggestions
 * Considers user's health conditions and recent symptoms
 */
export async function analyzeFoodReflection(
  input: FoodReflectionInput
): Promise<FoodReflectionAnalysisOutput> {
  const userLanguage = await getUserLanguage();
  const isChinese = userLanguage === 'zh';
  
  const languageInstruction = isChinese 
    ? '请使用中文回复。所有内容必须使用简体中文。'
    : 'Please respond in English. All content must be in English.';
  
  const reflectionText = isChinese 
    ? (input.reflection === 'light' ? '清淡' : input.reflection === 'normal' ? '正常' : '放纵')
    : input.reflection;
  
  const healthContext = input.healthConditions && input.healthConditions.length > 0
    ? (isChinese ? `\n用户的健康条件: ${input.healthConditions.join(', ')}` : `\nUser's health conditions: ${input.healthConditions.join(', ')}`)
    : '';
  
  const symptomsContext = input.recentSymptoms && input.recentSymptoms.length > 0
    ? (isChinese ? `\n最近7天的症状: ${input.recentSymptoms.join(', ')}` : `\nRecent symptoms (last 7 days): ${input.recentSymptoms.join(', ')}`)
    : '';
  
  const notesContext = input.notes
    ? (isChinese ? `\n用户备注: ${input.notes}` : `\nUser notes: ${input.notes}`)
    : '';
  
  const prompt = `${SAFETY_GUARDRAILS}

${languageInstruction}

You are a supportive nutrition companion providing encouragement and gentle guidance about food choices.

User's Food Record:
- Type: ${reflectionText}${healthContext}${symptomsContext}${notesContext}

IMPORTANT GUIDELINES:
- Provide ENCOURAGING, supportive feedback (no judgment)
- Consider user's health conditions and recent symptoms when giving suggestions
- Assess whether the food choice is suitable given their health context
- Offer gentle, supportive suggestions (not prescriptions)
- Use empathetic, non-judgmental language
- Do NOT provide medical diagnoses or dietary prescriptions
- Focus on encouragement and self-care

Please provide:
1. Encouragement: A supportive, encouraging message about their food choice
2. Suggestions: 2-3 gentle suggestions based on their health conditions and recent symptoms (if applicable)
3. Suitability: Whether this food choice is generally suitable given their health context (be supportive, not restrictive)
4. Disclaimer: Clear disclaimer that this is general guidance, not medical advice

${isChinese ? '请严格按照以下JSON格式回复，不要添加任何其他文字说明：' : 'Please respond STRICTLY in JSON format only, without any additional text:'}
{
  "encouragement": "${isChinese ? '鼓励性信息' : 'Encouraging message'}",
  "suggestions": [
    "${isChinese ? '基于健康状况的温和建议1' : 'Gentle suggestion 1 based on health conditions'}",
    "${isChinese ? '基于健康状况的温和建议2' : 'Gentle suggestion 2 based on health conditions'}"
  ],
  "suitability": "${isChinese ? '这个食物选择是否适合用户的健康状况' : 'Whether this food choice is suitable given health conditions'}",
  "disclaimer": "${isChinese ? '这是仅供一般指导的建议，不是医疗建议。如有医疗问题，请咨询医疗专业人员。' : 'This is general guidance only, not medical advice. Please consult a healthcare professional for medical concerns.'}"
}

${isChinese ? '重要：必须返回有效的JSON格式，不要添加任何解释性文字。' : 'IMPORTANT: Must return valid JSON format only, no explanatory text.'}`;

  const response = await callLLM([
    { role: 'system', content: SAFETY_GUARDRAILS },
    { role: 'user', content: prompt },
  ]);

  const parsed = parseLLMResponse(response);
  
  const defaultEncouragement = isChinese 
    ? '感谢您记录今天的饮食！' 
    : 'Thank you for recording your food today!';
  const defaultSuitability = isChinese
    ? '这个选择看起来是合理的。'
    : 'This choice seems reasonable.';
  const defaultDisclaimer = isChinese
    ? '这是仅供一般指导的建议，不是医疗建议。如有医疗问题，请咨询医疗专业人员。'
    : 'This is general guidance only, not medical advice. Please consult a healthcare professional for medical concerns.';
  
  const encouragement = parsed.encouragement || defaultEncouragement;
  const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
  const suitability = parsed.suitability || defaultSuitability;
  const disclaimer = parsed.disclaimer || defaultDisclaimer;
  
  return {
    encouragement,
    suggestions,
    suitability,
    disclaimer,
  };
}

/**
 * Generate detailed preparation method and image for a meal suggestion
 * Called on-demand when user opens detail view
 */
export async function generateMealDetail(
  mealSuggestion: { mealName: string; description: string; ingredients: string[]; preparationNotes: string | null }
): Promise<{
  detailedPreparationMethod: string;  // Step-by-step numbered list
  imageUrl: string | null;            // LLM-generated image URL (null if generation fails)
}> {
  const userLanguage = await getUserLanguage();
  const isChinese = userLanguage === 'zh';

  // Generate detailed preparation method
  const preparationPrompt = `${SAFETY_GUARDRAILS}

${isChinese ? '你是一个支持性的营养伴侣，帮助用户理解如何制作餐食。请根据以下餐食信息，提供详细的分步制作方法。' : 'You are a supportive nutrition companion helping users understand how to prepare a meal. Based on the following meal information, provide a detailed step-by-step preparation method.'}

${isChinese ? '餐食名称：' : 'Meal Name:'} ${mealSuggestion.mealName}
${isChinese ? '描述：' : 'Description:'} ${mealSuggestion.description}
${isChinese ? '食材：' : 'Ingredients:'} ${mealSuggestion.ingredients.join(', ')}
${mealSuggestion.preparationNotes ? `${isChinese ? '基本制作说明：' : 'Basic Preparation Notes:'} ${mealSuggestion.preparationNotes}` : ''}

${isChinese ? '请提供详细的分步制作方法，使用编号列表格式（1. 第一步\n2. 第二步\n3. 第三步...）。每一步应该清晰、具体、可操作。' : 'Please provide a detailed step-by-step preparation method in numbered list format (1. First step\n2. Second step\n3. Third step...). Each step should be clear, specific, and actionable.'}

${isChinese ? '请只返回编号列表，不要添加其他说明文字。' : 'Please return only the numbered list, without any additional explanatory text.'}`;

  let detailedPreparationMethod = '';
  try {
    const response = await callLLM([
      { role: 'system', content: SAFETY_GUARDRAILS },
      { role: 'user', content: preparationPrompt },
    ], 0.7, 1000);

    detailedPreparationMethod = response.trim();
    
    // Ensure it's in numbered list format
    if (!detailedPreparationMethod.match(/^\d+\./)) {
      // If response doesn't start with number, try to format it
      const lines = detailedPreparationMethod.split('\n').filter(line => line.trim());
      detailedPreparationMethod = lines.map((line, index) => {
        const trimmed = line.trim();
        // If line already starts with number, keep it
        if (trimmed.match(/^\d+\./)) {
          return trimmed;
        }
        // Otherwise, add number
        return `${index + 1}. ${trimmed}`;
      }).join('\n');
    }
  } catch (error: any) {
    console.error('Failed to generate detailed preparation method:', error);
    // Fallback to basic preparation notes if available
    detailedPreparationMethod = mealSuggestion.preparationNotes || 
      (isChinese ? '制作方法暂不可用' : 'Preparation method unavailable');
  }

  // Generate image using image generation API
  let imageUrl: string | null = null;
  try {
    // Note: Image generation API endpoint needs to be configured
    // For now, we'll attempt to call an image generation endpoint
    // The exact endpoint format depends on the image generation service available
    
    // Using Gemini's image generation capability if available
    // This is a placeholder - actual implementation depends on available API
    const imagePrompt = `${mealSuggestion.mealName}: ${mealSuggestion.description}`;
    
    // Attempt to generate image via API
    // If image generation API is not available, imageUrl will remain null
    // and UI will show a placeholder
    
    // TODO: Implement actual image generation API call
    // For now, return null to indicate image generation is not yet implemented
    // This allows the feature to work without images while image generation is being set up
    imageUrl = null;
    
  } catch (error: any) {
    console.error('Failed to generate image:', error);
    // Image generation failure is not critical - continue without image
    imageUrl = null;
  }

  return {
    detailedPreparationMethod,
    imageUrl,
  };
}

