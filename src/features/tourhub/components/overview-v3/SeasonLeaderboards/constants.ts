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
  earnings: AMBER_ACCENT,
  distance: AMBER_ACCENT,
  accuracy: AMBER_ACCENT,
  gir_pct: AMBER_ACCENT,
  putting: AMBER_ACCENT,
  scrambling: AMBER_ACCENT,
  sand_saves: AMBER_ACCENT,
};

/** Pill order: power → money → efficiency → short game */
export const CATEGORY_CONFIG: { id: CategoryId; name: string }[] = [
  { id: 'distance',    name: '💪 Driving Distance'  },
  { id: 'earnings',    name: '💰 Earnings'           },
  { id: 'sg_total',    name: '⚡ SG Total'           },
  { id: 'scoring_avg', name: '📊 Scoring Average'    },
  { id: 'gir_pct',     name: '⛳ GIR'                },
  { id: 'putting',     name: '🕳️ Putting'            },
  { id: 'accuracy',    name: '🎯 Driving Accuracy'   },
  { id: 'scrambling',  name: '🔀 Scrambling'         },
  { id: 'sand_saves',  name: '🏖️ Sand Saves'         },
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
