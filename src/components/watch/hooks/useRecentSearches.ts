import { useState, useCallback } from 'react';

const STORAGE_KEY = 'watch-recent-searches';
const MAX_ENTRIES = 10;

export function useRecentSearches() {
  const [searches, setSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addSearch = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setSearches(prev => {
      const filtered = prev.filter(s => s !== trimmed);
      const next = [trimmed, ...filtered].slice(0, MAX_ENTRIES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeSearch = useCallback((term: string) => {
    setSearches(prev => {
      const next = prev.filter(s => s !== term);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSearches([]);
  }, []);

  return { searches, addSearch, removeSearch, clearAll };
}
