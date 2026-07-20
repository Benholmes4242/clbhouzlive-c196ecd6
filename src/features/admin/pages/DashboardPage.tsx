import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line,
} from 'recharts';
import {
  AlertTriangle, ChevronRight, Activity, Bell, Cpu,
  MessageSquare, UserPlus, Star, RefreshCcw, Radio,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { adminTheme as t } from '../theme';
import EmptyState from '../components/EmptyState';
import AdminErrorState from '../components/AdminErrorState';
import MetricCard from '../components/MetricCard';
import { useTriageCounts } from '../hooks/useTriageCounts';
import { useEchoEngineHealth } from '../hooks/useEchoEngineHealth';
import { usePushHealth } from '../hooks/usePushHealth';
import { useDashboard } from '../hooks/useDashboard';
import {
  useOverviewMetrics, useLiveInApp, useRightNowHourly, useActiveMembers28d, pctDelta,
} from '../hooks/useOverviewMetrics';
import {
  computeEchoChip, computePushChip, computeEgChip, computeCronChip,
  toneColor, type ChipState,
} from '../lib/healthChips';

const num = (n: number) => n.toLocaleString();
function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Clubhouse feed ───────────────────────────────────────────────────────────

type FeedKind = 'member' | 'post' | 'review';

interface FeedItem {
  id: string;
  kind: FeedKind;
  created_at: string;
  title: string;
  subtitle: string | null;
  avatarUrl: string | null;
  href: string;
}

async function fetchClubhouseFeed(): Promise<FeedItem[]> {
  const [members, posts, reviews] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('id, display_name, username, profile_photo_url, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('posts')
      .select('id, content, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('course_ratings')
      .select('id, created_at, user_id, course_id, review')
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  const postRows = (posts.data ?? []) as { id: string; content: string | null; created_at: string; user_id: string }[];
  const reviewRows = (reviews.data ?? []) as { id: string; created_at: string; user_id: string; course_id: string; review: string | null }[];
  const memberRows = (members.data ?? []) as { id: string; display_name: string | null; username: string | null; profile_photo_url: string | null; created_at: string }[];

  const profileIds = Array.from(new Set([
    ...postRows.map(r => r.user_id),
    ...reviewRows.map(r => r.user_id),
  ].filter(Boolean)));
  const courseIds = Array.from(new Set(reviewRows.map(r => r.course_id).filter(Boolean)));
  const emptyContentPostIds = postRows
    .filter(p => !((p.content ?? '').trim()))
    .map(p => p.id);

  const [profRes, courseRes, mediaRes] = await Promise.all([
    profileIds.length
      ? supabase.from('user_profiles').select('id, display_name, username, profile_photo_url').in('id', profileIds)
      : Promise.resolve({ data: [] } as { data: unknown[] }),
    courseIds.length
      ? supabase.from('golf_courses').select('id, name').in('id', courseIds)
      : Promise.resolve({ data: [] } as { data: unknown[] }),
    emptyContentPostIds.length
      ? supabase.from('post_media').select('post_id, media_type').in('post_id', emptyContentPostIds).limit(50)
      : Promise.resolve({ data: [] } as { data: unknown[] }),
  ]);
  type Prof = { id: string; display_name: string | null; username: string | null; profile_photo_url: string | null };
  const profMap = new Map<string, Prof>(((profRes.data ?? []) as Prof[]).map(p => [p.id, p]));
  const courseMap = new Map<string, { id: string; name: string }>(((courseRes.data ?? []) as { id: string; name: string }[]).map(c => [c.id, c]));
  const mediaMap = new Map<string, string>();
  for (const m of ((mediaRes.data ?? []) as { post_id: string; media_type: string }[])) {
    if (!mediaMap.has(m.post_id)) mediaMap.set(m.post_id, m.media_type);
  }

  const displayName = (p: Prof | undefined | null) => p?.display_name ?? p?.username ?? 'A member';
  const items: FeedItem[] = [];

  for (const m of memberRows) {
    const name = m.display_name ?? m.username ?? 'A member';
    items.push({
      id: `member:${m.id}`,
      kind: 'member',
      created_at: m.created_at,
      title: `New member: ${name}`,
      subtitle: null,
      avatarUrl: m.profile_photo_url,
      href: `/admin-v2/members?q=${encodeURIComponent(m.username ?? name)}`,
    });
  }
  for (const p of postRows) {
    const prof = profMap.get(p.user_id);
    const name = displayName(prof);
    const content = (p.content ?? '').trim();
    let subtitle: string | null = null;
    if (content) subtitle = content;
    else {
      const mt = mediaMap.get(p.id);
      if (mt === 'video') subtitle = 'Video post';
      else if (mt === 'image' || mt === 'photo') subtitle = 'Photo post';
    }
    items.push({
      id: `post:${p.id}`,
      kind: 'post',
      created_at: p.created_at,
      title: `Post from ${name}`,
      subtitle,
      avatarUrl: prof?.profile_photo_url ?? null,
      href: `/p/${p.id}`,
    });
  }
  for (const r of reviewRows) {
    const course = courseMap.get(r.course_id);
    const prof = profMap.get(r.user_id);
    items.push({
      id: `review:${r.id}`,
      kind: 'review',
      created_at: r.created_at,
      title: `Review: ${course?.name ?? 'a course'}`,
      subtitle: (r.review ?? '').trim() || `by ${displayName(prof)}`,
      avatarUrl: prof?.profile_photo_url ?? null,
      href: r.course_id ? `/course/${r.course_id}` : '/admin-v2/content?tab=courses',
    });
  }

  items.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return items.slice(0, 8);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const qc = useQueryClient();
  const triage = useTriageCounts();
  const echo = useEchoEngineHealth();
  const push = usePushHealth();
  const dashboard = useDashboard();
  const eg = dashboard.egSyncHealth;

  const overview = useOverviewMetrics();
  const live = useLiveInApp();
  const intraday = useRightNowHourly();
  const actives = useActiveMembers28d();

  const feed = useQuery({
    queryKey: ['admin-v2', 'dashboard', 'clubhouse-feed'],
    queryFn: fetchClubhouseFeed,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  useEffect(() => {
    const handler = () => qc.invalidateQueries({ queryKey: ['admin-v2'] });
    window.addEventListener('admin-v2:refetch', handler);
    return () => window.removeEventListener('admin-v2:refetch', handler);
  }, [qc]);

  const echoChip = useMemo(() => computeEchoChip(echo), [echo.isLoading, echo.isError, echo.data]);
  const pushChip = useMemo(() => computePushChip(push), [push.isLoading, push.isError, push.data]);
  const egChip = useMemo(() => computeEgChip(eg), [eg.isLoading, eg.isError, eg.data]);
  const cronChip = useMemo(() => computeCronChip(eg), [eg.isLoading, eg.isError, eg.data]);
  const nonOkChips = [echoChip, pushChip, egChip, cronChip].filter(c => c.tone !== 'ok' && c.tone !== 'idle').length;

  const m = overview.data;
  const loading = overview.isLoading;

  return (
    <div style={{ padding: '8px 16px 0', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720, margin: '0 auto' }}>
      <AlertBannerRow
        triage={triage.data}
        pushRed={push.data?.status === 'red'}
        nonOkChips={nonOkChips}
      />

      <RightNowStrip
        live={live.data ?? null}
        loading={live.isLoading}
        intraday={intraday.data ?? []}
        intradayLoading={intraday.isLoading}
      />

      <MetricGrid loading={loading} data={m} />

      <ActiveMembersChart
        data={actives.data ?? []}
        loading={actives.isLoading}
        isError={actives.isError}
        onRetry={() => actives.refetch()}
      />

      <LatestInClubhouse
        items={feed.data ?? []}
        loading={feed.isLoading}
        isError={feed.isError}
        onRetry={() => feed.refetch()}
      />

      <HealthChipStrip echoChip={echoChip} pushChip={pushChip} egChip={egChip} cronChip={cronChip} />

      <style>{`@keyframes admin-pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.55 } } @keyframes admin-pulse-dot { 0%,100% { opacity: 1 } 50% { opacity: 0.35 } }`}</style>
    </div>
  );
}

// ─── RIGHT NOW ────────────────────────────────────────────────────────────────

function RightNowStrip({
  live, loading, intraday, intradayLoading,
}: {
  live: number | null; loading: boolean;
  intraday: { hour: number; today: number | null; last: number | null }[];
  intradayLoading: boolean;
}) {
  return (
    <section
      style={{
        background: t.surface, border: `1px solid ${t.line}`,
        borderRadius: 22, boxShadow: t.shadowCard,
        padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span aria-hidden style={{
          width: 8, height: 8, borderRadius: 999, background: t.ok,
          animation: 'admin-pulse-dot 1.6s ease-in-out infinite', flexShrink: 0,
        }} />
        <span style={{ color: t.brandText, fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>
          Right now
        </span>
        <span style={{ flex: 1 }} />
        <Radio size={14} color={t.inkFaint} />
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{
          color: t.ink, fontSize: 32, fontWeight: 800, lineHeight: 1,
          fontFeatureSettings: '"tnum" 1', fontVariantNumeric: 'tabular-nums',
        }}>
          {loading || live === null ? '-' : num(live)}
        </span>
        <span style={{ color: t.inkMuted, fontSize: 13, fontWeight: 500 }}>
          member{(live ?? 0) === 1 ? '' : 's'} active in last 5 min
        </span>
      </div>

      <div style={{ height: 120, marginLeft: -8, marginRight: -8 }}>
        {intradayLoading ? (
          <div style={{ height: '100%', background: t.canvas, borderRadius: t.radius.md, animation: 'admin-pulse 1.4s ease-in-out infinite' }} />
        ) : intraday.length < 2 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: t.inkFaint, fontSize: 12 }}>
            Not enough data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={intraday} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke={t.line} vertical={false} />
              <XAxis dataKey="hour" stroke={t.inkFaint} fontSize={10} tickLine={false} axisLine={false}
                tickFormatter={(h: number) => `${h}h`} />
              <YAxis stroke={t.inkFaint} fontSize={10} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
              <Tooltip contentStyle={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 8, fontSize: 12, boxShadow: t.shadowPop }} />
              <Line type="monotone" dataKey="last" name="Last week" stroke={t.inkFaint} strokeWidth={1.5} strokeDasharray="3 3" dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="today" name="Today" stroke={t.brand} strokeWidth={2} dot={false} isAnimationActive={false} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

// ─── Metric grid ──────────────────────────────────────────────────────────────

function MetricGrid({ loading, data }: { loading: boolean; data: ReturnType<typeof useOverviewMetrics>['data'] }) {
  return (
    <section
      className="admin-v2-metric-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 10,
      }}
    >
      <MetricCard
        label="DAU"
        value={loading ? null : (data?.dau.current ?? 0)}
        delta={loading ? undefined : pctDelta(data?.dau.current ?? 0, data?.dau.previous ?? 0)}
        deltaLabel="vs same day last week"
        sparkline={data?.dau.sparkline}
        to="/admin-v2/analytics?tab=growth"
        loading={loading}
      />
      <MetricCard
        label="Signups 7d"
        value={loading ? null : (data?.signups.current ?? 0)}
        delta={loading ? undefined : pctDelta(data?.signups.current ?? 0, data?.signups.previous ?? 0)}
        deltaLabel="vs prev 7d"
        sparkline={data?.signups.sparkline}
        to="/admin-v2/analytics?tab=growth"
        loading={loading}
      />
      <MetricCard
        label="Sessions 7d"
        value={loading ? null : (data?.sessions.current ?? 0)}
        delta={loading ? undefined : pctDelta(data?.sessions.current ?? 0, data?.sessions.previous ?? 0)}
        deltaLabel="vs prev 7d"
        sparkline={data?.sessions.sparkline}
        to="/admin-v2/analytics?tab=engagement"
        loading={loading}
      />
      <MetricCard
        label="Posts 7d"
        value={loading ? null : (data?.posts.current ?? 0)}
        delta={loading ? undefined : pctDelta(data?.posts.current ?? 0, data?.posts.previous ?? 0)}
        deltaLabel="vs prev 7d"
        sparkline={data?.posts.sparkline}
        to="/admin-v2/content?tab=posts"
        loading={loading}
      />
      <MetricCard
        label="Reviews 7d"
        value={loading ? null : (data?.reviews.current ?? 0)}
        delta={loading ? undefined : pctDelta(data?.reviews.current ?? 0, data?.reviews.previous ?? 0)}
        deltaLabel="vs prev 7d"
        sparkline={data?.reviews.sparkline}
        to="/admin-v2/content?tab=courses"
        loading={loading}
      />
      <MetricCard
        label="Members"
        value={loading ? null : (data?.totalUsers ?? 0)}
        deltaLabel="total"
        to="/admin-v2/members"
        loading={loading}
      />
    </section>
  );
}

// ─── Active members chart ─────────────────────────────────────────────────────

function ActiveMembersChart({
  data, loading, isError, onRetry,
}: {
  data: { date: string; d1: number; d7: number; d28: number }[];
  loading: boolean; isError: boolean; onRetry: () => void;
}) {
  const empty = !loading && !isError && data.every(d => !d.d1 && !d.d7 && !d.d28);
  return (
    <section
      style={{
        background: t.surface, border: `1px solid ${t.line}`,
        borderRadius: 18, boxShadow: t.shadowCard,
        padding: 16, display: 'flex', flexDirection: 'column', gap: 8,
      }}
    >
      <div>
        <div style={{ color: t.ink, fontWeight: 700, fontSize: 15 }}>Active members</div>
        <div style={{ color: t.inkMuted, fontSize: 12, marginTop: 2 }}>Last 28 days - 1 day, 7 day, 28 day rolling</div>
      </div>

      {loading ? (
        <div style={{ height: 200, background: t.canvas, borderRadius: t.radius.md, animation: 'admin-pulse 1.4s ease-in-out infinite' }} />
      ) : isError ? (
        <AdminErrorState message="Couldn't load active members." onRetry={onRetry} />
      ) : empty ? (
        <EmptyState title="No activity yet" />
      ) : (
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke={t.line} vertical={false} />
              <XAxis
                dataKey="date" stroke={t.inkFaint} fontSize={10} tickLine={false} axisLine={false}
                tickFormatter={(d: string) => new Date(d).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                minTickGap={24}
              />
              <YAxis stroke={t.inkFaint} fontSize={10} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
              <Tooltip contentStyle={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 8, fontSize: 12, boxShadow: t.shadowPop }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="d28" name="28-day" stroke={t.inkFaint} strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="d7" name="7-day" stroke={t.ink} strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="d1" name="1-day" stroke={t.brand} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

// ─── Alert banner (unchanged copy from prior turn) ────────────────────────────

function AlertBannerRow({
  triage, pushRed, nonOkChips,
}: {
  triage: ReturnType<typeof useTriageCounts>['data'];
  pushRed: boolean;
  nonOkChips: number;
}) {
  const total = triage?.total ?? 0;
  const hasTriage = total > 0;
  if (!hasTriage && !pushRed) return null;

  if (hasTriage) {
    const rel = triage?.oldestCreatedAt ? relTime(triage.oldestCreatedAt) : 'moments ago';
    const healthClause = pushRed
      ? ' - push notifications failing'
      : nonOkChips > 0
        ? ` - ${nonOkChips} health alert${nonOkChips === 1 ? '' : 's'}`
        : '';
    const message = `${total} waiting - longest ${rel}${healthClause}`;
    return <BannerLink to={triage!.oldestQueueRoute} tone="warn" message={message} />;
  }
  return (
    <BannerLink
      to="/admin-v2/health?tab=status"
      tone="danger"
      message="Push notifications failing - open push health"
    />
  );
}

function BannerLink({ to, tone, message }: { to: string; tone: 'warn' | 'danger'; message: string }) {
  const isDanger = tone === 'danger';
  return (
    <Link
      to={to}
      role="alert"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px',
        background: isDanger ? t.dangerSoft : t.warnSoft,
        border: `1px solid ${(isDanger ? t.dangerText : t.warnText)}22`,
        color: isDanger ? t.dangerText : t.warnText,
        borderRadius: t.radius.md,
        fontSize: 13, fontWeight: 600,
        textDecoration: 'none',
      }}
    >
      <AlertTriangle size={16} />
      <span style={{ flex: 1 }}>{message}</span>
      <ChevronRight size={16} />
    </Link>
  );
}

// ─── Clubhouse feed ───────────────────────────────────────────────────────────

function LatestInClubhouse({
  items, loading, isError, onRetry,
}: {
  items: FeedItem[];
  loading: boolean; isError: boolean; onRetry: () => void;
}) {
  return (
    <section
      style={{
        background: t.surface, border: `1px solid ${t.line}`,
        borderRadius: 18, boxShadow: t.shadowCard,
        padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      <div>
        <div style={{ color: t.ink, fontWeight: 700, fontSize: 15 }}>Latest in the clubhouse</div>
        <div style={{ color: t.inkMuted, fontSize: 12, marginTop: 2 }}>New members, posts, and reviews</div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ height: 52, background: t.canvas, borderRadius: t.radius.md, animation: 'admin-pulse 1.4s ease-in-out infinite' }} />
          ))}
        </div>
      ) : isError ? (
        <AdminErrorState message="Couldn't load recent activity." onRetry={onRetry} />
      ) : items.length === 0 ? (
        <EmptyState title="No activity yet" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {items.map((it, idx) => (
            <FeedRow key={it.id} item={it} first={idx === 0} />
          ))}
        </div>
      )}
    </section>
  );
}

function FeedRow({ item, first }: { item: FeedItem; first: boolean }) {
  const chip = feedChip(item.kind);
  return (
    <Link
      to={item.href}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '10px 0',
        borderTop: first ? 'none' : `1px solid ${t.line}`,
        textDecoration: 'none', color: 'inherit',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 28, height: 28, borderRadius: 8,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: chip.bg, color: chip.fg, flexShrink: 0,
        }}
      >
        {chip.icon}
      </span>
      {item.avatarUrl ? (
        <SquircleAvatar src={item.avatarUrl} alt={item.title} size={28} hairlineRing ringColor={LIGHT_HAIRLINE} />
      ) : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ color: t.ink, fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.title}
          </span>
          <span style={{ color: t.inkFaint, fontSize: 11 }}>- {relTime(item.created_at)}</span>
        </div>
        {item.subtitle && (
          <div
            style={{
              color: t.inkMuted, fontSize: 13, marginTop: 2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            {item.subtitle}
          </div>
        )}
      </div>
      <ChevronRight size={14} color={t.inkFaint} style={{ marginTop: 12, flexShrink: 0 }} />
    </Link>
  );
}

function feedChip(kind: FeedKind): { icon: React.ReactNode; bg: string; fg: string } {
  switch (kind) {
    case 'member': return { icon: <UserPlus size={14} />, bg: '#DBEAFE', fg: '#1D4ED8' };
    case 'review': return { icon: <Star size={14} />, bg: t.brandSoft, fg: t.brandText };
    case 'post':
    default:       return { icon: <MessageSquare size={14} />, bg: t.canvas, fg: t.ink };
  }
}

// ─── Health chip strip ────────────────────────────────────────────────────────

function HealthChipStrip({
  egChip, cronChip, echoChip, pushChip,
}: {
  egChip: ChipState; cronChip: ChipState; echoChip: ChipState; pushChip: ChipState;
}) {
  return (
    <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      <HealthChip to="/admin-v2/health?tab=status" icon={<RefreshCcw size={14} />} state={egChip} />
      <HealthChip to="/admin-v2/health?tab=status" icon={<Activity size={14} />} state={cronChip} />
      <HealthChip to="/admin-v2/health?tab=status" icon={<Cpu size={14} />} state={echoChip} />
      <HealthChip to="/admin-v2/health?tab=status" icon={<Bell size={14} />} state={pushChip} />
    </section>
  );
}

function HealthChip({ to, icon, state }: { to: string; icon: React.ReactNode; state: ChipState }) {
  return (
    <Link
      to={to}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: t.surface, border: `1px solid ${t.line}`,
        borderRadius: t.radius.lg, boxShadow: t.shadowCard,
        padding: '10px 12px',
        textDecoration: 'none', color: t.ink, minWidth: 0,
      }}
    >
      <span aria-hidden style={{ width: 8, height: 8, borderRadius: 999, background: toneColor(state.tone), flexShrink: 0 }} />
      <span style={{ display: 'inline-flex', color: t.inkMuted }}>{icon}</span>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: t.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{state.label}</span>
        <span style={{ fontSize: 11, color: t.inkMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{state.detail}</span>
      </div>
      <ChevronRight size={14} color={t.inkFaint} />
    </Link>
  );
}
