/** Health: App lens (health_app.html). */
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { trackError } from '@/lib/errorTracking';
import { adminTheme as t } from '../../theme';
import { FooterButton, Head, Muted, Panel, PanelError, PanelSkeleton, ROW_RULE, Slot, FIG_LABEL } from '../analytics/analyticsUi';
import { dateLabel, num } from '../analytics/analyticsFormat';
import { useHealthApp, type HealthApp } from '../../hooks/useHealthLenses';
import { usePushHealth } from '../../hooks/usePushHealth';
import { useEchoEngineHealth } from '../../hooks/useEchoEngineHealth';
import { crashFree } from './healthIssues';
import { ageOf, plural } from './healthText';
import { H, META } from './healthUi';

function CrashFree({ a }: { a: HealthApp }) {
  const cf = crashFree(a);
  const color = !cf ? t.ink : cf.pct >= 99 ? H.okText : cf.pct >= 95 ? H.amber : H.dangerText;
  let body: string;
  if (!cf) body = 'Waiting for sessions that report their build.';
  else if ((a.errors_7d_current ?? 0) > 0) body = `${plural(a.errors_7d_current!, 'error')} from the current build this week, the last ${ageOf(a.last_current_error_at)} ago.`;
  else if ((a.errors_14d ?? 0) === 0) body = 'No errors in 14 days.';
  else if ((a.errors_14d_old ?? 0) > 0) body = `No errors from the current build. The ${plural(a.errors_14d_old!, 'error')} in the last 14 days all came from ${plural(a.old_error_members ?? 0, 'member')} on old builds.`;
  else body = 'No errors from the current build.';
  return (
    <Panel style={{ padding: 16 }}>
      <Head title="Crash-free sessions" side={<>current build &middot; 7 days</>} />
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, color }}>{cf ? cf.text : '-'}</span>
        {cf && <span style={{ fontSize: 12.5, fontWeight: 600, color: t.inkMuted }}>of {plural(a.sessions_7d_current!, 'session')}</span>}
      </div>
      <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.45, color: t.inkMuted }}>{body}</div>
    </Panel>
  );
}

function Builds({ a }: { a: HealthApp }) {
  const [all, setAll] = useState(false);
  const b = a.builds;
  const tot = b.tracked_sessions ?? 0;
  const pctOf = (v: number | null) => (tot ? Math.min(100, (100 * (v ?? 0)) / tot) : 0);
  const legend = (c: string, label: string, sub: string) => (
    <span>
      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: c, marginRight: 6 }} />{label}
      <span style={{ display: 'block', marginTop: 2, fontSize: 10, color: t.inkFaint }}>{sub}</span>
    </span>
  );
  const members = all ? a.old_members : a.old_members.slice(0, 3);
  return (
    <Panel style={{ paddingBottom: a.old_members.length > 3 ? 4 : undefined }}>
      <Head title="Builds in use" side={<>sessions &middot; 7 days</>} />
      {tot === 0 ? (
        <>
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800, lineHeight: 1 }}>-</div>
          <Muted style={{ marginTop: 8 }}>No sessions have reported a build yet.</Muted>
        </>
      ) : (
        <>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>{Math.round(pctOf(b.current))}%</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: t.inkMuted }}>on the current build</span>
          </div>
          <div style={{ marginTop: 12, display: 'flex', height: 14, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
            <div style={{ width: `${pctOf(b.current)}%`, background: H.okBar }} />
            <div style={{ width: `${pctOf(b.previous)}%`, background: H.inkSoft }} />
            {(b.older ?? 0) > 0 && <div style={{ flex: 1, background: H.amber }} />}
          </div>
          <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6, fontSize: 11 }}>
            {legend(H.okBar, 'Current', `${(a.build_id ?? '-').slice(0, 7)} · ${dateLabel(b.current_first_seen)}`)}
            {legend(H.inkSoft, 'Previous', 'one behind')}
            {legend(H.amber, 'Older', b.older_builds == null ? '-' : plural(b.older_builds, 'build'))}
          </div>
        </>
      )}
      <div style={{ marginTop: 14, ...FIG_LABEL }}>Members on old builds</div>
      <div style={{ marginTop: 4 }}>
        {!a.old_members.length && <Muted style={{ padding: '9px 0', borderTop: ROW_RULE }}>Everyone is on the current build.</Muted>}
        {members.map((m) => (
          <Link key={m.user_id} to={`/admin-v2/users?member=${m.user_id}`} style={{
            display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: 10, alignItems: 'center', padding: '9px 0', borderTop: ROW_RULE, color: t.ink, textDecoration: 'none',
          }}>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 13, fontWeight: 700 }}>{m.name ?? '-'}</span>
              <span style={META}>build {(m.build ?? '-').slice(0, 7)} &middot; last seen {ageOf(m.last_seen)} ago</span>
            </span>
            {(m.errors ?? 0) > 0 && <span style={{ fontSize: 12, fontWeight: 800, color: H.amber }}>{plural(m.errors!, 'error')}</span>}
          </Link>
        ))}
      </div>
      {a.old_members.length > 3 && !all && (
        <div style={{ margin: '0 -16px' }}><FooterButton onClick={() => setAll(true)}>{a.old_members.length - 3} more</FooterButton></div>
      )}
    </Panel>
  );
}

