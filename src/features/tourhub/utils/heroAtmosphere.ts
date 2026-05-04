/**
 * Shared "editorial broadcast" tokens + atmosphere utilities for the
 * Tour Hero (live + results) and Player Scorecard surfaces.
 *
 * Source of truth: TOUR_HERO_AND_SCORECARD_BRIEF.
 * These tokens are intentionally co-located so the three surfaces stay
 * locked to the same visual language.
 */

// --- Atmosphere ------------------------------------------------------------
export const navy        = '#0B1220';
export const navyMid     = '#0F1726';
export const navyHigh    = '#15203A';
export const ink         = '#0F172A';

// --- Foreground on navy ----------------------------------------------------
export const inkOnNavy    = 'rgba(255,255,255,0.96)';
export const inkSoft      = 'rgba(255,255,255,0.72)';
export const inkFaint     = 'rgba(255,255,255,0.42)';
export const inkGhost     = 'rgba(255,255,255,0.22)';
export const hairlineDark = 'rgba(255,255,255,0.08)';
export const hairlineMid  = 'rgba(255,255,255,0.14)';

// --- Section colours (match Tournament Intelligence section) ---------------
export const amber       = '#F7931E';
export const amberDeep   = '#D97706';
export const gold        = '#FFB800';   // celebration only
export const goldDeep    = '#D97706';
export const greenLive   = '#10B981';   // live only
export const danger      = '#F87171';

// --- Headline font ---------------------------------------------------------
export const headlineFont =
  '"Geist", -apple-system, BlinkMacSystemFont, sans-serif';

/**
 * Layered atmospheric background — radial glow at top + linear navy ramp.
 * Used as the absolute base layer behind hero / scorecard content.
 */
export const ATMOSPHERE_BG = `
  radial-gradient(900px 500px at 50% -120px, ${navyHigh} 0%, transparent 60%),
  linear-gradient(180deg, ${navyMid} 0%, ${navy} 100%)
`;

/**
 * Inline SVG noise — ~600 bytes, no network round-trip.
 * Use at 4% opacity over the atmospheric base for the editorial grain feel.
 */
export const GRAIN_BG_IMAGE =
  `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;

/** @keyframes pulse — used by the green LIVE dot. */
export const PULSE_KEYFRAMES = `
  @keyframes heroPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.6); }
    50%      { box-shadow: 0 0 0 5px rgba(16,185,129,0); }
  }
`;

/** Score formatters — always emit signed score-to-par strings. */
export function fmtScore(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  if (n === 0) return 'E';
  return n > 0 ? `+${n}` : `${n}`;
}

export function fmtScoreSign(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  if (n === 0) return 'E';
  return n > 0 ? `+${n}` : `${n}`;
}
