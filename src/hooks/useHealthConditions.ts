import { useState, useEffect, useCallback } from 'react';
import { HealthCondition } from '../types';
import {
  saveEntity,
  getEntity,
  getAllEntities,
  deleteEntity,
  queryByIndex,
} from '../services/storage/indexedDB';

export function useHealthConditions() {
  const [conditions, setConditions] = useState<HealthCondition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConditions = useCallback(async () => {
    try {
      setLoading(true);
      const allConditions = await getAllEntities<HealthCondition>('healthConditions', {
        orderBy: 'documentedDate',
        orderDirection: 'desc',
      });
      setConditions(allConditions);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load health conditions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConditions();
  }, [loadConditions]);

  const addCondition = useCallback(async (condition: Partial<HealthCondition>) => {
    try {
      const saved = await saveEntity<HealthCondition>('healthConditions', condition as HealthCondition);
      await loadConditions();
      return saved;
    } catch (err: any) {
      setError(err.message || 'Failed to save health condition');
      throw err;
    }
  }, [loadConditions]);

  const updateCondition = useCallback(async (id: string, updates: Partial<HealthCondition>) => {
    try {
      const existing = await getEntity<HealthCondition>('healthConditions', id);
      if (!existing) {
        throw new Error('Health condition not found');
      }
      const updated = await saveEntity<HealthCondition>('healthConditions', {
        ...existing,
        ...updates,
      });
      await loadConditions();
      return updated;
    } catch (err: any) {
      setError(err.message || 'Failed to update health condition');
      throw err;
    }
  }, [loadConditions]);

  const deleteCondition = useCallback(async (id: string) => {
    try {
      await deleteEntity('healthConditions', id);
      await loadConditions();
    } catch (err: any) {
      setError(err.message || 'Failed to delete health condition');
      throw err;
    }
  }, [loadConditions]);

  const getConditionsByRecord = useCallback(async (recordId: string) => {
    try {
      return await queryByIndex<HealthCondition>('healthConditions', 'sourceRecordId', recordId);
    } catch (err: any) {
      setError(err.message || 'Failed to get conditions by record');
      return [];
    }
  }, []);

  return {
    conditions,
    loading,
    error,
    addCondition,
    updateCondition,
    deleteCondition,
    getConditionsByRecord,
    refresh: loadConditions,
  };
}