function Errors({ a }: { a: HealthApp }) {
  const days = a.daily.slice(-14);
  const max = Math.max(0, ...days.map((d) => (d.current ?? 0) + (d.old ?? 0)));
  const h = (v: number | null) => (max > 0 ? Math.min(100, (100 * (v ?? 0)) / max) : 0);
  return (
    <Panel>
      <Head title="Errors" side="14 days" />
      {(a.errors_14d ?? 0) === 0 && !a.top.length ? (
        <Muted style={{ marginTop: 10 }}>No errors in 14 days.</Muted>
      ) : (
        <>
          <div style={{ marginTop: 14, height: 64, display: 'grid', gridTemplateColumns: 'repeat(14, minmax(0, 1fr))', gap: 4, alignItems: 'end' }}>
            {days.map((d) => (
              <div key={d.d} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', gap: 1 }}>
                <div style={{ borderRadius: 2, height: `${h(d.old)}%`, background: H.inkOld }} />
                {(d.current ?? 0) > 0
                  ? <div style={{ borderRadius: 2, height: `${h(d.current)}%`, background: H.dangerBar }} />
                  : <div style={{ borderRadius: 2, height: 2, background: H.track }} />}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: 9.5, fontWeight: 700, color: t.inkFaint }}>
            <span>{dateLabel(days[0]?.d)}</span><span>today</span>
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 14, fontSize: 10.5, color: t.inkFaint }}>
            {([['current build', H.dangerBar], ['old builds', H.inkOld]] as const).map(([l, c]) => (
              <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{l}</span>
            ))}
          </div>
          <div style={{ marginTop: 14, ...FIG_LABEL }}>Most frequent</div>
          {!a.top.length && <Muted style={{ padding: '9px 0' }}>No errors in 14 days.</Muted>}
          {a.top.map((e, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: 10, alignItems: 'center', padding: '9px 0', borderTop: ROW_RULE }}>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, fontFamily: H.mono, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.message}</span>
                <span style={META}>{e.on_current ? 'current build' : 'old builds only'} &middot; {e.members == null ? '-' : plural(e.members, 'member')} &middot; last {ageOf(e.last_at)} ago</span>
              </span>
              <span style={{ fontSize: 12, fontWeight: 800 }}>{num(e.n)}</span>
            </div>
          ))}
        </>
      )}
    </Panel>
  );
}

