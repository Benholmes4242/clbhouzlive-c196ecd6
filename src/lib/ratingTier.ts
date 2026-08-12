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
// Use these across the review composer, course detail, fullscreen media,
// and feed so every rating expression speaks the same visual language.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Graduated tier ramps (hi → mid → lo) used for cell fills, bars, and
 * gradient surfaces tied to a rating value.
 *  - grey:  Poor / Fair (< 6.0)
 *  - amber: Good / Excellent (6.0 – 8.9)
 *  - gold:  Exceptional (≥ 9.0) — the reward state, visibly brighter
 */
// NOTE: ramp keys (grey/amber/gold) are legacy names. As of the Ember-to-Gold
// pass (Option B), ALL three are warm. "grey" is the low-end ember ramp, not grey.
// Key rename deferred to post-launch to avoid churn across ~6 consumers.
export const RATING_RAMPS = {
  // Low end (Poor / Fair). Deep ember — reads clearly "low" via depth, not grey.
  grey: { hi: '#C9670F', mid: '#A85110', lo: '#9A4A0E' },
  // Mid (Good / Excellent). Warm amber.
  amber: { hi: '#FFCB45', mid: '#E8800C', lo: '#C9670F' },
  // Top (Exceptional). Bright reward gold.
  gold: { hi: '#FFE08A', mid: '#FFCB45', lo: '#E8800C' },
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
  return '#9A4A0E'; // low-end ember (was grey #64748B)
}

/**
 * Shared hero-number typography. Spread onto the style prop of any score
 * number ≥ ~40px so weight, spacing, and font feel identical across surfaces.
 * Size stays per-surface. Notably: NO `tabular-nums` — it cramps the decimal.
 */
export const HERO_NUMBER_STYLE = {
  fontWeight: 700,
  letterSpacing: '-0.01em',
  fontVariantNumeric: 'normal',
  fontFamily: 'inherit',
} as const;

/**
 * Tier-label typography (e.g. "EXCEPTIONAL"). Pair with `ratingTextColor`
 * for colour. Uppercase rendering is the caller's responsibility.
 */
export const TIER_LABEL_STYLE = {
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontFamily: 'inherit',
} as const;
