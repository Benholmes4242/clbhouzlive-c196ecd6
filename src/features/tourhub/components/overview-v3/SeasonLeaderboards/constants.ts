/**
 * SeasonLeaderboards Constants
 * 
 * Unified amber accent color and configuration for all 13 categories.
 */

import type { CategoryId } from './StatCategoryIcons';

const SLATE_ACCENT = {
  primary: '#0F172A',
  shadow: 'rgba(15, 23, 42, 0.2)',
  border: 'rgba(15, 23, 42, 0.15)',
  bgLight: 'rgba(15, 23, 42, 0.03)',
  bgMedium: 'rgba(15, 23, 42, 0.06)',
  textMuted: 'rgba(15, 23, 42, 0.4)',
};

export const CATEGORY_ACCENT_COLORS: Record<CategoryId, typeof SLATE_ACCENT> = {
  sg_total: SLATE_ACCENT,
  scoring_avg: SLATE_ACCENT,
  earnings: SLATE_ACCENT,
  distance: SLATE_ACCENT,
  accuracy: SLATE_ACCENT,
  gir_pct: SLATE_ACCENT,
  putting: SLATE_ACCENT,
  scrambling: SLATE_ACCENT,
  sand_saves: SLATE_ACCENT,
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
