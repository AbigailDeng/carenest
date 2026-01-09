import { useState, useEffect, useCallback } from 'react';
import { MedicalRecord } from '../types';
import {
  saveEntity,
  getEntity,
  getAllEntities,
  deleteEntity,
  queryByIndex,
} from '../services/storage/indexedDB';

export function useMedicalRecords() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const allRecords = await getAllEntities<MedicalRecord>('medicalRecords', {
        orderBy: 'uploadDate',
        orderDirection: 'desc',
      });
      setRecords(allRecords);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load medical records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const addRecord = useCallback(async (record: Partial<MedicalRecord>) => {
    try {
      const saved = await saveEntity<MedicalRecord>('medicalRecords', record as MedicalRecord);
      await loadRecords();
      return saved;
    } catch (err: any) {
      setError(err.message || 'Failed to save medical record');
      throw err;
    }
  }, [loadRecords]);

  const updateRecord = useCallback(async (id: string, updates: Partial<MedicalRecord>) => {
    try {
      const existing = await getEntity<MedicalRecord>('medicalRecords', id);
      if (!existing) {
        throw new Error('Medical record not found');
      }
      const updated = await saveEntity<MedicalRecord>('medicalRecords', {
        ...existing,
        ...updates,
      });
      await loadRecords();
      return updated;
    } catch (err: any) {
      setError(err.message || 'Failed to update medical record');
      throw err;
    }
  }, [loadRecords]);

  const deleteRecord = useCallback(async (id: string) => {
    try {
      await deleteEntity('medicalRecords', id);
      await loadRecords();
    } catch (err: any) {
      setError(err.message || 'Failed to delete medical record');
      throw err;
    }
  }, [loadRecords]);

  const getPendingRecords = useCallback(async () => {
    try {
      return await queryByIndex<MedicalRecord>('medicalRecords', 'processingStatus', 'pending');
    } catch (err: any) {
      setError(err.message || 'Failed to get pending records');
      return [];
    }
  }, []);

  return {
    records,
    loading,
    error,
    addRecord,
    updateRecord,
    deleteRecord,
    getPendingRecords,
    refresh: loadRecords,
  };
}

