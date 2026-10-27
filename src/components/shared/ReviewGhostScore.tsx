/**
 * ReviewGhostScore — the shared review verdict label and its colour rules.
 * The watermark numeral that once lived here was deleted with the feed review
 * card rebuild (BRIEF_REVIEW_POST_REBUILD B.3); nothing else rendered it.
 *
 *   - The tier verdict label (EXCEPTIONAL / EXCELLENT / GOOD / FAIR / POOR)
 *     uses A.INK for every rating, on both surfaces (Ben, 27 Oct 2026).
 */
import React from 'react';
import { getRatingTierLabel, type RatingTier } from '@/lib/ratingTier';
import { A } from '@/features/courses/components/holes/analytical/tokens';

export type ReviewGhostSurface = 'dark' | 'light';

export const REVIEW_LABEL_COLOR_NEUTRAL_LIGHT = 'var(--rating-bar-fill-neutral)';

/** Every real rating verdict uses the same white ink on both surfaces. */
export function reviewLabelColor(
  rating: number,
  surface: ReviewGhostSurface = 'dark',
): string {
  return A.INK;
}

/**
 * Band colour for a TIER NAME rather than a score, for surfaces that group
 * ratings into the five tiers (My Ratings dividers, the tier distribution bars,
 * the loop card label). It resolves through `reviewLabelColor`, but remains a
 * separate tier-name API pending a decision on those distribution surfaces.
 *
 * Midpoints are retained so its current callers keep their existing API.
 */
export const TIER_MIDPOINT: Record<RatingTier, number> = {
  EXCEPTIONAL: 9.5,
  EXCELLENT: 8.2,
  GOOD: 6.7,
  FAIR: 4.95,
  POOR: 2.0,
};

export function reviewTierColor(
  tier: RatingTier,
  surface: ReviewGhostSurface = 'dark',
): string {
  return reviewLabelColor(TIER_MIDPOINT[tier], surface);
}



interface ReviewVerdictLabelProps {
  rating: number;
  /** Optional font-size override (card uses 12.5). */
  fontSize?: number;
  /** Optional click handler — wraps the label in a bare button when provided. */
  onClick?: (e: React.MouseEvent) => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  ariaLabel?: string;
  /** Host surface. Default 'dark'. Selects the band palette (see
   *  `reviewLabelColor`) — canonical threshold, per-surface values. */
  surface?: ReviewGhostSurface;
}

/**
 * The tier verdict word (EXCEPTIONAL / EXCELLENT / GOOD / FAIR / POOR).
 * Every verdict word is white; tier names and thresholds are unchanged.
 */
export const ReviewVerdictLabel: React.FC<ReviewVerdictLabelProps> = ({
  rating,
  fontSize = 12.5,
  onClick,
  onPointerDown,
  ariaLabel,
  surface = 'dark',
}) => {
  const tierLabel = getRatingTierLabel(rating);
  const labelColor = reviewLabelColor(rating, surface);
  const labelSpan = (
    <span
      style={{
        fontSize,
        lineHeight: 1,
        fontWeight: 800,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        color: labelColor,
      }}
    >
      {tierLabel}
    </span>
  );
  if (!onClick) return labelSpan;
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      style={{
        position: 'relative',
        zIndex: 3,
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        flexShrink: 0,
        display: 'block',
        fontSize,
        lineHeight: 1,
      }}
      aria-label={ariaLabel}
    >
      {labelSpan}
    </button>
  );
};
