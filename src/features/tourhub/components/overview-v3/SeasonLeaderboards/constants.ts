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
  { id: 'putting', name: 'Putting', icon: '⛳' },
  { id: 'sg_total', name: 'Overall', icon: '📊' },
];

// Metallic rank colors (consistent with World Rankings)
export const RANK_COLORS = {
  1: '#FFD700', // Gold
  2: '#C0C0C0', // Silver
  3: '#CD7F32', // Bronze
} as const;

// Podium card backgrounds
export const PODIUM_BACKGROUNDS = {
  1: 'linear-gradient(180deg, rgba(255, 215, 0, 0.08) 0%, white 100%)',
  2: 'linear-gradient(180deg, rgba(192, 192, 192, 0.08) 0%, white 100%)',
  3: 'linear-gradient(180deg, rgba(205, 127, 50, 0.08) 0%, white 100%)',
} as const;

// Podium badge gradients
export const BADGE_GRADIENTS = {
  1: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
  2: 'linear-gradient(135deg, #E8E8E8 0%, #B8B8B8 100%)',
  3: 'linear-gradient(135deg, #CD7F32 0%, #A0522D 100%)',
} as const;

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
