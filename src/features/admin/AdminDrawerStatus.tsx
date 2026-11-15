/**
 * The admin Health page and the drawer's Health dot read figures only from the `get_admin_health_*` RPCs (`useHealthLenses.ts`) and the existing service hooks, and share one verdict (`useHealthVerdict` in `components/health/healthIssues.ts`), so the dot and the page cannot disagree and no Health panel reads a table.
 * Open full-admin children own the existing live/Health queries; no table fallback.
 * The drawer live card and Analytics row share one query observer. Search uses
 * the Stage 3 overview in a threshold-mounted child to avoid idle requests.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
const t = { canvas: 'var(--cc3-canvas)', ink: 'var(--cc3-ink)', inkFaint: 'var(--cc3-faint)', neutralSoft: 'var(--cc3-initials)', good: 'var(--cc3-good)', bad: 'var(--cc3-bad)' };
import { useAnalyticsLive } from './hooks/useAnalyticsLenses';
import { useHealthVerdict } from './components/health/healthIssues';

export type DrawerLive = ReturnType<typeof useAnalyticsLive>;
export function LiveBoard({ children }: { children: (live: DrawerLive) => React.ReactNode }) {
  const live = useAnalyticsLive(false, false);
  return <>{children(live)}</>;
}
export function StatusDot({ warning = false }: { warning?: boolean }) {
  return <span aria-hidden style={{ width: 6, height: 6, flexShrink: 0, borderRadius: '50%', background: warning ? t.bad : t.good }} />;
}
export function HealthNavStatus() {
  const q = useHealthVerdict();
  if (q.isLoading || q.isError) return null;
  const n = q.issues.length;
  return <><StatusDot warning={n > 0} /><span style={{ color: n ? t.bad : t.inkFaint, fontWeight: n ? 600 : 400 }}>{n ? `${n} ${n === 1 ? 'issue' : 'issues'}` : 'All clear'}</span></>;
}
export function LiveCard({ live, onClose }: { live: DrawerLive; onClose: () => void }) {
  if (live.isError) return null;
  const data = live.data;
  const recent = data?.bars.slice(-30) ?? [];
  const bars = [...Array(Math.max(0, 30 - recent.length)).fill(0), ...recent];
  const max = Math.max(0, ...bars);
  const skeleton = (width: number) => <span aria-hidden style={{ display: 'inline-block', width, height: '1em', borderRadius: 3, background: t.neutralSoft }} />;
  return <Link to="/admin-v2/analytics?lens=live" onClick={onClose} aria-busy={live.isLoading} style={{ display: 'block', flexShrink: 0, padding: '11px 12px 10px', borderRadius: 14, background: t.canvas, color: t.ink, textDecoration: 'none' }}>
    <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.ink }}><span aria-hidden style={{ width: 7, height: 7, borderRadius: '50%', background: t.good, boxShadow: '0 0 0 3px var(--cc3-good-ring)' }} />In the app now</span>
      <ChevronRight size={13} color={t.inkFaint} />
    </span>
    <span style={{ marginTop: 6, display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', columnGap: 10, alignItems: 'end' }}>
      <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 0.95 }}>{live.isLoading ? skeleton(44) : (data?.now ?? '–')}</span>
      <span style={{ textAlign: 'right', fontSize: 11, lineHeight: 1.45, color: t.inkFaint }}><span style={{ color: t.ink, fontWeight: 700 }}>{live.isLoading ? skeleton(24) : (data?.today ?? '–')}</span> today<br />peak <span style={{ color: t.ink, fontWeight: 700 }}>{live.isLoading ? skeleton(24) : (data?.peak ?? '–')}</span>{data?.peak_at ? ` at ${data.peak_at}` : live.isLoading ? <> at {skeleton(30)}</> : null}</span>
    </span>
    <span role="img" aria-label="Screen views, last 30 minutes" style={{ marginTop: 9, height: 20, display: 'grid', gridTemplateColumns: 'repeat(30, minmax(0, 1fr))', gap: 2, alignItems: 'end' }}>
      {bars.map((v, i) => <span key={i} style={{ display: 'block', borderRadius: 1.5, height: max ? Math.max(2, Math.round(v / max * 20)) : 2, background: i === 29 ? t.good : 'color-mix(in srgb, var(--cc3-ink) 18%, transparent)' }} />)}
    </span>
  </Link>;
}
