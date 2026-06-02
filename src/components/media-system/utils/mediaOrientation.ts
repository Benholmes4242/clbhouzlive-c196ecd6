import type { MediaItem } from '../types/media';

/**
 * Max aspect (width / height) admitted to the immersive Suggested feed.
 * <= 1.05 keeps portrait + square + a hair past square; excludes landscape.
 * Single source of truth — tune here only.
 */
export const PORTRAIT_MAX_ASPECT = 1.05;

/**
 * Portrait-admissible if (width / height) <= PORTRAIT_MAX_ASPECT.
 * Fail-open: if width/height are missing or non-positive, ADMIT (treated as
 * portrait, matching mapRowToFeedPost's 1080x1920 default). We never hide
 * content we cannot measure.
 */
export function isPortraitAdmissible(item: Pick<MediaItem, 'width' | 'height'>): boolean {
  const w = item.width ?? 0;
  const h = item.height ?? 0;
  if (w <= 0 || h <= 0) return true; // unknown → admit
  return w / h <= PORTRAIT_MAX_ASPECT;
}
