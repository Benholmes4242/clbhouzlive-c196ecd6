import { ExploreContentItem } from '@/components/explore/types';

/**
 * Landscape card eligibility constants
 */
const LANDSCAPE_AR_MIN = 1.653; // 16:9 - 7%
const LANDSCAPE_AR_MAX = 1.901; // 16:9 + 7%
const MAX_DURATION_SECONDS = 180; // 3 minutes

/**
 * Check if an item is eligible for landscape card placement
 * Requirements:
 * - Videos only (no static images)
 * - Aspect ratio: 16:9 ±7% (1.653 ≤ ar ≤ 1.901)
 * - Duration: ≤ 180 seconds
 * - Must not be rotated portrait (use encoded video dimensions)
 */
export const isLandscapeEligible = (item: ExploreContentItem): boolean => {
  // Must be video type
  if (item.type !== 'video') return false;
  
  // Must have duration data and be within limit
  if (!item.durationSeconds || item.durationSeconds > MAX_DURATION_SECONDS) {
    return false;
  }
  
  // Compute aspect ratio from provided metadata
  let ar = item.aspectRatio;
  if (!ar && typeof item.width === 'number' && typeof item.height === 'number' && item.height > 0) {
    ar = item.width / item.height;
  }
  
  return !!ar && ar >= LANDSCAPE_AR_MIN && ar <= LANDSCAPE_AR_MAX;

/**
 * Select the best landscape candidate from available items
 * Priority order:
 * 1. Featured items (isFeatured === true)
 * 2. Items flagged as landscape-suitable (landscapeSuitable === true)
 * 3. Any eligible item
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
  
  // Priority 1: Featured items
  const featured = windowItems.find(({ item }) => item.isFeatured);
  if (featured) return featured;
  
  // Priority 2: Landscape-suitable items
  const landscapeSuitable = windowItems.find(({ item }) => item.landscapeSuitable);
  if (landscapeSuitable) return landscapeSuitable;
  
  // Priority 3: Any eligible item
  return windowItems[0];
};

/**
 * Preload landscape card poster
 */
export const preloadLandscapePoster = (item: ExploreContentItem) => {
  const posterUrl = item.thumbnailSrc;
  if (posterUrl) {
    const img = new Image();
    img.src = posterUrl;
  }
};
