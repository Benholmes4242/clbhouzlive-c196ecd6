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
  /**
   * Canonical clbhouz gamified title for this category.
   * Used by StatOfTheWeek and any future surface displaying these stats.
   */
  gamifiedTitle: string;
  /**
   * Verb-voice phrases for AI standfirst generation prompts.
   * Pipe-separated; the LLM picks the best fit.
   */
  verbVoice: string;
  /** Picker grouping (matches the Leaders page taxonomy). */
  group: 'general' | 'ball_striking' | 'short_game';
  section: 'performance' | 'stats';
  icon: LucideIcon;
  emoji: string;
  sortDirection: 'asc' | 'desc';
  unit: string;
  description: string;
  tourAverage: string;
  /** Numeric tour average for vs Avg pill computation. Null when no meaningful field average exists (counting stats, leader-relative scores). */
  tourAverageNumeric: number | null;
  /** True for higher-is-better stats (almost all). False for lower-is-better stats (Putting Average, Scoring Average). */
  higherIsBetter: boolean;
  /** True only for World Ranking — the only stat with weekly snapshot history powering streak tracking. */
  showStreak: boolean;
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
    gamifiedTitle: 'WORLD #1',
    verbVoice: 'holds the throne | sits atop the world | rules the rankings',
    group: 'general',
    section: 'performance',
    icon: Globe,
    emoji: '🌍',
    sortDirection: 'desc',
    unit: '',
    description: 'Official World Golf Ranking total points from tournament results.',
    tourAverage: '',
    tourAverageNumeric: null,
    higherIsBetter: true,
    showStreak: true,
    accentColor: '#B8860B',
    accessor: (s) => s.world_rank,
    format: (v) => `${Math.round(v)}pts`,
  },
  {
    key: 'events_played',
    label: 'Events Played',
    shortLabel: 'Events Played',
    gamifiedTitle: 'THE GRINDER',
    verbVoice: 'grinds | shows up week in, week out | never sits a week out',
    group: 'general',
    section: 'performance',
    icon: Calendar,
    emoji: '📅',
    sortDirection: 'desc',
    unit: 'events',
    description: 'Total number of tournament starts this season.',
    tourAverage: '24',
    tourAverageNumeric: null,
    higherIsBetter: true,
    showStreak: false,
    accentColor: '#3478F6',
    accessor: (s) => s.events_played,
    format: (v) => `${v}`,
  },
  {
    key: 'cuts_made',
    label: 'Cuts Made',
    shortLabel: 'Cuts Made',
    gamifiedTitle: 'THE WEEKEND WARRIOR',
    verbVoice: 'plays every weekend | never misses the cut | always around for Sunday',
    group: 'general',
    section: 'performance',
    icon: Scissors,
    emoji: '✂️',
    sortDirection: 'desc',
    unit: 'cuts',
    description: 'Number of times the player made the cut and played the weekend rounds.',
    tourAverage: '16',
    tourAverageNumeric: null,
    higherIsBetter: true,
    showStreak: false,
    accentColor: '#16A34A',
    accessor: (s) => s.cuts_made,
    format: (v) => `${v}`,
  },
  {
    key: 'top_10',
    label: 'Top 10 Finishes',
    shortLabel: 'Top 10s',
    gamifiedTitle: 'CONSISTENCY KING',
    verbVoice: 'shows up when it matters | always in the mix | a fixture on the leaderboard',
    group: 'general',
    section: 'performance',
    icon: Trophy,
    emoji: '🏆',
    sortDirection: 'desc',
    unit: '',
    description: 'Number of top-10 finishes in stroke play events this season.',
    tourAverage: '2',
    tourAverageNumeric: null,
    higherIsBetter: true,
    showStreak: false,
    accentColor: '#B8860B',
    accessor: (s) => s.top_10s,
    format: (v) => `${v}`,
  },
  {
    key: 'earnings',
    label: 'Season Earnings',
    shortLabel: 'Earnings',
    gamifiedTitle: 'THE MONEY LIST',
    verbVoice: 'printing money | collecting cheques | cashing in week after week',
    group: 'general',
    section: 'performance',
    icon: DollarSign,
    emoji: '💰',
    sortDirection: 'desc',
    unit: '',
    description: 'Total prize money earned this season across all events.',
    tourAverage: '$1.8M',
    tourAverageNumeric: 1_800_000,
    higherIsBetter: true,
    showStreak: false,
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
    gamifiedTitle: 'MOST COMPLETE GOLFER',
    verbVoice: 'dominating across the board | no weakness in his game | the best all-rounder out there',
    group: 'general',
    section: 'stats',
    icon: Trophy,
    emoji: '⚡',
    sortDirection: 'desc',
    unit: '',
    description: 'Total strokes gained versus the field average per round. The most comprehensive measure of overall performance.',
    tourAverage: '',
    tourAverageNumeric: null,
    higherIsBetter: true,
    showStreak: false,
    accentColor: '#f59e0b',
    accessor: (s) => s.strokes_gained_total,
    format: (v) => (v >= 0 ? '+' : '') + v.toFixed(2),
  },
  {
    key: 'scoring_avg',
    label: 'Scoring Average',
    shortLabel: 'Scoring Average',
    gamifiedTitle: 'LOWEST OF THE LOW',
    verbVoice: 'shooting the lowest scores | posting numbers nobody else can | running cards through the floor',
    group: 'general',
    section: 'stats',
    icon: Gauge,
    emoji: '📊',
    sortDirection: 'asc',
    unit: 'avg',
    description: 'Average score per round. Lower is better.',
    tourAverage: '71.2',
    tourAverageNumeric: 71.2,
    higherIsBetter: false,
    showStreak: false,
    accentColor: '#FF9500',
    accessor: (s) => s.scoring_average,
    format: (v) => v.toFixed(3),
  },
  {
    key: 'drive_avg',
    label: 'Driving Distance',
    shortLabel: 'Driving Distance',
    gamifiedTitle: 'BIG DOG',
    verbVoice: 'bombing it | bombing the field | crushing drives nobody else can hit',
    group: 'ball_striking',
    section: 'stats',
    icon: Zap,
    emoji: '💪',
    sortDirection: 'desc',
    unit: 'yds',
    description: 'Average driving distance off the tee in yards.',
    tourAverage: '296.4 yds',
    tourAverageNumeric: 296.4,
    higherIsBetter: true,
    showStreak: false,
    accentColor: '#16A34A',
    accessor: (s) => s.driving_distance,
    format: (v) => `${v.toFixed(1)}`,
  },
  {
    key: 'drive_acc',
    label: 'Driving Accuracy',
    shortLabel: 'Driving Accuracy',
    gamifiedTitle: 'STRAIGHT SHOOTER',
    verbVoice: 'finding fairways | hitting it straight | painting the short grass',
    group: 'ball_striking',
    section: 'stats',
    icon: Crosshair,
    emoji: '🎯',
    sortDirection: 'desc',
    unit: '%',
    description: 'Percentage of tee shots landing in the fairway.',
    tourAverage: '60.5%',
    tourAverageNumeric: 60.5,
    higherIsBetter: true,
    showStreak: false,
    accentColor: '#3478F6',
    accessor: (s) => s.driving_accuracy,
    format: (v) => v.toFixed(1),
  },
  {
    key: 'gir_pct',
    label: 'Greens in Regulation',
    shortLabel: 'GIR',
    gamifiedTitle: 'DARTS',
    verbVoice: 'sticking it close | hitting greens | throwing darts at every flag',
    group: 'ball_striking',
    section: 'stats',
    icon: Circle,
    emoji: '⛳',
    sortDirection: 'desc',
    unit: '%',
    description: 'Percentage of greens hit in regulation (on the green in par minus 2 strokes).',
    tourAverage: '65.0%',
    tourAverageNumeric: 65.0,
    higherIsBetter: true,
    showStreak: false,
    accentColor: '#16A34A',
    accessor: (s) => s.greens_in_reg,
    format: (v) => v.toFixed(1),
  },
  {
    key: 'putt_avg',
    label: 'Putting Average',
    shortLabel: 'Putting',
    gamifiedTitle: 'PUTTING GOD',
    verbVoice: 'bewitching greens | draining everything | making the hole look like a bucket',
    group: 'short_game',
    section: 'stats',
    icon: Flag,
    emoji: '🕳️',
    sortDirection: 'asc',
    unit: 'avg',
    description: 'Average number of putts per green hit in regulation. Lower is better.',
    tourAverage: '1.790',
    tourAverageNumeric: 1.790,
    higherIsBetter: false,
    showStreak: false,
    accentColor: '#8B5CF6',
    accessor: (s) => s.putting_average,
    format: (v) => v.toFixed(3),
  },
  {
    key: 'sand_saves_pct',
    label: 'Sand Saves',
    shortLabel: 'Sand Saves',
    gamifiedTitle: 'BUNKER BOSS',
    verbVoice: 'escaping bunkers | never afraid of sand | making bunker shots look like chip-ins',
    group: 'short_game',
    section: 'stats',
    icon: Sun,
    emoji: '🏖️',
    sortDirection: 'desc',
    unit: '%',
    description: 'Percentage of up-and-downs from greenside bunkers. Higher is better.',
    tourAverage: '49.5%',
    tourAverageNumeric: 49.5,
    higherIsBetter: true,
    showStreak: false,
    accentColor: '#FF9500',
    accessor: (s) => s.sand_saves,
    format: (v) => v.toFixed(1),
  },
  {
    key: 'scrambling_pct',
    label: 'Scrambling %',
    shortLabel: 'Scrambling',
    gamifiedTitle: 'THE ESCAPE ARTIST',
    verbVoice: 'getting up and down | saving par from anywhere | turning bogeys into pars',
    group: 'short_game',
    section: 'stats',
    icon: RefreshCw,
    emoji: '🔀',
    sortDirection: 'desc',
    unit: '%',
    description: 'Percentage of times a player saves par or better after missing the green in regulation.',
    tourAverage: '56.8%',
    tourAverageNumeric: 56.8,
    higherIsBetter: true,
    showStreak: false,
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
