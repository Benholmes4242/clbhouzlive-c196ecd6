/**
 * Leaders tab category definitions.
 * Single source of truth for all 12 stat categories.
 */

import {
  Globe,
  Calendar,
  Scissors,
  Trophy,
  DollarSign,
  Gauge,
  Zap,
  Crosshair,
  Circle,
  Flag,
  Sun,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';
import type { TourPlayerStatistics } from '../../hooks/useTourHubData';

export interface LeaderCategory {
  key: string;
  label: string;
  shortLabel: string;
  section: 'performance' | 'stats';
  icon: LucideIcon;
  sortDirection: 'asc' | 'desc';
  unit: string;
  accessor: (stats: TourPlayerStatistics) => number | null;
  format: (value: number) => string;
}

export const LEADER_CATEGORIES: LeaderCategory[] = [
  // ── Season Performance ──
  {
    key: 'world_rank',
    label: 'World Ranking',
    shortLabel: 'World',
    section: 'performance',
    icon: Globe,
    sortDirection: 'asc',
    unit: '',
    accessor: (s) => s.world_rank,
    format: (v) => `#${v}`,
  },
  {
    key: 'events_played',
    label: 'Events Played',
    shortLabel: 'Events',
    section: 'performance',
    icon: Calendar,
    sortDirection: 'desc',
    unit: 'events',
    accessor: (s) => s.events_played,
    format: (v) => `${v}`,
  },
  {
    key: 'cuts_made',
    label: 'Cuts Made',
    shortLabel: 'Cuts',
    section: 'performance',
    icon: Scissors,
    sortDirection: 'desc',
    unit: 'cuts',
    accessor: (s) => s.cuts_made,
    format: (v) => `${v}`,
  },
  {
    key: 'top_10',
    label: 'Top 10 Finishes',
    shortLabel: 'Top 10s',
    section: 'performance',
    icon: Trophy,
    sortDirection: 'desc',
    unit: '',
    accessor: (s) => s.top_10s,
    format: (v) => `${v}`,
  },
  {
    key: 'earnings',
    label: 'Season Earnings',
    shortLabel: 'Earnings',
    section: 'performance',
    icon: DollarSign,
    sortDirection: 'desc',
    unit: '',
    accessor: (s) => s.earnings,
    format: (v) =>
      v >= 1_000_000
        ? `$${(v / 1_000_000).toFixed(2)}M`
        : `$${v.toLocaleString()}`,
  },

  // ── Ball Striking & Short Game ──
  {
    key: 'scoring_avg',
    label: 'Scoring Average',
    shortLabel: 'Scoring',
    section: 'stats',
    icon: Gauge,
    sortDirection: 'asc',
    unit: 'avg',
    accessor: (s) => s.scoring_average,
    format: (v) => v.toFixed(3),
  },
  {
    key: 'drive_avg',
    label: 'Driving Distance',
    shortLabel: 'Distance',
    section: 'stats',
    icon: Zap,
    sortDirection: 'desc',
    unit: 'yds',
    accessor: (s) => s.driving_distance,
    format: (v) => `${v.toFixed(1)} yds`,
  },
  {
    key: 'drive_acc',
    label: 'Driving Accuracy',
    shortLabel: 'Accuracy',
    section: 'stats',
    icon: Crosshair,
    sortDirection: 'desc',
    unit: '%',
    accessor: (s) => s.driving_accuracy,
    format: (v) => `${v.toFixed(1)}%`,
  },
  {
    key: 'gir_pct',
    label: 'Greens in Regulation',
    shortLabel: 'GIR',
    section: 'stats',
    icon: Circle,
    sortDirection: 'desc',
    unit: '%',
    accessor: (s) => s.greens_in_reg,
    format: (v) => `${v.toFixed(1)}%`,
  },
  {
    key: 'putt_avg',
    label: 'Putting Average',
    shortLabel: 'Putting',
    section: 'stats',
    icon: Flag,
    sortDirection: 'asc',
    unit: 'avg',
    accessor: (s) => s.putting_average,
    format: (v) => v.toFixed(3),
  },
  {
    key: 'sand_saves_pct',
    label: 'Sand Saves',
    shortLabel: 'Sand',
    section: 'stats',
    icon: Sun,
    sortDirection: 'desc',
    unit: '%',
    accessor: (s) => s.sand_saves,
    format: (v) => `${v.toFixed(1)}%`,
  },
  {
    key: 'scrambling_pct',
    label: 'Scrambling',
    shortLabel: 'Scramble',
    section: 'stats',
    icon: RefreshCw,
    sortDirection: 'desc',
    unit: '%',
    accessor: (s) => s.scrambling,
    format: (v) => `${v.toFixed(1)}%`,
  },
];

/** Convenience lookups */
export const PERFORMANCE_CATEGORIES = LEADER_CATEGORIES.filter(
  (c) => c.section === 'performance'
);
export const STATS_CATEGORIES = LEADER_CATEGORIES.filter(
  (c) => c.section === 'stats'
);

export function getCategoryByKey(key: string): LeaderCategory | undefined {
  return LEADER_CATEGORIES.find((c) => c.key === key);
}
