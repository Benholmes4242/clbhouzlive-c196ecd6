import { useState } from 'react';

const STORAGE_KEY = 'friends-recent-searches';
const MAX_RECENT = 5;

export function useFriendsRecentSearches() {
  const [searches, setSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const addSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...searches.filter(s => s !== trimmed)].slice(0, MAX_RECENT);
    setSearches(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const removeSearch = (query: string) => {
    const updated = searches.filter(s => s !== query);
    setSearches(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const clearAll = () => {
    setSearches([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { searches, addSearch, removeSearch, clearAll };
}
