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
  
  // Check aspect ratio if available
  // Note: In real implementation, we'd need actual video dimensions
  // For now, we check if the item is explicitly marked or has landscape metadata
  const aspectRatio = item.aspectRatio;
  
  if (aspectRatio) {
    return aspectRatio >= LANDSCAPE_AR_MIN && aspectRatio <= LANDSCAPE_AR_MAX;
  }
  
  // If no AR data, use flags as fallback
  return false;
};

/**
 * Select the best landscape candidate from available items
 * Priority order:
 * 1. Featured items (isFeatured === true)
 * 2. Items flagged as landscape-suitable (landscapeSuitable === true)
 * 3. Any eligible item
 */
export const selectLandscapeCandidate = (
  items: ExploreContentItem[],
  usedIndexes: Set<number>
): { item: ExploreContentItem; index: number } | null => {
  const eligibleItems = items
    .map((item, index) => ({ item, index }))
    .filter(({ index }) => !usedIndexes.has(index))
    .filter(({ item }) => isLandscapeEligible(item));
  
  if (eligibleItems.length === 0) return null;
  
  // Priority 1: Featured items
  const featured = eligibleItems.find(({ item }) => item.isFeatured);
  if (featured) return featured;
  
  // Priority 2: Landscape-suitable items
  const landscapeSuitable = eligibleItems.find(({ item }) => item.landscapeSuitable);
  if (landscapeSuitable) return landscapeSuitable;
  
  // Priority 3: Any eligible item
  return eligibleItems[0];
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
