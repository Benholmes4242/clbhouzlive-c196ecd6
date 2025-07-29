import { useState, useEffect } from 'react';

export type ViewType = 'cards' | 'list';

const VIEW_PREFERENCE_KEY = 'top100-view-preference';

export const useViewPreference = () => {
  const [viewType, setViewType] = useState<ViewType>(() => {
    const stored = localStorage.getItem(VIEW_PREFERENCE_KEY);
    return (stored as ViewType) || 'cards';
  });

  const updateViewType = (newViewType: ViewType) => {
    setViewType(newViewType);
    localStorage.setItem(VIEW_PREFERENCE_KEY, newViewType);
  };

  return {
    viewType,
    setViewType: updateViewType
  };
};