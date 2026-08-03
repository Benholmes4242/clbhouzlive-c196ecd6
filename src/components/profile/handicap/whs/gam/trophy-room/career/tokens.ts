/**
 * Career record tokens.
 *
 * Literal values (not var(--hcp-*)) because the room renders inside a
 * portalled bottom sheet where the page scope does not resolve.
 *
 * COLOUR RULES, and there are only two:
 *   AMBER means a threshold passed, a record held, or the viewing member.
 *   GOOD (green) means a measured share that is favourable.
 * Nothing else on this surface carries colour.
 */
import { CHART, CHART_FONT } from '../../../charts/tokens';

export const REC = {
  CANVAS: CHART.CANVAS,
  PANEL: CHART.PANEL,
  PANEL_2: CHART.PANEL_2,
  BORDER: CHART.BORDER,
  TRACK: CHART.TRACK,
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
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
  color: REC.AMBER,
};

export const LABEL = {
  fontSize: 9,
  fontWeight: 800,
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
  fontWeight: 800,
  letterSpacing: '-0.02em',
  color: REC.INK,
  ...REC.TABULAR,
};
