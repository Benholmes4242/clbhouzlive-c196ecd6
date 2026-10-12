/**
 * COMMAND CENTRE (BRIEF_COMMAND_CENTRE, Stages 1-2). Nine panels, fixed order:
 * Status strip, Right now, Do now, The loop, The moat, Growth | Rounds,
 * Clubhouse, Retention. Figures, not prose. Every panel shell renders from the
 * first paint at its settled height and swaps in when its own query lands; on
 * an RPC error the shell stays empty — never a fabricated zero.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { FIG, Skeleton, monotonePath, formatDurationShort } from '../lib/chartPrimitives';
import { adminTheme as t } from '../theme';
import PostInsightSheet from '../components/PostInsightSheet';
import { useEchoEngineHealth } from '../hooks/useEchoEngineHealth';
import { usePushHealth } from '../hooks/usePushHealth';
import { useDashboard } from '../hooks/useDashboard';
import { useLiveInApp, useRightNowHourly, pctDelta } from '../hooks/useOverviewMetrics';
import {
  computeEchoChip, computePushChip, computeEgChip, computeCronChip, computeErrorsChip,
  toneColor, type ChipTone,
} from '../lib/healthChips';
import { useErrorCount24h } from '../hooks/useStability';
import { useOpsHealth } from '../hooks/useOpsHealth';
import { useActiveWindows } from '../hooks/useActiveWindows';
import { useRetention } from '../hooks/useRetention';
import { pipelineTone } from '../components/SystemPanels';
import { useCommandCentre, type CommandCentre } from '../hooks/useCommandCentre';
import { RAISED, PANEL, LIST_PANEL } from '../lib/panels';

// Brief-specified panel values with no theme token (BRIEF_COMMAND_CENTRE).
const TRACK = 'rgba(255,255,255,0.08)';
const AREA = 'rgba(255,255,255,0.06)';
const AVATAR_GROUND = '#1E2430';
const MINUS = '\u2212';
const DASH = '\u2014';

const fmt = (n: number) => n.toLocaleString();

// ─── Shell ────────────────────────────────────────────────────────────────────

const TITLE: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.ink };
const META: React.CSSProperties = { ...FIG, fontSize: 11, color: t.inkFaint };
const MINI_LABEL: React.CSSProperties = { fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.inkFaint };

function Header({ title, meta, list }: { title: React.ReactNode; meta?: React.ReactNode; list?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 12, padding: list ? '0 16px' : undefined }}>
      <span style={TITLE}>{title}</span>
      {meta != null ? <span style={META}>{meta}</span> : null}
    </div>
  );
}

/** Loading → skeleton; error → empty body at the same height; else content. */
function Body({ height, loading, failed, children }: { height: number; loading: boolean; failed: boolean; children: () => React.ReactNode }) {
  if (loading) return <div style={{ padding: 0 }}><Skeleton height={height} radius={10} /></div>;
  if (failed) return <div style={{ height }} aria-label="Unavailable" />;
  return <>{children()}</>;
}

// ─── Small figures ────────────────────────────────────────────────────────────

function Delta({ current, previous }: { current: number; previous: number }) {
  if (current === previous) return <span style={{ color: t.inkMuted }}>level</span>;
  const d = pctDelta(current, previous);
  if (d === null) return <span style={{ color: t.inkMuted }}>new</span>;
  if (d === 0) return <span style={{ color: t.inkMuted }}>level</span>;
  return d > 0
    ? <span style={{ color: t.okText }}>↗ {d}%</span>
    : <span style={{ color: t.dangerText }}>↘ {Math.abs(d)}%</span>;
}

function Spark({ values, height, color, width = 1.2 }: { values: number[]; height: number; color: string; width?: number }) {
  const W = 100;
  if (values.length < 2) return <div style={{ height }} />;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => ({ x: (i / (values.length - 1)) * W, y: height - 1 - ((v - min) / span) * (height - 2) }));
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }} aria-hidden>
      <path d={monotonePath(pts)} fill="none" stroke={color} strokeWidth={width} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

