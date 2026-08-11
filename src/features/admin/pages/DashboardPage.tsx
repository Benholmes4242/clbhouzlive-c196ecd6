import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, MessageSquare, UserPlus, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { adminTheme as t } from '../theme';
import EmptyState from '../components/EmptyState';
import AdminErrorState from '../components/AdminErrorState';
import MetricCard from '../components/MetricCard';
import PostInsightSheet from '../components/PostInsightSheet';
import CourseInsightSheet from '../components/CourseInsightSheet';
import { useTriageCounts } from '../hooks/useTriageCounts';
import { useEchoEngineHealth } from '../hooks/useEchoEngineHealth';
import { usePushHealth } from '../hooks/usePushHealth';
import { useDashboard } from '../hooks/useDashboard';
import {
  useOverviewMetrics, useLiveInApp, useRightNowHourly, useActiveMembers28d, pctDelta,
} from '../hooks/useOverviewMetrics';
import {
  computeEchoChip, computePushChip, computeEgChip, computeCronChip,
  computeErrorsChip,
} from '../lib/healthChips';
import { useErrorCount24h } from '../hooks/useStability';
import { useOpsHealth } from '../hooks/useOpsHealth';
import { useRetention } from '../hooks/useRetention';
import { SystemPanel, ActivationPanel, PipelinePanel } from '../components/SystemPanels';
import { RightNowPanel, RetentionPanel, ActiveMembersPanel } from '../components/ChartPanels';
import { OpsErrorsPanel } from '../components/OpsPanels';
import type { OpsHealth } from '../hooks/useOpsHealth';
import { stripMentionMarkup } from '@/lib/mentions/format';


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
  postId?: string;
  courseId?: string;
  /**
   * Moderation markers. Hidden and mock rows are MARKED, never filtered:
   * an admin needs to see that something was hidden.
   */
  warnings: string[];
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
      .select('id, content, created_at, user_id, moderation_hidden, auto_hidden')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('course_ratings')
      .select('id, created_at, user_id, course_id, review, is_mock')
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  const postRows = (posts.data ?? []) as { id: string; content: string | null; created_at: string; user_id: string; moderation_hidden: boolean | null; auto_hidden: boolean | null }[];
  const reviewRows = (reviews.data ?? []) as { id: string; created_at: string; user_id: string; course_id: string; review: string | null; is_mock: boolean | null }[];
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
      href: `/admin-v2/users?member=${m.id}`,
      warnings: [],
    });
  }
  for (const p of postRows) {
    const prof = profMap.get(p.user_id);
    const name = displayName(prof);
    const content = stripMentionMarkup((p.content ?? '').trim()).trim();
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
      href: `/admin-v2/users?member=${p.user_id}`,
      postId: p.id,
      warnings: [
        ...(p.auto_hidden ? ['Auto-hidden'] : []),
        ...(p.moderation_hidden ? ['Hidden'] : []),
      ],
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
      subtitle: stripMentionMarkup((r.review ?? '').trim()).trim() || `by ${displayName(prof)}`,
      avatarUrl: prof?.profile_photo_url ?? null,
      href: `/admin-v2/users?member=${r.user_id}`,
      courseId: r.course_id,
      warnings: r.is_mock ? ['Mock'] : [],
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
  const errors = useErrorCount24h();
  const ops = useOpsHealth(7);
  const errorsChip = useMemo(
    () => computeErrorsChip(errors.data ?? null, errors.isLoading, errors.isError),
    [errors.data, errors.isLoading, errors.isError],
  );
  const nonOkChips = [echoChip, pushChip, egChip, cronChip, errorsChip].filter(c => c.tone !== 'ok' && c.tone !== 'idle').length;

  const m = overview.data;
  const loading = overview.isLoading;

  return (
    <div style={{ padding: '8px 16px 0', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720, margin: '0 auto' }}>
      {/* Status first: an admin opens this to find out whether anything is
          broken, so system state leads and vanity metrics follow. */}
      <SystemPanel
        chips={{ eg: egChip, cron: cronChip, echo: echoChip, push: pushChip, errors: errorsChip }}
        nonOkChips={nonOkChips}
        triage={triage}
        ops={ops.data}
        opsLoading={ops.isLoading}
        eg={eg.data}
      />

      <ActivationPanel ops={ops.data} loading={ops.isLoading} />

      <PipelinePanel ops={ops.data} loading={ops.isLoading} />

      <RightNowPanel
        live={live.data?.count ?? null}
        liveLoading={live.isLoading}
        intraday={intraday.data ?? []}
        intradayLoading={intraday.isLoading}
        topUsers={dashboard.glance.data?.topActiveUsers}
        topUsersLoading={dashboard.glance.isLoading}
      />

      <MetricGrid loading={loading} data={m} ops={ops.data} opsLoading={ops.isLoading} />

      <RetentionPanel data={retention.data} loading={retention.isLoading} />

      <ActiveMembersPanel
        data={actives.data ?? []}
        loading={actives.isLoading}
        isError={actives.isError}
        onRetry={() => actives.refetch()}
      />

      <OpsErrorsPanel data={ops.data} loading={ops.isLoading} />

      <LatestInClubhouse
        items={feed.data ?? []}
        loading={feed.isLoading}
        isError={feed.isError}
        onRetry={() => feed.refetch()}
      />

      <style>{`@keyframes admin-pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.55 } } @keyframes admin-pulse-dot { 0%,100% { opacity: 1 } 50% { opacity: 0.35 } }`}</style>
    </div>
  );
}



