/**
 * TIER TONE — ONE FUNCTION for the cabinet tiles and the closest-records rows.
 *
 *   tier 0                       -> null (hollow chip: "not started")
 *   top third of the ladder      -> MEDAL_GOLD
 *   middle third                 -> MEDAL_SILVER
 *   bottom third (tier >= 1)     -> MEDAL_BRONZE
 *   all tiers reached            -> MEDAL_GOLD
 *
 * The three medal tokens are imported, never retyped. This is NOT SC_FILL_GOLD
 * (eagles/aces) and NOT AMBER (the viewing member) — no fourth gold.
 */
import { MEDAL_GOLD, MEDAL_SILVER, MEDAL_BRONZE } from '@/features/tourhub/_shared/tokens';
import type { Achievement } from './types';

export function tierTone(item: Pick<Achievement, 'reachedTier' | 'tiers' | 'nextThreshold'>): string | null {
  if (item.reachedTier <= 0) return null;
  if (!item.nextThreshold) return MEDAL_GOLD;
  const total = Math.max(1, item.tiers.length);
  const ratio = item.reachedTier / total;
  if (ratio > 2 / 3) return MEDAL_GOLD;
  if (ratio > 1 / 3) return MEDAL_SILVER;
  return MEDAL_BRONZE;
}

/** `rgba()` of a medal hex at an alpha — for the tile ground and border. */
export function toneAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}
