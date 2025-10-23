// src/utils/landscapeEligibility.ts
import { ExploreContentItem } from '@/components/explore/types';

export const LANDSCAPE_AR_MIN = 1.653; // 16:9 * 0.93
export const LANDSCAPE_AR_MAX = 1.901; // 16:9 * 1.07
export const MAX_DURATION_SECONDS = 180;

export const isLandscapeEligible = (item: ExploreContentItem): boolean => {
  if (item.type !== 'video') return false;
  if (!item.durationSeconds || item.durationSeconds > MAX_DURATION_SECONDS) return false;

  // Accept explicit AR, or compute from dimensions if present
  let ar = (item as any).aspectRatio as number | undefined;
  if (!ar) {
    const w = (item as any).width as number | undefined;
    const h = (item as any).height as number | undefined;
    if (w && h && h > 0) ar = w / h;
  }

  return !!ar && ar >= LANDSCAPE_AR_MIN && ar <= LANDSCAPE_AR_MAX;
};

/**
 * Select the best landscape candidate from a forward lookahead window.
 * Priority: isFeatured → landscapeSuitable → any eligible.
 */
export const selectLandscapeCandidate = (
  items: ExploreContentItem[],
  usedIndexes: Set<number>,
  startIndex: number = 0,
  lookahead: number = 20
): { item: ExploreContentItem; index: number } | null => {
  const windowItems = items
    .slice(startIndex, startIndex + lookahead)
    .map((item, idx) => ({ item, index: startIndex + idx }))
    .filter(({ index }) => !usedIndexes.has(index))
    .filter(({ item }) => isLandscapeEligible(item));

  if (windowItems.length === 0) return null;

  const featured = windowItems.find(({ item }) => (item as any).isFeatured);
  if (featured) return featured;

  const flagged = windowItems.find(({ item }) => (item as any).landscapeSuitable);
  if (flagged) return flagged;

  return windowItems[0];
};

/** Preload landscape poster (cheap) */
export const preloadLandscapePoster = (item: ExploreContentItem) => {
  const posterUrl = (item as any).thumbnailSrc as string | undefined;
  if (!posterUrl) return;
  const img = new Image();
  img.src = posterUrl;
};
