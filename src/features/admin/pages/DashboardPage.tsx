/** CC3: the v2 RPC owns existing windowed figures; useCcEngine alone owns
 * Golfers and The engine. Legacy health/live/active/retention readers retain
 * their server definitions. AdminShell owns chrome. Failed reads suppress
 * stale figures, and all sections reserve their own loading/error geometry.
 * Page-local semantic tokens preserve the mock without changing adminTheme;
 * system typography is inherited. Pure thresholds/grouping live in cc3Rules. */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { adminTheme as t } from '../theme';
import { Skeleton, formatDurationShort } from '../lib/chartPrimitives';
import { useCommandCentreV2, type CommandCentreDays, type CommandCentreV2 } from '../hooks/useCommandCentreV2';
import { useCcEngine, type CcEngine } from '../hooks/useCcEngine';
import { useDashboard } from '../hooks/useDashboard';
import { useEchoEngineHealth } from '../hooks/useEchoEngineHealth';
import { usePushHealth } from '../hooks/usePushHealth';
import { useErrorCount24h } from '../hooks/useStability';
import { useOpsHealth } from '../hooks/useOpsHealth';
import { useLiveInApp } from '../hooks/useOverviewMetrics';
import { useActiveWindows } from '../hooks/useActiveWindows';
import { useRetention } from '../hooks/useRetention';
import { computeEchoChip, computePushChip, computeEgChip, computeCronChip, computeErrorsChip, type ChipTone } from '../lib/healthChips';
import { pipelineTone } from '../components/SystemPanels';
import { ccDelta, ccHours, ccConnectChange, ccShare, ccCoverage, ccBodyChip, ccLeak } from './cc3Rules';
import './commandCentreV3.css';

const INSET = 'var(--cc3-inset)', INITIALS = 'var(--cc3-initials)', FAINT = 'var(--cc3-faint)', UNDER_PAR = 'var(--cc3-under)';
const TRACK = 'var(--cc3-track)';
const PAGE_TOKENS = { '--cc3-canvas': t.canvas, '--cc3-surface': t.surface, '--cc3-ink': t.ink, '--cc3-mute': t.inkMuted, '--cc3-good': t.ok, '--cc3-bad': t.danger, '--cc3-hair': t.hairline, '--cc3-line': t.line } as React.CSSProperties;
const analytics = (lens = 'behaviour') => `/admin-v2/analytics?lens=${lens}`;
const num = (n: number) => n.toLocaleString();
/** Status cells print figures only: a chip's words (e.g. Unavailable) read as a
 * dash so the six-cell grid never breaks mid-word; the dot keeps the chip's tone. */
