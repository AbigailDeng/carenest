import { useState, useEffect, useCallback } from 'react';
import { SymptomEntry } from '../types';
import {
  saveEntity,
  getEntity,
  getAllEntities,
  deleteEntity,
} from '../services/storage/indexedDB';

export function useSymptomEntries() {
  const [entries, setEntries] = useState<SymptomEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      const allEntries = await getAllEntities<SymptomEntry>('symptomEntries', {
        orderBy: 'loggedDate',
        orderDirection: 'desc',
      });
      setEntries(allEntries);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load symptom entries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const addEntry = useCallback(async (entry: Partial<SymptomEntry>) => {
    try {
      const now = new Date().toISOString();
      const fullEntry: SymptomEntry = {
        id: entry.id || crypto.randomUUID(),
        symptoms: entry.symptoms || '',
        notes: entry.notes || null,
        severity: entry.severity || null,
        loggedDate: entry.loggedDate || now,
        loggedTime: entry.loggedTime || now,
        aiAnalysis: entry.aiAnalysis || null,
        processingStatus: entry.processingStatus || 'pending',
        errorMessage: entry.errorMessage || null,
        createdAt: entry.createdAt || now,
        updatedAt: entry.updatedAt || now,
      };
      const saved = await saveEntity<SymptomEntry>('symptomEntries', fullEntry);
      await loadEntries();
      return saved;
    } catch (err: any) {
      setError(err.message || 'Failed to save symptom entry');
      throw err;
    }
  }, [loadEntries]);

  const updateEntry = useCallback(async (id: string, updates: Partial<SymptomEntry>) => {
    try {
      const existing = await getEntity<SymptomEntry>('symptomEntries', id);
      if (!existing) {
        throw new Error('Symptom entry not found');
      }
      const updated = await saveEntity<SymptomEntry>('symptomEntries', {
        ...existing,
        ...updates,
      });
      await loadEntries();
      return updated;
    } catch (err: any) {
      setError(err.message || 'Failed to update symptom entry');
      throw err;
    }
  }, [loadEntries]);

  const deleteEntry = useCallback(async (id: string) => {
    try {
      await deleteEntity('symptomEntries', id);
      await loadEntries();
    } catch (err: any) {
      setError(err.message || 'Failed to delete symptom entry');
      throw err;
    }
  }, [loadEntries]);

  const getEntriesByDateRange = useCallback(async (startDate: string, endDate: string) => {
    try {
      const allEntries = await getAllEntities<SymptomEntry>('symptomEntries');
      return allEntries.filter((entry) => {
        const entryDate = new Date(entry.loggedDate);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return entryDate >= start && entryDate <= end;
      });
    } catch (err: any) {
      setError(err.message || 'Failed to get entries by date range');
      return [];
    }
  }, []);

  return {
    entries,
    loading,
    error,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntriesByDateRange,
    refresh: loadEntries,
  };
}

