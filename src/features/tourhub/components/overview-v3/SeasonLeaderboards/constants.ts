// src/features/tourhub/components/overview-v3/SeasonLeaderboards/constants.ts

import type { CategoryId } from './types';

export const CATEGORY_CONFIG: {
  id: CategoryId;
  name: string;
  icon: string;
}[] = [
  { id: 'distance', name: 'Distance', icon: '🏌️' },
  { id: 'accuracy', name: 'Accuracy', icon: '🎯' },
  { id: 'scrambling', name: 'Scrambling', icon: '🔄' },
  { id: 'putting', name: 'Putting', icon: '🕳️' },
  { id: 'sg_total', name: 'SG: Total', icon: '📊' },
];

export const RANK_COLORS = {
  1: 'from-amber-400 to-yellow-500',      // Gold
  2: 'from-gray-300 to-gray-400',          // Silver
  3: 'from-orange-400 to-amber-600',       // Bronze
} as const;

export const CARD_GRADIENTS = {
  1: 'from-gray-900/80 via-gray-900/60 to-gray-900/90',
  2: 'from-slate-800/80 via-slate-800/60 to-slate-800/90',
  3: 'from-slate-800/80 via-slate-800/60 to-slate-800/90',
} as const;

export const SKILL_BAR_COLORS = [
  'bg-orange-400',
  'bg-orange-400',
  'bg-orange-500',
  'bg-orange-500',
  'bg-orange-600',
  'bg-orange-600',
  'bg-red-500',
  'bg-red-500',
  'bg-red-600',
  'bg-red-700',
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
