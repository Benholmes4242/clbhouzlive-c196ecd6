/**
 * Overview V4 shared tokens — LIGHT canvas, editorial dispatch aesthetic.
 * Spec ref: Brief O2.1 shared anatomy.
 */

export const V4 = {
  // Canvas
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  cardBorder: 'rgba(0,0,0,0.07)',
  cardShadow: '0 2px 10px rgba(31,36,40,0.05)',
  cardRadius: 18,

  // Ink
  ink: '#0F172A',
  inkSoft: '#3C4351',
  inkMute: '#5B6572',
  inkFaint: '#8A9099',
  slate: '#94A3B8',
  hairline: 'rgba(15,23,42,0.10)',

  // Accents
  amber: '#F7931E',
  amberSoft: 'rgba(247,147,30,0.12)',
  amberDeep: '#B36B00',

  // Gold family (majors)
  gold: '#F5D061',
  goldMid: '#C9A227',
  goldDeep: '#8A6A00',
  goldSoftA: '#FFF4DB',
  goldSoftB: '#FDE9B8',

  // Playoffs (violet)
  violet: '#5E4DA8',
  violetSoft: '#EDEAF7',

  // Score colours resolve through the canonical getScoreColor helper
  // (features/tourhub/_shared/scoreColor). Even/null stays here for
  // muted-neutral fallbacks used by non-score numeric surfaces.
  scoreEven: '#8A9099',


  // Live
  live: '#22C55E',

  // Movement
  up: '#189A55',
  down: '#C24A4A',

  // Hit / Miss
  hitBg: '#E2F4E9',
  hitFg: '#155E38',
  missBg: '#F9E7E7',
  missFg: '#8A3B3B',
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