// ─── Metric grid ──────────────────────────────────────────────────────────────

function MetricGrid({ loading, data, ops, opsLoading }: {
  loading: boolean;
  data: ReturnType<typeof useOverviewMetrics>['data'];
  ops?: OpsHealth;
  opsLoading: boolean;
}) {
  const act = ops?.activity;
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
        to="/admin-v2/analytics?tab=engagement"
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
      {/*
        Rounds, not sessions: logging a round is the product's actual action.
        play_date, never created_at - a handicap connection backfills history.
        The member count is the reference point: 16 rounds could be one keen
        golfer or nine.
      */}
      <MetricCard
        label="Rounds 7d"
        value={opsLoading ? null : (act?.rounds_in_window ?? 0)}
        delta={opsLoading ? undefined : pctDelta(act?.rounds_in_window ?? 0, act?.rounds_prev_window ?? 0)}
        deltaLabel={act ? `by ${act.rounds_members} member${act.rounds_members === 1 ? '' : 's'}` : 'vs prev 7d'}
        sparkline={act?.daily.map((d) => d.n)}
        to="/admin-v2/analytics?tab=engagement"
        loading={opsLoading}
      />
      <MetricCard
        label="Posts 7d"
        value={loading ? null : (data?.posts.current ?? 0)}
        delta={loading ? undefined : pctDelta(data?.posts.current ?? 0, data?.posts.previous ?? 0)}
        deltaLabel="vs prev 7d"
        sparkline={data?.posts.sparkline}
        to="/admin-v2/analytics?tab=engagement"
        loading={loading}
      />
      <MetricCard
        label="Reviews 7d"
        value={loading ? null : (data?.reviews.current ?? 0)}
        delta={loading ? undefined : pctDelta(data?.reviews.current ?? 0, data?.reviews.previous ?? 0)}
        deltaLabel="vs prev 7d"
        sparkline={data?.reviews.sparkline}
        to="/admin-v2/analytics?tab=engagement"
        loading={loading}
      />
      <MetricCard
        label="Members"
        value={loading ? null : (data?.totalUsers ?? 0)}
        deltaLabel="total"
        to="/admin-v2/users"
        loading={loading}
      />
    </section>
  );
}


// ─── Clubhouse feed ───────────────────────────────────────────────────────────

function LatestInClubhouse({
  items, loading, isError, onRetry,
}: {
  items: FeedItem[];
  loading: boolean; isError: boolean; onRetry: () => void;
}) {
  const [openPost, setOpenPost] = React.useState<string | null>(null);
  const [openCourse, setOpenCourse] = React.useState<string | null>(null);

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
            <FeedRow
              key={it.id} item={it} first={idx === 0}
              onOpenPost={setOpenPost}
              onOpenCourse={setOpenCourse}
            />
          ))}
        </div>
      )}

      <PostInsightSheet postId={openPost} open={!!openPost} onClose={() => setOpenPost(null)} />
      <CourseInsightSheet courseId={openCourse} open={!!openCourse} onClose={() => setOpenCourse(null)} />
    </section>
  );
}

function FeedRow({
  item, first, onOpenPost, onOpenCourse,
}: {
  item: FeedItem; first: boolean;
  onOpenPost: (id: string) => void;
  onOpenCourse: (id: string) => void;
}) {
  const chip = feedChip(item.kind);
  // C4-3: post rows -> post insight sheet (upgrades the temporary author-360 routing).
  // C4-2 (b): review rows -> course insight sheet.
  const opensSheet =
    (item.kind === 'post' && !!item.postId) ||
    (item.kind === 'review' && !!item.courseId);

  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    padding: '10px 0',
    borderTop: first ? 'none' : `1px solid ${t.line}`,
    textDecoration: 'none', color: 'inherit',
    background: 'transparent', border: 'none', width: '100%', textAlign: 'left',
    cursor: 'pointer',
  };

  const inner = (
    <>
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
        {item.warnings.length > 0 && (
          <div style={{ color: t.warnText, fontSize: 11, fontWeight: 700, marginTop: 2 }}>
            {item.warnings.join(' - ')}
          </div>
        )}
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
    </>
  );

  if (opensSheet) {
    return (
      <button
        type="button"
        onClick={() => {
          if (item.kind === 'post' && item.postId) onOpenPost(item.postId);
          else if (item.kind === 'review' && item.courseId) onOpenCourse(item.courseId);
        }}
        style={{ ...rowStyle, borderTopStyle: first ? 'none' : 'solid', borderTopWidth: first ? 0 : 1, borderTopColor: t.line }}
      >
        {inner}
      </button>
    );
  }

  return (
    <Link to={item.href} style={rowStyle}>
      {inner}
    </Link>
  );
}


function feedChip(kind: FeedKind): { icon: React.ReactNode; bg: string; fg: string } {
  switch (kind) {
    case 'member': return { icon: <UserPlus size={14} />, bg: t.neutralSoft, fg: t.ink };
    case 'review': return { icon: <Star size={14} />, bg: t.brandSoft, fg: t.brandText };
    case 'post':
    default:       return { icon: <MessageSquare size={14} />, bg: t.canvas, fg: t.ink };
  }
}

