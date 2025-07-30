import { useState } from 'react';

export type ViewType = 'cards' | 'list';
export type SortType = 'rank-asc' | 'rank-desc' | 'recent';

const VIEW_PREFERENCE_KEY = 'top100-view-preference';
const SORT_PREFERENCE_KEY = 'top100-sort-preference';

export const useViewPreference = () => {
  const [viewType, setViewType] = useState<ViewType>(() => {
    const stored = localStorage.getItem(VIEW_PREFERENCE_KEY);
    return (stored as ViewType) || 'cards';
  });

  const [sortType, setSortType] = useState<SortType>(() => {
    const stored = localStorage.getItem(SORT_PREFERENCE_KEY);
    return (stored as SortType) || 'rank-asc';
  });

  const updateViewType = (newViewType: ViewType) => {
    setViewType(newViewType);
    localStorage.setItem(VIEW_PREFERENCE_KEY, newViewType);
  };

  const updateSortType = (newSortType: SortType) => {
    setSortType(newSortType);
    localStorage.setItem(SORT_PREFERENCE_KEY, newSortType);
  };

  return {
    viewType,
    sortType,
    setViewType: updateViewType,
    setSortType: updateSortType
  };
};