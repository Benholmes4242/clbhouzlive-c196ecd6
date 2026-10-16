// ARCHITECTURE RULE: Invites own their surviving presentation; colours read
// canonical chart tokens, not a retired Trophy Room's private module.
import React, { useState } from 'react';
import { CHART, CHART_FONT } from '../../charts/tokens';

export const REC = {
  PANEL: CHART.PANEL,
  BORDER: CHART.BORDER,
  INK: CHART.INK,
  MUTE: CHART.MUTE,
  DIM: CHART.DIM,
  GOOD: CHART.DOWN,
  FONT: CHART_FONT,
  TABULAR: {
    fontVariantNumeric: 'tabular-nums lining-nums' as const,
    fontFeatureSettings: '"kern" 1, "liga" 1',
  },
};
export const KICKER = { fontSize: 9, fontWeight: 700, letterSpacing: '0.19em', textTransform: 'uppercase' as const, color: REC.DIM };
export const LABEL = { ...KICKER, letterSpacing: '0.12em' };
export const CAPTION = { fontSize: 13, lineHeight: 1.55, color: REC.MUTE };

export const Collapsible: React.FC<{
  children: React.ReactNode;
  threshold?: number;
  collapsedCount?: number;
  showAllLabel: React.ReactNode;
  showFewerLabel: React.ReactNode;
}> = ({ children, threshold = 5, collapsedCount = 3, showAllLabel, showFewerLabel }) => {
  const [open, setOpen] = useState(false);
  const rows = React.Children.toArray(children);
  if (rows.length <= threshold) return <>{rows}</>;
  return <>
    {open ? rows : rows.slice(0, collapsedCount)}
    <div style={{ padding: '11px 14px', borderTop: `1px solid ${REC.BORDER}` }}>
      <button type="button" onClick={() => setOpen((prev) => !prev)} style={{ background: 'transparent', border: 'none', padding: 0, fontFamily: REC.FONT, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.02em', color: REC.INK, cursor: 'pointer' }}>
        {open ? showFewerLabel : showAllLabel}
      </button>
    </div>
  </>;
};