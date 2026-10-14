/** Health: Status lens (health_status.html). */
import React from 'react';
import { Link } from 'react-router-dom';
import { adminTheme as t } from '../../theme';
import { Fig, Head, Muted, Panel, PanelError, PanelSkeleton, ROW_RULE, Slot, KICKER } from '../analytics/analyticsUi';
import { DAY_NAMES, dateLabel, londonHM, num } from '../analytics/analyticsFormat';
import { useHealthApp, useHealthGolf, useHealthJobs } from '../../hooks/useHealthLenses';
import { useEchoEngineHealth } from '../../hooks/useEchoEngineHealth';
import { usePushHealth } from '../../hooks/usePushHealth';
import { useDeletionIntegrity } from '../../hooks/useDeletionIntegrity';
import { useSystemStateHistory, type SystemDayState } from '../../hooks/useSystemStateHistory';
import { areaTone, jobProblems, useHealthVerdict, type Issue, type IssueArea } from './healthIssues';
import { lensLabel, type HealthLens } from './healthLens';
import { hoursMins, plural } from './healthText';
import { H } from './healthUi';

const lensHref = (l: HealthLens) => `/admin-v2/health?lens=${l}`;

const PALETTE = {
  ok: { bg: 'rgba(61,220,145,0.08)', ring: 'rgba(61,220,145,0.3)', dot: '#5FE3A8', kicker: '#5FE3A8', btn: '#5FE3A8' },
  warn: { bg: 'rgba(249,200,116,0.08)', ring: 'rgba(249,200,116,0.3)', dot: '#F9C874', kicker: '#F9C874', btn: '#F9C874' },
  danger: { bg: 'rgba(255,123,114,0.08)', ring: 'rgba(255,123,114,0.3)', dot: '#FF7B72', kicker: '#FF9B93', btn: '#FF9B93' },
};

