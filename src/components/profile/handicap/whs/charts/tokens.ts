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

import { PAGE_CANVAS, MEMBER_PANEL, MEMBER_CELL, inkWithAlpha } from '@/lib/tokens/surfaces';
import { SURFACE } from '@/lib/tokens/surface';

/* ONE INK FAMILY: the chart ink is the app ink base (#F8FAFC), never pure
   white with white alphas - one base, one family. Foreground tiers use the
   ink helper, not the surface one. */
const INK_BASE = SURFACE.dark.ink;



export const CHART = {
  /* SURFACES come from the app ramp by reference. The chart keeps its own NAMES
     (twelve consumers depend on them) but no longer its own VALUES. */
  CANVAS: PAGE_CANVAS,
  PANEL: MEMBER_PANEL,
  PANEL_2: MEMBER_CELL,
  BORDER: inkWithAlpha(INK_BASE, 0.07),
  /* Grid raised to 0.09: at 0.06 it measured 1.127:1 - a defect the ramp made
     visible. Still quieter than TRACK so the hierarchy holds. */
  GRID: inkWithAlpha(INK_BASE, 0.09),
  INK: INK_BASE,
  MUTE: inkWithAlpha(INK_BASE, 0.62),
  DIM: inkWithAlpha(INK_BASE, 0.40),
  TRACK: inkWithAlpha(INK_BASE, 0.10),
  FAINT: inkWithAlpha(INK_BASE, 0.22),
  /* OPAQUE, NOT AN ALPHA. FAINT is ink at 0.22, so a dot drawn with it
     shifts tone wherever the trace passes behind it, and at a smaller
     radius it washes out against the canvas. This is the same colour
     composited over PAGE_CANVAS, made solid. Dots only. */
  DOT_IDLE: '#4A4C50',
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
