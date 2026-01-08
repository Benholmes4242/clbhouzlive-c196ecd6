/**
 * useRecentlyViewedGames - localStorage-backed recently viewed game IDs
 */
import { useState, useCallback, useEffect } from 'react';

const MAX_ITEMS = 5;
const STORAGE_KEY = 'clbhouz:recentGames';

function getStorageKey(userId?: string): string {
  return `${STORAGE_KEY}:${userId || 'anon'}`;
}

export function useRecentlyViewedGames(userId?: string) {
  const [recentIds, setRecentIds] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(getStorageKey(userId));
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentIds(parsed.slice(0, MAX_ITEMS));
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, [userId]);

  const addRecentGame = useCallback((gameId: string) => {
    setRecentIds((prev) => {
      // Remove if already exists, then add to front
      const filtered = prev.filter((id) => id !== gameId);
      const updated = [gameId, ...filtered].slice(0, MAX_ITEMS);
      
      try {
        localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
      
      return updated;
    });
  }, [userId]);

  const clearRecent = useCallback(() => {
    setRecentIds([]);
    try {
      localStorage.removeItem(getStorageKey(userId));
    } catch {
      // Ignore
    }
  }, [userId]);

  return { recentIds, addRecentGame, clearRecent };
}
