/** Open full-admin children own the existing live/Health queries; no table fallback. */
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { adminTheme as t } from './theme';
import { useAnalyticsLive } from './hooks/useAnalyticsLenses';
import { useHealthVerdict } from './components/health/healthIssues';

export type DrawerLive = ReturnType<typeof useAnalyticsLive>;
export function LiveBoard({ children }: { children: (live: DrawerLive) => React.ReactNode }) {
  const live = useAnalyticsLive(false, false);
  return <>{children(live)}</>;
}
export function StatusDot({ warning = false }: { warning?: boolean }) {
  return <span aria-hidden style={{ width: 7, height: 7, flexShrink: 0, borderRadius: '50%', background: warning ? t.warn : t.ok }} />;
}
export function HealthNavStatus() {
  const q = useHealthVerdict();
  if (q.isLoading || q.isError) return null;
  const n = q.issues.length;
  return <><StatusDot warning={n > 0} /><span style={{ color: n ? t.warnText : t.inkFaint }}>{n ? `${n} ${n === 1 ? 'issue' : 'issues'}` : 'All clear'}</span></>;
}
export function LiveCard({ live, onClose }: { live: DrawerLive; onClose: () => void }) {
  if (live.isError) return null;
  const data = live.data;
  const recent = data?.bars.slice(-30) ?? [];
  const bars = [...Array(Math.max(0, 30 - recent.length)).fill(0), ...recent];
  const max = Math.max(0, ...bars);
  const skeleton = (width: number) => <span aria-hidden style={{ display: 'inline-block', width, height: '1em', borderRadius: 3, background: t.neutralSoft }} />;
  return <Link to="/admin-v2/analytics?lens=live" onClick={onClose} aria-busy={live.isLoading} style={{ display: 'block', flexShrink: 0, margin: '14px 14px 0', padding: 14, borderRadius: 14, background: t.canvas, border: `1px solid ${t.hairline}`, color: t.ink, textDecoration: 'none' }}>
    <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ display: 'inline-flex', gap: 7, alignItems: 'center', fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: t.okText }}><span aria-hidden style={{ width: 7, height: 7, borderRadius: '50%', background: t.ok, boxShadow: `0 0 0 3px ${t.okSoft}` }} />In the app now</span>
      <ChevronRight size={14} color={t.inkFaint} />
    </span>
    <span style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', columnGap: 14, alignItems: 'end', minHeight: 36 }}>
      <span style={{ fontSize: 36, fontWeight: 700, lineHeight: 1 }}>{live.isLoading ? skeleton(44) : (data?.now ?? '–')}</span>
      <span style={{ textAlign: 'right', fontSize: 12, lineHeight: 1.45, color: t.inkMuted }}><span style={{ color: t.ink, fontWeight: 600 }}>{live.isLoading ? skeleton(24) : (data?.today ?? '–')}</span> today<br />peak <span style={{ color: t.ink, fontWeight: 600 }}>{live.isLoading ? skeleton(24) : (data?.peak ?? '–')}</span>{data?.peak_at ? ` at ${data.peak_at}` : live.isLoading ? <> at {skeleton(30)}</> : null}</span>
    </span>
    <span role="img" aria-label="Screen views, last 30 minutes" style={{ marginTop: 12, height: 28, display: 'grid', gridTemplateColumns: 'repeat(30, minmax(0, 1fr))', gap: 2, alignItems: 'end' }}>
      {bars.map((v, i) => <span key={i} style={{ display: 'block', borderRadius: 1.5, height: max ? Math.max(2, Math.round(v / max * 28)) : 2, background: i === 29 ? t.ok : 'rgba(255,255,255,0.18)' }} />)}
    </span>
  </Link>;
}