const isShortFigure = (v: string) => v.length <= 7 && !/\s/.test(v) && /\d/.test(v);
const ccCellFigure = (v: string | null) => (v && isShortFigure(v) ? v : '—');
const Go = () => <span className="go" aria-hidden>›</span>;
function Label({ children }: { children: React.ReactNode }) { return <span className="ml">{children}</span>; }
function Delta({ now, prev }: { now: number; prev: number }) { const d = ccDelta(now, prev); return <span className={d.tone} data-cc-delta>{d.text}</span>; }
function Body({ height, loading, failed, children }: { height: number; loading: boolean; failed: boolean; children: () => React.ReactNode }) {
  if (loading) return <Skeleton height={height} radius={12} />;
  if (failed) return <div className="empty" style={{ height }} aria-label="Unavailable" />;
  return <>{children()}</>;
}
function Panel({ title, meta, children, list = false }: { title: React.ReactNode; meta?: React.ReactNode; children: React.ReactNode; list?: boolean }) {
  return <section className={`p${list ? ' list' : ''}`}><div className="hd"><span className="ti">{title}</span>{meta && <span className="me">{meta}</span>}</div>{children}</section>;
}
function EmptyPanel({ title, height, loading, list = false }: { title: string; height: number; loading: boolean; list?: boolean }) {
  return <Panel title={title} list={list}><Body height={height} loading={loading} failed={!loading}>{() => null}</Body></Panel>;
}
function Squircle({ name, size = 22 }: { name: string; size?: number }) {
  return <span className={`av${size === 28 ? ' l' : ''}`} style={{ width: size, height: size, background: INITIALS }}>{name.split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase()}</span>;
}
function Bar({ percent, height = 6 }: { percent: number; height?: number }) {
  return <div className="bar" style={{ height, background: TRACK }}><i style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} /></div>;
}
function Spark({ data, h = 22, stroke = 1.3, color = t.ink, stepped = false }: { data: (number | null)[]; h?: number; stroke?: number; color?: string; stepped?: boolean }) {
  const available = data.flatMap((v, i) => v == null ? [] : [{ v, i }]);
  if (available.length < 2) return <div style={{ height: h }} />;
  const min = Math.min(...available.map(p => p.v)), max = Math.max(...available.map(p => p.v));
  const points = available.map(p => ({ x: p.i / Math.max(1, data.length - 1) * 100, y: h - 2 - (p.v - min) / (max - min || 1) * (h - 4) }));
  const d = points.map((p, i) => i === 0 ? `M${p.x},${p.y}` : stepped ? `H${p.x} V${p.y}` : `L${p.x},${p.y}`).join(' ');
  return <svg width="100%" height={h} viewBox={`0 0 100 ${h}`} preserveAspectRatio="none" aria-hidden><path d={d} fill="none" stroke={color} strokeWidth={stroke} vectorEffect="non-scaling-stroke" /></svg>;
}
function StatusLine() {
  const eg = useDashboard().egSyncHealth, echo = useEchoEngineHealth(), push = usePushHealth(), errors = useErrorCount24h(), ops = useOpsHealth(7);
  const egChip = computeEgChip(eg), cronChip = computeCronChip(eg), echoChip = computeEchoChip(echo), pushChip = computePushChip(push), errorsChip = computeErrorsChip(errors.data ?? null, errors.isLoading, errors.isError);
  const e = eg.data, p = ops.data?.pipeline, errs = ops.data?.errors;
  const cells: { label: string; tone: ChipTone; value: string | null }[] = [
    { label: 'EG sync', tone: egChip.tone, value: e ? `${e.status_ok_count}/${e.total_connected}` : null },
    { label: 'Cron', tone: cronChip.tone, value: e ? e.cron_hours_ago == null ? '—' : formatDurationShort(Math.round(e.cron_hours_ago) * 3600) : null },
    { label: 'Echo', tone: echoChip.tone, value: echo.data ? String(echo.data.latest?.length ?? 0) : null },
    { label: 'Push', tone: pushChip.tone, value: push.isLoading ? null : pushChip.tone === 'ok' ? 'OK' : pushChip.detail },
    { label: 'Queue', tone: ops.isLoading ? 'idle' : pipelineTone(p), value: p ? num(p.unprocessed) : null },
    { label: 'Errors', tone: errorsChip.tone, value: errs ? errs.sessions_24h > 0 ? `${(errs.errors_24h / errs.sessions_24h * 100).toFixed(1)}%` : '—' : null },
  ];
  const nonOk = cells.filter(c => c.tone !== 'ok' && c.tone !== 'idle').length;
  const loading = eg.isLoading || echo.isLoading || push.isLoading || errors.isLoading || ops.isLoading;
  return <><Link className="status" to="/admin-v2/health"><span className={`dot${nonOk ? ' bad' : ''}`} /><span className="s1">{nonOk ? `${nonOk} need attention` : 'All systems normal'}</span><span className="s2">EG <b>{!eg.isLoading && !eg.isError && e ? `${e.status_ok_count}/${e.total_connected}` : '—'}</b> · errors <b>{!ops.isLoading && !ops.isError && errs ? errs.sessions_24h > 0 ? `${(errs.errors_24h / errs.sessions_24h * 100).toFixed(1)}%` : '—' : '—'}</b></span><Go /></Link>
    {loading ? <Skeleton height={45} radius={12} /> : nonOk > 0 && <div className="status-grid" data-cc-status-cells>{cells.map(c => <Link key={c.label} className="status-cell" to="/admin-v2/health"><span className={`dot small${c.tone === 'idle' ? ' idle' : c.tone === 'ok' ? '' : ' bad'}`} /><span className="value">{ccCellFigure(c.value)}</span><Label>{c.label}</Label></Link>)}</div>}</>;
}
function PaceCard({ label, now, goal, added, days, deadline, to }: { label: string; now: number; goal: number; added: number; days: CommandCentreDays; deadline: string; to: string }) {
  const weeksLeft = Math.ceil((new Date(deadline).getTime() - Date.now()) / (7 * 86400000));
  const doing = added / (days / 7), needed = (goal - now) / Math.max(1, weeksLeft);
  const fmt = (v: number) => v >= 10 ? num(Math.round(v)) : v.toFixed(1).replace(/\.0$/, '');
  return <Link className="pc" to={to}><div className="h"><Label>{label}</Label><Go /></div><div className="big">{num(now)}</div><div className="of">of {num(goal)}</div><Bar percent={Math.max(1.2, now / goal * 100)} height={4} /><div className="p1"><b className={doing >= needed ? 'up' : 'dn'} data-cc-pace>{fmt(doing)}</b> a week</div><div className="p2">need <b>{fmt(needed)}</b></div></Link>;
}
function TopRow({ data, engine, days, loading, engineLoading }: { data?: CommandCentreV2; engine?: CcEngine; days: CommandCentreDays; loading: boolean; engineLoading: boolean }) {
  return <div className="top3">{data ? <PaceCard label="Members" now={data.target.members} goal={data.target.members_goal} added={data.target.signups} days={days} deadline={data.target.deadline} to="/admin-v2/users" /> : <div className="pc"><Label>Members</Label><Body height={116} loading={loading} failed={!loading}>{() => null}</Body></div>}
    {engine ? <Link className="pc" to={analytics()}><div className="h"><Label>Golfers</Label><Go /></div><div className="big">{num(engine.golfers.current)}</div><div className="of">logged a round</div><Spark data={engine.golfers.weekly} h={10} /><div className="p1"><Delta now={engine.golfers.current} prev={engine.golfers.previous} />{days === 7 ? ' on last week' : ` on previous ${days} days`}</div><div className="p2">north star</div></Link> : <div className="pc"><Label>Golfers</Label><Body height={116} loading={engineLoading} failed={!engineLoading}>{() => null}</Body></div>}
    {data ? <PaceCard label="Clubs" now={data.target.clubs} goal={data.target.clubs_goal} added={data.target.clubs_added} days={days} deadline={data.target.deadline} to="/admin-v2/content?section=courses" /> : <div className="pc"><Label>Clubs</Label><Body height={116} loading={loading} failed={!loading}>{() => null}</Body></div>}</div>;
}
function HoursChart({ hours }: { hours: CommandCentreV2['hours'] }) {
  const w = 200, h = 48, max = Math.max(1, ...hours.hours.flatMap(x => [x.today, x.last]));
  const point = (hour: number, value: number) => ({ x: hour / 23 * w, y: h - 2 - value / max * (h - 4) });
  const path = (points: { x: number; y: number }[]) => points.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ');
  const today = hours.hours.filter(x => x.hour <= hours.current_hour).map(x => point(x.hour, x.today));
  const last = hours.hours.map(x => point(x.hour, x.last)), end = today.at(-1);
  return <svg className="chart" width="100%" height={48} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden><path d={path(last)} fill="none" stroke={FAINT} strokeWidth={1} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />{end && <><path d={`${path(today)} L${end.x},48 L${today[0].x},48 Z`} fill="var(--cc3-area)" /><path d={path(today)} fill="none" stroke={t.ink} strokeWidth={1.5} vectorEffect="non-scaling-stroke" /><circle cx={end.x} cy={end.y} r={2.5} fill={t.ink} /></>}</svg>;
}
function RightNow({ hours }: { hours?: CommandCentreV2['hours'] }) {
  const live = useLiveInApp(), aw = useActiveWindows(28), a = !aw.isError ? aw.data : undefined;
  return <Panel title={<><span className="dot small" />Right now</>} meta={hours ? hours.peak === 0 ? 'no one yet today' : <>peak today <b>{hours.peak}</b> at {String(hours.peak_hour).padStart(2, '0')}:00</> : undefined}>
    <div className="rn"><div className="live"><Body height={40} loading={live.isLoading} failed={live.isError || !live.data}>{() => <><span className="n">{live.data?.count}</span><span className="u">live</span></>}</Body></div>{hours && <HoursChart hours={hours} />}</div>
    <div className="quad">{(['dau', 'wau', 'mau', 'sticky'] as const).map(k => <Link key={k} className="tile" to={analytics('health')}><div className="lh"><Label>{k === 'sticky' ? 'Sticky' : k.toUpperCase()}</Label><Go /></div><Body height={56} loading={aw.isLoading} failed={!a}>{() => a && <><div className="v">{k === 'sticky' ? a.stickiness == null ? '—' : `${Math.round(a.stickiness)}%` : num(a[k].current)}</div><div className="d">{k === 'sticky' ? <span className="mu">WAU/MAU</span> : <Delta now={a[k].current} prev={a[k].previous} />}</div><Spark data={a.daily.slice(-13).map(x => k === 'sticky' ? x.mau ? x.wau / x.mau * 100 : 0 : x[k])} h={16} color={t.inkMuted} stroke={1.2} /></>}</Body></Link>)}</div>
  </Panel>;
}
function DoNow({ data: d }: { data: CommandCentreV2['do_now'] }) {
  const member = (id?: string) => id ? `/admin-v2/users?member=${id}` : '/admin-v2/users';
  const pitch = (name?: string) => `/admin-v2/content?section=courses&q=${encodeURIComponent(name ?? '')}`;
  const rows = [
    { n: d.stuck_rounds.rounds, title: 'Rounds stuck on unmatched courses', short: 'Rounds stuck', sub: `${d.stuck_rounds.members} members · oldest ${d.stuck_rounds.oldest_days} days`, cta: 'MATCH', to: '/admin-v2/inbox?type=unmatchedCourse', items: d.stuck_rounds.items.map(x => ({ name: x.name, detail: `${x.rounds} rounds · ${x.members} members`, to: null })) },
    { n: d.gone_quiet.members, title: 'Regulars gone quiet', short: 'Regulars gone quiet', sub: 'played weekly · silent 10+ days', cta: 'DM', to: member(d.gone_quiet.items[0]?.user_id), items: d.gone_quiet.items.map(x => ({ name: x.name, detail: `${x.days} days`, to: member(x.user_id) })) },
    { n: d.clubs_to_pitch.clubs, title: 'Clubs ready to pitch', short: 'Clubs to pitch', sub: '3+ members each · no club profile', cta: 'PITCH', to: pitch(d.clubs_to_pitch.items[0]?.name), items: d.clubs_to_pitch.items.map(x => ({ name: x.name, detail: `${x.members} members · ${x.connected} connected`, to: pitch(x.name) })) },
    { n: d.first_rounds.members, title: 'First rounds just landed', short: 'First rounds', sub: 'new members · last 24 hours', cta: 'WELCOME', to: member(d.first_rounds.items[0]?.user_id), items: d.first_rounds.items.map(x => ({ name: x.name, detail: x.gross == null ? x.course : `${x.gross} at ${x.course ?? ''}`, to: member(x.user_id) })) },
    { n: d.unreacted.posts, title: 'Posts nobody has reacted to', short: 'Unreacted posts', sub: 'live for 6+ hours', cta: 'REACT', to: d.unreacted.items[0] ? `/post/${d.unreacted.items[0].post_id}` : '/admin-v2/content', items: d.unreacted.items.map(x => ({ name: x.name, detail: `${x.kind} · ${x.hours < 24 ? `${x.hours}h` : `${Math.floor(x.hours / 24)}d`}`, to: `/post/${x.post_id}` })) },
    { n: d.played_not_connected, title: 'Played, not connected', short: 'Played, not connected', sub: 'this week', cta: 'NUDGE', to: '/admin-v2/users?filter=not_connected', items: [] },
    { n: d.inbox, title: 'Inbox', short: 'Inbox', sub: 'claims, requests and tickets', cta: 'OPEN', to: '/admin-v2/inbox', items: [] },
  ];
  const visible = rows.filter(r => r.n > 0), [open, setOpen] = useState<string | null>(null);
  return <Panel title="Do now" meta={<><b>{visible.reduce((n, r) => n + r.n, 0)}</b> things · most urgent first</>} list>{visible.map((r, i) => <React.Fragment key={r.title}><div className={`row${open === r.title ? ' open' : ''}`}><span className="c">{r.n}</span><Button variant="ghost" className="tog" aria-expanded={open === r.title} onClick={() => setOpen(open === r.title ? null : r.title)}><div className="lb">{r.title}<span className="chev" aria-hidden>▾</span></div><div className="sb">{r.sub}</div></Button><Button variant="ghost" asChild className={`btn${i === 0 ? ' fill' : ''}`}><Link to={r.to}>{r.cta}</Link></Button></div>{open === r.title && <div className="sub">{r.items.slice(0, 5).map((x, j) => { const content = <><Squircle name={x.name} /><span className="n">{x.name}</span><span className="r">{x.detail}{x.to ? ' ›' : ''}</span></>; return x.to ? <Link className="mini" key={j} to={x.to}>{content}</Link> : <div className="mini" key={j}>{content}</div>; })}</div>}</React.Fragment>)}<div className="clear"><span className="ck">✓</span>Clear · {rows.filter(r => r.n === 0).map(r => r.short.toLowerCase()).join(' · ')}</div></Panel>;
}
function Engine({ data: d, days }: { data: CcEngine; days: CommandCentreDays }) {
  const change = ccConnectChange(d.connect);
  return <Panel title="The engine" meta={`what drives growth · ${days}D`}><div className="m4">
    <Link className="mt" to={analytics('journeys')}><div className="lh"><Label>Invites</Label><Go /></div><div className="top"><span className="v">{num(d.invites.sent)}<span style={{ fontSize: 12, fontWeight: 600, color: FAINT }}> → {num(d.invites.joined)}</span></span><span className="r mu">{d.invites.sent === 0 ? '—' : `${ccShare(d.invites.joined, d.invites.sent)}%`}</span></div><div className="sv" style={{ display: 'flex', alignItems: 'center' }}><Bar percent={ccShare(d.invites.joined, d.invites.sent)} /></div><div className="dl"><span className="l">sent → joined</span></div></Link>
    <Link className="mt" to="/admin-v2/users?filter=not_connected"><div className="lh"><Label>Time to connect</Label><Go /></div><div className="top"><span className={`v${d.connect.n === 0 ? ' fa' : ''}`}>{d.connect.n === 0 ? '—' : ccHours(d.connect.median_hours)}</span>{change && <span className={`r ${change.tone}`} data-cc-connect-change>{change.text}</span>}</div><div className="sv"><Spark data={d.connect.weekly} /></div><div className="dl"><span className="l">median, sign-up → handicap</span></div></Link>
    <Link className="mt" to={analytics()}><div className="lh"><Label>First reaction</Label><Go /></div><div className="top"><span className={`v${d.first_reaction.n === 0 ? ' fa' : ''}`}>{d.first_reaction.n === 0 ? '—' : ccHours(d.first_reaction.median_hours)}</span>{d.first_reaction.eligible > 0 && <span className="r mu">{ccShare(d.first_reaction.within_24h, d.first_reaction.eligible)}% in 24h</span>}</div><div className="sv"><Spark data={d.first_reaction.weekly} /></div><div className="dl"><span className="l">median wait on a new post</span></div></Link>
    <Link className="mt" to="/admin-v2/health"><div className="lh"><Label>Notifications on</Label><Go /></div><div className="top"><span className="v">{ccShare(d.notifications.enabled, d.notifications.members)}%</span><span className="r mu">{num(d.notifications.enabled)} of {num(d.notifications.members)}</span></div><div className="sv" style={{ display: 'flex', alignItems: 'center' }}><Bar percent={ccShare(d.notifications.enabled, d.notifications.members)} /></div><div className="dl"><span className="l">members who can get a push</span></div></Link>
  </div></Panel>;
}
function Loop({ data, coverage }: { data: CommandCentreV2['loop']; coverage: CommandCentreV2['coverage'] }) {
  const { steps, index, drop } = ccLeak(data), [open, setOpen] = useState(false), bodies = ccCoverage(coverage), max = Math.max(1, ...coverage.map(x => x.members));
  let opacity = 0;
  return <Panel title="The loop" meta={<>share of <b>{num(data.joined)}</b> members</>}><div className="lp">{steps.slice(1).map(([label, value], i) => { const leak = i + 1 === index; const alpha = leak ? 1 : [0.9, 0.75, 0.6, 0.5][opacity++]; return <Link key={label} className={`lr${leak ? ' leak' : ''}`} to={label === 'Connected' ? '/admin-v2/users?filter=connected' : analytics('journeys')}><span className="k">{label}</span><span className="tr"><i style={{ width: `${data.joined ? value / data.joined * 100 : 0}%`, opacity: alpha }} /></span><span className="v">{num(value)}</span><span className="s">{ccShare(value, data.joined)}%</span></Link>; })}</div>
    <div className="leakbox"><div><Label><span className="dn">Biggest leak</span></Label><div className="dn" style={{ fontSize: 12, fontWeight: 700, marginTop: 6, lineHeight: 1.3 }}>{steps[index - 1][0]} →<br />{steps[index][0]}</div></div>{index === 1 ? <><div><Label>Could connect</Label><div className="v">{num(data.could_connect)}</div></div><div><Label>Waiting on body</Label><div className="v">{num(data.waiting_on_body)}</div></div></> : <><div><Label>Stopped here</Label><div className="v">{num(drop)}</div></div><div /></>}</div>
    <Button variant="ghost" className="bodies" aria-expanded={open} onClick={() => setOpen(!open)}><span>By handicap body</span><span className="me">{coverage.filter(x => x.body !== 'Not known').length} bodies <span className="chev" style={{ transform: open ? 'rotate(180deg)' : undefined }}>▾</span></span></Button>
    {open && <div className="cvw">{bodies.map(x => { const chip = ccBodyChip(x.body, x.live); return <div className="cv" key={x.body}><span className={`n${x.body === 'Not known' ? ' mu' : ''}`}>{x.body === 'Not known' ? 'No body named' : x.body}{chip && <span className={`chip${x.live ? ' live' : ''}`}>{chip}</span>}</span><span className="f">{x.live ? <><b>{num(x.connected)}</b> / {num(x.members)}</> : <b>{num(x.members)}</b>}</span><span className="coverage-bar"><i style={{ width: `${x.members / max * 100}%`, background: 'var(--cc3-members-bar)' }} />{x.connected > 0 && <i style={{ width: `${x.connected / max * 100}%`, background: t.ok }} />}</span></div>; })}</div>}
  </Panel>;
}
function Moat({ data: d, days }: { data: CommandCentreV2['moat']; days: CommandCentreDays }) {
  const tiles = [
    { label: 'Rounds', value: d.rounds_total, added: d.rounds_window, series: [], foot: days === 7 ? null : 'by week', to: analytics() },
    { label: 'Holes', value: d.holes_total, added: d.holes_window, series: d.holes_series, foot: 'holes logged', to: analytics() },
    { label: 'Courses measured', value: d.courses_measured, added: 0, series: d.measured_series, foot: '10+ rounds each', to: '/admin-v2/content?section=courses' },
    { label: 'Reviews', value: d.reviews_total, added: d.reviews_window, series: d.reviews_series, foot: 'course reviews', to: analytics() },
  ];
  return <Panel title="The moat" meta={`all time · +${days}D`}><div className="m4">{tiles.map(tile => <Link key={tile.label} className="mt" to={tile.to}><div className="lh"><Label>{tile.label}</Label><Go /></div><div className="top"><span className="v">{num(tile.value)}</span>{tile.label === 'Courses measured' ? <span className="r fa">of {num(d.courses_played)}</span> : tile.added > 0 && <span className="r up">+{num(tile.added)}</span>}</div><div className="sv">{tile.label === 'Rounds' ? <div className="bars">{d.rounds_buckets.map((x, i) => <i className={i === d.rounds_buckets.length - 1 ? 'on' : ''} key={x.from} style={{ height: x.n === 0 ? '2px' : `${x.n / Math.max(1, ...d.rounds_buckets.map(b => b.n)) * 100}%` }} />)}</div> : <Spark data={tile.series} stepped={tile.label === 'Holes'} />}</div><div className="dl">{tile.label === 'Rounds' && days === 7 ? d.rounds_buckets.map((x, i) => <span key={x.from} style={{ color: i === d.rounds_buckets.length - 1 ? t.ink : FAINT }}>{new Date(x.from).toLocaleDateString('en-GB', { weekday: 'short' }).slice(0, 1)}</span>) : <span className="l">{tile.foot}</span>}</div></Link>)}</div></Panel>;
}
function Clubs({ data: d }: { data: CommandCentreV2['clubs'] }) {
  return <Panel title="Clubs" meta="revenue switches on in December" list><div className="f2"><div><Label>Clubs with members</Label><div className="fv">{num(d.clubs_with_members)}</div><div className="fs">{num(d.profiles)} with a profile</div></div><div><Label>Members at a club</Label><div className="fv">{ccShare(d.members_at_club, d.members)}%</div><div className="fs">{num(d.members_at_club)} members</div></div></div><div className="th"><span>Club</span><span>Mem</span><span>Con</span><span>Rds</span><span /></div>{d.top.slice(0, 6).map(x => <div className="tr2" key={x.name}><span className="n">{x.name}</span>{[x.members, x.connected, x.rounds].map((n, i) => <span key={i} className={`x${n === 0 ? ' z' : ''}`}>{num(n)}</span>)}{x.has_profile ? <span className="onn">✓ ON</span> : <Button variant="ghost" asChild className="pt"><Link to={`/admin-v2/content?section=courses&q=${encodeURIComponent(x.name)}`}>PITCH</Link></Button>}</div>)}</Panel>;
}
function Clubhouse({ data: d, days }: { data: CommandCentreV2['clubhouse']; days: CommandCentreDays }) {
  const stats = [
    { label: 'Posts', value: d.posts, sub: <Delta now={d.posts} prev={d.posts_prev} /> },
    { label: 'Reactions', value: d.reactions, sub: `${(d.posts ? d.reactions / d.posts : 0).toFixed(1)} a post` },
    { label: 'Reviews', value: d.reviews, sub: <Delta now={d.reviews} prev={d.reviews_prev} /> },
    { label: 'Video', value: d.video_posts, sub: d.posts ? `${ccShare(d.video_posts, d.posts)}% of posts` : '—' },
  ];
  return <Panel title="Clubhouse" meta={`${days}D`} list><div className="f4">{stats.map(x => <Link key={x.label} to={analytics()}><Label>{x.label}</Label><div className="fv">{num(x.value)}</div><div className="fs">{x.sub}</div></Link>)}</div>{d.top.slice(0, 4).map(x => <Link key={x.post_id} className="post" to={`/post/${x.post_id}`}><Squircle name={x.name} size={28} /><div><div className="n">{x.name}</div><div className="s">{x.kind}{x.course ? ` · ${x.course}` : ''}{x.gross != null && <> · {x.gross}{x.to_par != null && <> <span style={{ color: x.to_par < 0 ? UNDER_PAR : FAINT, fontWeight: 700 }} data-cc-to-par data-tone={x.to_par < 0 ? 'under' : 'level'}>{x.to_par === 0 ? 'E' : `${x.to_par > 0 ? '+' : '−'}${Math.abs(x.to_par)}`}</span></>}</>}</div></div><span className="e"><b>{num(x.likes)}</b> · {num(x.comments)}</span></Link>)}<div className="sec"><Label>Featured creators</Label><span className="me">posts · reactions</span></div><div className="cr">{d.creators.map(x => <span className="creator" key={x.name} style={{ background: INSET }}><Squircle name={x.name} size={20} /><span>{x.name}</span><em className={x.posts === 0 ? 'dn' : ''}>{x.posts} · {x.reactions}</em></span>)}</div></Panel>;
}
function Retention({ data: d }: { data: CommandCentreV2['retention'] }) {
  const r = useRetention(56), c = !r.isError ? r.data?.cohort : undefined;
  return <Panel title="Retention" meta="came back within"><div className="r4">{(['d1', 'd7'] as const).map(k => <div key={k}><Label>{k === 'd1' ? '1 day' : '7 days'}</Label><Body height={37} loading={r.isLoading} failed={!c}>{() => c && <><div className={`fv${c[`${k}_eligible`] === 0 ? ' fa' : ''}`}>{c[`${k}_eligible`] === 0 ? '—' : `${ccShare(c[`${k}_returned`], c[`${k}_eligible`])}%`}</div><div className="fs">of joiners</div></>}</Body></div>)}{[{ label: '30 · conn.', n: d.d30_connected_n, returned: d.d30_connected_returned }, { label: '30 · not', n: d.d30_not_n, returned: d.d30_not_returned }].map(x => <div key={x.label}><Label>{x.label}</Label><div className={`fv${x.n < 5 ? ' fa' : ''}`}>{x.n < 5 ? '—' : `${ccShare(x.returned, x.n)}%`}</div><div className="fs">{x.n < 5 ? `${x.n} so far` : `${x.returned} of ${x.n}`}</div></div>)}</div><div className="grid"><span /><span className="h">N</span>{[0, 1, 2, 3, 4].map(i => <span className="h" key={i}>W{i}</span>)}{d.cohorts.map(x => <React.Fragment key={x.week_start}><span className="w">{new Date(x.week_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span><span className="nn">{x.n}</span>{[0, 1, 2, 3, 4].map(i => { const v = x.cells[i]; const empty = v == null || x.n === 0; return <span key={i} className={`cl${empty ? ' e' : ''}`} style={empty ? undefined : { background: `color-mix(in srgb, var(--cc3-ink) ${(0.05 + v / 100 * 0.55) * 100}%, transparent)`, color: v > 60 ? t.canvas : t.ink }}>{empty ? null : v}</span>; })}</React.Fragment>)}</div></Panel>;
}
export default function DashboardPage() {
  const [days, setDays] = useState<CommandCentreDays>(7), qc = useQueryClient();
  useEffect(() => { const handler = () => qc.invalidateQueries({ queryKey: ['admin-v2'] }); window.addEventListener('admin-v2:refetch', handler); return () => window.removeEventListener('admin-v2:refetch', handler); }, [qc]);
  const cc = useCommandCentreV2(days), engine = useCcEngine(days);
  const data = !cc.isLoading && !cc.isError ? cc.data : undefined, e = !engine.isLoading && !engine.isError ? engine.data : undefined;
  return <div className="admin-cc-v3" style={PAGE_TOKENS}><div className="ctl"><div className="seg" role="tablist" aria-label="Window">{([7, 28, 90] as const).map(d => <Button variant="ghost" role="tab" aria-selected={days === d} className={days === d ? 'on' : ''} key={d} onClick={() => setDays(d)}>{d}D</Button>)}</div><span className="upd">{data && `updated ${new Date(data.computed_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`}</span></div><StatusLine /><TopRow data={data} engine={e} days={days} loading={cc.isLoading} engineLoading={engine.isLoading} />
    {data ? <RightNow hours={data.hours} /> : <EmptyPanel title="Right now" height={177} loading={cc.isLoading} />}
    {data ? <DoNow data={data.do_now} /> : <EmptyPanel title="Do now" height={160} loading={cc.isLoading} list />}
    {e ? <Engine data={e} days={days} /> : <EmptyPanel title="The engine" height={230} loading={engine.isLoading} />}
    {data ? <Loop data={data.loop} coverage={data.coverage} /> : <EmptyPanel title="The loop" height={251} loading={cc.isLoading} />}
    {data ? <Moat data={data.moat} days={days} /> : <EmptyPanel title="The moat" height={230} loading={cc.isLoading} />}
    {data ? <Clubs data={data.clubs} /> : <EmptyPanel title="Clubs" height={327} loading={cc.isLoading} list />}
    {data ? <Clubhouse data={data.clubhouse} days={days} /> : <EmptyPanel title="Clubhouse" height={338} loading={cc.isLoading} list />}
    {data ? <Retention data={data.retention} /> : <EmptyPanel title="Retention" height={242} loading={cc.isLoading} />}
  </div>;
}
