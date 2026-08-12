export const AMBER = '#F7931E';
export const DEEP_AMBER = '#B26818';                  // darker amber - empty-state pill borders (mirrors GAM.DEEP_AMBER from WHS Legends)
export const INK = '#0F172A';
export const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

// Mono numeral stack - analyst-grade tabular alignment on the Holes tab (data-page exception).
export const MONO = "'SF Pro', -apple-system, BlinkMacSystemFont, system-ui, sans-serif";

// -----------------------------------------------------------------------------
// "World Feed" scoring palette.
//
// Fill chips - surface-agnostic (identical on light canvas and #1B1E27):
//   birdie disc red, bogey square blue, double-plus square navy,
//   ace/albatross/eagle disc broadcast gold.
// Chip numeral ink: #FFFFFF on red/blue/navy, INK (#0F172A) on gold.
//
// IMPORTANT: SC_FILL_GOLD #FFD200 is scorecard-genre broadcast gold. It is
// NOT the achievement gold (#B36B00 / #F5D061) used for majors, champions
// and No.1 surfaces. Do not substitute one for the other.
// -----------------------------------------------------------------------------

export const SC_FILL_GOLD   = '#FFD200'; // ace / albatross rarity ring
// Canonical under-par red lives in tourhub/_shared/tokens (TOPAR_UNDER_LIGHT).
// SC_FILL_BIRDIE is a re-export alias so #D2222D is declared exactly once.
export { TOPAR_UNDER_LIGHT as SC_FILL_BIRDIE } from '@/features/tourhub/_shared/tokens';
export const SC_FILL_BOGEY  = '#1D5DBF'; // legacy fill grammar - see ship report
export const SC_FILL_DOUBLE = '#0F2E63'; // legacy fill grammar - see ship report


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
export const SC_BIRDIE_DARK    = '#FF6B5E';
export const SC_PAR_DARK       = 'rgba(242,244,247,0.42)';
export const SC_BOGEY_DARK     = '#7AA6EC';
export const SC_DOUBLE_DARK    = '#A6C2F0';
