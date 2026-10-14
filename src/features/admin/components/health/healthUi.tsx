/** Health-only literals and small pieces from health_*.html (no token exists for these). */
import React from 'react';
import { adminTheme as t } from '../../theme';

export const H = {
  okBar: '#3DDC91',
  okText: '#5FE3A8',
  dangerBar: '#FF7B72',
  dangerText: '#FF9B93',
  amber: t.warnText,
  brand: '#FFA83A',
  track: 'rgba(255,255,255,0.08)',
  tile: 'rgba(255,255,255,0.04)',
  inkSoft: 'rgba(233,237,243,0.55)',
  inkOld: 'rgba(233,237,243,0.35)',
  rule: 'rgba(255,255,255,0.14)',
  chip: 'rgba(255,255,255,0.06)',
  okChip: 'rgba(61,220,145,0.14)',
  warnChip: 'rgba(249,200,116,0.14)',
  tileWarn: 'rgba(249,200,116,0.08)',
  mono: 'ui-monospace, Menlo, monospace',
} as const;

export const SUB_LABEL: React.CSSProperties = { fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.inkFaint };
export const META: React.CSSProperties = { display: 'block', fontSize: 10.5, color: t.inkFaint };

export function Bar({ pct, color, height = 8 }: { pct: number; color: string; height?: number }) {
  const w = Math.max(0, Math.min(100, pct));
  return (
    <div style={{ marginTop: 5, height, borderRadius: 3, background: H.track }}>
      <div style={{ height: '100%', width: `${w}%`, borderRadius: 3, background: color }} />
    </div>
  );
}

export function PillButton({ children, onClick, primary, disabled, style }: {
  children: React.ReactNode; onClick?: () => void; primary?: boolean; disabled?: boolean; style?: React.CSSProperties;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{
      height: 34, padding: '0 14px', borderRadius: 999, fontSize: 12, fontFamily: 'inherit', cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      ...(primary
        ? { border: 0, background: t.ink, color: t.canvas, fontWeight: 800 }
        : { border: `1px solid ${H.rule}`, background: 'transparent', color: t.ink, fontWeight: 700 }),
      ...style,
    }}>{children}</button>
  );
}
