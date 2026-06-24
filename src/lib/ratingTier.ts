/**
 * Rating tier taxonomy for Clbhouz reviews.
 * Canonical tier taxonomy used across review post surfaces.
 *
 * 5-tier system (April 2026 rebalance):
 *   EXCEPTIONAL ≥9.0   (width 1.0)
 *   EXCELLENT   7.5-8.9 (width 1.4)
 *   GOOD        6.0-7.4 (width 1.4)
 *   FAIR        4.0-5.9 (width 2.0)
 *   POOR        <4.0    (width 4.0)
 *
 * Legacy "Outstanding" and "Very Good" no longer exist. ≥9.0 is now Exceptional;
 * 7.5–7.9 ratings promote to Excellent; 7.0–7.4 ratings demote to Good.
 * `null` ratings map to POOR (semantically the worst case — no rating exists).
 */

export type RatingTier =
  | 'EXCEPTIONAL'
  | 'EXCELLENT'
  | 'GOOD'
  | 'FAIR'
  | 'POOR';

export function getRatingTier(rating: number | null | undefined): RatingTier {
  if (rating == null) return 'POOR';
  if (rating >= 9.0) return 'EXCEPTIONAL';
  if (rating >= 7.5) return 'EXCELLENT';
  if (rating >= 6.0) return 'GOOD';
  if (rating >= 4.0) return 'FAIR';
  return 'POOR';
}

/**
 * Human-readable tier label (title case for display).
 * "EXCEPTIONAL" → "Exceptional"
 */
export function getRatingTierLabel(rating: number | null | undefined): string {
  const tier = getRatingTier(rating);
  return tier
    .split(' ')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

// ═══════════════════════════════════════════════════════════════════════════
// Unified rating design tokens (Phase 1 — shared foundation)
// Use these across the review wizard, course detail, fullscreen media,
// and feed so every rating expression speaks the same visual language.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Graduated tier ramps (hi → mid → lo) used for cell fills, bars, and
 * gradient surfaces tied to a rating value.
 *  - grey:  Poor / Fair (< 6.0)
 *  - amber: Good / Excellent (6.0 – 8.9)
 *  - gold:  Exceptional (≥ 9.0) — the reward state, visibly brighter
 */
export const RATING_RAMPS = {
  grey: { hi: '#AEB6C2', mid: '#8A95A4', lo: '#677280' },
  amber: { hi: '#FAC775', mid: '#F7931E', lo: '#D97706' },
  gold: { hi: '#FFE08A', mid: '#FFC23D', lo: '#F7931E' },
} as const;

export type RatingRamp = (typeof RATING_RAMPS)[keyof typeof RATING_RAMPS];

/** Pick the ramp for a rating value via the canonical tier function. */
export function rampForRating(rating: number | null | undefined): RatingRamp {
  const tier = getRatingTier(rating);
  if (tier === 'EXCEPTIONAL') return RATING_RAMPS.gold;
  if (tier === 'EXCELLENT' || tier === 'GOOD') return RATING_RAMPS.amber;
  return RATING_RAMPS.grey;
}

/**
 * Hero / tier-label text colour. Single rule applied everywhere a rating
 * number or tier label is shown.
 */
export function ratingTextColor(rating: number | null | undefined): string {
  const tier = getRatingTier(rating);
  if (tier === 'EXCEPTIONAL') return '#F0A500'; // deeper gold, legible on light surfaces
  if (tier === 'EXCELLENT' || tier === 'GOOD') return '#D97706';
  return '#64748B';
}

/**
 * Shared hero-number typography. Spread onto the style prop of any score
 * number ≥ ~40px so weight, spacing, and font feel identical across surfaces.
 * Size stays per-surface. Notably: NO `tabular-nums` — it cramps the decimal.
 */
export const HERO_NUMBER_STYLE = {
  fontWeight: 800,
  letterSpacing: '-0.01em',
  fontVariantNumeric: 'normal',
  fontFamily: 'inherit',
} as const;

/**
 * Tier-label typography (e.g. "EXCEPTIONAL"). Pair with `ratingTextColor`
 * for colour. Uppercase rendering is the caller's responsibility.
 */
export const TIER_LABEL_STYLE = {
  fontWeight: 800,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontFamily: 'inherit',
} as const;
