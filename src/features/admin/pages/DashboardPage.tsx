/** Admin Command centre v2: windowed panels read only useCommandCentreV2;
 * legacy live/activity/health hooks retain their server definitions. AdminShell owns chrome.
 * The signed-off mock owns geometry, with inherited system typography (no feature font).
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { adminTheme as t } from '../theme';
import { Skeleton, formatDurationShort } from '../lib/chartPrimitives';
import PostInsightSheet from '../components/PostInsightSheet';
import { useCommandCentreV2, type CommandCentreDays, type CommandCentreV2 } from '../hooks/useCommandCentreV2';
import { useDashboard } from '../hooks/useDashboard';
import { usePushHealth } from '../hooks/usePushHealth';
import { useErrorCount24h } from '../hooks/useStability';
import { useOpsHealth } from '../hooks/useOpsHealth';
import { useLiveInApp } from '../hooks/useOverviewMetrics';
import { useActiveWindows } from '../hooks/useActiveWindows';
import { useRetention } from '../hooks/useRetention';
import { computePushChip, computeEgChip, computeCronChip, computeErrorsChip } from '../lib/healthChips';
import { pipelineTone } from '../components/SystemPanels';
const INSET = '#181D25';
const FIG: React.CSSProperties = { fontVariantNumeric: 'tabular-nums lining-nums', fontWeight: 700, letterSpacing: '-0.04em' };
const LABEL: React.CSSProperties = { fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.inkFaint, overflowWrap: 'anywhere' };
const PANEL_T: React.CSSProperties = { fontSize: 12, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: t.ink };
function toParText(n: number) { return n === 0 ? 'E' : n > 0 ? `+${n}` : `−${Math.abs(n)}`; }
function Body({ height, loading, failed, children }: { height: number; loading: boolean; failed: boolean; children: () => React.ReactNode }) {
  if (loading) return <Skeleton height={height} radius={10} />;
  if (failed) return <div style={{ height }} aria-label="Unavailable" />;
  return <>{children()}</>;
}
/* ---------- primitives ---------- */
const pct = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : null);
function Delta({ now, prev, invert = false, size = 12 }: { now: number; prev: number; invert?: boolean; size?: number }) {
  const d = pct(now, prev);
  if (d === null || d === 0) return <span style={{ fontSize: size, color: t.inkFaint, fontWeight: 600 }}>level</span>;
  const good = invert ? d < 0 : d > 0;
  return (
    <span style={{ fontSize: size, fontWeight: 700, color: good ? t.ok : t.danger, ...FIG, letterSpacing: 0 }}>
      {d > 0 ? '↗' : '↘'} {Math.abs(d)}%
    </span>
  );
}

function Spark({ data, w = 120, h = 34, dashed, area = false, color = t.ink }: { data: number[]; w?: number; h?: number; dashed?: boolean; area?: boolean; color?: string }) {
  if (data.length < 2) return <div style={{ height: h }} />;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 2 - ((v - min) / (max - min || 1)) * (h - 4)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      {area && <path d={`${d} L ${w} ${h} L 0 ${h} Z`} fill="rgba(255,255,255,0.06)" />}
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeDasharray={dashed ? '3 3' : undefined} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function Panel({ title, meta, children, pad = true, id }: { title?: React.ReactNode; meta?: React.ReactNode; children: React.ReactNode; pad?: boolean; id?: string }) {
  return (
    <section id={id} style={{ background: t.surface, borderRadius: 22, overflow: 'hidden', margin: '0 0 12px' }}>
      {title && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, padding: '18px 18px 0' }}>
          <div style={PANEL_T}>{title}</div>
          {meta && <div style={{ fontSize: 12.5, color: t.inkFaint, textAlign: 'right' }}>{meta}</div>}
        </div>
      )}
      <div style={pad ? { padding: '14px 18px 18px' } : undefined}>{children}</div>
    </section>
  );
}

function Btn({ children, primary, to }: { children: React.ReactNode; primary?: boolean; to: string }) {
  return (
    <Link to={to} onClick={e => e.stopPropagation()} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
      flex: 'none', height: 34, padding: '0 14px', borderRadius: 999,
      fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
      background: primary ? t.ink : 'transparent', color: primary ? t.canvas : t.ink,
      border: primary ? 'none' : `1px solid ${t.line}`,
    }}>{children}</Link>
  );
}

function Squircle({ name, size = 30 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.34, background: INSET, border: `1px solid ${t.hairline}`, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', placeItems: 'center', fontSize: size * 0.36, fontWeight: 700, color: t.inkMuted, flex: 'none' }}>{initials}</div>
  );
}

