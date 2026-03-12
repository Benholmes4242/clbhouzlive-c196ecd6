import { useState, useCallback } from 'react';

const STORAGE_KEY = 'explore-recent-searches';
const MAX_ITEMS = 5;

function loadSearches(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSearches(items: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
}

export function useExploreRecentSearches() {
  const [searches, setSearches] = useState<string[]>(loadSearches);

  const addSearch = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setSearches((prev) => {
      const next = [trimmed, ...prev.filter((s) => s !== trimmed)].slice(0, MAX_ITEMS);
      saveSearches(next);
      return next;
    });
  }, []);

  const removeSearch = useCallback((term: string) => {
    setSearches((prev) => {
      const next = prev.filter((s) => s !== term);
      saveSearches(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setSearches([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { searches, addSearch, removeSearch, clearAll };
}
