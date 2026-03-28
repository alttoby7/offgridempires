import type { SizingResult } from "./types";

const STORAGE_KEY = "oge_sizing";

export interface StoredSizing {
  sizing: SizingResult;
  savedAt: number; // epoch ms
}

/** Save calculator sizing results to localStorage */
export function saveSizing(sizing: SizingResult): void {
  if (typeof window === "undefined") return;
  try {
    const data: StoredSizing = { sizing, savedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // quota exceeded or private browsing — silently fail
  }
}

/** Load sizing from localStorage. Returns null if missing or older than 7 days. */
export function loadSizing(): StoredSizing | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: StoredSizing = JSON.parse(raw);
    // Expire after 7 days
    if (Date.now() - data.savedAt > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/** Clear saved sizing */
export function clearSizing(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
