/**
 * Leaders tab category definitions.
 * Single source of truth for all 12 stat categories.
 * Includes descriptions, tour averages, and accent colors for the immersive hero.
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
  emoji: string;
  sortDirection: 'asc' | 'desc';
  unit: string;
  description: string;
  tourAverage: string;
  accentColor: string;
  accessor: (stats: TourPlayerStatistics) => number | null;
  format: (value: number) => string;
}

export const LEADER_CATEGORIES: LeaderCategory[] = [
  // ── Season Performance ──
  {
    key: 'world_rank',
    label: 'World Ranking',
    shortLabel: 'World Rankings',
    section: 'performance',
    icon: Globe,
    emoji: '🌍',
    sortDirection: 'asc',
    unit: '',
    description: 'Official World Golf Ranking based on rolling average points from tournament results.',
    tourAverage: '',
    accentColor: '#B8860B',
    accessor: (s) => s.world_rank,
    format: (v) => `#${v}`,
  },
  {
    key: 'events_played',
    label: 'Events Played',
    shortLabel: 'Events Played',
    section: 'performance',
    icon: Calendar,
    emoji: '📅',
    sortDirection: 'desc',
    unit: 'events',
    description: 'Total number of tournament starts this season.',
    tourAverage: '24',
    accentColor: '#3478F6',
    accessor: (s) => s.events_played,
    format: (v) => `${v}`,
  },
  {
    key: 'cuts_made',
    label: 'Cuts Made',
    shortLabel: 'Cuts Made',
    section: 'performance',
    icon: Scissors,
    emoji: '✂️',
    sortDirection: 'desc',
    unit: 'cuts',
    description: 'Number of times the player made the cut and played the weekend rounds.',
    tourAverage: '16',
    accentColor: '#16A34A',
    accessor: (s) => s.cuts_made,
    format: (v) => `${v}`,
  },
  {
    key: 'top_10',
    label: 'Top 10 Finishes',
    shortLabel: 'Top 10s',
    section: 'performance',
    icon: Trophy,
    emoji: '🏆',
    sortDirection: 'desc',
    unit: '',
    description: 'Number of top-10 finishes in stroke play events this season.',
    tourAverage: '2',
    accentColor: '#B8860B',
    accessor: (s) => s.top_10s,
    format: (v) => `${v}`,
  },
  {
    key: 'earnings',
    label: 'Season Earnings',
    shortLabel: 'Earnings',
    section: 'performance',
    icon: DollarSign,
    emoji: '💰',
    sortDirection: 'desc',
    unit: '',
    description: 'Total prize money earned this season across all events.',
    tourAverage: '$1.8M',
    accentColor: '#16A34A',
    accessor: (s) => s.earnings,
    format: (v) =>
      v >= 1_000_000
        ? `$${(v / 1_000_000).toFixed(2)}M`
        : `$${v.toLocaleString()}`,
  },

  // ── Ball Striking & Short Game ──
  {
    key: 'strokes_gained_total',
    label: 'Strokes Gained Total',
    shortLabel: 'SG Total',
    section: 'stats',
    icon: Trophy,
    emoji: '⚡',
    sortDirection: 'desc',
    unit: '',
    description: 'Total strokes gained versus the field average per round. The most comprehensive measure of overall performance.',
    tourAverage: '',
    accentColor: '#f59e0b',
    accessor: (s) => s.strokes_gained_total,
    format: (v) => (v >= 0 ? '+' : '') + v.toFixed(2),
  },
  {
    key: 'scoring_avg',
    label: 'Scoring Average',
    shortLabel: 'Scoring Average',
    section: 'stats',
    icon: Gauge,
    emoji: '📊',
    sortDirection: 'asc',
    unit: 'avg',
    description: 'Average score per round. Lower is better.',
    tourAverage: '71.2',
    accentColor: '#FF9500',
    accessor: (s) => s.scoring_average,
    format: (v) => v.toFixed(3),
  },
  {
    key: 'drive_avg',
    label: 'Driving Distance',
    shortLabel: 'Driving Distance',
    section: 'stats',
    icon: Zap,
    emoji: '💪',
    sortDirection: 'desc',
    unit: 'yds',
    description: 'Average driving distance off the tee in yards.',
    tourAverage: '296.4 yds',
    accentColor: '#16A34A',
    accessor: (s) => s.driving_distance,
    format: (v) => `${v.toFixed(1)}`,
  },
  {
    key: 'drive_acc',
    label: 'Driving Accuracy',
    shortLabel: 'Driving Accuracy',
    section: 'stats',
    icon: Crosshair,
    emoji: '🎯',
    sortDirection: 'desc',
    unit: '%',
    description: 'Percentage of tee shots landing in the fairway.',
    tourAverage: '60.5%',
    accentColor: '#3478F6',
    accessor: (s) => s.driving_accuracy,
    format: (v) => v.toFixed(1),
  },
  {
    key: 'gir_pct',
    label: 'Greens in Regulation',
    shortLabel: 'GIR',
    section: 'stats',
    icon: Circle,
    emoji: '⛳',
    sortDirection: 'desc',
    unit: '%',
    description: 'Percentage of greens hit in regulation (on the green in par minus 2 strokes).',
    tourAverage: '65.0%',
    accentColor: '#16A34A',
    accessor: (s) => s.greens_in_reg,
    format: (v) => v.toFixed(1),
  },
  {
    key: 'putt_avg',
    label: 'Putting Average',
    shortLabel: 'Putting',
    section: 'stats',
    icon: Flag,
    emoji: '🕳️',
    sortDirection: 'asc',
    unit: 'avg',
    description: 'Average number of putts per green hit in regulation. Lower is better.',
    tourAverage: '1.790',
    accentColor: '#8B5CF6',
    accessor: (s) => s.putting_average,
    format: (v) => v.toFixed(3),
  },
  {
    key: 'sand_saves_pct',
    label: 'Sand Saves',
    shortLabel: 'Sand Saves',
    section: 'stats',
    icon: Sun,
    emoji: '🏖️',
    sortDirection: 'desc',
    unit: '%',
    description: 'Percentage of up-and-downs from greenside bunkers. Higher is better.',
    tourAverage: '49.5%',
    accentColor: '#FF9500',
    accessor: (s) => s.sand_saves,
    format: (v) => v.toFixed(1),
  },
  {
    key: 'scrambling_pct',
    label: 'Scrambling %',
    shortLabel: 'Scrambling',
    section: 'stats',
    icon: RefreshCw,
    emoji: '🔀',
    sortDirection: 'desc',
    unit: '%',
    description: 'Percentage of times a player saves par or better after missing the green in regulation.',
    tourAverage: '56.8%',
    accentColor: '#FF9500',
    accessor: (s) => s.scrambling,
    format: (v) => v.toFixed(1),
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
