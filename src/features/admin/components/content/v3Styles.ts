/**
 * CONTENT_V3 — the small shared style module for the four Content v3 tabs.
 * Every colour is a Command centre v3 token (CC3/NUM from InboxPanels); no amber.
 * Uppercase on buttons is CSS only: DOM text keeps its case so accessible names do not change.
 */
import type React from 'react';
import { CC3, NUM } from '../InboxPanels';

export const INK_55 = 'rgba(233,237,243,0.55)';
export const INK_30 = 'rgba(233,237,243,0.3)';

export const LABEL10: React.CSSProperties = { fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: CC3.faint };
export const FIG18: React.CSSProperties = { ...NUM, fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1, color: CC3.ink };
export const FIG_SMALL: React.CSSProperties = { fontSize: 11, fontWeight: 600, letterSpacing: 0, color: CC3.mute };
export const CAPTION: React.CSSProperties = { fontSize: 10.5, fontWeight: 600, color: CC3.faint, marginTop: 1, overflowWrap: 'anywhere' };
/** Figures inside a STATS grid take marginTop 3. */
export const STATS = (cols: number): React.CSSProperties => ({ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 8, marginTop: 12 });
export const RULE: React.CSSProperties = { marginTop: 12, paddingTop: 11, borderTop: `1px solid ${CC3.hair}` };
export const LIST_HEAD: React.CSSProperties = { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, padding: '0 14px', marginBottom: 12 };
export const PANEL_HEAD: React.CSSProperties = { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 };
export const ROW: React.CSSProperties = {
  display: 'grid', columnGap: 12, alignItems: 'center', width: '100%', padding: '10px 14px',
  borderTop: `1px solid ${CC3.hair}`, borderLeft: 0, borderRight: 0, borderBottom: 0, background: 'transparent',
  textAlign: 'left', font: 'inherit', color: CC3.ink, cursor: 'pointer', boxSizing: 'border-box',
};
export const NAME: React.CSSProperties = { display: 'block', fontSize: 13.5, fontWeight: 700, lineHeight: 1.25, overflowWrap: 'anywhere' };
export const SUB: React.CSSProperties = { display: 'block', fontSize: 11, color: CC3.faint, marginTop: 2, lineHeight: 1.35, overflowWrap: 'anywhere' };
export const MORE3: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: 40,
  borderTop: `1px solid ${CC3.hair}`, borderLeft: 0, borderRight: 0, borderBottom: 0, background: 'transparent',
  fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: CC3.faint, cursor: 'pointer', ...NUM,
};
export const EMPTY: React.CSSProperties = { padding: 14, borderTop: `1px solid ${CC3.hair}`, fontSize: 12, color: CC3.faint };
export function ochip(tone: 'bad' | 'neutral'): React.CSSProperties {
  return {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', padding: '2px 7px', borderRadius: 999,
    border: `1px solid ${tone === 'bad' ? 'rgba(255,123,114,0.45)' : CC3.line}`,
    color: tone === 'bad' ? CC3.bad : CC3.mute, whiteSpace: 'nowrap',
  };
}
export const CHIP_ROW: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 6 };
/** Same chip as the Inbox QueueChips. */
export function chipStyle(on: boolean): React.CSSProperties {
  return {
    height: 28, padding: '0 11px', borderRadius: 999, fontSize: 11.5, fontWeight: 600,
    display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
    background: on ? CC3.ink : CC3.surface, color: on ? CC3.canvas : CC3.mute,
  };
}
export function chipCount(on: boolean): React.CSSProperties {
  return { ...NUM, fontWeight: 700, color: on ? CC3.canvas : CC3.ink };
}
/** The Members sort control. */
export const SORT_WRAP: React.CSSProperties = { display: 'inline-flex', background: CC3.inset, borderRadius: 999, padding: 3 };
export function sortBtn(on: boolean): React.CSSProperties {
  return {
    height: 24, padding: '0 10px', borderRadius: 999, border: 'none', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
    whiteSpace: 'nowrap', cursor: 'pointer', background: on ? CC3.ink : 'transparent', color: on ? CC3.canvas : CC3.faint,
  };
}
export const RAIL_FIG: React.CSSProperties = { ...NUM, display: 'block', fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' };
export const RAIL_LABEL: React.CSSProperties = { display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: CC3.faint, marginTop: 1 };
