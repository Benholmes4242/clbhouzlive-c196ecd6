import { useState, useEffect } from 'react';
import type { TourKey } from '../components/TourSwitcherPills';

const STORAGE_KEY = 'tourhub:selectedTour';
const DEFAULT_TOUR: TourKey = 'pga';

export function useTourSelection() {
  const [selectedTour, setSelectedTour] = useState<TourKey>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ['pga', 'lpga', 'eur', 'champions-tour'].includes(stored)) {
      return stored as TourKey;
    }
    return DEFAULT_TOUR;
  });
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, selectedTour);
  }, [selectedTour]);
  
  return { selectedTour, setSelectedTour };
}
