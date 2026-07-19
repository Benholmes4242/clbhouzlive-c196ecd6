/**
 * Badge-tier materials -- a SEPARATE system from the wall level Career Ladder.
 *
 * Individual tiered badges (rounds played, sub-80 streak, etc.) climb five
 * material tiers: Bronze -> Silver -> Emerald -> Diamond -> Gold (formerly
 * Obsidian). This system tints per-badge visuals only; it does NOT drive
 * wall-level identity, which lives in `./levels.ts` and renders via
 * TierGlyph.
 */

export type WallMaterial = 'bronze' | 'silver' | 'emerald' | 'diamond' | 'obsidian';

export const MATERIAL_LADDER: readonly WallMaterial[] = [
  'bronze',
  'silver',
  'emerald',
  'diamond',
  'obsidian',
] as const;

/** Material for a badge tier index (1..N). Clamps to the ladder ends. */
export function materialForTier(tier: number): WallMaterial {
  if (tier <= 0) return 'bronze';
  const idx = Math.min(MATERIAL_LADDER.length, Math.max(1, tier)) - 1;
  return MATERIAL_LADDER[idx];
}
