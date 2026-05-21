import { Flame, TrendingDown, Trophy, type LucideIcon } from 'lucide-react';
import type { StreakType } from '@/lib/gam/types';

/**
 * STREAK_CARD_CONFIG — per-type display metadata for the home streak card.
 * The picker (`selectFeaturedStreaks`) chooses which 3 to feature; this map
 * provides labels/emojis/copy for any of the 7 types it might pick.
 */
export interface StreakCardEntry {
  type: StreakType;
  label: string;
  emoji: string;
  icon: LucideIcon;
  unit: string;
  description: string;
  actionVerb: string;
  showGrid?: boolean;
  gridCaption?: string;
}

export const STREAK_CARD_CONFIG: Record<StreakType, StreakCardEntry> = {
  counter: {
    type: 'counter',
    label: 'Counter rounds in a row',
    emoji: '🔥',
    icon: Flame,
    unit: 'rounds',
    description: 'Consecutive rounds being counted',
    actionVerb: 'Post a counter',
  },
  cutting: {
    type: 'cutting',
    label: 'Index cuts in a row',
    emoji: '📉',
    icon: TrendingDown,
    unit: 'rounds',
    description: 'Counter rounds that dropped your handicap',
    actionVerb: 'Score better than your average',
  },
  sub_80: {
    type: 'sub_80',
    label: 'Rounds under 80',
    emoji: '🏆',
    icon: Trophy,
    unit: 'rounds',
    description: 'Posted scores below 80 in a row',
    actionVerb: 'Break 80',
  },
  no_up: {
    type: 'no_up',
    label: 'Index holds',
    emoji: '🛡️',
    icon: Trophy,
    unit: 'rounds',
    description: 'Counter rounds without an index increase',
    actionVerb: 'Hold the line',
  },
  sub_par: {
    type: 'sub_par',
    label: 'Sub-par rounds',
    emoji: '🏆',
    icon: Trophy,
    unit: 'rounds',
    description: 'Counter rounds below par',
    actionVerb: 'Break par',
  },
  birdie_round: {
    type: 'birdie_round',
    label: 'Birdie rounds',
    emoji: '🐦',
    icon: Trophy,
    unit: 'rounds',
    description: 'Rounds with at least one birdie',
    actionVerb: 'Make a birdie',
  },
  round_played: {
    type: 'round_played',
    label: 'Weeks played',
    emoji: '⛳',
    icon: Trophy,
    unit: 'weeks',
    description: 'Weeks with at least one round',
    actionVerb: 'Play next week',
  },
};

/**
 * @deprecated The home card now uses `selectFeaturedStreaks()` as the source
 * of truth for which 3 streaks to display. Remove in a follow-up PR once no
 * consumer imports this.
 */
export const STREAK_CARD_ORDER: StreakCardEntry[] = [
  STREAK_CARD_CONFIG.counter,
  STREAK_CARD_CONFIG.cutting,
  STREAK_CARD_CONFIG.sub_80,
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
