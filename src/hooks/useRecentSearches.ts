import { useState, useCallback } from 'react';

const MAX_ENTRIES = 5;

export function useRecentSearches(storageKey: string, max = MAX_ENTRIES) {
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addSearch = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s !== trimmed);
      const next = [trimmed, ...filtered].slice(0, max);
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey, max]);

  const removeSearch = useCallback((term: string) => {
    setRecentSearches(prev => {
      const next = prev.filter(s => s !== term);
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  const clearAll = useCallback(() => {
    localStorage.removeItem(storageKey);
    setRecentSearches([]);
  }, [storageKey]);

  return { recentSearches, addSearch, removeSearch, clearAll };
}
