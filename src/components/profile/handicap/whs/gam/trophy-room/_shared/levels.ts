/**
 * Trophy Room level system -- the medal wall.
 *
 * Every tier of every badge is one MEDAL. The wall level is a pure
 * function of medals owned. The ladder is capped at what a lifelong
 * elite golfer can actually collect (~55 of the ~70 theoretical
 * medals): deep albatross / hole-in-one tiers are bonus-beyond-max,
 * never a wall requirement.
 *
 * Materials ride the existing Forge ladder:
 * bronze -> silver -> emerald -> diamond -> obsidian.
 */

import type { TrophyItem } from './normalizeTrophyItem';

export const MATERIAL_LADDER = [
  'bronze',
  'silver',
  'emerald',
  'diamond',
  'obsidian',
] as const;

export type WallMaterial = (typeof MATERIAL_LADDER)[number];

export interface WallLevel {
  level: number;
  medalsRequired: number;
  material: WallMaterial;
  sub: 'I' | 'II';
  label: string;
}

export const WALL_LEVELS: readonly WallLevel[] = [
  { level: 1, medalsRequired: 1, material: 'bronze', sub: 'I', label: 'Bronze I' },
  { level: 2, medalsRequired: 4, material: 'bronze', sub: 'II', label: 'Bronze II' },
  { level: 3, medalsRequired: 8, material: 'silver', sub: 'I', label: 'Silver I' },
  { level: 4, medalsRequired: 13, material: 'silver', sub: 'II', label: 'Silver II' },
  { level: 5, medalsRequired: 19, material: 'emerald', sub: 'I', label: 'Emerald I' },
  { level: 6, medalsRequired: 26, material: 'emerald', sub: 'II', label: 'Emerald II' },
  { level: 7, medalsRequired: 33, material: 'diamond', sub: 'I', label: 'Diamond I' },
  { level: 8, medalsRequired: 40, material: 'diamond', sub: 'II', label: 'Diamond II' },
  { level: 9, medalsRequired: 47, material: 'obsidian', sub: 'I', label: 'Obsidian I' },
  { level: 10, medalsRequired: 55, material: 'obsidian', sub: 'II', label: 'Obsidian II' },
] as const;

/** Medals owned by one badge: earned tiers for tiered items, 1/0 for binary. */
export function medalsForItem(item: TrophyItem): number {
  if ('tiers' in item && Array.isArray(item.tiers) && item.tiers.length > 0) {
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

/** Next wall level, or null at Obsidian II. */
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

/** Material for a badge's current earned tier count (1-based). */
export function materialForTier(tiersEarned: number): WallMaterial {
  if (tiersEarned <= 0) return 'bronze';
  return MATERIAL_LADDER[Math.min(tiersEarned - 1, MATERIAL_LADDER.length - 1)];
}
