/**
 * SeasonLeaderboards Constants
 * 
 * Category accent colors and configuration
 */

import type { CategoryId } from './types';

/**
 * Category accent color system
 * Each stat category has a unique accent that carries through:
 * - Active pill background
 * - Leader card accents
 * - Big stat number
 * - Position badges
 * - Benchmark bar
 * - Placeholder avatars
 * - Footer button
 */
export const CATEGORY_ACCENT_COLORS: Record<CategoryId, {
  primary: string;      // Main accent color
  shadow: string;       // For box-shadow (0.25 opacity)
  border: string;       // For borders (0.2 opacity)
  bgLight: string;      // Very light bg (0.04-0.08 opacity)
  bgMedium: string;     // Medium bg (0.1 opacity)
  textMuted: string;    // Muted text (0.5 opacity)
}> = {
  distance: {
    primary: '#16A34A',
    shadow: 'rgba(22, 163, 74, 0.25)',
    border: 'rgba(22, 163, 74, 0.2)',
    bgLight: 'rgba(22, 163, 74, 0.04)',
    bgMedium: 'rgba(22, 163, 74, 0.08)',
    textMuted: 'rgba(22, 163, 74, 0.5)',
  },
  accuracy: {
    primary: '#3478F6',
    shadow: 'rgba(52, 120, 246, 0.25)',
    border: 'rgba(52, 120, 246, 0.2)',
    bgLight: 'rgba(52, 120, 246, 0.04)',
    bgMedium: 'rgba(52, 120, 246, 0.08)',
    textMuted: 'rgba(52, 120, 246, 0.5)',
  },
  scrambling: {
    primary: '#FF9500',
    shadow: 'rgba(255, 149, 0, 0.25)',
    border: 'rgba(255, 149, 0, 0.2)',
    bgLight: 'rgba(255, 149, 0, 0.04)',
    bgMedium: 'rgba(255, 149, 0, 0.08)',
    textMuted: 'rgba(255, 149, 0, 0.5)',
  },
  putting: {
    primary: '#8B5CF6',
    shadow: 'rgba(139, 92, 246, 0.25)',
    border: 'rgba(139, 92, 246, 0.2)',
    bgLight: 'rgba(139, 92, 246, 0.04)',
    bgMedium: 'rgba(139, 92, 246, 0.08)',
    textMuted: 'rgba(139, 92, 246, 0.5)',
  },
  sg_total: {
    primary: '#B8860B',
    shadow: 'rgba(184, 134, 11, 0.25)',
    border: 'rgba(184, 134, 11, 0.2)',
    bgLight: 'rgba(184, 134, 11, 0.04)',
    bgMedium: 'rgba(184, 134, 11, 0.08)',
    textMuted: 'rgba(184, 134, 11, 0.5)',
  },
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
