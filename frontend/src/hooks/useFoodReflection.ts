import { useState, useEffect, useCallback } from 'react';
import { FoodReflection, FoodReflectionType, FoodReflectionAnalysis, MealType } from '../types';
import {
  saveFoodReflection,
  getFoodReflection,
  getFoodReflectionsForDate,
  getFoodReflections,
  deleteFoodReflection,
} from '../services/storage/indexedDB';
import { analyzeFoodReflection } from '../services/llmService';
import { useHealthConditions } from './useHealthConditions';
import { useSymptomEntries } from './useSymptomEntries';

export function useFoodReflection() {
  const [reflection, setReflection] = useState<FoodReflection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { conditions } = useHealthConditions();
  const { entries } = useSymptomEntries();

  /**
   * Get today's date in YYYY-MM-DD format
   */
  const getTodayDate = useCallback((): string => {
    return new Date().toISOString().split('T')[0];
  }, []);

  /**
   * Load today's reflection for a specific meal type
   */
  const loadTodayReflection = useCallback(async (mealType?: MealType) => {
    try {
      setLoading(true);
      const today = getTodayDate();
      if (mealType) {
        const { getFoodReflectionByDateAndMealType } = await import('../services/storage/indexedDB');
        const todayReflection = await getFoodReflectionByDateAndMealType(today, mealType);
        setReflection(todayReflection);
      } else {
        // Load first meal found (for backward compatibility)
        const todayReflections = await getFoodReflectionsForDate(today);
        setReflection(todayReflections.length > 0 ? todayReflections[0] : null);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load food reflection');
    } finally {
      setLoading(false);
    }
  }, [getTodayDate]);

  useEffect(() => {
    loadTodayReflection();
  }, [loadTodayReflection]);

  /**
   * Analyze food reflection with AI (does not save)
   */
  const analyzeReflection = useCallback(async (
    type: FoodReflectionType,
    mealType: MealType,
    notes?: string | null
  ): Promise<FoodReflectionAnalysis> => {
    try {
      setError(null);
      
      // Get recent symptoms (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentSymptoms = entries
        .filter(entry => {
          const entryDate = new Date(entry.loggedDate);
          return entryDate >= sevenDaysAgo;
        })
        .map(entry => entry.symptoms)
        .slice(0, 5); // Limit to 5 most recent
      
      // Get health conditions
      const healthConditions = conditions.map(c => c.conditionName);
      
      // Generate AI analysis
      const aiAnalysis = await analyzeFoodReflection({
        reflection: type,
        notes: notes || null,
        healthConditions: healthConditions.length > 0 ? healthConditions : undefined,
        recentSymptoms: recentSymptoms.length > 0 ? recentSymptoms : undefined,
      });
      
      return aiAnalysis;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to analyze food reflection';
      setError(errorMsg);
      throw err;
    }
  }, [conditions, entries]);

  /**
   * Save or update food reflection for a specific date (without AI analysis)
   */
  const saveReflection = useCallback(async (
    type: FoodReflectionType,
    mealType: MealType,
    notes?: string | null,
    aiAnalysis?: FoodReflectionAnalysis | null,
    date?: string
  ): Promise<FoodReflection> => {
    try {
      setError(null);
      const targetDate = date || getTodayDate();
      
      // Save reflection
      const saved = await saveFoodReflection({
        date: targetDate,
        mealType: mealType,
        reflection: type,
        notes: notes || null,
        processingStatus: aiAnalysis ? 'completed' : 'pending',
        aiAnalysis: aiAnalysis || null,
        errorMessage: null,
      });
      setReflection(saved);
      
      return saved;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to save food reflection';
      setError(errorMsg);
      throw err;
    }
  }, [getTodayDate]);

  /**
   * Get reflections for a specific date (all meals)
   */
  const getReflectionsForDate = useCallback(async (date: string): Promise<FoodReflection[]> => {
    try {
      const { getFoodReflectionsForDate } = await import('../services/storage/indexedDB');
      return await getFoodReflectionsForDate(date);
    } catch (err: any) {
      setError(err.message || 'Failed to get food reflections');
      throw err;
    }
  }, []);

  /**
   * Get reflection for a specific date (first one found, for backward compatibility)
   * @deprecated Use getReflectionsForDate instead
   */
  const getReflectionForDate = useCallback(async (date: string): Promise<FoodReflection | null> => {
    try {
      const { getFoodReflectionsForDate } = await import('../services/storage/indexedDB');
      const reflections = await getFoodReflectionsForDate(date);
      return reflections.length > 0 ? reflections[0] : null;
    } catch (err: any) {
      setError(err.message || 'Failed to get food reflection');
      throw err;
    }
  }, []);

  /**
   * Get reflection for a specific date and meal type
   */
  const getReflectionForDateAndMeal = useCallback(async (
    date: string,
    mealType: MealType
  ): Promise<FoodReflection | null> => {
    try {
      const { getFoodReflectionByDateAndMealType } = await import('../services/storage/indexedDB');
      return await getFoodReflectionByDateAndMealType(date, mealType);
    } catch (err: any) {
      setError(err.message || 'Failed to get food reflection');
      throw err;
    }
  }, []);

  /**
   * Get reflections for a date range
   */
  const getReflectionsForRange = useCallback(async (
    startDate: string,
    endDate: string
  ): Promise<FoodReflection[]> => {
    try {
      return await getFoodReflections(startDate, endDate);
    } catch (err: any) {
      setError(err.message || 'Failed to get food reflections');
      throw err;
    }
  }, []);

  /**
   * Delete reflection for a specific date
   */
  const deleteReflection = useCallback(async (date: string): Promise<void> => {
    try {
      await deleteFoodReflection(date);
      if (reflection && reflection.date === date) {
        setReflection(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete food reflection');
      throw err;
    }
  }, [reflection]);

  return {
    reflection,
    loading,
    error,
    analyzeReflection,
    saveReflection,
    getReflectionsForDate,
    getReflectionForDateAndMeal,
    getReflectionsForRange,
    deleteReflection,
    refresh: loadTodayReflection,
  };
}