const cumulative = (xs: { n: number }[]) => {
  let s = 0;
  return xs.map(x => (s += x.n));
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const qc = useQueryClient();
  useEffect(() => {
    const handler = () => qc.invalidateQueries({ queryKey: ['admin-v2'] });
    window.addEventListener('admin-v2:refetch', handler);
    return () => window.removeEventListener('admin-v2:refetch', handler);
  }, [qc]);

  const cc = useCommandCentre();
  const ccLoading = cc.isLoading;
  const ccFailed = cc.isError || (cc.isFetched && !cc.data);

  return (
    <div style={{ padding: '8px 12px 24px', display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 720, margin: '0 auto' }}>
      <StatusStrip />
      <RightNow />
      <DoNow data={cc.data} loading={ccLoading} failed={ccFailed} />
      <TheLoop data={cc.data} loading={ccLoading} failed={ccFailed} />
      <TheMoat data={cc.data} loading={ccLoading} failed={ccFailed} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        <Growth data={cc.data} loading={ccLoading} failed={ccFailed} />
        <RoundsByDay data={cc.data} loading={ccLoading} failed={ccFailed} />
      </div>
      <Clubhouse data={cc.data} loading={ccLoading} failed={ccFailed} />
      <RetentionCard />
      <style>{`@keyframes admin-pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.55 } }`}</style>
    </div>
  );
}

type CCProps = { data?: CommandCentre; loading: boolean; failed: boolean };

// ─── 1 STATUS STRIP ───────────────────────────────────────────────────────────

