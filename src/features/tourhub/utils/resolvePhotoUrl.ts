/**
 * resolvePhotoUrl — DEPRECATED compatibility shim.
 *
 * All player headshots now come from the R2 CDN via getR2HeadshotUrl /
 * getR2HeadshotUrlMultiTour in @/utils/playerHeadshot.
 *
 * This file re-exports those utilities and provides a thin backward-compat
 * wrapper so existing callers don't break while they migrate.
 */

export { getR2HeadshotUrl, getR2HeadshotUrlMultiTour } from '@/utils/playerHeadshot';
import { getR2HeadshotUrlMultiTour } from '@/utils/playerHeadshot';

/**
 * @deprecated Use getR2HeadshotUrl / getR2HeadshotUrlMultiTour instead.
 * Kept only for backward compatibility — returns null so callers fall
 * through to their own initials placeholder. Components should migrate
 * to passing playerName + tourCode to the R2 utilities.
 */
export function resolvePhotoUrl(
  _photoUrl?: string | null,
  _pgaTourId?: string | null,
  _size?: 'thumb' | 'hero',
): string | null {
  return null;
}

/**
 * @deprecated Use getR2HeadshotUrl instead.
 */
export function getPgaTourHeadshotUrl(_pgaTourId: string, _size?: 'thumb' | 'hero'): string {
  // Return empty string — callers should migrate to R2 utilities
  return '';
}