function ControlBar({ days, setDays, statusOpen, setStatusOpen }: { days: CommandCentreDays; setDays: (d: CommandCentreDays) => void; statusOpen: boolean; setStatusOpen: (v: boolean) => void }) {
  const eg = useDashboard().egSyncHealth;
  const push = usePushHealth();
  const errors = useErrorCount24h();
  const ops = useOpsHealth(days);
  const e = eg.data, p = ops.data?.pipeline, errs = ops.data?.errors;
  const rows = [
    { name: 'EG sync', tone: computeEgChip(eg).tone, value: e ? `${e.status_ok_count} of ${e.total_connected} connections synced` : 'Unavailable' },
    { name: 'Cron', tone: computeCronChip(eg).tone, value: e?.cron_hours_ago != null ? `last run ${formatDurationShort(Math.round(e.cron_hours_ago * 3600))} ago` : 'Unavailable' },
    { name: 'Push', tone: computePushChip(push).tone, value: computePushChip(push).tone === 'ok' ? 'delivering' : computePushChip(push).detail },
    { name: 'Queue', tone: ops.isError || !p ? 'danger' : pipelineTone(p), value: p ? p.unprocessed ? `${p.unprocessed} waiting` : 'nothing waiting' : 'Unavailable' },
    { name: 'Errors', tone: computeErrorsChip(errors.data, errors.isLoading, errors.isError).tone, value: errs ? `${(errs.sessions_24h > 0 ? errs.errors_24h / errs.sessions_24h * 100 : 0).toFixed(1)}% of sessions, 24h` : 'Unavailable' },
  ];
  const loading = eg.isLoading || push.isLoading || errors.isLoading || ops.isLoading;
  const nonOk = rows.filter(r => r.tone !== 'ok').length;
  const dot = loading ? t.inkFaint : nonOk ? t.danger : t.ok;
  return <>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', margin: '14px 0 12px' }}>
      <div role="tablist" aria-label="Window" style={{ display: 'flex', background: t.surface, borderRadius: 999, padding: 3, border: `1px solid ${t.hairline}` }}>
        {([7, 28, 90] as const).map(d => <button key={d} role="tab" aria-selected={days === d} onClick={() => setDays(d)} style={{ height: 30, minWidth: 50, padding: '0 12px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, letterSpacing: '0.04em', background: days === d ? t.ink : 'transparent', color: days === d ? t.canvas : t.inkMuted }}>{d}D</button>)}
      </div>
      <button onClick={() => setStatusOpen(!statusOpen)} aria-expanded={statusOpen} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px', borderRadius: 999, cursor: 'pointer', background: t.surface, border: `1px solid ${t.hairline}`, color: t.ink, fontSize: 13, fontWeight: 600 }}>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: dot, boxShadow: !loading && !nonOk ? `0 0 0 3px ${t.okSoft}` : undefined }} />
        {loading ? 'Checking…' : nonOk ? `${nonOk} ${nonOk === 1 ? 'needs' : 'need'} attention` : 'All systems normal'}
        <span style={{ color: t.inkFaint, transform: statusOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>⌄</span>
      </button>
    </div>
    {statusOpen && <Panel pad={false}>{rows.map((r, i) => <Link key={r.name} to="/admin-v2/health" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderTop: i ? `1px solid ${t.hairline}` : 'none', color: t.ink, textDecoration: 'none' }}>
      <span style={{ width: 7, height: 7, borderRadius: 99, background: loading ? t.inkFaint : r.tone === 'ok' ? t.ok : t.danger, flex: 'none' }} />
      <span style={{ fontSize: 14, fontWeight: 600, width: 64, flex: 'none' }}>{r.name}</span><span style={{ fontSize: 13.5, color: t.inkMuted }}>{loading ? 'Checking…' : r.value}</span>
    </Link>)}</Panel>}
  </>;
}

/* ---------- 1. the target ---------- */
function Target({ data, days }: { data: CommandCentreV2['target']; days: CommandCentreDays }) {
  const weeksLeft = Math.ceil((new Date(data.deadline).getTime() - Date.now()) / (7 * 86400000));
  const rows = [
    { k: 'Members', now: data.members, goal: data.members_goal, pace: data.signups / (days / 7) },
    { k: 'Golf clubs', now: data.clubs, goal: data.clubs_goal, pace: data.clubs_added / (days / 7) },
  ];
  return (
    <Panel title="The target" meta={`end of ${new Date(data.deadline).getFullYear()} season · ${weeksLeft} weeks`}>
      {rows.map((r, i) => {
        const need = (r.goal - r.now) / Math.max(1, weeksLeft);
        const onPace = r.pace >= need;
        const fmtPace = (v: number) => (v >= 10 ? Math.round(v).toLocaleString() : v.toFixed(1).replace(/\.0$/, ''));
        return (
          <div key={r.k} style={{ paddingTop: i ? 16 : 0, marginTop: i ? 16 : 0, borderTop: i ? `1px solid ${t.hairline}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ ...LABEL, width: '100%' }}>{r.k}</span>
              <span style={{ ...FIG, fontSize: 40, lineHeight: 1 }}>{r.now.toLocaleString()}</span>
              <span style={{ ...FIG, fontSize: 16, color: t.inkFaint, letterSpacing: '-0.01em' }}>/ {r.goal.toLocaleString()}</span>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: INSET, marginTop: 12, overflow: 'hidden' }}>
              <div style={{ width: `${Math.max(1.2, (r.now / r.goal) * 100)}%`, height: '100%', background: t.ink, borderRadius: 99 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
              <div>
                <div style={LABEL}>Doing</div>
                <div style={{ ...FIG, fontSize: 20, color: onPace ? t.ok : t.danger, marginTop: 3 }}>{fmtPace(r.pace)}<span style={{ fontSize: 12, color: t.inkFaint, fontWeight: 600, letterSpacing: 0 }}> a week</span></div>
              </div>
              <div>
                <div style={LABEL}>Needed</div>
                <div style={{ ...FIG, fontSize: 20, marginTop: 3 }}>{fmtPace(need)}<span style={{ fontSize: 12, color: t.inkFaint, fontWeight: 600, letterSpacing: 0 }}> a week</span></div>
              </div>
            </div>
          </div>
        );
      })}
    </Panel>
  );
}

/* ---------- 2. do now ---------- */
function DoNow({ data: d }: { data: CommandCentreV2['do_now'] }) {
  const member = (id?: string) => id ? `/admin-v2/users?member=${id}` : '/admin-v2/users';
  const pitch = (name?: string) => `/admin-v2/content?section=courses&q=${encodeURIComponent(name ?? '')}`;
  const rows = [
    { n: d.stuck_rounds.rounds, urgent: true, title: 'Rounds stuck on unmatched courses', short: 'Rounds stuck', sub: `${d.stuck_rounds.members} members · oldest ${d.stuck_rounds.oldest_days} days`, cta: 'MATCH', to: '/admin-v2/inbox?type=unmatchedCourse', items: d.stuck_rounds.items.map(x => ({ name: x.name, detail: `${x.rounds} rounds · ${x.members} members`, to: '/admin-v2/inbox?type=unmatchedCourse' })) },
    { n: d.gone_quiet.members, title: 'Regulars gone quiet', short: 'Regulars gone quiet', sub: 'played weekly · silent 10+ days', cta: 'DM', to: member(d.gone_quiet.items[0]?.user_id), items: d.gone_quiet.items.map(x => ({ name: x.name, detail: `last seen ${x.days} days ago`, to: member(x.user_id) })) },
    { n: d.clubs_to_pitch.clubs, title: 'Clubs ready to pitch', short: 'Clubs to pitch', sub: '3+ members each · no club profile', cta: 'PITCH', to: pitch(d.clubs_to_pitch.items[0]?.name), items: d.clubs_to_pitch.items.map(x => ({ name: x.name, detail: `${x.members} members · ${x.connected} connected`, to: pitch(x.name) })) },
    { n: d.first_rounds.members, title: 'First rounds just landed', short: 'First rounds', sub: 'new members · last 24 hours', cta: 'WELCOME', to: member(d.first_rounds.items[0]?.user_id), items: d.first_rounds.items.map(x => ({ name: x.name, detail: x.gross == null ? x.course : `${x.gross} at ${x.course ?? ''}`, to: member(x.user_id) })) },
    { n: d.unreacted.posts, title: 'Posts nobody has reacted to', short: 'Unreacted posts', sub: 'live for 6+ hours', cta: 'REACT', to: d.unreacted.items[0] ? `/post/${d.unreacted.items[0].post_id}` : '/admin-v2/content', items: d.unreacted.items.map(x => ({ name: x.name, detail: `${x.kind === 'post' ? 'post' : `${x.kind} post`} · ${x.hours}h`, to: `/post/${x.post_id}` })) },
    { n: d.played_not_connected, title: 'Played, not connected', short: 'Played, not connected', sub: 'this week', cta: 'NUDGE', to: '/admin-v2/users?filter=not_connected', items: [] },
    { n: d.inbox, title: 'Inbox', short: 'Inbox', sub: 'claims, requests and tickets', cta: 'OPEN', to: '/admin-v2/inbox', items: [] },
  ];
  const visible = rows.filter(r => r.n > 0);
  const [open, setOpen] = useState<string | null | undefined>(undefined);
  const opened = open === undefined ? visible[0]?.title : open;
  const total = visible.reduce((n, r) => n + r.n, 0);
  return <Panel title="Do now" meta={visible.length ? <><b style={{ color: t.ink, ...FIG, letterSpacing: 0 }}>{total}</b> things · most urgent first</> : undefined} pad={false}>
    {visible.length > 0 && <div style={{ height: 14 }} />}
    {visible.map((r, i) => <div key={r.title} style={{ borderTop: `1px solid ${t.hairline}` }}>
      <div role="button" tabIndex={0} aria-expanded={opened === r.title} onClick={() => setOpen(opened === r.title ? null : r.title)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(opened === r.title ? null : r.title); } }} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 18px', cursor: 'pointer' }}>
        <div style={{ ...FIG, fontSize: 28, width: 30, flex: 'none', color: r.urgent ? t.danger : t.ink }}>{r.n}</div>
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 15.5, fontWeight: 600, lineHeight: 1.25 }}>{r.title}</div><div style={{ fontSize: 13, color: t.inkMuted, marginTop: 3 }}>{r.sub}</div></div>
        <Btn primary={i === 0} to={r.to}>{r.cta}</Btn>
      </div>
      {opened === r.title && <div style={{ padding: '0 18px 14px 62px' }}>{r.items.map((x, j) => <Link key={j} to={x.to} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', color: t.ink, textDecoration: 'none' }}><Squircle name={x.name} size={28} /><div style={{ minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 600 }}>{x.name}</div><div style={{ fontSize: 12.5, color: t.inkFaint }}>{x.detail}</div></div></Link>)}</div>}
    </div>)}
    <div style={{ borderTop: `1px solid ${t.hairline}`, padding: '12px 18px 16px', fontSize: 12.5, color: t.inkFaint }}><span style={{ color: t.ok }}>✓</span> {visible.length ? `Clear: ${rows.filter(r => r.n === 0).map(r => r.short).join(' · ')}` : 'All clear'}</div>
  </Panel>;
}

/* ---------- 3. right now ---------- */
function RightNow({ hours, days }: { hours: CommandCentreV2['hours']; days: CommandCentreDays }) {
  const live = useLiveInApp();
  const aw = useActiveWindows(days);
  const a = !aw.isError ? aw.data : undefined;
  const today = hours.hours.filter(x => x.hour <= hours.current_hour).map(x => x.today);
  const lastWk = hours.hours.map(x => x.last);
  const tiles = a ? [
    ...(['dau', 'wau', 'mau'] as const).map(k => ({ k: k.toUpperCase(), v: a[k].current.toLocaleString(), d: [a[k].previous, a[k].current], sub: undefined, s: a.daily.slice(-13).map(x => x[k]) })),
    { k: 'Sticky', v: a.stickiness == null ? '—' : `${Math.round(a.stickiness)}%`, d: undefined, sub: 'WAU / MAU', s: a.daily.slice(-13).map(x => x.mau ? x.wau / x.mau * 100 : 0) },
  ] : [];
  return (
    <Panel title={<span style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ width: 8, height: 8, borderRadius: 99, background: t.ok }} />Right now</span>} meta={hours.peak === 0 ? 'no one yet today' : <>peak today <b style={{ color: t.ink }}>{hours.peak}</b> at {String(hours.peak_hour).padStart(2, '0')}:00</>}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
        <div style={{ flex: 'none' }}>
          <Body height={58} loading={live.isLoading} failed={live.isError || !live.data}>{() => <span style={{ ...FIG, fontSize: 64, lineHeight: 0.9 }}>{live.data?.count}</span>}</Body>
          <span style={{ fontSize: 15, color: t.inkMuted, marginLeft: 8 }}>live</span>
        </div>
        <div style={{ flex: 1, minWidth: 0, position: 'relative', height: 58 }}>
          <div style={{ position: 'absolute', inset: 0 }}><Spark data={lastWk} h={58} dashed color={t.inkFaint} /></div>
          <div style={{ position: 'absolute', inset: 0, right: `${lastWk.length > 1 ? (1 - (Math.max(1, today.length) - 1) / (lastWk.length - 1)) * 100 : 0}%` }}><Spark data={today} h={58} area /></div>
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: t.inkFaint, textAlign: 'right', marginTop: 4 }}>solid today · dashed same day last week</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginTop: 14 }}>
        {(!a ? ['DAU', 'WAU', 'MAU', 'Sticky'].map(k => <div key={k} style={{ background: INSET, borderRadius: 16, padding: '13px 14px 10px', minWidth: 0 }}><div style={LABEL}>{k}</div><Body height={66} loading={aw.isLoading} failed={!aw.isLoading}>{() => null}</Body></div>) : tiles.map(tile => (
          <div key={tile.k} style={{ background: INSET, borderRadius: 16, padding: '13px 14px 10px', minWidth: 0 }}>
            <div style={LABEL}>{tile.k}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
              <span style={{ ...FIG, fontSize: 28 }}>{tile.v}</span>
              {tile.d ? <Delta now={tile.d[1]} prev={tile.d[0]} /> : <span style={{ fontSize: 11.5, color: t.inkFaint, fontWeight: 600 }}>{tile.sub}</span>}
            </div>
            <div style={{ marginTop: 8 }}><Spark data={tile.s} h={24} /></div>
          </div>
        )))}
      </div>
    </Panel>
  );
}

/* ---------- 4. the loop ---------- */
function Loop({ data }: { data: CommandCentreV2['loop'] }) {
  const steps: [string, number][] = [['Joined', data.joined], ['Connected', data.connected], ['Round in', data.round_in], ['Opened a round', data.opened], ['Posted', data.posted], ['Invited', data.invited]];
  const drops = steps.map((s, i) => (i ? steps[i - 1][1] - s[1] : 0));
  const leak = drops.indexOf(Math.max(...drops));
  return (
    <Panel title="The loop" meta="share of all members">
      {steps.map(([k, v], i) => (
        <div key={k} style={{ display: 'grid', gridTemplateColumns: 'minmax(84px, 30%) 1fr 40px 38px', alignItems: 'center', gap: 10, padding: '7px 0' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: i === leak ? t.danger : t.inkMuted, lineHeight: 1.2 }}>{k}</div>
          <div style={{ height: 22, background: INSET, borderRadius: 7, overflow: 'hidden' }}>
            <div style={{ width: `${(v / (steps[0][1] || 1)) * 100}%`, height: '100%', borderRadius: 7, background: i === leak ? t.danger : t.ink, opacity: i === leak ? 1 : 0.9 - i * 0.1 }} />
          </div>
          <div style={{ ...FIG, fontSize: 17, textAlign: 'right', color: i === leak ? t.danger : t.ink }}>{v}</div>
          <div style={{ ...FIG, fontSize: 12.5, textAlign: 'right', color: t.inkFaint, letterSpacing: 0 }}>{i ? `${Math.round((v / (steps[0][1] || 1)) * 100)}%` : ''}</div>
        </div>
      ))}
      <div style={{ marginTop: 14, padding: '14px 14px', background: t.dangerSoft, borderRadius: 14 }}>
        <div style={{ ...LABEL, color: t.danger }}>Biggest leak · {steps[Math.max(0, leak - 1)][0].toLowerCase()} → {steps[leak][0].toLowerCase()}</div>
        <div style={{ display: 'grid', gridTemplateColumns: leak === 1 ? '1fr 1fr' : '1fr', gap: 10, marginTop: 10 }}>
          {(leak === 1 ? [[data.could_connect, 'could connect today'], [data.waiting_on_body, 'waiting on a handicap body']] : [[drops[leak], 'lost at this step']]).map(([n, label]) => <div key={label}><div style={{ ...FIG, fontSize: 26 }}>{n}</div><div style={{ fontSize: 12.5, color: t.inkMuted, marginTop: 2 }}>{label}</div></div>)}
        </div>
      </div>
    </Panel>
  );
}

/* ---------- 5. coverage ---------- */
function Coverage({ data, waiting }: { data: CommandCentreV2['coverage']; waiting: number }) {
  const bodies: [string, string, number, number][] = data.map(x => [x.body === 'Not known' ? 'No body named' : x.body, x.live ? 'LIVE' : ['Scottish Golf', 'Golf Ireland', 'Wales Golf'].includes(x.body) ? 'IN TALKS' : ['USGA', 'FFGolf'].includes(x.body) ? 'IN PLAY' : '', x.members, x.connected]);
  const max = Math.max(1, ...data.map(x => x.members));
  return (
    <Panel title="Who can connect" meta={<><b style={{ color: t.ink }}>{waiting}</b> members waiting</>}>
      <div style={{ display: 'flex', gap: 14, fontSize: 11.5, color: t.inkFaint, marginBottom: 10 }}>
        <span><i style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 3, background: t.ok, marginRight: 6 }} />connected</span>
        <span><i style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 3, background: 'rgba(233,237,243,0.32)', marginRight: 6 }} />members</span>
      </div>
      {bodies.map(([k, st, n, conn]) => (
        <div key={k} style={{ padding: '9px 0', borderTop: `1px solid ${t.hairline}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{k}</span>
            {st && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 7px', borderRadius: 6, color: st === 'LIVE' ? t.ok : t.inkMuted, border: `1px solid ${st === 'LIVE' ? 'rgba(61,220,145,0.4)' : t.line}` }}>{st}</span>}
            <span style={{ marginLeft: 'auto', ...FIG, fontSize: 16 }}>{n}</span>
          </div>
          <div style={{ height: 8, background: INSET, borderRadius: 99, marginTop: 8, overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, width: `${(n / max) * 100}%`, background: 'rgba(233,237,243,0.32)', borderRadius: 99 }} />
            <div style={{ position: 'absolute', inset: 0, width: `${(conn / max) * 100}%`, background: t.ok, borderRadius: 99 }} />
          </div>
        </div>
      ))}
    </Panel>
  );
}

/* ---------- 6. clubs ---------- */
function Clubs({ data, goal }: { data: CommandCentreV2['clubs']; goal: number }) {
  const clubs: [string, number, number, number, boolean][] = data.top.map(x => [x.name, x.members, x.connected, x.rounds, x.has_profile]);
  return (
    <Panel title="Clubs" meta="the other half of clbhouz" pad={false}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '14px 18px 16px' }}>
        {[['Club profiles', data.profiles.toLocaleString(), `of ${goal}`], ['Clubs with members', data.clubs_with_members.toLocaleString(), ''], ['Members at a club', `${Math.round(data.members ? data.members_at_club / data.members * 100 : 0)}%`, `${data.members_at_club} of ${data.members}`]].map(([k, v, s]) => (
          <div key={k} style={{ minWidth: 0 }}>
            <div style={{ ...LABEL, lineHeight: 1.35 }}>{k}</div>
            <div style={{ ...FIG, fontSize: 26, marginTop: 5 }}>{v}</div>
            {s && <div style={{ fontSize: 12, color: t.inkFaint, marginTop: 2 }}>{s}</div>}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 28px 28px 28px 60px', gap: 6, padding: '10px 18px 8px', borderTop: `1px solid ${t.hairline}`, ...LABEL, fontSize: 9 }}>
        <span>Clubs</span><span style={{ textAlign: 'right' }}>Mem</span><span style={{ textAlign: 'right' }}>Con</span><span style={{ textAlign: 'right' }}>Rds</span><span />
      </div>
      {clubs.map(([n, m, c, r, prof]) => (
        <div key={n} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 28px 28px 28px 60px', gap: 6, alignItems: 'center', padding: '10px 18px', borderTop: `1px solid ${t.hairline}` }}>
          <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.25, minWidth: 0 }}>{n}</span>
          <span style={{ ...FIG, fontSize: 15, textAlign: 'right' }}>{m}</span>
          <span style={{ ...FIG, fontSize: 15, textAlign: 'right', color: t.inkMuted }}>{c}</span>
          <span style={{ ...FIG, fontSize: 15, textAlign: 'right', color: t.inkMuted }}>{r}</span>
          <span style={{ textAlign: 'right' }}>
            {prof
              ? <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: t.ok }}>✓ ON</span>
              : <Link to={`/admin-v2/content?section=courses&q=${encodeURIComponent(n)}`} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', height: 28, padding: '0 9px', borderRadius: 999, border: `1px solid ${t.line}`, background: 'transparent', color: t.ink,  fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>PITCH</Link>}
          </span>
        </div>
      ))}
      <div style={{ borderTop: `1px solid ${t.hairline}`, padding: '14px 18px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ ...LABEL }}>Revenue · v2</span>
          <span style={{ fontSize: 12, color: t.inkFaint }}>switches on in December</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 10 }}>
          {[['MRR', '£0'], ['Tee times', '0'], ['Club mail', '0'], ['Promoted', '0']].map(([k, v]) => (
            <div key={k} style={{ background: INSET, borderRadius: 12, padding: '10px 10px 9px', minWidth: 0 }}>
              <div style={{ ...FIG, fontSize: 18, color: t.inkFaint }}>{v}</div>
              <div style={{ fontSize: 11, color: t.inkFaint, marginTop: 3 }}>{k}</div>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

/* ---------- 7. the moat ---------- */
function Moat({ data, win, days }: { data: CommandCentreV2['moat']; win: string; days: CommandCentreDays }) {
  const byDay = data.rounds_buckets.map(x => x.n);
  const DAYS = data.rounds_buckets.map(x => new Date(x.from).toLocaleDateString('en-GB', { weekday: 'short' }).slice(0, 1));
  const tiles = [
    { k: 'Rounds', v: data.rounds_total.toLocaleString(), d: data.rounds_window > 0 ? `+${data.rounds_window.toLocaleString()}` : null, bars: true, sub: undefined, s: [] },
    { k: 'Holes', v: data.holes_total.toLocaleString(), d: data.holes_window > 0 ? `+${data.holes_window.toLocaleString()}` : null, bars: false, sub: undefined, s: data.holes_series },
    { k: 'Courses measured', v: data.courses_measured.toLocaleString(), d: null, bars: false, sub: `10+ rounds each · ${data.courses_played} played`, s: data.measured_series },
    { k: 'Reviews', v: data.reviews_total.toLocaleString(), d: data.reviews_window > 0 ? `+${data.reviews_window.toLocaleString()}` : null, bars: false, sub: undefined, s: data.reviews_series },
  ];
  return (
    <Panel title="The moat" meta={`all time · + ${win}`}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
        {tiles.map(tile => (
          <div key={tile.k} style={{ background: INSET, borderRadius: 16, padding: '14px 14px 12px', minWidth: 0 }}>
            <div style={{ ...LABEL, lineHeight: 1.35 }}>{tile.k}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              <span style={{ ...FIG, fontSize: 28 }}>{tile.v}</span>
              {tile.d && <span style={{ ...FIG, fontSize: 13, color: t.ok, letterSpacing: 0 }}>{tile.d}</span>}
            </div>
            {tile.sub && <div style={{ fontSize: 12, color: t.inkFaint, marginTop: 2 }}>{tile.sub}</div>}
            <div style={{ marginTop: 10 }}>
              {tile.bars ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 30 }}>
                    {byDay.map((n, i) => <div key={i} style={{ flex: 1, height: `${Math.max(6, (n / Math.max(1, ...byDay)) * 100)}%`, borderRadius: 3, background: i === byDay.length - 1 ? t.ink : 'rgba(233,237,243,0.30)' }} />)}
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                    {(days === 7 ? DAYS : []).map((d, i) => <span key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9.5, fontWeight: 700, color: i === byDay.length - 1 ? t.ink : t.inkFaint }}>{d}</span>)}
                  </div>
                </div>
              ) : <Spark data={tile.s} h={30} />}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ---------- 8. clubhouse ---------- */
function Clubhouse({ data: w, win }: { data: CommandCentreV2['clubhouse']; win: string }) {
  const [openPost, setOpenPost] = useState<string | null>(null);
  const posts: [string, string, number, number, [string, string, boolean] | null, string][] = w.top.slice(0, 4).map(x => [x.name, `${x.kind}${x.course ? ` · ${x.course}` : ''}`, x.likes, x.comments, x.kind === 'round' && x.gross != null ? [String(x.gross), x.to_par != null ? toParText(x.to_par) : '', x.to_par != null && x.to_par < 0] : null, x.post_id]);
  const creators: [string, number, number][] = w.creators.map(x => [x.name, x.posts, x.reactions]);
  const stats: [string, number, number | null, string?][] = [['Posts', w.posts, w.posts_prev], ['Reactions', w.reactions, null, `${(w.posts ? w.reactions / w.posts : 0).toFixed(1)} a post`], ['Reviews', w.reviews, w.reviews_prev], ['Video', w.video_posts, null, `${Math.round(w.posts ? w.video_posts / w.posts * 100 : 0)}% of posts`]];
  return (
    <Panel title="Clubhouse" meta={win} pad={false}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, padding: '14px 18px 16px' }}>
        {stats.map(([k, v, p, sub]) => (
          <div key={k} style={{ minWidth: 0 }}>
            <div style={LABEL}>{k}</div>
            <div style={{ ...FIG, fontSize: 26, marginTop: 5 }}>{v}</div>
            <div style={{ marginTop: 2 }}>{p != null ? <Delta now={v} prev={p} /> : <span style={{ fontSize: 12, color: t.inkFaint, fontWeight: 600 }}>{sub}</span>}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 44px 44px', gap: 8, padding: '10px 18px 8px', borderTop: `1px solid ${t.hairline}`, ...LABEL, fontSize: 9 }}>
        <span>Top posts</span><span style={{ textAlign: 'right' }}>Likes</span><span style={{ textAlign: 'right' }}>Comm</span>
      </div>
      {posts.map(([n, d, l, c, sc, postId]) => (
        <div key={postId} role="button" tabIndex={0} onClick={() => setOpenPost(postId)} onKeyDown={e => { if (e.key === 'Enter') setOpenPost(postId); }} style={{ cursor: 'pointer', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 44px 44px', gap: 8, alignItems: 'center', padding: '10px 18px', borderTop: `1px solid ${t.hairline}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <Squircle name={n} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, overflowWrap: 'anywhere' }}>{n}</div>
              <div style={{ fontSize: 12.5, color: t.inkFaint }}>{d}{sc && <> · <b style={{ color: t.ink, ...FIG, letterSpacing: 0 }}>{sc[0]}</b> <span style={{ color: sc[2] ? '#E24B3F' : t.inkFaint, ...FIG, letterSpacing: 0 }}>{sc[1]}</span></>}</div>
            </div>
          </div>
          <span style={{ ...FIG, fontSize: 15, textAlign: 'right' }}>{l}</span>
          <span style={{ ...FIG, fontSize: 15, textAlign: 'right', color: t.inkMuted }}>{c}</span>
        </div>
      ))}
      <div style={{ borderTop: `1px solid ${t.hairline}`, padding: '14px 18px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={LABEL}>Featured creators</span><span style={{ fontSize: 12, color: t.inkFaint }}>posts · reactions</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginTop: 10 }}>
          {creators.map(([n, p, r]) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, background: INSET, borderRadius: 14, padding: '10px 12px', minWidth: 0 }}>
              <Squircle name={n} size={30} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2, overflowWrap: 'anywhere' }}>{n}</div>
                <div style={{ ...FIG, fontSize: 13, letterSpacing: 0, color: p ? t.inkMuted : t.danger, marginTop: 2 }}>{p} · {r}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <PostInsightSheet postId={openPost} open={!!openPost} onClose={() => setOpenPost(null)} />
    </Panel>
  );
}

/* ---------- 9. retention ---------- */
function Retention({ data }: { data: CommandCentreV2['retention'] }) {
  const r = useRetention(56);
  const c = !r.isError ? r.data?.cohort : undefined;
  const cohorts: [string, number, (number | null)[]][] = data.cohorts.map(x => [new Date(x.week_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), x.n, x.cells]);
  const cards = [{ k: 'Connected', n: data.d30_connected_n, returned: data.d30_connected_returned, col: t.ok }, { k: 'Not connected', n: data.d30_not_n, returned: data.d30_not_returned, col: t.danger }];
  return (
    <Panel title="Retention" meta="day 30">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {cards.map(({ k, n, returned, col }) => { const v = n >= 5 ? Math.round(returned / n * 100) : null; const s = n < 5 ? `too few yet (${n})` : `${returned} of ${n}`; return (
          <div key={k} style={{ background: INSET, borderRadius: 16, padding: '14px 14px 12px', minWidth: 0 }}>
            <div style={LABEL}>{k}</div>
            <div style={{ ...FIG, fontSize: 34, marginTop: 6, color: col }}>{v == null ? '—' : `${v}%`}</div>
            <div style={{ fontSize: 12, color: t.inkFaint, marginTop: 2 }}>{s}</div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, marginTop: 10, overflow: 'hidden' }}>
              <div style={{ width: `${v ?? 0}%`, height: '100%', background: col, borderRadius: 99 }} />
            </div>
          </div>
        ); })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 18 }}>
        <span style={LABEL}>Weekly cohorts · still active</span>
        <span style={{ fontSize: 12, color: t.inkFaint }}>{c ? `D1 ${c.d1_eligible ? Math.round(c.d1_returned / c.d1_eligible * 100) : 0}% · D7 ${c.d7_eligible ? Math.round(c.d7_returned / c.d7_eligible * 100) : 0}%` : '—'}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '48px 26px repeat(5, 1fr)', gap: 4, marginTop: 10, alignItems: 'center' }}>
        <span /><span style={{ ...LABEL, fontSize: 9, textAlign: 'right' }}>n</span>
        {['W0', 'W1', 'W2', 'W3', 'W4'].map(h => <span key={h} style={{ ...LABEL, fontSize: 9, textAlign: 'center' }}>{h}</span>)}
        {cohorts.map(([wk, n, cells]) => (
          <React.Fragment key={wk}>
            <span style={{ fontSize: 12, color: t.inkMuted, fontWeight: 600 }}>{wk}</span>
            <span style={{ ...FIG, fontSize: 12, color: t.inkFaint, textAlign: 'right', letterSpacing: 0 }}>{n}</span>
            {[0, 1, 2, 3, 4].map(i => {
              const v = cells[i];
              return (
                <div key={i} style={{ height: 30, borderRadius: 7, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', placeItems: 'center', background: v == null ? 'transparent' : `rgba(233,237,243,${0.05 + (v / 100) * 0.55})`, border: v == null ? `1px dashed ${t.hairline}` : 'none' }}>
                  {v != null && <span style={{ ...FIG, fontSize: 11.5, letterSpacing: 0, color: v > 60 ? t.canvas : t.ink }}>{v}</span>}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </Panel>
  );
}


function EmptyPanel({ title, height, loading }: { title: string; height: number; loading: boolean }) {
  return <Panel title={title}><Body height={height} loading={loading} failed={!loading}>{() => null}</Body></Panel>;
}
export default function DashboardPage() {
  const [days, setWindow] = useState<CommandCentreDays>(() => { try { const d = Number(localStorage.getItem('admin.cc.window')); return d === 28 || d === 90 ? d : 7; } catch { return 7; } });
  const [statusOpen, setStatusOpen] = useState(false);
  const qc = useQueryClient();
  useEffect(() => { const handler = () => qc.invalidateQueries({ queryKey: ['admin-v2'] }); window.addEventListener('admin-v2:refetch', handler); return () => window.removeEventListener('admin-v2:refetch', handler); }, [qc]);
  const cc = useCommandCentreV2(days);
  const data = !cc.isError ? cc.data : undefined;
  const setDays = (d: CommandCentreDays) => { setWindow(d); try { localStorage.setItem('admin.cc.window', String(d)); } catch { /* storage may be unavailable */ } };
  return <div className="admin-cc-v2" style={{ maxWidth: 460, margin: '0 auto', padding: '0 12px 40px', color: t.ink, fontWeight: 400 }}>
    <ControlBar days={days} setDays={setDays} statusOpen={statusOpen} setStatusOpen={setStatusOpen} />
    {data ? <Target data={data.target} days={days} /> : <EmptyPanel title="The target" height={290} loading={cc.isLoading} />}
    {data ? <DoNow data={data.do_now} /> : <EmptyPanel title="Do now" height={320} loading={cc.isLoading} />}
    {data ? <RightNow hours={data.hours} days={days} /> : <EmptyPanel title="Right now" height={260} loading={cc.isLoading} />}
    {data ? <Loop data={data.loop} /> : <EmptyPanel title="The loop" height={290} loading={cc.isLoading} />}
    {data ? <Coverage data={data.coverage} waiting={data.loop.waiting_on_body} /> : <EmptyPanel title="Who can connect" height={320} loading={cc.isLoading} />}
    {data ? <Clubs data={data.clubs} goal={data.target.clubs_goal} /> : <EmptyPanel title="Clubs" height={360} loading={cc.isLoading} />}
    {data ? <Moat data={data.moat} win={`${days}D`} days={days} /> : <EmptyPanel title="The moat" height={260} loading={cc.isLoading} />}
    {data ? <Clubhouse data={data.clubhouse} win={`${days}D`} /> : <EmptyPanel title="Clubhouse" height={360} loading={cc.isLoading} />}
    {data ? <Retention data={data.retention} /> : <EmptyPanel title="Retention" height={330} loading={cc.isLoading} />}
  </div>;
}
