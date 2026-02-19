/**
 * SeasonLeaderboards Constants
 * 
 * Unified amber accent color and configuration for all 13 categories.
 */

import type { CategoryId } from './StatCategoryIcons';

const AMBER_ACCENT = {
  primary: '#f59e0b',
  shadow: 'rgba(245, 158, 11, 0.25)',
  border: 'rgba(245, 158, 11, 0.2)',
  bgLight: 'rgba(245, 158, 11, 0.04)',
  bgMedium: 'rgba(245, 158, 11, 0.08)',
  textMuted: 'rgba(245, 158, 11, 0.5)',
};

export const CATEGORY_ACCENT_COLORS: Record<CategoryId, typeof AMBER_ACCENT> = {
  sg_total: AMBER_ACCENT,
  scoring_avg: AMBER_ACCENT,
  distance: AMBER_ACCENT,
  accuracy: AMBER_ACCENT,
  gir_pct: AMBER_ACCENT,
  scrambling: AMBER_ACCENT,
  sand_saves: AMBER_ACCENT,
  putting: AMBER_ACCENT,
  world_rank: AMBER_ACCENT,
  events_played: AMBER_ACCENT,
  cuts_made: AMBER_ACCENT,
  top_10: AMBER_ACCENT,
  earnings: AMBER_ACCENT,
};

/** Pill order: overall → tee-to-green → short game → career/season */
export const CATEGORY_CONFIG: { id: CategoryId; name: string }[] = [
  { id: 'sg_total', name: 'Overall' },
  { id: 'scoring_avg', name: 'Scoring' },
  { id: 'distance', name: 'Distance' },
  { id: 'accuracy', name: 'Accuracy' },
  { id: 'gir_pct', name: 'GIR' },
  { id: 'scrambling', name: 'Scrambling' },
  { id: 'sand_saves', name: 'Sand Saves' },
  { id: 'putting', name: 'Putting' },
  { id: 'world_rank', name: 'World Rank' },
  { id: 'events_played', name: 'Events' },
  { id: 'cuts_made', name: 'Cuts Made' },
  { id: 'top_10', name: 'Top 10s' },
  { id: 'earnings', name: 'Earnings' },
];

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