function Services() {
  const push = usePushHealth();
  const echo = useEchoEngineHealth();
  if (push.isLoading || echo.isLoading) return <PanelSkeleton height={150} />;
  if (!push.data && !echo.data) return <PanelError onRetry={() => { void push.refetch(); void echo.refetch(); }} />;
  const q = push.data?.queue;
  const latest = echo.data?.latest ?? [];
  const okN = latest.filter((x) => x.ok).length;
  const newest = latest.reduce<string | null>((m, x) => (!m || x.checked_at > m ? x.checked_at : m), null);
  return (
    <Panel>
      <Head title="Services" />
      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: 10, alignItems: 'center', paddingBottom: 12 }}>
        <span>
          <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700 }}>Push notifications</span>
          <span style={META}>
            {q ? <>{num(q.sent_24h)} sent in 24h &middot; median delivery {q.latency_p50_ms == null ? '-' : `${Math.round(q.latency_p50_ms)}ms`} &middot; {num(q.pending_now)} waiting</> : '-'}
          </span>
        </span>
        <span style={{ fontSize: 13, fontWeight: 800, color: !q ? t.ink : q.errored_24h > 0 ? H.dangerText : H.okText }}>{q ? `${num(q.errored_24h)} failed` : '-'}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: 10, alignItems: 'center', paddingTop: 12, borderTop: ROW_RULE }}>
        <span>
          <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700 }}>Echo</span>
          <span style={META}>answer engines &middot; checked {newest ? `${ageOf(newest)} ago` : '-'}</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {latest.map((x, i) => <span key={i} style={{ width: 8, height: 8, borderRadius: 4, background: x.ok ? H.okBar : H.dangerBar }} />)}
          <span style={{ marginLeft: 6, fontSize: 13, fontWeight: 800 }}>{latest.length ? `${okN}/${latest.length}` : '-'}</span>
        </span>
      </div>
    </Panel>
  );
}

/** The StabilityTab pipe test, restyled. trackError dedupes repeats, so the button rests 15s. */
function CheckTracking({ a, refetch }: { a: HealthApp | undefined; refetch: () => void }) {
  const [cool, setCool] = useState(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const send = () => {
    trackError({ kind: 'test', message: 'Admin pipe test' });
    setCool(true);
    timers.current.push(window.setTimeout(refetch, 5_000));
    timers.current.push(window.setTimeout(() => setCool(false), 15_000));
  };
  return (
    <section style={{ borderRadius: 16, padding: '14px 16px', boxShadow: `inset 0 0 0 1px ${t.line}`, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: 12, alignItems: 'center' }}>
      <span>
        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700 }}>Check error tracking</span>
        <span style={{ display: 'block', marginTop: 2, fontSize: 11, lineHeight: 1.45, color: t.inkFaint }}>Sends a harmless test error through the whole pipeline</span>
        {a && (
          <span style={{ display: 'block', marginTop: 2, fontSize: 11, lineHeight: 1.45, color: t.inkFaint }}>
            {a.last_test_at ? `Last test received ${ageOf(a.last_test_at)} ago` : 'No test received in 14 days'}
          </span>
        )}
      </span>
      <button type="button" onClick={send} disabled={cool} style={{
        height: 36, padding: '0 14px', borderRadius: 999, border: 0, background: t.brandSoft, color: t.brandText,
        fontSize: 12, fontWeight: 800, fontFamily: 'inherit', cursor: cool ? 'default' : 'pointer', opacity: cool ? 0.6 : 1,
      }}>{cool ? 'Sent' : 'Send test'}</button>
    </section>
  );
}

export default function AppLens() {
  const app = useHealthApp();
  return (
    <>
      <Slot q={app} height={150}>{(a) => <CrashFree a={a} />}</Slot>
      <Slot q={app} height={330}>{(a) => <Builds a={a} />}</Slot>
      <Slot q={app} height={300}>{(a) => <Errors a={a} />}</Slot>
      <Services />
      <CheckTracking a={app.data} refetch={() => { void app.refetch(); }} />
    </>
  );
}
