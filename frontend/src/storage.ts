import type { AnalysisRecord } from './types';

const STORAGE_KEY = 'comfuse_analysis_history';

export function getHistory(): AnalysisRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.warn('Failed to parse analysis history from localStorage:', err);
    return [];
  }
}

export function saveRecord(record: AnalysisRecord): AnalysisRecord[] {
  try {
    const current = getHistory();
    // Prepend new record, keep up to 100 historical items
    const updated = [record, ...current.filter((r) => r.id !== record.id)].slice(0, 100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to save analysis record to localStorage:', err);
    return getHistory();
  }
}

export function deleteRecord(id: string): AnalysisRecord[] {
  try {
    const current = getHistory();
    const updated = current.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to delete analysis record from localStorage:', err);
    return getHistory();
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear analysis history from localStorage:', err);
  }
}
