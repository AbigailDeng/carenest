import { Router } from 'express';
import {
  analyzeSymptoms,
  summarizeMedicalRecord,
  generateMealSuggestions,
  generateEmotionalResponse,
  analyzeFoodReflection,
  generateMealDetail,
} from '../services/llmService.js';

const router = Router();

// Wrapper for async route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// POST /api/analyze-symptoms
router.post('/analyze-symptoms', asyncHandler(async (req, res) => {
  const { symptoms, notes, severity, language } = req.body;
  
  if (!symptoms) {
    return res.status(400).json({
      error: { code: 'INVALID_INPUT', message: 'symptoms is required', retryable: false },
    });
  }

  const result = await analyzeSymptoms({ symptoms, notes, severity }, language || 'en');
  res.json(result);
}));

// POST /api/summarize-medical-record
router.post('/summarize-medical-record', asyncHandler(async (req, res) => {
  const { content, fileType, metadata, language } = req.body;
  
  if (!content) {
    return res.status(400).json({
      error: { code: 'INVALID_INPUT', message: 'content is required', retryable: false },
    });
  }

  const result = await summarizeMedicalRecord({ content, fileType, metadata }, language || 'en');
  res.json(result);
}));

// POST /api/meal-suggestions
router.post('/meal-suggestions', asyncHandler(async (req, res) => {
  const { ingredients, healthConditions, energyLevel, dietaryPreferences, options, language } = req.body;
  
  if (!ingredients) {
    return res.status(400).json({
      error: { code: 'INVALID_INPUT', message: 'ingredients is required', retryable: false },
    });
  }

  const result = await generateMealSuggestions(
    { ingredients, healthConditions, energyLevel, dietaryPreferences },
    options || {},
    language || 'en'
  );
  res.json(result);
}));

// POST /api/emotional-response
router.post('/emotional-response', asyncHandler(async (req, res) => {
  const { journalEntry, moodContext, conversationHistory, language } = req.body;
  
  if (!journalEntry) {
    return res.status(400).json({
      error: { code: 'INVALID_INPUT', message: 'journalEntry is required', retryable: false },
    });
  }

  const result = await generateEmotionalResponse(
    { journalEntry, moodContext, conversationHistory },
    language || 'en'
  );
  res.json(result);
}));

// POST /api/analyze-food-reflection
router.post('/analyze-food-reflection', asyncHandler(async (req, res) => {
  const { reflection, notes, healthConditions, recentSymptoms, language } = req.body;
  
  if (!reflection) {
    return res.status(400).json({
      error: { code: 'INVALID_INPUT', message: 'reflection is required', retryable: false },
    });
  }

  const result = await analyzeFoodReflection(
    { reflection, notes, healthConditions, recentSymptoms },
    language || 'en'
  );
  res.json(result);
}));

// POST /api/meal-detail
router.post('/meal-detail', asyncHandler(async (req, res) => {
  const { mealName, description, ingredients, preparationNotes, language } = req.body;
  
  if (!mealName) {
    return res.status(400).json({
      error: { code: 'INVALID_INPUT', message: 'mealName is required', retryable: false },
    });
  }

  const result = await generateMealDetail(
    { mealName, description, ingredients, preparationNotes },
    language || 'en'
  );
  res.json(result);
}));

export default router;
