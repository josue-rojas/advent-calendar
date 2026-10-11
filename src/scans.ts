// Which candles she has scanned. Stored as a SET of date keys ("2026-11-02"), never a counter,
// so double taps, refreshes, the back button and React StrictMode can't add a candle twice.

const STORAGE_KEY = 'advent-calendar:2026:scans';
const KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function getStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null; // blocked (private mode, embedded browser, ...)
  }
}

/** Pure: insert-only. Returns the same list and added=false if the key is already there. */
export function insertScan(list: string[], key: string): { list: string[]; added: boolean } {
  if (list.includes(key)) return { list, added: false };
  return { list: [...list, key].sort(), added: true };
}

export function loadScans(storage: StorageLike | null = getStorage()): string[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return Array.from(new Set(parsed.filter((k): k is string => typeof k === 'string' && KEY_PATTERN.test(k)))).sort();
  } catch {
    return [];
  }
}

/** Idempotent: writes only when the key is new. `added` is true only for the first scan. */
export function recordScan(
  key: string,
  storage: StorageLike | null = getStorage()
): { list: string[]; added: boolean } {
  const current = loadScans(storage);
  const result = insertScan(current, key);
  if (result.added && storage) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(result.list));
    } catch {
      // storage full or blocked: the board still works for this visit
    }
  }
  return result;
}
