/** Members v3 uses the existing overview and catalogue only. Lifecycle and
 * eligibility require complete membership; legacy linked filters retain their
 * existing reader. Pure lifecycle/ordering rules live in membersLifecycle. */
import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { DORMANT_FILL, INK_30, INK_55, WEEK_OFF, WEEK_PREJOIN } from '../lib/panels';
import { formatAgo } from '../lib/formatAgo';
import { memberIndexText } from '../lib/memberRadarRules';
import { londonDate } from '../lib/memberRadarDisplay';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import type { MembersOverview, MembersOverviewMember } from '../hooks/useMembersRadar';
import { useEgIssueUserIds } from '../hooks/useUsers';
import { Button } from '@/components/ui/button';
import { ProLabel } from '@/features/pro-verification/ProLabel';
import { useProMembers } from '@/features/pro-verification/useProMembers';
import { useAmateurMembers } from '@/features/amateur-ranking/useAmateurMembers';
import type { ProMember } from '@/features/pro-verification/proMembersCache';
import { useAdminVerified, adminVerifiedCount } from '../hooks/useAdminVerified';
import { AdminVerifiedCard } from './AdminVerifiedCard';
import { CC3, NUM, PANEL3, LIST3, PANEL_TITLE, PANEL_META } from './InboxPanels';
import { ccDelta } from '../pages/cc3Rules';
import { completeMembership, membersLifecycle, lifecycleSummary, memberActivity, toConnect, resolveMemberSort, sortMembers, memberTags, memberSubline as lifecycleSubline, lastSeenColor as lifecycleLastSeenColor, type LifecycleWeek, type MemberSort } from '../lib/membersLifecycle';

const PAGE = 25;
const DAY = 86_400_000;
const DASH = '—';
export type ChipFilter = 'all' | 'verified' | 'connected' | 'to_connect' | 'no_handicap' | 'quiet' | 'new_this_week';
const CHIP_FILTERS: ChipFilter[] = ['all', 'verified', 'connected', 'to_connect', 'no_handicap', 'quiet', 'new_this_week'];
const LEGACY_TO_ALL = new Set(['unverified', 'new_today']);
/** Filters linked from elsewhere: no chip, label shown as the list header. */
const LINKED_FILTERS: Record<string, { label: string; test: (m: MembersOverviewMember, eg: ReadonlySet<string>, now: number) => boolean }> = {
  active_24h:    { label: 'Active 24h',            test: (m, _e, now) => !!m.last_seen_at && now - new Date(m.last_seen_at).getTime() < DAY },
  dormant_14d:   { label: 'Dormant 14d+',          test: (m, _e, now) => !m.last_seen_at || now - new Date(m.last_seen_at).getTime() >= 14 * DAY },
  eg_issues:     { label: 'EG issues',             test: (m, eg) => eg.has(m.user_id) },
  suspended:     { label: 'Suspended',             test: m => m.is_suspended },
  verified:      { label: 'Verified',              test: m => m.is_verified },
  admin:         { label: 'Admins',                test: m => !!m.admin_role },
  not_connected: { label: 'No handicap connected', test: m => !m.connected },
};
const CHIP_TEST: Record<ChipFilter, (m: MembersOverviewMember, proIds: ReadonlySet<string>, now: number) => boolean> = {
  all: () => true, verified: () => false, connected: m => m.connected,
  to_connect: toConnect, no_handicap: m => !m.connected,
  quiet: m => m.is_quiet, new_this_week: m => m.is_new,
};
const CHIP_HEADER: Record<ChipFilter, string> = {
  all: 'All members', verified: 'Verified', connected: 'Connected', to_connect: 'To connect', no_handicap: 'No handicap', quiet: 'Quiet', new_this_week: 'New',
};
const MINI: React.CSSProperties = { fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: CC3.faint };
const FIG: React.CSSProperties = { ...NUM, fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 };
const CAP: React.CSSProperties = { ...NUM, fontSize: 10.5, fontWeight: 600, color: CC3.faint, marginTop: 1, overflowWrap: 'anywhere' };
const PULSE: React.CSSProperties = { animation: 'admin-pulse 1.4s ease-in-out infinite' };
const TAG: React.CSSProperties = { fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' };
const TONES = { role: CC3.mute, good: CC3.good, bad: CC3.bad, faint: CC3.faint, ink: CC3.ink };
const HEADER: React.CSSProperties = { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 };
const rowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '34px minmax(0,1fr) auto', columnGap: 10, alignItems: 'center', padding: '10px 14px', borderTop: `1px solid ${CC3.hair}` };
const SORT_LABEL: Record<MemberSort, string> = { seen: 'Seen', joined: 'Joined', index: 'Index', rounds: 'Rounds' };
const SORT_CAP: Record<MemberSort, string> = { seen: 'most recent first', joined: 'newest first', index: 'lowest first', rounds: 'most first' };

