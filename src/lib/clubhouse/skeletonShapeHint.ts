/**
 * skeletonShapeHint — the shape of the first Clubhouse feed card, remembered
 * across launches (BRIEF_CLUBHOUSE_LOAD_SEQUENCE §2.7 / §2.8).
 *
 * WHY LOCALSTORAGE AND NOT THE PERSISTED QUERY CACHE.
 * The persisted react-query cache is IndexedDB backed and hydrates
 * ASYNCHRONOUSLY — PersistQueryClientProvider resolves it tens of ms after the
 * first paint, which is after the skeleton has already committed its height. So
 * it cannot size the FIRST frame. localStorage is synchronous and readable
 * during module evaluation, so this hint is available before the skeleton's
 * first render. The persisted cache still does its job a moment later: once the
 * feed data restores, Clubhouse re-derives the shape and rewrites the hint.
 *
 * COLD START (no hint): callers fall back to the SHORTEST plausible card, never
 * the tallest — growing into content is acceptable, collapsing out of it looks
 * broken.
 */

export type SkeletonCardVariant = 'regular' | 'review' | 'round';

export interface SkeletonShape {
  variant: SkeletonCardVariant;
  /** CSS aspect-ratio string for the media block. Ignored by 'round'. */
  mediaRatio?: string;
  isVideo?: boolean;
}

const KEY = 'clb-skeleton-shape-v1';

/** Shortest plausible card: a media post at the widest sensible media ratio. */
export const COLD_START_SHAPE: SkeletonShape = {
  variant: 'regular',
  mediaRatio: '16/9',
  isVideo: false,
};

export function readSkeletonShapeHint(): SkeletonShape | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SkeletonShape;
    if (parsed?.variant !== 'regular' && parsed?.variant !== 'review' && parsed?.variant !== 'round') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeSkeletonShapeHint(shape: SkeletonShape): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(shape));
  } catch {
    /* private mode / quota — the cold-start fallback covers it */
  }
}

/** Ratio from real stored media dimensions; null when unmeasurable. */
export function ratioFromDimensions(
  width?: number | null,
  height?: number | null,
): string | null {
  if (!width || !height || width <= 0 || height <= 0) return null;
  return `${width}/${height}`;
}
