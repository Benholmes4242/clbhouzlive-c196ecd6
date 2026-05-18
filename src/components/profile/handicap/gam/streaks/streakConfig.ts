import { Flame, TrendingDown, Trophy, type LucideIcon } from 'lucide-react';
import type { StreakType } from '@/lib/gam/types';

/**
 * STREAK_CARD_CONFIG — the three streaks featured on the home card.
 * Order here is the render order.
 */
export interface StreakCardEntry {
  type: Extract<StreakType, 'counter' | 'cutting' | 'sub_80'>;
  label: string;
  icon: LucideIcon;
  unit: string;
  description: string;
  showGrid?: boolean;
  gridCaption?: string;
}

export const STREAK_CARD_ORDER: StreakCardEntry[] = [
  {
    type: 'counter',
    label: 'Counter rounds in a row',
    icon: Flame,
    unit: 'rounds',
    description: 'Consecutive rounds being counted',
    showGrid: true,
    gridCaption: 'Counters in last 7 days',
  },
  {
    type: 'cutting',
    label: 'Index cuts',
    icon: TrendingDown,
    unit: 'rounds',
    description: 'Counter rounds that dropped your handicap',
  },
  {
    type: 'sub_80',
    label: 'Rounds under 80',
    icon: Trophy,
    unit: 'rounds',
    description: 'Posted scores below 80 in a row',
  },
];

/**
 * STREAK_SHEET_CONFIG — explainer copy for every streak type shown in the
 * All Streaks sheet (the four sheet-only types + the three card types).
 */
export interface StreakSheetEntry {
  label: string;
  emoji: string;
  explainer: string;
  unit: string;
}

export const STREAK_SHEET_CONFIG: Record<StreakType, StreakSheetEntry> = {
  counter: {
    label: 'COUNTER ROUNDS IN A ROW',
    emoji: '🔥',
    explainer: 'Consecutive rounds being counted towards your handicap.',
    unit: 'rounds',
  },
  cutting: {
    label: 'INDEX CUTS',
    emoji: '📉',
    explainer: 'Counter rounds that dropped your handicap index.',
    unit: 'rounds',
  },
  sub_80: {
    label: 'ROUNDS UNDER 80',
    emoji: '🏆',
    explainer: 'Posted scores below 80 in a row.',
    unit: 'rounds',
  },
  no_up: {
    label: 'NO INDEX INCREASES',
    emoji: '🛡️',
    explainer: 'Counter rounds that did not increase your handicap index. Defensive streak — holding the line.',
    unit: 'rounds',
  },
  sub_par: {
    label: 'SUB-PAR ROUNDS',
    emoji: '🏆',
    explainer: 'Counter rounds with a score below par. The hardest streak in the system.',
    unit: 'rounds',
  },
  birdie_round: {
    label: 'BIRDIE ROUNDS',
    emoji: '🐦',
    explainer: 'Rounds with at least one birdie.',
    unit: 'rounds',
  },
  round_played: {
    label: 'WEEKS PLAYED',
    emoji: '⛳',
    explainer: 'Weeks where you played at least one round. Pure activity streak — your engagement baseline.',
    unit: 'weeks',
  },
};

/** Render order in the All Streaks sheet. */
export const STREAK_SHEET_ORDER: StreakType[] = [
  'counter',
  'cutting',
  'sub_80',
  'no_up',
  'sub_par',
  'birdie_round',
  'round_played',
];
