/**
 * BRIEF_CONTENT_DESK — the translucent steps the five signed-off mocks use on
 * top of adminTheme. They have no adminTheme token, so they live here once
 * rather than inline in each section. Opaque colours always come from
 * adminTheme; nothing here is a new amber.
 */
import { adminTheme as t } from '../../theme';

export const desk = {
  cellBg: 'rgba(255,255,255,0.035)',
  trackBg: 'rgba(255,255,255,0.08)',
  trackFaint: 'rgba(255,255,255,0.04)',
  pillNeutral: 'rgba(255,255,255,0.07)',
  todayRing: 'inset 0 0 0 1px rgba(233,237,243,0.5)',
  ink45: 'rgba(233,237,243,0.45)',
  ink55: 'rgba(233,237,243,0.55)',
  ink30: 'rgba(233,237,243,0.3)',
  dangerOutline: 'rgba(255,123,114,0.45)',
  warnOutline: 'rgba(249,200,116,0.4)',
} as const;

export const SECTION: React.CSSProperties = { background: t.surface, borderRadius: 16, padding: '14px 16px' };
export const LIST_SECTION: React.CSSProperties = { background: t.surface, borderRadius: 16, padding: '14px 0 4px' };
export const H: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.ink };
export const H_RIGHT: React.CSSProperties = { fontSize: 11, color: t.inkFaint };
export const FIG_LABEL: React.CSSProperties = { fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.inkFaint };
export const FIG: React.CSSProperties = { marginTop: 2, fontSize: 20, fontWeight: 800, color: t.ink };
export const FIG_SUB: React.CSSProperties = { fontSize: 10.5, color: t.inkFaint };
export const MORE: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, width: '100%',
  borderTop: `1px solid ${t.hairline}`, borderLeft: 0, borderRight: 0, borderBottom: 0, background: 'transparent',
  fontSize: 11.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.inkMuted, cursor: 'pointer',
};
export const ROW_BTN: React.CSSProperties = {
  display: 'block', width: '100%', textAlign: 'left', padding: '11px 16px', background: 'transparent',
  border: 0, borderTop: `1px solid ${t.hairline}`, color: t.ink, cursor: 'pointer', font: 'inherit',
};
export const DOT = ' \u00B7 ';

export function chip(tone: 'danger' | 'warn'): React.CSSProperties {
  return {
    fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 999,
    border: `1px solid ${tone === 'danger' ? desk.dangerOutline : desk.warnOutline}`,
    color: tone === 'danger' ? t.dangerText : t.warnText,
  };
}

export function beatColour(kind: 'tour' | 'amateur'): string {
  return kind === 'tour' ? t.ink : t.brand;
}
