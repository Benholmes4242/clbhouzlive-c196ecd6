/**
 * BRIEF_MEMBERS_LIST_REBUILD — the Members list, built to Main.html.
 * Every figure comes from get_admin_members_overview (useMembersOverview).
 * The one exception is the legacy ?filter=eg_issues deep link, which the
 * overview has no flag for (see useEgIssueUserIds).
 */
import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { adminTheme as t } from '../theme';
import { DORMANT_FILL, INK_30, INK_55, WEEK_OFF, WEEK_PREJOIN } from '../lib/panels';
import { Skeleton } from '../lib/chartPrimitives';
import { formatAgo } from '../lib/formatAgo';
import { memberIndexText } from '../lib/memberRadarRules';
import { londonDate } from '../lib/memberRadarDisplay';
import { getAvatarFallbackColor, getInitialsFromName } from '@/lib/avatarFallback';
import type { MembersOverview, MembersOverviewMember } from '../hooks/useMembersRadar';
import { useEgIssueUserIds } from '../hooks/useUsers';

const PAGE = 25;
const DAY = 86_400_000;

export type ChipFilter = 'all' | 'connected' | 'no_handicap' | 'quiet' | 'new_this_week';
const CHIP_FILTERS: ChipFilter[] = ['all', 'connected', 'no_handicap', 'quiet', 'new_this_week'];
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
const CHIP_TEST: Record<ChipFilter, (m: MembersOverviewMember) => boolean> = {
  all: () => true,
  connected: m => m.connected,
  no_handicap: m => !m.connected,
  quiet: m => m.is_quiet,
  new_this_week: m => m.is_new,
};
const CHIP_HEADER: Record<ChipFilter, string> = {
  all: 'All members', connected: 'Connected', no_handicap: 'No handicap', quiet: 'Quiet', new_this_week: 'New',
};

const PANEL_TITLE: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' };
const CAPTION: React.CSSProperties = { fontSize: 11, color: t.inkFaint };
const SMALL_LABEL: React.CSSProperties = { fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: t.inkFaint };
const TAG: React.CSSProperties = { flex: 'none', fontSize: 8.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' };
const ROLE_LABEL: Record<string, string> = { full: 'Full', limited: 'Limited', moderator: 'Moderator' };

export function resolveListFilter(raw: string | null): { chip: ChipFilter | null; linked: string | null } {
  if (!raw || LEGACY_TO_ALL.has(raw)) return { chip: 'all', linked: null };
  if (raw === 'not_connected') return { chip: null, linked: raw };
  if ((CHIP_FILTERS as string[]).includes(raw)) return { chip: raw as ChipFilter, linked: null };
  if (LINKED_FILTERS[raw]) return { chip: null, linked: raw };
  return { chip: 'all', linked: null };
}

export function memberTags(m: MembersOverviewMember): { label: string; color: string }[] {
  const tags: { label: string; color: string }[] = [];
  if (m.admin_role && ROLE_LABEL[m.admin_role]) tags.push({ label: ROLE_LABEL[m.admin_role], color: t.brandText });
  if (m.is_new) tags.push({ label: 'New', color: t.okText });
  if (m.is_quiet) tags.push({ label: 'Quiet', color: t.warnText });
  if (m.is_suspended) tags.push({ label: 'Suspended', color: t.dangerText });
  if (!m.connected) tags.push({ label: 'No hcp', color: t.inkFaint });
  return tags.slice(0, 2);
}

export function memberSubline(m: MembersOverviewMember): string {
  const handle = m.username ? `@${m.username}` : '—';
  if (m.is_quiet) return `was weekly · silent since ${londonDate(m.last_seen_at, { day: 'numeric', month: 'short' })}`;
  if (m.is_new) return `${m.home_club || 'no club'} · joined ${formatAgo(m.created_at, { suffix: true })}`;
  if (!m.home_club && m.rounds_total === 0) return `${handle} · no club`;
  return `${m.home_club || handle} · ${m.rounds_total} rds`;
}

export function lastSeenColor(m: MembersOverviewMember, now = Date.now()): string {
  if (!m.last_seen_at) return t.inkFaint;
  const age = now - new Date(m.last_seen_at).getTime();
  if (age < DAY) return t.okText;
  if (m.is_quiet) return t.warnText;
  if (age <= 7 * DAY) return t.ink;
  return t.inkFaint;
}

/** weeks_8[0] is 7 weeks ago. A week that ended before the member joined is pre-join. */
export function weekDashColors(m: MembersOverviewMember, now = Date.now()): string[] {
  const joined = new Date(m.created_at).getTime();
  return m.weeks_8.map((active, i) => {
    const weekEnd = now - (7 - i) * 7 * DAY;
    if (weekEnd <= joined) return WEEK_PREJOIN;
    return active ? t.ink : WEEK_OFF;
  });
}

function Avatar({ id, name, photo, size, radius, font }: { id: string; name: string | null; photo: string | null; size: number; radius: number; font: number }) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: getAvatarFallbackColor(id),
        display: 'grid',
        placeItems: 'center',
        fontSize: font,
        fontWeight: 700,
        overflow: 'hidden',
        color: t.ink,
      }}
    >
      {photo && !failed ? (
        <img src={photo} alt={name ?? ''} onError={() => setFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        getInitialsFromName(name)
      )}
    </span>
  );
}
export { Avatar as MembersAvatar };

