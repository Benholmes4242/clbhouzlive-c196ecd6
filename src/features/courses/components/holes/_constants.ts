export const AMBER = '#F7931E';
export const DEEP_AMBER = '#B26818';                  // darker amber - empty-state pill borders (mirrors GAM.DEEP_AMBER from WHS Legends)
export const INK = '#0F172A';
export const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

// SF Pro sans stack (same value as FONT). Kept as a named export for the Holes tab figure cells.
export const SANS = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

// -----------------------------------------------------------------------------
// Scoring palette - the SC_* TEXT tokens below are the live scale.
//
// Buckets, loudest to faintest: birdie+ red, double+ deeper blue,
// bogey blue, par neutral gray. Blue on the over-par buckets is a chosen
// scale for this card, not an inheritance from an older fill grammar.
//
// The light set and the dark set are two THEMES OF ONE SCALE and MUST run in
// the same direction: damage gains emphasis as it worsens (light deepens,
// dark gains saturation). Never move one bucket without its pair.
//
// SC_FILL_GOLD and SC_FILL_BIRDIE are the only live FILL tokens.
// IMPORTANT: SC_FILL_GOLD #FFD200 is scorecard-genre broadcast gold. It is
// NOT the achievement gold (#B36B00 / #F5D061) used for majors, champions
// and No.1 surfaces. Do not substitute one for the other.
// -----------------------------------------------------------------------------

export const SC_FILL_GOLD   = '#FFD200'; // ace / albatross rarity ring
// Canonical under-par red lives in tourhub/_shared/tokens (TOPAR_UNDER_LIGHT).
// SC_FILL_BIRDIE is a re-export alias so #D2222D is declared exactly once.
export { TOPAR_UNDER_LIGHT as SC_FILL_BIRDIE } from '@/features/tourhub/_shared/tokens';


// Text tokens - light surfaces (stats, totals, distribution labels).
export const SC_ACE       = '#8A6400';
export const SC_ALBATROSS = '#9E7300';
export const SC_EAGLE     = '#B8860B';
export const SC_BIRDIE    = '#D2222D';
export const SC_PAR       = '#8A9099'; // unified on house even-gray
export const SC_BOGEY     = '#1D5DBF';
export const SC_DOUBLE    = '#0F2E63';
export const SC_ACCENT    = '#94A3B8'; // holes tab section eyebrow - slate (canonical rule)

// Text tokens - dark surfaces.
export const SC_ACE_DARK       = '#FFE066';
export const SC_ALBATROSS_DARK = '#FFD84D';
export const SC_EAGLE_DARK     = '#F5C842';
// Dark birdies share the canonical dark to-par red; no independent pink-red.
export { TOPAR_UNDER_DARK as SC_BIRDIE_DARK } from '@/features/tourhub/_shared/tokens';
export const SC_PAR_DARK       = 'rgba(242,244,247,0.42)';
export const SC_BOGEY_DARK     = '#A6C2F0'; // paler blue - lighter damage
export const SC_DOUBLE_DARK    = '#7AA6EC'; // more saturated blue - worse damage
