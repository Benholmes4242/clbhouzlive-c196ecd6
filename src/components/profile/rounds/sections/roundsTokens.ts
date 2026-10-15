/**
 * Rounds-tab ink tiers — DERIVED from the app ink via inkWithAlpha, not new
 * values. Amber comes from CHART.AMBER (existing state; no new amber owner).
 * Green is the handicap family's GOOD.
 */
import type React from 'react';
import { inkWithAlpha } from '@/lib/tokens/surfaces';
import { SURFACE } from '@/lib/tokens/surface';
import { CHART } from '@/components/profile/handicap/whs/charts/tokens';
import { GOOD } from '@/components/profile/handicap/whs/connect/designTokens';

const INK_BASE = SURFACE.dark.ink;

export const RT = {
  INK: CHART.INK,
  BODY: inkWithAlpha(INK_BASE, 0.72),
  MUTE: CHART.MUTE,
  DIM: inkWithAlpha(INK_BASE, 0.42),
  FAINT: inkWithAlpha(INK_BASE, 0.30),
  BASELINE: inkWithAlpha(INK_BASE, 0.12),
  TRACK: inkWithAlpha(INK_BASE, 0.07),
  SOFT: inkWithAlpha(INK_BASE, 0.06),
  HAIRLINE: CHART.BORDER,
  PANEL: CHART.PANEL,
  AMBER: CHART.AMBER,
  GREEN: GOOD,
} as const;

export const KICKER: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: RT.AMBER,
};
export const TITLE: React.CSSProperties = {
  fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', color: RT.INK, marginTop: 5,
};
export const TAB: React.CSSProperties = { fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"kern" 1, "liga" 1' };

export const note = (border: string): React.CSSProperties => ({
  borderLeft: `2px solid ${border}`, paddingLeft: 10, fontSize: 12.5, lineHeight: 1.5, color: RT.MUTE,
});

export const SR_ONLY: React.CSSProperties = {
  position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden',
  clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0,
};

export const fmt1 = (n: number) => n.toFixed(1);