function Verdict() {
  const v = useHealthVerdict();
  if (v.isLoading) return <PanelSkeleton height={176} />;
  if (v.isError) return <PanelError onRetry={v.retry} retrying={v.retrying} />;
  const issues = v.issues;
  const tone = !issues.length ? 'ok' : issues.some((i) => i.tone === 'danger') ? 'danger' : 'warn';
  const p = PALETTE[tone];
  const first = issues[0] as Issue | undefined;
  return (
    <section style={{ borderRadius: 16, padding: 16, background: p.bg, boxShadow: `inset 0 0 0 1px ${p.ring}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: 4, background: p.dot }} />
        <span style={{ ...KICKER, color: p.kicker }}>
          {first ? `${issues.length} ${issues.length === 1 ? 'thing needs' : 'things need'} you` : 'All clear'}
        </span>
      </div>
      <div style={{ marginTop: 8, fontSize: 20, fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
        {first ? first.title : 'Everything is running normally'}
      </div>
      {first?.body && <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.45, color: t.inkMuted }}>{first.body}</div>}
      {issues.length > 1 && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {issues.slice(1).map((i, k) => (
            <Link key={k} to={lensHref(i.lens)} style={{ fontSize: 12, color: t.inkMuted, textDecoration: 'none' }}>{i.title}</Link>
          ))}
        </div>
      )}
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 11, color: t.inkFaint }}>Everything else normal &middot; checked {londonHM(v.checkedAt || null)}</span>
        {first && (
          <Link to={lensHref(first.lens)} style={{
            height: 34, padding: '0 14px', borderRadius: 999, background: p.btn, color: t.canvas, fontSize: 12, fontWeight: 800,
            display: 'inline-flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0,
          }}>Open {lensLabel(first.lens)}</Link>
        )}
      </div>
    </section>
  );
}

/** 'YYYY-MM-DD' -> 'Mon'..'Sun' without new Date() on the calendar string. */
function dayName(d: string): string {
  const [y, m, dd] = d.slice(0, 10).split('-').map(Number);
  if (!y || !m || !dd) return '-';
  const dow = new Date(Date.UTC(y, m - 1, dd)).getUTCDay(); // UTC midnight of that calendar day
  return DAY_NAMES[(dow + 6) % 7];
}

function RoundToMember() {
  const golf = useHealthGolf();
  return (
    <Slot q={golf} height={262}>
      {(g) => {
        const p = g.promise;
        const over = p.median_hrs != null && p.median_hrs > p.target_hrs;
        const stuck = g.stuck.stuck;
        const scale = 10.5;
        return (
          <Panel>
            <Head title="Round to member" side={<>the promise &middot; 7 days</>} />
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>{hoursMins(p.median_hrs)}</span>
              {p.median_hrs != null && (
                <span style={{ fontSize: 12, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: over ? H.warnChip : H.okChip, color: over ? H.amber : H.okText }}>
                  {over ? `over ${p.target_hrs}h` : `inside ${p.target_hrs}h`}
                </span>
              )}
            </div>
            <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.45, color: t.inkMuted }}>
              Median time from a score being posted on England Golf to its analysis being ready in clbhouz
            </div>
            <div style={{ marginTop: 14, position: 'relative', height: 70, display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 8, alignItems: 'end' }}>
              {p.days.slice(-7).map((d, i, all) => {
                const empty = !d.n;
                const today = i === all.length - 1;
                const late = d.median_hrs != null && d.median_hrs > p.target_hrs;
                const h = empty || d.median_hrs == null ? null : Math.min(100, Math.max(0, (d.median_hrs / scale) * 100));
                return (
                  <div key={d.d} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{
                      width: '100%', borderRadius: '3px 3px 1px 1px',
                      height: h == null ? 2 : `${h}%`,
                      background: h == null ? H.track : late ? H.amber : today ? H.brand : H.inkSoft,
                    }} />
                  </div>
                );
              })}
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: `${(p.target_hrs / scale) * 70}px`, borderTop: '1px dashed rgba(249,200,116,0.55)' }} />
              <span style={{ position: 'absolute', right: 0, bottom: `${(p.target_hrs / scale) * 70 + 3}px`, fontSize: 9.5, fontWeight: 700, color: H.amber }}>{p.target_hrs}h target</span>
            </div>
            <div style={{ marginTop: 4, display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 8, fontSize: 9.5, fontWeight: 700, color: t.inkFaint, textAlign: 'center' }}>
              {p.days.slice(-7).map((d) => <span key={d.d}>{dayName(d.d)}</span>)}
            </div>
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: ROW_RULE, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6 }}>
              <Fig label="Rounds" value={num(p.rounds)} sub="this week" />
              <Fig label="Slowest" value={p.slowest_hrs == null ? '-' : `${Math.round(p.slowest_hrs)}h`} sub="one round" />
              <Fig label="Stuck" value={num(stuck)} sub="over 1h" valueColor={stuck == null ? undefined : stuck > 0 ? H.dangerText : H.okText} />
            </div>
          </Panel>
        );
      }}
    </Slot>
  );
}

const TONE = {
  ok: { dot: H.okBar, value: t.ink },
  warn: { dot: H.amber, value: H.amber },
  danger: { dot: H.dangerBar, value: H.dangerText },
};

function cellColor(s: SystemDayState): string {
  if (s === 'ok') return H.okBar;
  if (s === 'warn') return H.amber;
  if (s === 'danger') return H.dangerBar;
  return H.track;
}

function Systems() {
  const v = useHealthVerdict();
  const golf = useHealthGolf();
  const app = useHealthApp();
  const jobs = useHealthJobs();
  const echo = useEchoEngineHealth();
  const push = usePushHealth();
  const del = useDeletionIntegrity();
  const hist = useSystemStateHistory(14);

  if (v.isLoading) return <PanelSkeleton height={560} />;
  if (v.isError) return <PanelError onRetry={v.retry} retrying={v.retrying} />;

  const series = (id: string | null): SystemDayState[] => {
    const days = id ? hist.data?.systems.find((x) => x.subsystem === id)?.days ?? [] : [];
    const last = days.slice(-14);
    return [...Array(14 - last.length).fill(null), ...last];
  };
  const g = golf.data; const a = app.data;
  const jp = jobProblems(jobs.data);
  const nJobs = jp.neverOk.length + jp.failing.length + jp.missed.length;
  const latest = echo.data?.latest ?? [];
  const delN = del.data ? del.data.live_sessions + del.data.unbanned : null;

  const rows: { label: string; meta: string; value: string; area: IssueArea; hist: string | null; lens: HealthLens }[] = [
    { label: 'England Golf sync', meta: 'connections synced in 12h', value: g ? `${num(g.connections.fresh)}/${num(g.connections.connected)}` : '-', area: 'eg', hist: 'eg', lens: 'golf' },
    { label: 'Round analysis', meta: 'rounds waiting to be scored', value: g ? `${num(g.stuck.waiting)} waiting` : '-', area: 'pipeline', hist: 'pipeline', lens: 'golf' },
    { label: 'Course matching', meta: 'rounds on unmatched courses', value: g ? num(g.unmatched.rounds) : '-', area: 'matching', hist: null, lens: 'golf' },
    { label: 'Echo', meta: 'answer engines responding', value: latest.length ? `${latest.filter((x) => x.ok).length}/${latest.length}` : '-', area: 'echo', hist: 'echo', lens: 'app' },
    { label: 'Push', meta: 'failed in 24h', value: push.data ? num(push.data.queue.errored_24h) : '-', area: 'push', hist: 'push', lens: 'app' },
    { label: 'App errors', meta: 'current build, 7 days', value: a ? num(a.errors_7d_current) : '-', area: 'errors', hist: 'errors', lens: 'app' },
    {
      label: 'Scheduled jobs',
      meta: jp.neverOk.length ? 'never succeeded' : jp.failing.length ? 'failed last run' : jp.missed.length ? 'missed a run' : 'all running',
      value: !jobs.data ? '-' : nJobs ? `${nJobs} failing` : '0', area: 'jobs', hist: null, lens: 'jobs',
    },
    { label: 'Account deletions', meta: 'not fully erased', value: num(delN), area: 'deletion', hist: 'deletion', lens: 'jobs' },
  ];

  return (
    <Panel list>
      <Head inset title="Systems" side="last 14 days" />
      {rows.map((r) => {
        const tone = TONE[areaTone(v.issues, r.area)];
        return (
          <Link key={r.label} to={lensHref(r.lens)} style={{ display: 'block', padding: '11px 16px', borderTop: ROW_RULE, color: t.ink, textDecoration: 'none' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '10px minmax(0, 1fr) auto', columnGap: 10, alignItems: 'center' }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: tone.dot }} />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700 }}>{r.label}</span>
                <span style={{ display: 'block', fontSize: 10.5, color: t.inkFaint }}>{r.meta}</span>
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: tone.value }}>{r.value}</span>
            </div>
            <div style={{ marginTop: 8, marginLeft: 20, display: 'grid', gridTemplateColumns: 'repeat(14, minmax(0, 1fr))', gap: 3 }}>
              {series(r.hist).map((s, i) => <span key={i} style={{ height: 10, borderRadius: 2, background: cellColor(s) }} />)}
            </div>
          </Link>
        );
      })}
      <div style={{ display: 'flex', gap: 14, padding: '10px 16px 8px', borderTop: ROW_RULE, fontSize: 10.5, color: t.inkFaint }}>
        {([['normal', H.okBar], ['degraded', H.amber], ['down', H.dangerBar]] as const).map(([l, c]) => (
          <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{l}
          </span>
        ))}
      </div>
    </Panel>
  );
}

const CHANGE_LABEL: Record<string, string> = {
  eg: 'England Golf sync', cron: 'England Golf sync timer', pipeline: 'Round analysis', echo: 'Echo',
  push: 'Push', errors: 'App errors', deletion: 'Account deletions',
};
const VERB = { ok: 'recovered', warn: 'degraded', danger: 'down' } as const;

function WhatChanged() {
  const hist = useSystemStateHistory(14);
  return (
    <Slot q={hist} height={220}>
      {(h) => {
        const rows = h.changes
          .filter((c) => c.tone !== 'idle')
          .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
          .slice(0, 5);
        return (
          <Panel list>
            <Head inset title="What changed" side="14 days" />
            {!rows.length && <Muted style={{ padding: '10px 16px', borderTop: ROW_RULE }}>Nothing changed in 14 days.</Muted>}
            {rows.map((c, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '52px 12px minmax(0, 1fr)', columnGap: 8, alignItems: 'start', padding: '10px 16px', borderTop: ROW_RULE }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: t.inkFaint }}>{dateLabel(c.at)}</span>
                <span style={{ marginTop: 4, width: 8, height: 8, borderRadius: 4, background: cellColor(c.tone) }} />
                <span>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 700 }}>
                    {CHANGE_LABEL[c.subsystem] ?? c.subsystem} {VERB[c.tone as 'ok' | 'warn' | 'danger']}
                  </span>
                  {c.detail && <span style={{ display: 'block', marginTop: 2, fontSize: 11.5, lineHeight: 1.45, color: t.inkMuted }}>{c.detail}</span>}
                </span>
              </div>
            ))}
          </Panel>
        );
      }}
    </Slot>
  );
}

export default function StatusLens() {
  return (
    <>
      <Verdict />
      <RoundToMember />
      <Systems />
      <WhatChanged />
    </>
  );
}

export { plural as _plural };
