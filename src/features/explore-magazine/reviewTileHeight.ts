/**
 * The MINIMUM height of a full-width review tile (210 * 1.2).
 *
 * It is applied as `minHeight`, so the review's own on-photo text can push the
 * tile past it. PHOTO_H in ExploreCard.tsx is different: it is a FIXED height
 * that every other card holds. That asymmetry is why two reviews can render at
 * different heights while every round renders at the same one.
 */
export const REVIEW_TILE_MIN_HEIGHT = 210 * 1.2;