export function resolveListFilter(raw: string | null): { chip: ChipFilter | null; linked: string | null } {
  if (!raw || LEGACY_TO_ALL.has(raw)) return { chip: 'all', linked: null };
  if (raw === 'not_connected') return { chip: null, linked: raw };
  if ((CHIP_FILTERS as string[]).includes(raw)) return { chip: raw as ChipFilter, linked: null };
  if (LINKED_FILTERS[raw]) return { chip: null, linked: raw };
  return { chip: 'all', linked: null };
}

export { memberTags } from '../lib/membersLifecycle';
export function memberSubline(m: MembersOverviewMember, pro?: ProMember, chip?: ChipFilter | null, now = Date.now()) {
  return lifecycleSubline(m, pro, chip, now);
}
export function lastSeenColor(m: MembersOverviewMember, now = Date.now()) {
  return lifecycleLastSeenColor(m, now);
}

/** weeks_8[0] is 7 weeks ago. The overview's weeks_8 buckets are 7-day steps
 * counted back from now, so week ends computed from now line up with them.
 * A week that ended before the member joined is pre-join. */
export function weekDashColors(m: MembersOverviewMember, now = Date.now()): string[] {
  const joined = new Date(m.created_at).getTime();
  return m.weeks_8.map((active, i) => {
    const weekEnd = now - (7 - i) * 7 * DAY;
    if (weekEnd <= joined) return WEEK_PREJOIN;
    return active ? CC3.ink : WEEK_OFF;
  });
}


