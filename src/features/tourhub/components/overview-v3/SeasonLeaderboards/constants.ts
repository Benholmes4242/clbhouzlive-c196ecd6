/**
 * SeasonLeaderboards Constants
 * 
 * Unified amber accent color and configuration
 */

import type { CategoryId } from './types';

/**
 * Unified accent color system
 * All categories use the same outstanding amber (#f59e0b)
 * for a consistent, premium look.
 */
const AMBER_ACCENT = {
  primary: '#f59e0b',
  shadow: 'rgba(245, 158, 11, 0.25)',
  border: 'rgba(245, 158, 11, 0.2)',
  bgLight: 'rgba(245, 158, 11, 0.04)',
  bgMedium: 'rgba(245, 158, 11, 0.08)',
  textMuted: 'rgba(245, 158, 11, 0.5)',
};

export const CATEGORY_ACCENT_COLORS: Record<CategoryId, {
  primary: string;
  shadow: string;
  border: string;
  bgLight: string;
  bgMedium: string;
  textMuted: string;
}> = {
  distance: AMBER_ACCENT,
  accuracy: AMBER_ACCENT,
  scrambling: AMBER_ACCENT,
  putting: AMBER_ACCENT,
  sg_total: AMBER_ACCENT,
};

export const CATEGORY_CONFIG: {
  id: CategoryId;
  name: string;
}[] = [
  { id: 'distance', name: 'Distance' },
  { id: 'accuracy', name: 'Accuracy' },
  { id: 'scrambling', name: 'Scrambling' },
  { id: 'putting', name: 'Putting' },
  { id: 'sg_total', name: 'Overall' },
];

// Spring config kept for potential future use
export const SPRING_CONFIG = {
  snappy: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 35,
    mass: 0.8,
  },
  gentle: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
  },
};
