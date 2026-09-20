/**
 * ReviewGhostScore — shared ghost numeral + verdict label used by
 * Clubhouse FeedCard AND ReviewBottomSheet. Palettes MUST never fork.
 *
 * Split of duties:
 *   - The huge low-alpha watermark numeral is GREEN at 9.0 and above, and
 *     neutral below. Its existing 16% dark / 10% light alpha remains fixed so
 *     the 110px wash stays behind the body copy rather than competing with it.
 *   - The tier verdict label (EXCEPTIONAL / EXCELLENT / GOOD / FAIR / POOR)
 *     uses the canonical display rule: GREEN at 9.0 and above, MUTE below.
 *     The three-band scale belongs only to score-composer feedback.
 */
import React from 'react';
import { getRatingTierLabel, type RatingTier } from '@/lib/ratingTier';
import { formatRatingValue } from '@/utils/formatters';
import { A, courseSubScoreTone } from '@/features/courses/components/holes/analytical/tokens';
import { BAND_GREEN } from '@/features/courses/_shared/scoreBandTokens';

export type ReviewGhostSurface = 'dark' | 'light';

/** One neutral ghost value for every tier — 9.2 and 4.1 render identically.
 *  Dark = paper-white at 16%; light = ink at 10% (a quiet grey watermark). */
export const REVIEW_GHOST_COLOR_NEUTRAL = 'rgba(248,250,252,0.16)';
export const REVIEW_GHOST_COLOR_NEUTRAL_LIGHT = 'rgba(14,18,22,0.10)';
export const REVIEW_GHOST_COLOR_GREEN = 'rgba(52,211,153,0.16)';
export const REVIEW_GHOST_COLOR_GREEN_LIGHT = 'rgba(4,120,87,0.10)';
export const REVIEW_LABEL_COLOR_NEUTRAL_LIGHT = 'var(--rating-bar-fill-neutral)';

export function reviewGhostColor(
  rating: number,
  surface: ReviewGhostSurface = 'dark',
): string {
  if (rating >= 9) {
    return surface === 'light'
      ? REVIEW_GHOST_COLOR_GREEN_LIGHT
      : REVIEW_GHOST_COLOR_GREEN;
  }
  return surface === 'light'
    ? REVIEW_GHOST_COLOR_NEUTRAL_LIGHT
    : REVIEW_GHOST_COLOR_NEUTRAL;
}

/** Canonical display colour, not the composer bands. The scoreBands.tsx light
 * values fail on the dark feed and its amber/red meanings do not apply here.
 * A genuine light ground uses the established light rating green and neutral;
 * current feed, activity, profile and sheet surfaces use the dark branch. */
export function reviewLabelColor(
  rating: number,
  surface: ReviewGhostSurface = 'dark',
): string {
  if (surface === 'light') {
    return rating >= 9 ? BAND_GREEN : REVIEW_LABEL_COLOR_NEUTRAL_LIGHT;
  }
  return courseSubScoreTone(rating);
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
        color: reviewGhostColor(rating, surface),
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
  onPointerDown?: (e: React.PointerEvent) => void;
  ariaLabel?: string;
  /** Host surface. Default 'dark'. Selects the band palette (see
   *  `reviewLabelColor`) — canonical threshold, per-surface values. */
  surface?: ReviewGhostSurface;
}

/**
 * The tier verdict word (EXCEPTIONAL / EXCELLENT / GOOD / FAIR / POOR).
 * Colour follows the canonical display rule: >= 9.0 green, below 9.0 mute.
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
      onPointerDown={onPointerDown}
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
