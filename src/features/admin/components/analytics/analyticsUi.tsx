/**
 * Shared pieces of the Analytics lenses, measured from the signed-off HTML
 * (analytics_*.html). Values with no admin token are the HTML literals.
 */
import React from 'react';
import { adminTheme as t } from '../../theme';
import AdminErrorState from '../AdminErrorState';

export const LIT = {
  track: 'rgba(255,255,255,0.08)',
  trackSoft: 'rgba(255,255,255,0.06)',
  inkSoft: 'rgba(233,237,243,0.55)',
  amber: 'rgba(255,168,58,1)',
  okChip: 'rgba(61,220,145,0.14)',
  dangerChip: 'rgba(255,123,114,0.14)',
  neutralChip: 'rgba(255,255,255,0.06)',
  rule: 'rgba(255,255,255,0.14)',
} as const;

export const KICKER: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' };
export const SIDE: React.CSSProperties = { fontSize: 11, color: t.inkFaint };
export const FIG_LABEL: React.CSSProperties = { fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.inkFaint };
export const ROW_RULE = `1px solid ${t.hairline}`;

export function Panel({ list, style, children }: { list?: boolean; style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <section style={{ background: t.surface, borderRadius: 16, padding: list ? '14px 0 4px' : '14px 16px', ...style }}>
      {children}
    </section>
  );
}

export function Head({ title, side, sideStyle, inset }: { title: React.ReactNode; side?: React.ReactNode; sideStyle?: React.CSSProperties; inset?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', ...(inset ? { padding: '0 16px 10px' } : null) }}>
      <span style={KICKER}>{title}</span>
      {side != null && <span style={{ ...SIDE, ...sideStyle }}>{side}</span>}
    </div>
  );
}

export function Fig({ label, value, sub, size = 18, valueColor }: {
  label: string; value: React.ReactNode; sub?: React.ReactNode; size?: number; valueColor?: string;
}) {
  return (
    <div>
      <div style={FIG_LABEL}>{label}</div>
      <div style={{ marginTop: 2, fontSize: size, fontWeight: 800, color: valueColor }}>{value}</div>
      {sub != null && <div style={{ fontSize: 10, color: t.inkFaint }}>{sub}</div>}
    </div>
  );
}

/** Flat surface placeholder at the panel's spec height. No shimmer, no spinner. */
export function PanelSkeleton({ height }: { height: number }) {
  return <section aria-hidden style={{ background: t.surface, borderRadius: 16, height }} />;
}

export function PanelError({ onRetry, retrying }: { onRetry: () => void; retrying?: boolean }) {
  return (
    <Panel>
      <AdminErrorState title="Couldn't load this panel" onRetry={onRetry} retrying={retrying} />
    </Panel>
  );
}

export function Muted({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ fontSize: 12, color: t.inkFaint, ...style }}>{children}</div>;
}

export function FooterButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: 44,
        border: 0, borderTop: ROW_RULE, background: 'transparent', cursor: 'pointer',
        fontSize: 11.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.inkMuted,
        fontFamily: 'inherit',
      }}
    >{children}</button>
  );
}

/** Wraps one panel's query state: skeleton, error with Retry, or content. */
export function Slot<T>({ q, height, children }: {
  q: { data: T | undefined; isLoading: boolean; isError: boolean; isFetching: boolean; refetch: () => unknown };
  height: number;
  children: (d: T) => React.ReactNode;
}) {
  if (q.data !== undefined) return <>{children(q.data)}</>;
  if (q.isError) return <PanelError onRetry={() => { void q.refetch(); }} retrying={q.isFetching} />;
  return <PanelSkeleton height={height} />;
}
