/**
 * useTourLens - Tour Lens state management
 * Handles the global reweighting system for the Golf Universe
 */

import { useState, useCallback, useMemo } from 'react';
import type { TourLens } from '../types';

interface TourLensConfig {
  id: TourLens;
  label: string;
  shortLabel: string;
  color: string;
  icon?: string;
}

export const TOUR_LENS_CONFIG: TourLensConfig[] = [
  { id: 'global', label: 'Global', shortLabel: 'All', color: 'hsl(220, 80%, 50%)' },
  { id: 'pga', label: 'PGA Tour', shortLabel: 'PGA', color: 'hsl(210, 70%, 45%)' },
  { id: 'lpga', label: 'LPGA Tour', shortLabel: 'LPGA', color: 'hsl(330, 70%, 50%)' },
  { id: 'liv', label: 'LIV Golf', shortLabel: 'LIV', color: 'hsl(0, 0%, 20%)' },
  { id: 'dpworld', label: 'DP World Tour', shortLabel: 'DPWT', color: 'hsl(45, 80%, 45%)' },
];

export function useTourLens(initialLens: TourLens = 'global') {
  const [activeLens, setActiveLens] = useState<TourLens>(initialLens);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const switchLens = useCallback((lens: TourLens) => {
    if (lens === activeLens) return;
    
    setIsTransitioning(true);
    // Short delay for animation
    setTimeout(() => {
      setActiveLens(lens);
      setIsTransitioning(false);
    }, 150);
  }, [activeLens]);

  const currentConfig = useMemo(() => {
    return TOUR_LENS_CONFIG.find(c => c.id === activeLens) || TOUR_LENS_CONFIG[0];
  }, [activeLens]);

  return {
    activeLens,
    setActiveLens: switchLens,
    isTransitioning,
    currentConfig,
    allLenses: TOUR_LENS_CONFIG,
  };
}