function Stats({ children, columns }: { children: React.ReactNode; columns: number }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))`, gap: 8, marginTop: 12, paddingTop: 11, borderTop: `1px solid ${CC3.hair}` }}>{children}</div>;
}
function Stat({ label, value, caption, tone = 'ink', loading }: { label: string; value: React.ReactNode; caption: React.ReactNode; tone?: keyof typeof TONES; loading?: boolean }) {
  return <div data-stat={label} style={{ minWidth: 0 }}>
    <div style={MINI}>{label}</div>
    <div data-figure data-tone={tone} style={{ ...FIG, marginTop: 3, color: TONES[tone], ...(loading ? PULSE : {}) }}>{loading ? DASH : value}</div>
    <div style={CAP}>{loading ? '\u00a0' : caption}</div>
  </div>;
}
function LastSeenPanel({ o, weeks, complete }: { o: MembersOverview | undefined; weeks: LifecycleWeek[]; complete: boolean }) {
  const r = o?.recency;
  const total = o?.total ?? 0;
  const latest = weeks[6];
  const delta = ccDelta(latest?.active ?? 0, latest?.previous ?? 0);
  const values = [r?.d1, r?.d7, r?.d14, r?.d30, r?.older];
  const colors = [CC3.good, CC3.ink, INK_55, INK_30, DORMANT_FILL];
  return <section style={PANEL3} aria-label="Last seen">
    <div style={HEADER}><span style={PANEL_TITLE}>Last seen</span><span style={PANEL_META}><b style={{ ...NUM, color: CC3.ink, fontWeight: 700 }}>{o ? total : DASH}</b> members</span></div>
    <div style={{ display: 'flex', marginTop: 12, height: 12, gap: 2, borderRadius: 4, overflow: 'hidden' }}>
      {values.map((n, i) => <div key={i} style={{ width: total && n != null ? `${n / total * 100}%` : 0, background: colors[i] }} />)}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 4, marginTop: 10 }}>
      {['24h', '7d', '14d', '30d', '30d+'].map((label, i) => <div key={label}><div style={{ ...FIG, color: i === 0 ? CC3.good : i === 4 ? CC3.bad : CC3.ink, ...(!o ? PULSE : {}) }}>{values[i] ?? DASH}</div><div style={{ ...MINI, marginTop: 2 }}>{label}</div></div>)}
    </div>
    <Stats columns={3}>
      <Stat label="Connected" value={o?.connected ?? DASH} loading={!o} caption={`${total ? Math.round((o?.connected ?? 0) / total * 100) : 0}% of members`} />
      <Stat label="Active 7d" value={complete ? latest?.active ?? 0 : DASH} loading={!o} caption={!complete ? 'incomplete data' : <><span data-tone={delta.tone} style={{ color: delta.tone === 'up' ? CC3.good : delta.tone === 'dn' ? CC3.bad : CC3.mute }}>{delta.text}</span> vs {latest?.previous ?? 0}</>} />
      <Stat label="Gone quiet" value={o?.quiet ?? DASH} loading={!o} tone={(o?.quiet ?? 0) > 0 ? 'bad' : 'ink'} caption="were weekly" />
    </Stats>
  </section>;
}
function LifecyclePanel({ weeks, complete, loading }: { weeks: LifecycleWeek[]; complete: boolean; loading: boolean }) {
  const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: 6 };
  const latest = weeks[6];
  const summary = latest ? lifecycleSummary(latest) : null;
  const maxUp = Math.max(0, ...weeks.map(w => w.active));
  const maxLost = Math.max(0, ...weeks.map(w => w.lost));
  const px = (value: number, max: number, height: number) => complete && value > 0 && max > 0 ? Math.max(2, value / max * height) : 0;
  const date = (w: LifecycleWeek) => londonDate(new Date(w.start).toISOString(), { day: 'numeric', month: 'short' });
  const caption = (text: React.ReactNode) => complete ? text : 'incomplete data';
  return <section style={PANEL3} aria-label="Lifecycle">
    <div style={HEADER}><span style={PANEL_TITLE}>Lifecycle</span><span style={{ ...PANEL_META, display: 'inline-flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 9 }}>
      {(['new', 'back', 'kept', 'lost'] as const).map((label, i) => <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><i style={{ width: 8, height: 8, borderRadius: 2, background: [CC3.good, CC3.ink, INK_30, CC3.bad][i] }} />{label}</span>)}
    </span></div>
    <div style={{ marginTop: 12 }}>
      <div style={{ ...grid, height: 56, alignItems: 'end' }}>{weeks.map(w => <div key={w.start} title={complete ? `${date(w)}: ${w.new} new, ${w.back} back, ${w.kept} kept` : undefined} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', borderRadius: '3px 3px 0 0', overflow: 'hidden' }}>
        {([['new', CC3.good], ['back', CC3.ink], ['kept', INK_30]] as const).map(([key, color]) => <i key={key} style={{ display: 'block', width: '100%', height: px(w[key], maxUp, 56), background: color }} />)}
      </div>)}</div>
      <div style={{ height: 1, background: CC3.line, margin: '2px 0' }} />
      <div style={{ ...grid, height: 20, alignItems: 'start' }}>{weeks.map(w => <i key={w.start} title={complete ? `${date(w)}: ${w.lost} lost` : undefined} style={{ display: 'block', height: px(w.lost, maxLost, 20), background: CC3.bad, borderRadius: '0 0 3px 3px' }} />)}</div>
      <div style={{ ...grid, marginTop: 5 }}>{weeks.map((w, i) => <span key={w.start} style={{ ...NUM, fontSize: 10, fontWeight: 600, color: i === 6 ? CC3.ink : CC3.faint, textAlign: 'center', whiteSpace: 'nowrap' }}>{i === 6 ? 'now' : i % 2 === 0 ? date(w) : ''}</span>)}</div>
    </div>
    <Stats columns={4}>
      <Stat label="New" value={complete ? latest?.new ?? 0 : DASH} loading={loading} tone={complete && (latest?.new ?? 0) > 0 ? 'good' : 'ink'} caption={caption('joined')} />
      <Stat label="Back" value={complete ? latest?.back ?? 0 : DASH} loading={loading} caption={caption('after a gap')} />
      <Stat label="Kept" value={complete ? summary?.keptPercent : DASH} loading={loading} caption={caption(summary?.keptCaption)} />
      <Stat label="Lost" value={complete ? latest?.lost ?? 0 : DASH} loading={loading} tone={complete && (latest?.lost ?? 0) > 0 ? 'bad' : 'ink'} caption={caption(summary?.lostCaption)} />
    </Stats>
  </section>;
}
function Chips({ o, verifiedCount, toConnectCount, active, onPick, loading }: { o: MembersOverview | undefined; verifiedCount: number | undefined; toConnectCount: number | undefined; active: ChipFilter | null; onPick: (f: ChipFilter) => void; loading: boolean }) {
  const chips = [
    { id: 'all', label: 'All', n: o?.total }, { id: 'verified', label: 'Verified', n: verifiedCount },
    { id: 'connected', label: 'Connected', n: o?.connected }, { id: 'to_connect', label: 'To connect', n: toConnectCount },
    { id: 'no_handicap', label: 'No handicap', n: o?.no_handicap }, { id: 'quiet', label: 'Quiet', n: o?.quiet }, { id: 'new_this_week', label: 'New', n: o?.new_7d },
  ] as const;
  return <div data-member-chips style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{chips.map(c => {
    const on = active === c.id;
    return <Button key={c.id} variant={null} size={null} type="button" aria-pressed={on} onClick={() => onPick(c.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 28, padding: '0 11px', borderRadius: 999, border: 'none', fontSize: 11.5, fontWeight: 600, background: on ? CC3.ink : CC3.surface, color: on ? CC3.canvas : CC3.mute, whiteSpace: 'nowrap', ...(loading ? PULSE : {}) }}>
      {c.label} <span style={{ ...NUM, fontWeight: 700, color: on ? CC3.canvas : CC3.ink }}>{loading ? DASH : c.n ?? DASH}</span>
    </Button>;
  })}</div>;
}
function MemberRow({ m, pro, amateur, chip, now, onOpen }: { m: MembersOverviewMember; pro?: ProMember; amateur?: boolean; chip: ChipFilter | null; now: number; onOpen: () => void }) {
  const name = m.display_name ?? m.username ?? 'Member';
  const seenColor = lastSeenColor(m, now);
  const seenTone = seenColor === CC3.good ? 'good' : seenColor === CC3.bad ? 'bad' : seenColor === CC3.ink ? 'ink' : 'faint';
  return <Button variant={null} size={null} type="button" onClick={onOpen} data-member-id={m.user_id} style={{ ...rowStyle, ...NUM, width: '100%', height: 'auto', borderRadius: 0, textAlign: 'left', background: 'transparent', borderLeft: 'none', borderRight: 'none', borderBottom: 'none', color: CC3.ink, whiteSpace: 'normal' }}>
    <SquircleAvatar size={34} src={m.photo_url} alt={name} userId={m.user_id} hairlineRing />
    <span style={{ minWidth: 0 }}><span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 6, rowGap: 2 }}>
      <span style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.25, overflowWrap: 'anywhere' }}>{name}</span>
      {pro && <ProLabel size="small" />}{!pro && amateur && <ProLabel size="small" kind="am" />}
      {memberTags(m, pro, chip).map(tag => <span key={tag.label} data-tone={tag.tone} style={{ ...TAG, color: TONES[tag.tone], ...(tag.tone === 'role' ? { padding: '1px 5px', borderRadius: 5, border: `1px solid ${CC3.line}` } : {}) }}>{tag.label}</span>)}
    </span><span style={{ display: 'block', fontSize: 11, color: CC3.faint, marginTop: 2, lineHeight: 1.35, overflowWrap: 'anywhere' }}>{memberSubline(m, pro, chip, now)}</span>
      <span style={{ display: 'flex', gap: 3, marginTop: 5 }}>{weekDashColors(m, now).map((c, i) => <i key={i} style={{ width: 14, height: 4, borderRadius: 2, background: c }} />)}</span>
    </span>
    <span style={{ textAlign: 'right' }}><span style={{ display: 'block', ...NUM, fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', color: m.connected || pro ? CC3.ink : CC3.faint }}>{pro ? 'PRO' : memberIndexText(m.index, m.connected).replace(/^-/, '−')}</span><span data-tone={seenTone} style={{ display: 'block', ...NUM, fontSize: 10.5, fontWeight: 700, whiteSpace: 'nowrap', marginTop: 2, color: seenColor }}>{formatAgo(m.last_seen_at, { now })}</span></span>
  </Button>;
}
function RowSkeleton() {
  const block = (width: number | string, height: number, radius = 3): React.CSSProperties => ({ width, height, borderRadius: radius, background: CC3.inset, ...PULSE });
  return <div style={rowStyle}><i style={block(34, 34, 12)} /><span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><i style={block('60%', 17)} /><i style={block('80%', 14)} /><i style={block(133, 4, 2)} /></span><span style={{ width: 36, display: 'flex', flexDirection: 'column', gap: 4 }}><i style={block(36, 19)} /><i style={block(36, 13)} /></span></div>;
}
export default function MembersList({ overview, loading, onOpenMember }: { overview: MembersOverview | undefined; loading: boolean; onOpenMember: (id: string) => void }) {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [shown, setShown] = useState(PAGE);
  const { chip, linked } = resolveListFilter(params.get('filter'));
  const sort = resolveMemberSort(params.get('sort'));
  const eg = useEgIssueUserIds(linked === 'eg_issues');
  const verified = useAdminVerified();
  const egSet = useMemo(() => new Set(eg.data ?? []), [eg.data]);
  const proIds = useMemo(() => new Set((verified.data?.pros ?? []).map(p => p.id)), [verified.data]);
  const now = Date.now();
  const complete = !loading && completeMembership(overview);
  const weeks = membersLifecycle(complete ? overview?.members ?? [] : [], now);
  const catalogueReady = !!verified.data && !verified.isPending && !verified.isError;
  const toConnectCount = complete && catalogueReady ? (overview?.members ?? []).filter(m => toConnect(m, proIds, now)).length : undefined;
  const pick = (f: ChipFilter) => {
    const next = new URLSearchParams(params);
    if (f === 'all' || f === chip) next.delete('filter'); else next.set('filter', f);
    setParams(next, { replace: true }); setShown(PAGE);
  };
  const rows = sortMembers((overview?.members ?? []).filter(m => {
    if (chip === 'to_connect' && !catalogueReady) return false;
    if (chip && !CHIP_TEST[chip](m, proIds, now)) return false;
    if (linked && !LINKED_FILTERS[linked].test(m, egSet, now)) return false;
    const term = search.trim().toLowerCase();
    return !term || [m.display_name, m.username, m.home_club, m.email].some(v => v?.toLowerCase().includes(term));
  }), sort, now);
  const header = linked ? LINKED_FILTERS[linked].label : CHIP_HEADER[chip ?? 'all'];
  const { members: pros } = useProMembers(chip === 'verified' ? [] : rows.slice(0, shown).map(m => m.user_id));
  const { members: amateurs } = useAmateurMembers(chip === 'verified' ? [] : rows.slice(0, shown).map(m => m.user_id));
  const more = rows.length - shown;
  return <>
    <style>{`.members-v3-search::placeholder{color:var(--cc3-faint)}.members-v3-search::-webkit-search-cancel-button{-webkit-appearance:none;appearance:none}`}</style>
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, height: 40, padding: '0 12px', borderRadius: 12, background: CC3.surface }}>
      <Search size={15} strokeWidth={1.5} color={CC3.faint} aria-hidden />
      <input type="search" className="members-v3-search" value={search} onChange={e => { setSearch(e.target.value); setShown(PAGE); if (chip === 'verified') { const next = new URLSearchParams(params); next.delete('filter'); setParams(next, { replace: true }); } }} placeholder="Name, @handle, email or club" aria-label="Search members" style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: CC3.ink }} />
    </label>
    <LastSeenPanel o={loading ? undefined : overview} weeks={weeks} complete={complete} />
    <LifecyclePanel weeks={weeks} complete={complete} loading={loading} />
    <Chips o={overview} verifiedCount={adminVerifiedCount(verified.data)} toConnectCount={toConnectCount} active={chip} onPick={pick} loading={loading} />
    {chip === 'to_connect' && !loading && toConnectCount == null && <span style={CAP}>{!complete ? 'incomplete data' : DASH}</span>}
    {chip === 'verified' ? <AdminVerifiedCard data={verified.data} loading={verified.isPending} error={verified.isError} onOpenMember={onOpenMember} /> : <section style={LIST3} aria-label="Members list">
      <div style={{ ...HEADER, padding: '0 14px', marginBottom: 12 }}><span style={PANEL_TITLE}>{header}</span><span style={PANEL_META}>8 wks · index · seen</span></div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '6px 8px', padding: '0 14px', margin: '-2px 0 10px' }}>
        <div role="group" aria-label="Sort members" style={{ display: 'inline-flex', background: CC3.inset, borderRadius: 999, padding: 3 }}>{(Object.keys(SORT_LABEL) as MemberSort[]).map(k => <Button variant={null} size={null} key={k} aria-pressed={sort === k} onClick={() => { const next = new URLSearchParams(params); if (k === 'seen') next.delete('sort'); else next.set('sort', k); setParams(next, { replace: true }); setShown(PAGE); }} style={{ height: 24, padding: '0 10px', borderRadius: 999, border: 'none', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', background: sort === k ? CC3.ink : 'transparent', color: sort === k ? CC3.canvas : CC3.faint }}>{SORT_LABEL[k]}</Button>)}</div>
        <span style={PANEL_META}>{SORT_CAP[sort]}</span>
      </div>
      {loading ? Array.from({ length: 5 }, (_, i) => <RowSkeleton key={i} />) : rows.length === 0 ? <div style={{ padding: '24px 14px 26px', textAlign: 'center', borderTop: `1px solid ${CC3.hair}` }}><div style={{ fontSize: 13, fontWeight: 600, color: CC3.ink }}>No members match</div><div style={{ fontSize: 11, color: CC3.faint, marginTop: 2 }}>try a name, @handle or club</div></div> : <>
        {rows.slice(0, shown).map(m => <MemberRow key={m.user_id} m={m} pro={pros.get(m.user_id)} amateur={amateurs.has(m.user_id)} chip={chip} now={now} onOpen={() => onOpenMember(m.user_id)} />)}
        {more > 0 && <Button variant={null} size={null} type="button" onClick={() => setShown(s => s + PAGE)} style={{ width: '100%', height: 40, borderRadius: 0, borderTop: `1px solid ${CC3.hair}`, background: 'transparent', ...NUM, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: CC3.faint }}>{more} more</Button>}
      </>}
    </section>}
  </>;
}
