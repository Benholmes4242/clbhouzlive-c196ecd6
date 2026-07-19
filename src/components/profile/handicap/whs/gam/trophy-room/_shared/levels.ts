/**
 * Trophy Room level system -- the Career Ladder.
 *
 * Every tier of every badge is one MEDAL. The wall level is a pure
 * function of medals owned. The ladder is capped at what a lifelong
 * elite golfer can actually collect (~55 of the ~70 theoretical
 * medals): deep albatross / hole-in-one tiers are bonus-beyond-max,
 * never a wall requirement.
 */

import type { TrophyItem } from './normalizeTrophyItem';
import type { TierKey } from '@/components/shared/TierGlyph';

export interface WallLevel {
  level: number;
  medalsRequired: number;
  key: TierKey;
  label: string;
}

export const WALL_LEVELS: readonly WallLevel[] = [
  { level: 1, medalsRequired: 1, key: 'new_recruit', label: 'New Recruit' },
  { level: 2, medalsRequired: 4, key: 'rising_star', label: 'Rising Star' },
  { level: 3, medalsRequired: 8, key: 'season_regular', label: 'Season Regular' },
  { level: 4, medalsRequired: 13, key: 'team_captain', label: 'Team Captain' },
  { level: 5, medalsRequired: 19, key: 'national_squad', label: 'National Squad' },
  { level: 6, medalsRequired: 26, key: 'amateur_champion', label: 'Amateur Champion' },
  { level: 7, medalsRequired: 33, key: 'tour_rookie', label: 'Tour Rookie' },
  { level: 8, medalsRequired: 40, key: 'contender', label: 'Contender' },
  { level: 9, medalsRequired: 47, key: 'hall_of_famer', label: 'Hall of Famer' },
  { level: 10, medalsRequired: 55, key: 'the_goat', label: 'The GOAT' },
] as const;

/**
 * Display string for a wall level. At the summit (level 10) we append the
 * live medal count so the ladder gains infinite headroom past 55 medals:
 *   'The GOAT · 61 medals'
 * Below the summit we render the label verbatim (e.g. 'Team Captain').
 * Null level (zero medals) falls back to the first rung's label.
 */
export function levelDisplay(level: WallLevel | null, medals: number): string {
  if (!level) return WALL_LEVELS[0].label;
  if (level.level === 10) return `${level.label} · ${medals} medals`;
  return level.label;
}

/** Medals owned by one badge: earned tiers for tiered
    achievements, 1/0 for binary. Legend showcase rows carry no
    medals -- legend_at_course's tiers own that metric. */
export function medalsForItem(item: TrophyItem): number {
  if (item.kind !== 'achievement') return 0;

  if (item.tiers.length > 0) {
    return item.tiers.filter((t) => t.earned).length;
  }

  return item.earned ? 1 : 0;
}

/** Total medals across the wall. */
export function medalsOwned(items: TrophyItem[]): number {
  return items.reduce((acc, item) => acc + medalsForItem(item), 0);
}

/** Current wall level for a medal count. Below 1 medal returns null. */
export function levelForMedals(count: number): WallLevel | null {
  let current: WallLevel | null = null;
  for (const lvl of WALL_LEVELS) {
    if (count >= lvl.medalsRequired) current = lvl;
    else break;
  }
  return current;
}

/** Next wall level, or null at The GOAT. */
export function nextLevelForMedals(count: number): WallLevel | null {
  return WALL_LEVELS.find((lvl) => lvl.medalsRequired > count) ?? null;
}

/** Progress 0..1 between the current and next level. 1 at the top. */
export function levelProgress(count: number): number {
  const next = nextLevelForMedals(count);
  if (!next) return 1;
  const current = levelForMedals(count);
  const floor = current?.medalsRequired ?? 0;
  const span = next.medalsRequired - floor;
  if (span <= 0) return 1;
  return Math.max(0, Math.min(1, (count - floor) / span));
}
