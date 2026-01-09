import {
  MedicalRecord,
  HealthCondition,
  SymptomEntry,
  MoodEntry,
  JournalEntry,
  IngredientList,
  MealSuggestion,
  UserPreferences,
} from '../types';
import {
  getAllEntities,
  getEntity,
} from '../services/storage/indexedDB';

/**
 * Data export utilities
 * Supports JSON and CSV export formats
 */

export interface ExportData {
  medicalRecords: MedicalRecord[];
  healthConditions: HealthCondition[];
  symptomEntries: SymptomEntry[];
  moodEntries: MoodEntry[];
  journalEntries: JournalEntry[];
  ingredientLists: IngredientList[];
  mealSuggestions: MealSuggestion[];
  userPreferences: UserPreferences | null;
  exportDate: string;
  exportVersion: string;
}

/**
 * Export all data as JSON
 */
export async function exportAsJSON(): Promise<string> {
  const data: ExportData = {
    medicalRecords: await getAllEntities<MedicalRecord>('medicalRecords'),
    healthConditions: await getAllEntities<HealthCondition>('healthConditions'),
    symptomEntries: await getAllEntities<SymptomEntry>('symptomEntries'),
    moodEntries: await getAllEntities<MoodEntry>('moodEntries'),
    journalEntries: await getAllEntities<JournalEntry>('journalEntries'),
    ingredientLists: await getAllEntities<IngredientList>('ingredientLists'),
    mealSuggestions: await getAllEntities<MealSuggestion>('mealSuggestions'),
    userPreferences: await getEntity<UserPreferences>('userPreferences', 'singleton'),
    exportDate: new Date().toISOString(),
    exportVersion: '1.0',
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Export data as CSV (flattened format)
 */
export async function exportAsCSV(): Promise<string> {
  const rows: string[] = [];
  
  // CSV Header
  rows.push('Type,ID,Created,Updated,Data');

  // Export each entity type
  const medicalRecords = await getAllEntities<MedicalRecord>('medicalRecords');
  medicalRecords.forEach((record) => {
    rows.push(
      `MedicalRecord,${record.id},${record.createdAt},${record.updatedAt},"${escapeCSV(JSON.stringify(record))}"`
    );
  });

  const healthConditions = await getAllEntities<HealthCondition>('healthConditions');
  healthConditions.forEach((condition) => {
    rows.push(
      `HealthCondition,${condition.id},${condition.createdAt},${condition.updatedAt},"${escapeCSV(JSON.stringify(condition))}"`
    );
  });

  const symptomEntries = await getAllEntities<SymptomEntry>('symptomEntries');
  symptomEntries.forEach((entry) => {
    rows.push(
      `SymptomEntry,${entry.id},${entry.createdAt},${entry.updatedAt},"${escapeCSV(JSON.stringify(entry))}"`
    );
  });

  const moodEntries = await getAllEntities<MoodEntry>('moodEntries');
  moodEntries.forEach((entry) => {
    rows.push(
      `MoodEntry,${entry.id},${entry.createdAt},${entry.updatedAt},"${escapeCSV(JSON.stringify(entry))}"`
    );
  });

  const journalEntries = await getAllEntities<JournalEntry>('journalEntries');
  journalEntries.forEach((entry) => {
    rows.push(
      `JournalEntry,${entry.id},${entry.createdAt},${entry.updatedAt},"${escapeCSV(JSON.stringify(entry))}"`
    );
  });

  return rows.join('\n');
}

/**
 * Download exported data as file
 */
export function downloadExport(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escape CSV field values
 */
function escapeCSV(value: string): string {
  return value.replace(/"/g, '""').replace(/\n/g, ' ');
}

