/**
 * Handicap chart tokens (dark surface).
 *
 * Literal values, NOT var(--hcp-*), because these primitives are rendered
 * both on the page (inside .hcp-dark) and inside portalled bottom sheets
 * where --hcp-* does not resolve.
 *
 * THE HANDICAP INVERSION: an index going UP means playing WORSE, so UP is
 * red and DOWN is green. This is the opposite of the score convention and
 * it is correct on this surface.
 */

export const CHART = {
  CANVAS: '#0B0F14',
  PANEL: '#151A21',
  PANEL_2: '#1B222B',
  BORDER: 'rgba(255,255,255,0.07)',
  GRID: 'rgba(255,255,255,0.06)',
  INK: '#FFFFFF',
  MUTE: 'rgba(255,255,255,0.62)',
  DIM: 'rgba(255,255,255,0.40)',
  TRACK: 'rgba(255,255,255,0.10)',
  FAINT: 'rgba(255,255,255,0.22)',
  AMBER: '#F7931E',
  /** index rising = playing worse */
  UP: '#FF6B6B',
  /** index falling = playing better */
  DOWN: '#5EE9A6',
} as const;

export const CHART_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export type ChartTone = 'up' | 'down' | 'amber' | 'neutral';

export function toneColor(tone: ChartTone): string {
  if (tone === 'up') return CHART.UP;
  if (tone === 'down') return CHART.DOWN;
  if (tone === 'amber') return CHART.AMBER;
  return CHART.MUTE;
}

/** Dead band: movement under 0.05 does not read as movement. */
export const DEAD_BAND = 0.05;

/**
 * The ONLY comparator. `risingIsWorse` carries the polarity, so no call site
 * ever swaps its arguments to flip a colour.
 */
function movementTone(first: number, last: number, risingIsWorse: boolean): ChartTone {
  const delta = last - first;
  if (Math.abs(delta) <= DEAD_BAND) return 'neutral';
  const rising = delta > 0;
  if (rising) return risingIsWorse ? 'up' : 'down';
  return risingIsWorse ? 'down' : 'up';
}

/**
 * Lower-is-better series: handicap index, differentials, gross.
 * Rising -> 'up' (red). Falling -> 'down' (green).
 */
export function indexTone(first: number, last: number): ChartTone {
  return movementTone(first, last, true);
}

/**
 * Higher-is-better series: stableford points, birdies, greens.
 * Rising -> 'down' (green). Falling -> 'up' (red).
 *
 * Always pass it before-then-after: pointsTone(previous, current).
 */
export function pointsTone(first: number, last: number): ChartTone {
  return movementTone(first, last, false);
}


export const LABEL_STYLE = {
  fontFamily: CHART_FONT,
  fontSize: 10,  // AXIS floor: chart tick/axis label, 10 not 11
  fontWeight: 700,
  letterSpacing: '0.13em',
  textTransform: 'uppercase' as const,
  /* Axis and footer figures live in this role. Tabular so an axis label does
     not shift width as the data changes. */
  fontVariantNumeric: 'tabular-nums lining-nums' as const,
  color: CHART.DIM,
};
