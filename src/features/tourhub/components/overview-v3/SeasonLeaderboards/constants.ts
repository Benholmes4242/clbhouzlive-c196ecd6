/**
 * SeasonLeaderboards Constants
 * 
 * SVG icon references (no emojis)
 */

import type { CategoryId } from './types';

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
