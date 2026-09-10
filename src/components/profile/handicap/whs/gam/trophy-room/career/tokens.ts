/**
 * Career record tokens.
 *
 * Literal values (not var(--hcp-*)) because the room renders inside a
 * portalled bottom sheet where the page scope does not resolve.
 *
 * COLOUR RULES, and there are only three:
 *   INK is every figure. This whole sheet IS the viewing member, so amber on a
 *   figure here distinguishes them from nobody and makes each one shout equally.
 *   GOOD (green) means a completed ladder or a reached milestone, nothing else.
 *   AMBER survives only as a BAR FILL -- a bar is a state, not an identity.
 * Nothing else on this surface carries colour.
 */
import { CHART, CHART_FONT } from '../../../charts/tokens';

export const REC = {
  CANVAS: CHART.CANVAS,
  PANEL: CHART.PANEL,
  PANEL_2: CHART.PANEL_2,
  BORDER: CHART.BORDER,
  TRACK: CHART.TRACK,
  /**
   * Bar track. Lifted off CHART.TRACK on purpose: against the panel a faint
   * track makes a 0% bar read as a hairline and a 100% bar as a solid band,
   * so the same component looked like two different objects. At 0.16 an empty
   * bar still reads as a bar.
   */
  BAR_TRACK: 'rgba(255,255,255,0.16)',
  INK: CHART.INK,
  MUTE: CHART.MUTE,
  DIM: CHART.DIM,
  AMBER: CHART.AMBER,
  GOOD: CHART.DOWN,
  FONT: CHART_FONT,
  TABULAR: {
    fontVariantNumeric: 'tabular-nums lining-nums' as const,
    fontFeatureSettings: '"kern" 1, "liga" 1',
  },
} as const;

export const KICKER = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
  color: 'rgba(255,255,255,0.62)',
};

export const LABEL = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.13em',
  textTransform: 'uppercase' as const,
  color: REC.DIM,
};

export const CAPTION = {
  fontSize: 12.5,
  lineHeight: 1.5,
  color: REC.MUTE,
};

export const FIGURE = {
  fontWeight: 700,
  letterSpacing: '-0.02em',
  color: REC.INK,
  ...REC.TABULAR,
};
