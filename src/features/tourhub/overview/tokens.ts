/**
 * Overview V4 shared tokens — DARK canvas, editorial dispatch aesthetic.
 * Spec ref: Brief O2.1 shared anatomy.
 *
 * READ THE VALUE, NOT THE NAME. These keys were named for a light surface
 * ("surface" was white, "ink" was near-black, "hairline" was black-alpha) and
 * they are deliberately NOT renamed: ten importers across the overview tree
 * read them, and a rename would be a churn pass with no visual outcome. The
 * names are historical; the values are the dark ramp.
 *
 * Alphas LIFT rather than mirror — light-on-dark needs more separation than
 * dark-on-light, which is why `hairline` is 0.14 and not 0.10.
 *
 * Tints are tints OF THEIR OWN HUE (hit/miss, gold, violet), never pale
 * pastels: a washed-out saturated hue reads as failed on a dark canvas.
 */

export const V4 = {
  // Canvas
  // NON-MERGE: #15171F is also CHARCOAL and SLATE_50 in
  // features/tourhub/_shared/tokens.ts. Three names, one value, three
  // reasons — see the two existing notes there. Deliberately not converged.
  bg: '#15171F',
  surface: '#1B1E27',
  cardBorder: 'rgba(255,255,255,0.10)',
  // A card on dark is separated by its surface step and its hairline. A drop
  // shadow only adds a smudge — if a card reads flat, raise `surface`.
  cardShadow: 'none',
  cardRadius: 18,

  // Ink
  ink: '#F8FAFC',
  inkSoft: 'rgba(248,250,252,0.72)',
  inkMute: 'rgba(248,250,252,0.62)',
  inkFaint: 'rgba(248,250,252,0.42)',
  slate: 'rgba(248,250,252,0.42)',
  hairline: 'rgba(255,255,255,0.14)',

  // Accents — amber means the viewing member; amberDeep doubles as the
  // MAJORS GOLD (see holes/_constants.ts). Never repointed.
  amber: '#F7931E',
  amberSoft: 'rgba(247,147,30,0.12)',
  amberDeep: '#B36B00',

  // Gold family (majors) — celebration identity, held.
  gold: '#F5D061',
  goldMid: '#C9A227',
  goldDeep: '#8A6A00',
  goldSoftA: 'rgba(245,208,97,0.14)',
  goldSoftB: 'rgba(245,208,97,0.22)',

  // Playoffs (violet) — identity held, tint repointed.
  violet: '#5E4DA8',
  violetSoft: 'rgba(94,77,168,0.22)',

  // Score colours resolve through the canonical getScoreColor helper
  // (features/tourhub/_shared/scoreColor). Even/null stays here for
  // muted-neutral fallbacks used by non-score numeric surfaces.
  scoreEven: 'rgba(248,250,252,0.42)',


  // Live
  live: '#5EE9A6',

  // Movement
  up: '#34D77F',
  down: '#FF6B60',

  // Hit / Miss
  hitBg: 'rgba(52,215,127,0.14)',
  hitFg: '#34D77F',
  missBg: 'rgba(255,107,96,0.14)',
  missFg: '#FF6B60',
} as const;

// Match course-details hero height (full-viewport-under-safe-area).
export const HERO_HEIGHT_CSS = 'calc(100dvh * 0.62)';

// Tour hero gradients — dark treatment with per-tour identity.
export const TOUR_HERO_GRADIENT: Record<string, string> = {
  pga: 'linear-gradient(165deg, #26405c 0%, #14243a 55%, #0a1220 100%)',
  euro: 'linear-gradient(165deg, #3a2b6a 0%, #221a44 55%, #0e0a24 100%)',
  lpga: 'linear-gradient(165deg, #185a5c 0%, #0f3a3d 55%, #06181c 100%)',
  liv: 'linear-gradient(165deg, #4a1420 0%, #26090f 100%)',
  pgad: 'linear-gradient(165deg, #244a2e 0%, #0f2318 100%)',
  champ: 'linear-gradient(165deg, #4a3a12 0%, #221a08 100%)',
};

export function heroGradient(tour: string): string {
  return TOUR_HERO_GRADIENT[tour] ?? TOUR_HERO_GRADIENT.pga;
}

// Thin numerals — the house accent for display digits.
export const NUMERAL_THIN = { fontWeight: 200, fontVariantNumeric: 'tabular-nums' as const, letterSpacing: '-0.02em' };