function LastSeenPanel({ o }: { o: MembersOverview | undefined }) {
  const r = o?.recency;
  const total = o?.total ?? 0;
  const segs = r ? [
    { n: r.d1, c: t.ok }, { n: r.d7, c: t.ink }, { n: r.d14, c: INK_55 }, { n: r.d30, c: INK_30 }, { n: r.older, c: DORMANT_FILL },
  ] : [];
  const counts = r ? [
    { n: r.d1, l: '24h', c: t.okText }, { n: r.d7, l: '7d' }, { n: r.d14, l: '14d' }, { n: r.d30, l: '30d' }, { n: r.older, l: 'Over 30d', c: t.dangerText },
  ] : Array.from({ length: 5 }, () => ({ n: 0, l: '', c: undefined }));
  const pct = total ? Math.round(((o?.connected ?? 0) / total) * 100) : 0;
  const figure = (label: string, value: React.ReactNode, color?: string) => (
    <div>
      <div style={{ ...SMALL_LABEL, letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ marginTop: 2, fontSize: 18, fontWeight: 800, color }}>{o ? value : <Skeleton height={22} radius={3} />}</div>
    </div>
  );
  return (
    <div style={{ background: t.surface, borderRadius: 16, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={PANEL_TITLE}>Last seen</span>
        <span style={CAPTION}>
          <span style={{ color: t.ink, fontWeight: 700 }}>{o ? total : '—'}</span> members
        </span>
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 2, height: 14, borderRadius: 4, overflow: 'hidden' }}>
        {o ? segs.map((s, i) => (
          <div key={i} style={{ width: total ? `${(s.n / total) * 100}%` : 0, background: s.c }} />
        )) : <Skeleton height={14} radius={4} />}
      </div>
      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 4 }}>
        {counts.map((c, i) => (
          <div key={i}>
            <div style={{ fontSize: 17, fontWeight: 800, color: c.c }}>{o ? c.n : <Skeleton height={20} radius={3} />}</div>
            <div style={SMALL_LABEL}>{c.l || ['24h', '7d', '14d', '30d', 'Over 30d'][i]}</div>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: `1px solid ${t.hairline}`,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 8,
        }}
      >
        {figure('Connected', <>{o?.connected} <span style={{ fontSize: 11, fontWeight: 700, color: t.inkMuted }}>{pct}%</span></>)}
        {figure('New 7d', o?.new_7d)}
        {figure('Gone quiet', o?.quiet, t.warnText)}
      </div>
    </div>
  );
}

function Chips({ o, active, onPick }: { o: MembersOverview | undefined; active: ChipFilter | null; onPick: (f: ChipFilter) => void }) {
  const chips: { id: ChipFilter; label: string; n: number | undefined; c?: string }[] = [
    { id: 'all', label: 'All', n: o?.total },
    { id: 'connected', label: 'Connected', n: o?.connected },
    { id: 'no_handicap', label: 'No handicap', n: o?.no_handicap },
    { id: 'quiet', label: 'Quiet', n: o?.quiet, c: t.warnText },
    { id: 'new_this_week', label: 'New', n: o?.new_7d },
  ];
  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
      {chips.map(c => {
        const on = active === c.id;
        return (
          <button
            key={c.id}
            type="button"
            aria-pressed={on}
            onClick={() => onPick(c.id)}
            style={{
              flex: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 34,
              padding: '0 12px',
              borderRadius: 999,
              border: 'none',
              background: on ? t.ink : t.surface,
              color: on ? t.canvas : t.ink,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {c.label}
            <span style={{ fontWeight: 800, color: on ? undefined : c.c }}>{c.n ?? '—'}</span>
          </button>
        );
      })}
    </div>
  );
}

function MemberRow({ m, onOpen }: { m: MembersOverviewMember; onOpen: () => void }) {
  const name = m.display_name ?? m.username ?? 'Member';
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        width: '100%',
        textAlign: 'left',
        background: 'transparent',
        border: 'none',
        color: t.ink,
        cursor: 'pointer',
        display: 'grid',
        gridTemplateColumns: '38px minmax(0,1fr) auto',
        columnGap: 11,
        alignItems: 'center',
        padding: '11px 16px',
        borderTop: `1px solid ${t.hairline}`,
      }}
    >
      <Avatar id={m.user_id} name={name} photo={m.photo_url} size={38} radius={11} font={12} />
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {name}
          </span>
          {memberTags(m).map(tag => (
            <span key={tag.label} style={{ ...TAG, color: tag.color }}>{tag.label}</span>
          ))}
        </span>
        <span
          style={{
            display: 'block',
            marginTop: 1,
            fontSize: 11.5,
            color: t.inkMuted,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {memberSubline(m)}
        </span>
        <span style={{ marginTop: 5, display: 'flex', gap: 3 }}>
          {weekDashColors(m).map((c, i) => (
            <span key={i} style={{ width: 14, height: 4, borderRadius: 2, background: c }} />
          ))}
        </span>
      </span>
      <span style={{ textAlign: 'right' }}>
        <span style={{ display: 'block', fontSize: 16, fontWeight: 800, color: m.connected ? t.ink : t.inkFaint }}>
          {memberIndexText(m.index, m.connected)}
        </span>
        <span style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: lastSeenColor(m) }}>
          {formatAgo(m.last_seen_at)}
        </span>
      </span>
    </button>
  );
}

function RowSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '38px minmax(0,1fr) auto',
        columnGap: 11,
        alignItems: 'center',
        padding: '11px 16px',
        borderTop: `1px solid ${t.hairline}`,
      }}
    >
      <Skeleton height={38} radius={11} />
      <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Skeleton height={17} radius={3} />
        <Skeleton height={14} radius={3} />
        <Skeleton height={4} radius={2} />
      </span>
      <span style={{ width: 36, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Skeleton height={19} radius={3} />
        <Skeleton height={13} radius={3} />
      </span>
    </div>
  );
}

export default function MembersList({
  overview,
  loading,
  onOpenMember,
}: {
  overview: MembersOverview | undefined;
  loading: boolean;
  onOpenMember: (id: string) => void;
}) {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [shown, setShown] = useState(PAGE);
  const { chip, linked } = resolveListFilter(params.get('filter'));
  const eg = useEgIssueUserIds(linked === 'eg_issues');
  const egSet = useMemo(() => new Set(eg.data ?? []), [eg.data]);

  const pick = (f: ChipFilter) => {
    const next = new URLSearchParams(params);
    if (f === 'all') next.delete('filter');
    else next.set('filter', f);
    setParams(next, { replace: true });
    setShown(PAGE);
  };

  const rows = useMemo(() => {
    const now = Date.now();
    const term = search.trim().toLowerCase();
    return (overview?.members ?? []).filter(m => {
      if (chip && !CHIP_TEST[chip](m)) return false;
      if (linked && !LINKED_FILTERS[linked].test(m, egSet, now)) return false;
      if (!term) return true;
      return [m.display_name, m.username, m.home_club, m.email].some(v => v?.toLowerCase().includes(term));
    });
  }, [overview, chip, linked, egSet, search]);

  const header = linked ? LINKED_FILTERS[linked].label : CHIP_HEADER[chip ?? 'all'];
  const more = rows.length - shown;

  return (
    <>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          height: 44,
          padding: '0 14px',
          borderRadius: 12,
          background: t.surface,
        }}
      >
        <Search size={15} strokeWidth={1.5} color={t.inkFaint} aria-hidden />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setShown(PAGE); }}
          placeholder="Name, @handle, email or club"
          aria-label="Search members"
          style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: t.ink }}
        />
      </label>

      <LastSeenPanel o={loading ? undefined : overview} />

      {loading ? (
        <div style={{ display: 'flex', gap: 6 }}>
          {[64, 96, 108, 72, 64].map((w, i) => (
            <span key={i} style={{ flex: 'none', width: w }}><Skeleton height={34} radius={999} /></span>
          ))}
        </div>
      ) : (
        <Chips o={overview} active={chip} onPick={pick} />
      )}

      <div style={{ background: t.surface, borderRadius: 16, padding: '14px 0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 16px 10px' }}>
          <span style={PANEL_TITLE}>{header}</span>
          <span style={CAPTION}>8 wks · index · seen</span>
        </div>
        {loading ? (
          Array.from({ length: 5 }, (_, i) => <RowSkeleton key={i} />)
        ) : rows.length === 0 ? (
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${t.hairline}`, fontSize: 13, color: t.inkFaint }}>
            No members match
          </div>
        ) : (
          <>
            {rows.slice(0, shown).map(m => (
              <MemberRow key={m.user_id} m={m} onOpen={() => onOpenMember(m.user_id)} />
            ))}
            {more > 0 && (
              <button
                type="button"
                onClick={() => setShown(s => s + PAGE)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 44,
                  background: 'transparent',
                  border: 'none',
                  borderTop: `1px solid ${t.hairline}`,
                  fontSize: 11.5,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: t.inkMuted,
                  cursor: 'pointer',
                }}
              >
                {more} more
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}
