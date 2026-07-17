/**
 * ReviewGhostScore — shared ghost numeral + verdict label used by
 * Clubhouse FeedCard AND ReviewBottomSheet. Palettes MUST never fork.
 *
 * Palettes are the single source of truth for:
 *   - The huge low-alpha watermark numeral behind card/sheet headers
 *   - The tier verdict label (EXCEPTIONAL / EXCELLENT / GOOD / FAIR / POOR)
 *
 * EXCEPTIONAL uses the shared 'clbhouz-gold-shimmer' class at reduced
 * opacity so the numeral keeps its ghost character while shimmering with
 * the label above it.
 */
import React from 'react';
import { getRatingTier, getRatingTierLabel, ratingTextColor, type RatingTier } from '@/lib/ratingTier';
import { formatRatingValue } from '@/utils/formatters';

export const REVIEW_GHOST_COLOR: Record<RatingTier, string> = {
  EXCEPTIONAL: 'rgba(255,194,61,0.16)',
  EXCELLENT:   'rgba(247,147,30,0.17)',
  GOOD:        'rgba(247,147,30,0.15)',
  FAIR:        'rgba(201,118,43,0.20)',
  POOR:        'rgba(201,118,43,0.16)',
};

export const REVIEW_LABEL_COLOR: Record<RatingTier, string> = {
  EXCEPTIONAL: '#FFCE5C',
  EXCELLENT:   '#FBA63F',
  GOOD:        '#FBA63F',
  FAIR:        'rgba(255,255,255,0.68)',
  POOR:        'rgba(255,255,255,0.58)',
};

/** Opacity applied to the shimmering EXCEPTIONAL numeral so it stays ghostly. */
export const REVIEW_GHOST_EXCEPTIONAL_OPACITY = 0.22;

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
  const tierKey = getRatingTier(rating);
  const ghostExceptional = tierKey === 'EXCEPTIONAL';
  return (
    <span
      aria-hidden
      className={ghostExceptional ? 'clbhouz-gold-shimmer' : undefined}
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
        ...(ghostExceptional
          ? { opacity: REVIEW_GHOST_EXCEPTIONAL_OPACITY }
          : { color: REVIEW_GHOST_COLOR[tierKey] }),
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
  const tierKey = getRatingTier(rating);
  const tierLabel = getRatingTierLabel(rating);
  const isExceptional = tierKey === 'EXCEPTIONAL';
  const labelColor =
    surface === 'light' && !isExceptional
      ? ratingTextColor(rating)
      : REVIEW_LABEL_COLOR[tierKey];
  const labelSpan = (
    <span
      className={isExceptional ? 'clbhouz-gold-shimmer' : undefined}
      style={{
        fontSize,
        fontWeight: 800,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        ...(isExceptional ? {} : { color: labelColor }),
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
