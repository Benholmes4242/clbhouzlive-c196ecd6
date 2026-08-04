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
import { getRatingTierLabel } from '@/lib/ratingTier';
import { formatRatingValue } from '@/utils/formatters';

/** One neutral ghost value for every tier — 9.2 and 4.1 render identically. */
export const REVIEW_GHOST_COLOR_NEUTRAL = 'rgba(248,250,252,0.16)';

/** Band colour at DARK-legible values. scoreBands.tsx's bandColor() returns
 *  light-surface values (#047857 green, #DC2626 red) that fail on the dark
 *  feed — same thresholds, dark tokens. */
export function reviewLabelColor(rating: number): string {
  if (rating >= 9) return '#5EE9A6';
  if (rating >= 5) return '#F7931E';
  return '#FF6B6B';
}

interface ReviewGhostNumeralProps {
  rating: number;
  /** Watermark font size — card uses 110; sheet uses ~86. */
  fontSize?: number;
  /** Absolute-position `right` offset. Both card and sheet use -7 by default. */
  right?: number;
  /** Absolute-position `top` (before translateY(-50%)). Card uses 28. */
  top?: number;
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
        fontWeight: 800,
        letterSpacing: '-0.05em',
        lineHeight: 1,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        zIndex: 0,
        fontVariantNumeric: 'tabular-nums',
        color: REVIEW_GHOST_COLOR_NEUTRAL,
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
  /**
   * Surface behind the label. 'dark' preserves the original low-alpha white
   * for FAIR/POOR (used on charcoal feed cards / dark review sheets).
   * 'light' uses the opaque tier colours from `ratingTextColor` so the label
   * remains legible on white cards such as the Review Wizard preview.
   */
  surface?: 'light' | 'dark';
}

/**
 * The tier verdict word (EXCEPTIONAL / EXCELLENT / GOOD / FAIR / POOR).
 * On dark surfaces FAIR/POOR stay low-alpha white; on light surfaces they use
 * the same opaque ember/amber colours as the profile feed.
 * EXCEPTIONAL gets the gold shimmer sweep on both surfaces.
 */
export const ReviewVerdictLabel: React.FC<ReviewVerdictLabelProps> = ({
  rating,
  fontSize = 12.5,
  onClick,
  ariaLabel,
  surface = 'dark',
}) => {
  const tierLabel = getRatingTierLabel(rating);
  const labelColor = reviewLabelColor(rating);
  const labelSpan = (
    <span
      style={{
        fontSize,
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