function StatusStrip() {
  const navigate = useNavigate();
  const echo = useEchoEngineHealth();
  const push = usePushHealth();
  const eg = useDashboard().egSyncHealth;
  const errors = useErrorCount24h();
  const ops = useOpsHealth(7);

  const echoChip = useMemo(() => computeEchoChip(echo), [echo.isLoading, echo.isError, echo.data]); // eslint-disable-line react-hooks/exhaustive-deps
  const pushChip = useMemo(() => computePushChip(push), [push.isLoading, push.isError, push.data]); // eslint-disable-line react-hooks/exhaustive-deps
  const egChip = useMemo(() => computeEgChip(eg), [eg.isLoading, eg.isError, eg.data]); // eslint-disable-line react-hooks/exhaustive-deps
  const cronChip = useMemo(() => computeCronChip(eg), [eg.isLoading, eg.isError, eg.data]); // eslint-disable-line react-hooks/exhaustive-deps
  const errorsChip = computeErrorsChip(errors.data ?? null, errors.isLoading, errors.isError);

  const egD = eg.data;
  const p = ops.data?.pipeline;
  const pTone = pipelineTone(p);
  const errs = ops.data?.errors;

  const cells: { label: string; tone: ChipTone; value: string | null }[] = [
    { label: 'EG sync', tone: egChip.tone, value: egD ? `${egD.status_ok_count}/${egD.total_connected}` : null },
    { label: 'Cron', tone: cronChip.tone, value: egD ? (egD.cron_hours_ago == null ? DASH : formatDurationShort(Math.round(egD.cron_hours_ago) * 3600)) : null },
    { label: 'Echo', tone: echoChip.tone, value: echo.data ? String(echo.data.latest?.length ?? 0) : null },
    { label: 'Push', tone: pushChip.tone, value: push.isLoading ? null : pushChip.tone === 'ok' ? 'OK' : pushChip.detail },
    { label: 'Waiting', tone: ops.isLoading ? 'idle' : pTone, value: p ? fmt(p.unprocessed) : null },
    {
      label: 'Errors', tone: errorsChip.tone,
      value: errs ? (errs.sessions_24h > 0 ? `${((errs.errors_24h / errs.sessions_24h) * 100).toFixed(1)}%` : DASH) : null,
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 4 }}>
      {cells.map(c => (
        <button
          key={c.label}
          type="button"
          onClick={() => navigate('/admin-v2/health')}
          style={{
            background: t.surface, borderRadius: 10, padding: '8px 6px', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0,
          }}
        >
          <span aria-hidden style={{ width: 6, height: 6, borderRadius: 999, background: toneColor(c.tone) }} />
          <span style={{ ...FIG, marginTop: 5, fontSize: 12, fontWeight: 800, color: t.ink, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {c.value ?? DASH}
          </span>
          <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: t.inkFaint, whiteSpace: 'nowrap' }}>
            {c.label}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── 2 RIGHT NOW ──────────────────────────────────────────────────────────────

function RightNow() {
  const live = useLiveInApp();
  const intraday = useRightNowHourly();
  const aw = useActiveWindows(28);

  const hours = intraday.data ?? [];
  const peak = hours.reduce((m, h) => (h.today != null && h.today > m ? h.today : m), 0);

  const W = 200, H = 48;
  const maxY = Math.max(1, ...hours.map(h => Math.max(h.today ?? 0, h.last ?? 0)));
  const x = (hr: number) => (hr / 23) * W;
  const y = (v: number) => H - 2 - (v / maxY) * (H - 4);
  const todayPts = hours.filter(h => h.today != null).map(h => ({ x: x(h.hour), y: y(h.today as number) }));
  const lastPts = hours.filter(h => h.last != null).map(h => ({ x: x(h.hour), y: y(h.last as number) }));
  const end = todayPts[todayPts.length - 1];

  const a = aw.data;
  const awLoading = aw.isLoading;
  const tiles = a ? [
    { label: 'DAU', value: fmt(a.dau.current), delta: <Delta current={a.dau.current} previous={a.dau.previous} />, spark: a.daily.slice(-7).map(d => d.dau) },
    { label: 'WAU', value: fmt(a.wau.current), delta: <Delta current={a.wau.current} previous={a.wau.previous} />, spark: a.daily.map(d => d.wau) },
    { label: 'MAU', value: fmt(a.mau.current), delta: <Delta current={a.mau.current} previous={a.mau.previous} />, spark: a.daily.map(d => d.mau) },
    {
      label: 'Sticky', value: a.stickiness == null ? DASH : `${a.stickiness}%`,
      delta: <span style={{ color: t.inkMuted }}>WAU/MAU</span>,
      spark: a.daily.map(d => (d.mau > 0 ? d.wau / d.mau : 0)),
    },
  ] : null;

  return (
    <section style={PANEL}>
      <Header
        title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span aria-hidden style={{ width: 8, height: 8, borderRadius: 999, background: t.ok }} />Right now</span>}
        meta={<>peak today <span style={{ color: t.ink, fontWeight: 700 }}>{intraday.data ? fmt(peak) : DASH}</span></>}
      />
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ ...FIG, fontSize: 44, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: t.ink }}>
            {live.data ? fmt(live.data.count) : DASH}
          </span>
          <span style={{ fontSize: 12, color: t.inkMuted }}>live</span>
        </div>
        {intraday.isLoading ? <div style={{ width: W }}><Skeleton height={H} radius={8} /></div> : (
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden style={{ display: 'block', flexShrink: 0 }}>
            {lastPts.length > 1 && <path d={monotonePath(lastPts)} fill="none" stroke={t.inkFaint} strokeWidth={1} strokeDasharray="3 3" />}
            {todayPts.length > 1 && (
              <>
                <path d={`${monotonePath(todayPts)} L${end.x.toFixed(2)},${H} L${todayPts[0].x.toFixed(2)},${H} Z`} fill={AREA} />
                <path d={monotonePath(todayPts)} fill="none" stroke={t.ink} strokeWidth={1.5} />
              </>
            )}
            {end && <circle cx={end.x} cy={end.y} r={2.5} fill={t.ink} />}
          </svg>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6 }}>
        {(tiles ?? ['DAU', 'WAU', 'MAU', 'Sticky'].map(label => ({ label, value: null, delta: null, spark: [] as number[] }))).map(tile => (
          <div key={tile.label} style={{ background: RAISED, borderRadius: 10, padding: '10px 10px 8px', minWidth: 0 }}>
            <div style={MINI_LABEL}>{tile.label}</div>
            {awLoading || !tiles ? (
              <div style={{ marginTop: 4 }}><Skeleton height={44} radius={6} /></div>
            ) : (
              <>
                <div style={{ ...FIG, fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: t.ink, marginTop: 2 }}>{tile.value}</div>
                <div style={{ ...FIG, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>{tile.delta}</div>
                <div style={{ marginTop: 6 }}><Spark values={tile.spark} height={16} color={t.inkMuted} /></div>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── 3 DO NOW ─────────────────────────────────────────────────────────────────

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function DoNow({ data, loading, failed }: CCProps) {
  const d = data?.do_now;
  const inboxCount = d ? d.inbox.claims + d.inbox.course_requests + d.inbox.tickets : 0;
  const total = d ? d.stuck_rounds.members + d.played_not_connected.members + d.gone_quiet.members + inboxCount : null;
  const firstQuiet = d?.gone_quiet.names[0]?.user_id;

  const rows = d ? [
    { count: d.stuck_rounds.rounds, color: t.dangerText, label: 'Rounds stuck · unmatched course', sub: plural(d.stuck_rounds.members, 'member'), age: d.stuck_rounds.oldest_days, button: 'MATCH', filled: true, to: '/admin-v2/inbox?type=unmatchedCourse' },
    // No bulk-message composer exists in admin; NUDGE opens the not-connected member list.
    { count: d.played_not_connected.members, color: t.warnText, label: 'Played, not connected', sub: 'this week', age: d.played_not_connected.oldest_days, button: 'NUDGE', filled: false, to: '/admin-v2/users?filter=not_connected' },
    // No "quiet" member filter exists; DM opens the longest-silent member.
    { count: d.gone_quiet.members, color: t.warnText, label: 'Regulars gone quiet', sub: 'weekly → 10d+ silent', age: d.gone_quiet.oldest_days, button: 'DM', filled: false, to: firstQuiet ? `/admin-v2/users?member=${firstQuiet}` : '/admin-v2/users' },
    {
      count: inboxCount, color: t.inkMuted, label: 'Inbox',
      sub: `${plural(d.inbox.claims, 'claim')} · ${plural(d.inbox.course_requests, 'request')} · ${plural(d.inbox.tickets, 'ticket')}`,
      age: d.inbox.oldest_days, button: 'OPEN', filled: false, to: '/admin-v2/inbox',
    },
  ] : [];

  return (
    <section style={LIST_PANEL}>
      <Header list title="Do now" meta={total == null ? null : <><span style={{ color: t.ink, fontWeight: 700 }}>{fmt(total)}</span> members</>} />
      {loading || failed ? (
        <div style={{ padding: '0 16px 10px' }}><Body height={4 * 50 - 10} loading={loading} failed={failed}>{() => null}</Body></div>
      ) : rows.map(r => {
        const zero = r.count === 0;
        return (
          <div key={r.label} style={{ display: 'grid', gridTemplateColumns: '34px minmax(0,1fr) 54px auto', columnGap: 10, alignItems: 'center', padding: '10px 16px', borderTop: `1px solid ${t.hairline}` }}>
            <span style={{ ...FIG, fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: zero ? t.inkFaint : r.color }}>{fmt(r.count)}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</div>
              <div style={{ ...FIG, fontSize: 10.5, color: t.inkFaint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.sub}</div>
            </div>
            <span style={{ ...FIG, fontSize: 11, fontWeight: 700, textAlign: 'right', color: r.age >= 14 ? t.dangerText : t.inkMuted }}>{r.age}d</span>
            <Link
              to={r.to}
              aria-disabled={zero}
              onClick={zero ? (e) => e.preventDefault() : undefined}
              style={{
                width: 64, height: 30, borderRadius: 999, fontSize: 11.5, fontWeight: 700, textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box',
                background: r.filled ? t.brand : 'transparent',
                color: r.filled ? t.canvas : t.ink,
                border: r.filled ? 'none' : `1px solid ${t.line}`,
                opacity: zero ? 0.5 : 1,
                pointerEvents: zero ? 'none' : undefined,
              }}
            >
              {r.button}
            </Link>
          </div>
        );
      })}
    </section>
  );
}

// ─── 4 THE LOOP ───────────────────────────────────────────────────────────────

export function TheLoop({ data, loading, failed }: CCProps) {
  const l = data?.loop;
  const rows = l ? [
    { label: 'Joined', v: l.joined },
    { label: 'Connected', v: l.connected, red: true },
    { label: 'Round in', v: l.round_in },
  ] : [];
  const pct = (v: number | null) => (v == null ? DASH : `${v}%`);

  return (
    <section style={PANEL}>
      <Header title="The loop" meta="share of all members" />
      <Body height={3 * 14 + 2 * 7 + 70} loading={loading} failed={failed}>{() => (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {rows.map((r) => {
              // Percentage is the row's figure as a share of JOINED, never of the row
              // above — the bar fill is drawn against joined, so number and bar agree.
              const share = r.label === 'Joined' ? '' : l!.joined > 0 ? `${Math.round((r.v / l!.joined) * 100)}%` : DASH;
              const w = l!.joined > 0 ? Math.min(100, (r.v / l!.joined) * 100) : 0;
              return (
                <div key={r.label} style={{ display: 'grid', gridTemplateColumns: '64px minmax(0,1fr) 36px 40px', columnGap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: t.inkFaint, whiteSpace: 'nowrap' }}>{r.label}</span>
                  <div style={{ height: 14, borderRadius: 4, background: TRACK, overflow: 'hidden' }}>
                    <div style={{ width: `${w}%`, height: '100%', borderRadius: 4, background: r.red ? t.danger : t.ink }} />
                  </div>
                  <span style={{ ...FIG, fontSize: 13, fontWeight: 800, textAlign: 'right', color: r.red ? t.dangerText : t.ink }}>{fmt(r.v)}</span>
                  <span style={{ ...FIG, fontSize: 10, fontWeight: 700, textAlign: 'right', color: r.red ? t.dangerText : t.inkMuted }}>{share}</span>
                </div>
              );
            })}
          </div>
          <div style={{ borderTop: `1px solid ${t.hairline}`, marginTop: 12, paddingTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 }}>
            {[
              { label: 'Never connected', v: fmt(l!.never_connected), c: t.dangerText },
              { label: 'D30 · connected', v: pct(l!.d30_connected_pct), c: t.ink },
              { label: 'D30 · not', v: pct(l!.d30_not_connected_pct), c: t.ink },
            ].map(c => (
              <div key={c.label} style={{ minWidth: 0 }}>
                <div style={MINI_LABEL}>{c.label}</div>
                <div style={{ ...FIG, fontSize: 18, fontWeight: 800, color: c.c, marginTop: 2 }}>{c.v}</div>
              </div>
            ))}
          </div>
        </>
      )}</Body>
    </section>
  );
}

// ─── 5 THE MOAT ───────────────────────────────────────────────────────────────

function TheMoat({ data, loading, failed }: CCProps) {
  const m = data?.moat;
  const roundsCum = m ? cumulative(m.rounds_daily_28) : [];
  const cells = m ? [
    { label: 'Rounds', v: m.rounds_total, right: <span style={{ color: t.okText }}>+{fmt(m.rounds_7d)}</span>, spark: roundsCum },
    // No daily holes series exists; the rounds cumulative carries the shape.
    { label: 'Holes', v: m.holes_total, right: <span style={{ color: t.okText }}>+{fmt(m.holes_7d)}</span>, spark: roundsCum },
    { label: 'Courses played', v: m.courses_played, right: <span style={{ color: t.inkFaint }}>of {fmt(m.catalogue_total)}</span>, spark: m.courses_played_daily_28.map(d => d.cumulative) },
    { label: 'Reviews', v: m.reviews_total, right: <span style={{ color: t.okText }}>+{fmt(m.reviews_7d)}</span>, spark: cumulative(m.reviews_daily_28) },
  ] : [];

  return (
    <section style={PANEL}>
      <Header title="The moat" meta="all time · 28d" />
      <Body height={2 * 78 + 8} loading={loading} failed={failed}>{() => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 }}>
          {cells.map(c => (
            <div key={c.label} style={{ background: RAISED, borderRadius: 12, padding: '10px 12px 8px', minWidth: 0 }}>
              <div style={MINI_LABEL}>{c.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6, marginTop: 2 }}>
                <span style={{ ...FIG, fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: t.ink }}>{fmt(c.v)}</span>
                <span style={{ ...FIG, fontSize: 10.5, fontWeight: 700, whiteSpace: 'nowrap' }}>{c.right}</span>
              </div>
              <div style={{ marginTop: 6 }}><Spark values={c.spark} height={22} color={t.ink} width={1.3} /></div>
            </div>
          ))}
        </div>
      )}</Body>
    </section>
  );
}

// ─── 6 GROWTH  |  7 ROUNDS ────────────────────────────────────────────────────

const HALF: React.CSSProperties = { background: t.surface, borderRadius: 16, padding: '14px 14px 12px', minWidth: 0 };

function HalfHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
      <span style={TITLE}>{title}</span>
      <span style={{ fontSize: 10, color: t.inkFaint, whiteSpace: 'nowrap' }}>{sub}</span>
    </div>
  );
}

function Growth({ data, loading, failed }: CCProps) {
  const g = data?.growth;
  return (
    <section style={HALF}>
      <HalfHeader title="Growth" sub="7d" />
      <Body height={80} loading={loading} failed={failed}>{() => (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 }}>
            <div>
              <div style={MINI_LABEL}>Signups</div>
              <div style={{ ...FIG, fontSize: 20, fontWeight: 800, color: t.ink }}>{fmt(g!.signups_7d)}</div>
              <div style={{ ...FIG, fontSize: 10, fontWeight: 700 }}><Delta current={g!.signups_7d} previous={g!.signups_prev_7d} /></div>
            </div>
            <div>
              <div style={MINI_LABEL}>Invited</div>
              <div style={{ ...FIG, fontSize: 20, fontWeight: 800, color: t.ink }}>{fmt(g!.invites_sent_7d)}</div>
              <div style={{ ...FIG, fontSize: 10, fontWeight: 700, color: t.inkMuted }}>{fmt(g!.invites_joined_7d)} joined</div>
            </div>
          </div>
          <div style={{ marginTop: 8 }}><Spark values={g!.signups_daily_14.map(d => d.n)} height={28} color={t.ink} width={1.3} /></div>
        </>
      )}</Body>
    </section>
  );
}

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function RoundsByDay({ data, loading, failed }: CCProps) {
  const byDow = Array(7).fill(0) as number[];
  for (const r of data?.rounds_by_day ?? []) if (r.dow >= 0 && r.dow < 7) byDow[r.dow] += r.n;
  const max = Math.max(1, ...byDow);
  const barColor = (i: number) => (i === 6 ? t.brand : i === 5 ? t.ink : t.inkMuted);

  return (
    <section style={HALF}>
      <HalfHeader title="Rounds" sub="by day · 7d" />
      <Body height={80} loading={loading} failed={failed}>{() => (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexWrap: 'nowrap', whiteSpace: 'nowrap', overflow: 'hidden' }}>
            <span style={{ ...FIG, fontSize: 20, fontWeight: 800, color: t.ink }}>{fmt(data!.moat.rounds_7d)}</span>
            <span style={{ ...FIG, fontSize: 10, fontWeight: 700 }}><Delta current={data!.moat.rounds_7d} previous={data!.rounds_prev_7d} /></span>
            <span style={{ ...FIG, fontSize: 10, color: t.inkFaint }}>· {fmt(data!.rounds_7d_members)} members</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 34, marginTop: 8 }}>
            {byDow.map((n, i) => (
              <div key={i} style={{ flex: 1, height: `${(n / max) * 100}%`, minHeight: n > 0 ? 2 : 0, background: barColor(i), borderRadius: '3px 3px 0 0' }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
            {DAY_LETTERS.map((l, i) => (
              <span key={i} style={{ flex: 1, textAlign: 'center', fontSize: 8.5, fontWeight: 700, color: i === 6 ? t.brandText : t.inkFaint }}>{l}</span>
            ))}
          </div>
        </>
      )}</Body>
    </section>
  );
}

// ─── 8 CLUBHOUSE ──────────────────────────────────────────────────────────────

function toParText(n: number): string {
  if (n === 0) return 'E';
  return n > 0 ? `+${n}` : `${MINUS}${Math.abs(n)}`;
}

function initials(name: string | null): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '') || '·';
}

function Clubhouse({ data, loading, failed }: CCProps) {
  const [openPost, setOpenPost] = useState<string | null>(null);
  const c = data?.clubhouse;
  const figs = c ? [
    { label: 'Posts', v: fmt(c.posts_7d), sub: <Delta current={c.posts_7d} previous={c.posts_prev_7d} />, color: t.ink },
    { label: 'Reactions', v: fmt(c.reactions_7d), sub: <span style={{ color: t.inkMuted }}>per post {c.reactions_per_post.toFixed(1)}</span>, color: t.ink },
    { label: 'Reviews', v: fmt(c.reviews_7d), sub: <Delta current={c.reviews_7d} previous={c.reviews_prev_7d} />, color: t.ink },
    { label: 'Unseen', v: fmt(c.unseen_7d), sub: <span style={{ color: t.inkMuted }}>0 reactions</span>, color: t.dangerText },
  ] : [];

  return (
    <section style={LIST_PANEL}>
      <Header list title="Clubhouse" meta="7d" />
      {loading || failed ? (
        <div style={{ padding: '0 16px 10px' }}><Body height={56 + 5 * 46} loading={loading} failed={failed}>{() => null}</Body></div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8, padding: '0 16px 12px' }}>
            {figs.map(f => (
              <div key={f.label} style={{ minWidth: 0 }}>
                <div style={MINI_LABEL}>{f.label}</div>
                <div style={{ ...FIG, fontSize: 18, fontWeight: 800, color: f.color }}>{f.v}</div>
                <div style={{ ...FIG, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.sub}</div>
              </div>
            ))}
          </div>
          {c!.top.map(r => {
            const nameColor = r.unseen ? t.dangerText : t.ink;
            return (
              <button
                key={r.post_id}
                type="button"
                onClick={() => setOpenPost(r.post_id)}
                style={{
                  display: 'grid', gridTemplateColumns: '28px minmax(0,1fr) 58px auto', columnGap: 10, alignItems: 'center',
                  width: '100%', padding: '9px 16px', borderTop: `1px solid ${t.hairline}`, borderLeft: 'none', borderRight: 'none', borderBottom: 'none',
                  background: 'transparent', cursor: 'pointer', textAlign: 'left',
                }}
              >
                {r.avatar_url ? (
                  <img src={r.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover', display: 'block' }} />
                ) : (
                  <span aria-hidden style={{ width: 28, height: 28, borderRadius: 8, background: AVATAR_GROUND, color: t.inkMuted, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase' }}>
                    {initials(r.display_name)}
                  </span>
                )}
                <span style={{ fontSize: 13, fontWeight: 600, color: nameColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.display_name ?? DASH}
                </span>
                <span style={{ ...FIG, fontSize: 11, color: r.unseen ? t.dangerText : t.inkFaint, textAlign: 'right' }}>
                  {r.like_count} · {r.comment_count}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 3 }}>
                  <span style={{ ...FIG, width: 24, textAlign: 'right', fontSize: 17, fontWeight: 800, color: t.ink }}>{r.gross ?? DASH}</span>
                  <span style={{ ...FIG, width: 22, textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: r.to_par != null && r.to_par < 0 ? t.dangerText : t.inkMuted }}>
                    {r.gross != null && r.to_par != null ? toParText(r.to_par) : ''}
                  </span>
                </span>
              </button>
            );
          })}
        </>
      )}
      <PostInsightSheet postId={openPost} open={!!openPost} onClose={() => setOpenPost(null)} />
    </section>
  );
}

// ─── 9 RETENTION ──────────────────────────────────────────────────────────────

function RetentionCard() {
  const r = useRetention(56);
  const c = r.data?.cohort;
  const daily = r.data?.daily ?? [];
  const max = Math.max(1, ...daily.map(d => d.returning ?? 0));
  const cols = c ? [
    { label: 'D1', ret: c.d1_returned, el: c.d1_eligible },
    { label: 'D7', ret: c.d7_returned, el: c.d7_eligible },
    { label: 'D30', ret: c.d30_returned, el: c.d30_eligible },
  ] : [];
  const day = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '');

  return (
    <section style={PANEL}>
      <Header title="Retention" meta="28d cohorts" />
      <Body height={44 + 44 + 30} loading={r.isLoading} failed={r.isError || (r.isFetched && !c)}>{() => (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 }}>
            {cols.map(col => (
              <div key={col.label}>
                <div style={MINI_LABEL}>{col.label}</div>
                <div style={{ ...FIG, fontSize: 20, fontWeight: 800, color: t.ink }}>{col.el > 0 ? `${Math.round((col.ret / col.el) * 100)}%` : DASH}</div>
                <div style={{ ...FIG, fontSize: 10, color: t.inkFaint }}>{fmt(col.ret)} of {fmt(col.el)}</div>
              </div>
            ))}
          </div>
          {daily.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 44, marginTop: 12 }}>
                {daily.map(d => (
                  <div key={d.date} style={{ flex: 1, minWidth: 0, height: `${((d.returning ?? 0) / max) * 100}%`, background: t.ink, borderRadius: '2px 2px 0 0' }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ ...FIG, fontSize: 9.5, fontWeight: 700, color: t.inkFaint }}>{day(daily[0]?.date)}</span>
                <span style={{ ...FIG, fontSize: 9.5, fontWeight: 700, color: t.inkFaint }}>{day(daily[daily.length - 1]?.date)}</span>
              </div>
            </>
          )}
        </>
      )}</Body>
    </section>
  );
}
