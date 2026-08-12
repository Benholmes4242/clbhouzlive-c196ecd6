/**
 * ReviewGhostScore — shared ghost numeral + verdict label used by
 * Clubhouse FeedCard AND ReviewBottomSheet. Palettes MUST never fork.
 *
 * Split of duties:
 *   - The huge low-alpha watermark numeral is NEUTRAL for every tier. It is
 *     structure, not semantics: a 110px band-coloured numeral would read as an
 *     alarm in a feed where red already means over par. No shimmer, flat.
 *   - The tier verdict label (EXCEPTIONAL / EXCELLENT / GOOD / FAIR / POOR)
 *     carries the band colour at label scale, where colour reads as
 *     information. Thresholds match the app-wide bands exactly.
 */
import React from 'react';
import { getRatingTierLabel, type RatingTier } from '@/lib/ratingTier';
import { formatRatingValue } from '@/utils/formatters';

export type ReviewGhostSurface = 'dark' | 'light';

/** One neutral ghost value for every tier — 9.2 and 4.1 render identically.
 *  Dark = paper-white at 16%; light = ink at 10% (a quiet grey watermark). */
export const REVIEW_GHOST_COLOR_NEUTRAL = 'rgba(248,250,252,0.16)';
export const REVIEW_GHOST_COLOR_NEUTRAL_LIGHT = 'rgba(14,18,22,0.10)';

export function reviewGhostColor(surface: ReviewGhostSurface = 'dark'): string {
  return surface === 'light'
    ? REVIEW_GHOST_COLOR_NEUTRAL_LIGHT
    : REVIEW_GHOST_COLOR_NEUTRAL;
}

/** Band colour at DARK-legible values. scoreBands.tsx's bandColor() returns
 *  light-surface values (#047857 green, #DC2626 red) that fail on the dark
 *  feed — same thresholds, dark tokens. */
export function reviewLabelColor(
  rating: number,
  surface: ReviewGhostSurface = 'dark',
): string {
  if (surface === 'light') {
    // Light-surface values. The mid band is amber-DEEP, never #F7931E: the word
    // is ~10-12px and small bright amber on white fails contrast (house rule).
    if (rating >= 9) return '#047857';
    if (rating >= 5) return '#C2620A';
    return '#DC2626';
  }
  if (rating >= 9) return '#5EE9A6';
  if (rating >= 5) return '#F7931E';
  return '#FF6B6B';
}

/**
 * Band colour for a TIER NAME rather than a score, for surfaces that group
 * ratings into the five tiers (My Ratings dividers, the tier distribution bars,
 * the loop card label). It resolves through `reviewLabelColor` — the same three
 * bands, no thresholds and no hexes restated here.
 *
 * Five tiers against three bands, mapped by each tier's own midpoint:
 *   EXCEPTIONAL  (>=9.0, mid 9.5)     -> green
 *   EXCELLENT    (7.5-8.9, mid 8.2)   -> mid band
 *   GOOD         (6.0-7.4, mid 6.7)   -> mid band
 *   FAIR         (4.0-5.9, mid 4.95)  -> red   (its midpoint falls under 5.0)
 *   POOR         (<4.0, mid 2.0)      -> red
 * Adjacent tiers sharing a band is deliberate: the bands are the app's rule and
 * a fourth colour would fork it.
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



interface ReviewGhostNumeralProps {
  rating: number;
  /** Watermark font size — card uses 110; sheet uses ~86. */
  fontSize?: number;
  /** Absolute-position `right` offset. Both card and sheet use -7 by default. */
  right?: number;
  /** Absolute-position `top` (before translateY(-50%)). Card uses 28. */
  top?: number;
  /** Host surface. Default 'dark' — FeedCard and ReviewBottomSheet unchanged. */
  surface?: ReviewGhostSurface;
}

/**
 * Absolutely-positioned watermark numeral. Parent must be `position: relative`
 * with `overflow: hidden` so the numeral clips at the container edge (this is
 * what gives the card/sheet its off-edge overflow).
 */
export const ReviewGhostNumeral: React.FC<ReviewGhostNumeralProps> = ({
  rating,
  fontSize = 110,
  right = -7,
  top = 28,
  surface = 'dark',
}) => {
  return (
    <span
      aria-hidden
      style={{
        position: 'absolute',
        right,
        top,
        transform: 'translateY(-50%)',
        fontSize,
        fontWeight: 700,
        letterSpacing: '-0.05em',
        lineHeight: 1,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        zIndex: 0,
        fontVariantNumeric: 'tabular-nums',
        color: reviewGhostColor(surface),
      }}
    >
      {formatRatingValue(rating)}
    </span>
  );
};

interface ReviewVerdictLabelProps {
  rating: number;
  /** Optional font-size override (card uses 12.5). */
  fontSize?: number;
  /** Optional click handler — wraps the label in a bare button when provided. */
  onClick?: (e: React.MouseEvent) => void;
  ariaLabel?: string;
  /** Host surface. Default 'dark'. Selects the band palette (see
   *  `reviewLabelColor`) — same thresholds, per-surface values. */
  surface?: ReviewGhostSurface;
}

/**
 * The tier verdict word (EXCEPTIONAL / EXCELLENT / GOOD / FAIR / POOR).
 * Colour comes from the score bands at dark-legible values:
 * >= 9.0 green, >= 5.0 amber, below 5.0 red. No shimmer.
 */
export const ReviewVerdictLabel: React.FC<ReviewVerdictLabelProps> = ({
  rating,
  fontSize = 12.5,
  onClick,
  ariaLabel,
  surface = 'dark',
}) => {
  const tierLabel = getRatingTierLabel(rating);
  const labelColor = reviewLabelColor(rating, surface);
  const labelSpan = (
    <span
      style={{
        fontSize,
        fontWeight: 700,
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
      style={{
        position: 'relative',
        zIndex: 3,
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        flexShrink: 0,
      }}
      aria-label={ariaLabel}
    >
      {labelSpan}
    </button>
  );
};
