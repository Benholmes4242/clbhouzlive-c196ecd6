/** Health-only literals and small pieces from health_*.html (no token exists for these). */
import React from 'react';
import { Link } from 'react-router-dom';
import { adminTheme as t } from '../../theme';
import { ROW_RULE } from '../analytics/analyticsUi';

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

/** Two-column list row (title + meta | right), optionally a link. */
export function ListRow({ to, title, meta, right, inset = false, onClick, titleStyle }: {
  to?: string; title: React.ReactNode; meta?: React.ReactNode; right?: React.ReactNode; inset?: boolean; onClick?: () => void; titleStyle?: React.CSSProperties;
}) {
  const style: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: 10, alignItems: 'center',
    padding: inset ? '10px 16px' : '9px 0', borderTop: ROW_RULE, color: t.ink, textDecoration: 'none',
    background: 'transparent', border: 0, borderTopStyle: 'solid', width: '100%', textAlign: 'left', fontFamily: 'inherit',
  };
  const inner = (
    <>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 700, ...titleStyle }}>{title}</span>
        {meta != null && <span style={META}>{meta}</span>}
      </span>
      {right}
    </>
  );
  if (to) return <Link to={to} style={style}>{inner}</Link>;
  if (onClick) return <button type="button" onClick={onClick} style={{ ...style, borderTop: ROW_RULE, cursor: 'pointer' }}>{inner}</button>;
  return <div style={style}>{inner}</div>;
}
