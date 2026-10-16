/**
 * Trophy Room level system -- the Career Ladder.
 *
 * Every tier of every badge is one MEDAL. The wall level is a pure
 * function of medals owned. The ladder is capped at what a lifelong
 * elite golfer can actually collect (~55 of the ~70 theoretical
 * medals): deep albatross / hole-in-one tiers are bonus-beyond-max,
 * never a wall requirement.
 */

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

/** Current wall level for a medal count. Below 1 medal returns null. */
export function levelForMedals(count: number): WallLevel | null {
  let current: WallLevel | null = null;
  for (const lvl of WALL_LEVELS) {
    if (count >= lvl.medalsRequired) current = lvl;
    else break;
  }
  return current;
}

