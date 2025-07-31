import { useState, useEffect } from 'react';

export type ViewType = 'cards' | 'list';
export type SortType = 'rank-asc' | 'rank-desc' | 'recent';

const VIEW_PREFERENCE_KEY = 'top100-view-preference';
const SORT_PREFERENCE_KEY = 'top100-sort-preference';

// Helper to safely get from localStorage
const getStoredValue = (key: string, defaultValue: string): string => {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const stored = localStorage.getItem(key);
    return stored || defaultValue;
  } catch (error) {
    console.warn(`Failed to read ${key} from localStorage:`, error);
    return defaultValue;
  }
};

// Helper to safely set to localStorage
const setStoredValue = (key: string, value: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`Failed to save ${key} to localStorage:`, error);
  }
};

export const useViewPreference = () => {
  // Initialize with default values to prevent hydration mismatch
  const [viewType, setViewType] = useState<ViewType>('cards');
  const [sortType, setSortType] = useState<SortType>('rank-asc');
  const [isHydrated, setIsHydrated] = useState(false);

  // Load preferences from localStorage after component mounts
  useEffect(() => {
    const storedViewType = getStoredValue(VIEW_PREFERENCE_KEY, 'cards') as ViewType;
    const storedSortType = getStoredValue(SORT_PREFERENCE_KEY, 'rank-asc') as SortType;
    
    setViewType(storedViewType);
    setSortType(storedSortType);
    setIsHydrated(true);
  }, []);

  const updateViewType = (newViewType: ViewType) => {
    setViewType(newViewType);
    setStoredValue(VIEW_PREFERENCE_KEY, newViewType);
    
    console.log(`📁 View preference updated to: ${newViewType}`);
  };

  const updateSortType = (newSortType: SortType) => {
    setSortType(newSortType);
    setStoredValue(SORT_PREFERENCE_KEY, newSortType);
    
    console.log(`🔄 Sort preference updated to: ${newSortType}`);
  };

  return {
    viewType,
    sortType,
    setViewType: updateViewType,
    setSortType: updateSortType,
    isHydrated, // Expose hydration status to prevent flash
  };
};