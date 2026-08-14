import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { CARD, KICKER, LABEL, FIG, Skeleton } from '../lib/chartPrimitives';

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
  useOverviewMetrics, useLiveInApp, useRightNowHourly, pctDelta,
} from '../hooks/useOverviewMetrics';
import {
  computeEchoChip, computePushChip, computeEgChip, computeCronChip,
  computeErrorsChip,
} from '../lib/healthChips';
import { useErrorCount24h } from '../hooks/useStability';
import { useOpsHealth } from '../hooks/useOpsHealth';
import { useActiveWindows, type ActiveWindows } from '../hooks/useActiveWindows';
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

interface FeedRound {
  gross: number;
  par: number;
  courseName: string | null;
}

interface FeedItem {
  id: string;
  kind: FeedKind;
  created_at: string;
  /** Line 1 subject: member name, post author, or - for reviews - the COURSE. */
  subject: string;
  /** Line 2 content: caption, "{author} - {review}", or nothing for a join. */
  body: string | null;
  avatarUrl: string | null;
  href: string;
  /**
   * 4a GROUPING IDENTITY. The member who caused the item - for a review that
   * is the AUTHOR, not the course the row is titled with. Carried explicitly
   * rather than inferred from `href` so grouping never depends on a route
   * string, and `memberName` exists because a review row's `subject` is the
   * course name and a collapsed group must name the person.
   */
  memberId: string;
  memberName: string;
  postId?: string;
  courseId?: string;
  /**
   * Line 3 metadata. Every entry carries its own noun - never a bare figure.
   * A zero is only present where the zero is itself a finding (likes,
   * comments); absent values are omitted rather than rendered as 0.
   */
  meta: string[];
  /** Present only when a post resolves to a processed round. */
  round?: FeedRound;
  /**
   * Moderation markers. Hidden and mock rows are MARKED, never filtered:
   * an admin needs to see that something was hidden.
   */
  warnings: string[];
}

async function fetchClubhouseFeed(): Promise<FeedItem[]> {
  // 4.1d: 8/8/8 merged and sliced to 8, deliberately. A 4/4/4 split would
  // spend four slots on reviews in a week with no reviews while live posts
  // fell off the panel.
  const [members, posts, reviews] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('id, display_name, username, profile_photo_url, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('posts')
      .select('id, content, created_at, user_id, moderation_hidden, auto_hidden, like_count, comment_count, course_id, whs_score_id, visibility, status')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('course_ratings')
      .select('id, created_at, user_id, course_id, review, is_mock, rating, tee_label, helpful_count')
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  type PostRow = {
    id: string; content: string | null; created_at: string; user_id: string;
    moderation_hidden: boolean | null; auto_hidden: boolean | null;
    like_count: number | null; comment_count: number | null;
    course_id: string | null; whs_score_id: string | null;
    visibility: string | null; status: string | null;
  };
  type ReviewRow = {
    id: string; created_at: string; user_id: string; course_id: string;
    review: string | null; is_mock: boolean | null; rating: number | null;
    tee_label: string | null; helpful_count: number | null;
  };
  const postRows = (posts.data ?? []) as PostRow[];
  const reviewRows = (reviews.data ?? []) as ReviewRow[];
  const memberRows = (members.data ?? []) as { id: string; display_name: string | null; username: string | null; profile_photo_url: string | null; created_at: string }[];

  const profileIds = Array.from(new Set([
    ...postRows.map(r => r.user_id),
    ...reviewRows.map(r => r.user_id),
  ].filter(Boolean)));
  // 4.1a ONE course map serves both branches - review course_ids and post
  // course_ids in the same query.
  const courseIds = Array.from(new Set([
    ...reviewRows.map(r => r.course_id),
    ...postRows.map(r => r.course_id ?? ''),
  ].filter(Boolean))) as string[];
  // 4.1c Deliberately narrow: only posts with no caption need a media
  // fallback subtitle, so media type is NOT reliable metadata here.
  const emptyContentPostIds = postRows
    .filter(p => !((p.content ?? '').trim()))
    .map(p => p.id);
  const roundScoreIds = Array.from(new Set(
    postRows.map(p => p.whs_score_id).filter(Boolean),
  )) as string[];

  const [profRes, courseRes, mediaRes, roundRes] = await Promise.all([
    profileIds.length
      ? supabase.from('user_profiles').select('id, display_name, username, profile_photo_url').in('id', profileIds)
      : Promise.resolve({ data: [] } as { data: unknown[] }),
    courseIds.length
      ? supabase.from('golf_courses').select('id, name').in('id', courseIds)
      : Promise.resolve({ data: [] } as { data: unknown[] }),
    emptyContentPostIds.length
      ? supabase.from('post_media').select('post_id, media_type').in('post_id', emptyContentPostIds).limit(50)
      : Promise.resolve({ data: [] } as { data: unknown[] }),
    roundScoreIds.length
      ? supabase.from('gam_round_stats').select('whs_score_id, gross_score, course_par, course_name').in('whs_score_id', roundScoreIds)
      : Promise.resolve({ data: [] } as { data: unknown[] }),
  ]);
  type Prof = { id: string; display_name: string | null; username: string | null; profile_photo_url: string | null };
  const profMap = new Map<string, Prof>(((profRes.data ?? []) as Prof[]).map(p => [p.id, p]));
  const courseMap = new Map<string, { id: string; name: string }>(((courseRes.data ?? []) as { id: string; name: string }[]).map(c => [c.id, c]));
  const mediaMap = new Map<string, string>();
  for (const m of ((mediaRes.data ?? []) as { post_id: string; media_type: string }[])) {
    if (!mediaMap.has(m.post_id)) mediaMap.set(m.post_id, m.media_type);
  }
  // A missing row means the evaluator has not processed the round yet. The
  // post then renders as an ordinary post: no partial score, no "pending".
  const roundMap = new Map<string, FeedRound>();
  for (const r of ((roundRes.data ?? []) as { whs_score_id: string | null; gross_score: number | null; course_par: number | null; course_name: string | null }[])) {
    if (!r.whs_score_id) continue;
    if (r.gross_score == null || r.course_par == null) continue;
    if (!roundMap.has(r.whs_score_id)) {
      roundMap.set(r.whs_score_id, { gross: r.gross_score, par: r.course_par, courseName: r.course_name });
    }
  }

  const displayName = (p: Prof | undefined | null) => p?.display_name ?? p?.username ?? 'A member';
  const items: FeedItem[] = [];

  for (const m of memberRows) {
    items.push({
      id: `member:${m.id}`,
      kind: 'member',
      created_at: m.created_at,
      subject: m.display_name ?? m.username ?? 'A member',
      body: null,
      avatarUrl: m.profile_photo_url,
      href: `/admin-v2/users?member=${m.id}`,
      memberId: m.id,
      memberName: m.display_name ?? m.username ?? 'A member',
      meta: [],
      warnings: [],
    });
  }
  for (const p of postRows) {
    const prof = profMap.get(p.user_id);
    const name = displayName(prof);
    const content = stripMentionMarkup((p.content ?? '').trim()).trim();
    let body: string | null = null;
    if (content) body = content;
    else {
      const mt = mediaMap.get(p.id);
      if (mt === 'video') body = 'Video post';
      else if (mt === 'image' || mt === 'photo') body = 'Photo post';
    }
    const likes = p.like_count ?? 0;
    const comments = p.comment_count ?? 0;
    const meta: string[] = [
      `${likes} like${likes === 1 ? '' : 's'}`,
      `${comments} comment${comments === 1 ? '' : 's'}`,
    ];
    const courseName = p.course_id ? courseMap.get(p.course_id)?.name : undefined;
    if (courseName) meta.push(courseName);
    // post_visibility is ('anyone' | 'followers' | 'private') - 'anyone' IS
    // public. 'private' is named as itself rather than mislabelled "friends".
    if (p.visibility === 'followers') meta.push('Friends only');
    else if (p.visibility === 'private') meta.push('Private');

    items.push({
      id: `post:${p.id}`,
      kind: 'post',
      created_at: p.created_at,
      subject: name,
      body,
      avatarUrl: prof?.profile_photo_url ?? null,
      href: `/admin-v2/users?member=${p.user_id}`,
      memberId: p.user_id,
      memberName: name,
      postId: p.id,
      meta,
      round: p.whs_score_id ? roundMap.get(p.whs_score_id) : undefined,
      warnings: [
        ...(p.auto_hidden ? ['Auto-hidden'] : []),
        ...(p.moderation_hidden ? ['Hidden'] : []),
      ],
    });
  }
  for (const r of reviewRows) {
    const course = courseMap.get(r.course_id);
    const prof = profMap.get(r.user_id);
    const author = displayName(prof);
    const text = stripMentionMarkup((r.review ?? '').trim()).trim();
    const meta: string[] = [];
    if (r.rating != null) meta.push(`${r.rating.toFixed(1)} rated`);
    if (r.tee_label) meta.push(`${r.tee_label} tees`);
    if ((r.helpful_count ?? 0) > 0) meta.push(`${r.helpful_count} helpful`);
    items.push({
      id: `review:${r.id}`,
      kind: 'review',
      created_at: r.created_at,
      subject: course?.name ?? 'a course',
      body: text ? `${author} - ${text}` : author,
      avatarUrl: prof?.profile_photo_url ?? null,
      href: `/admin-v2/users?member=${r.user_id}`,
      memberId: r.user_id,
      memberName: author,
      courseId: r.course_id,
      meta,
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
  const activeWindows = useActiveWindows(28);

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
  const retention = useRetention(56);

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

      <MetricGrid
        loading={loading}
        data={m}
        ops={ops.data}
        opsLoading={ops.isLoading}
        aw={activeWindows.data ?? null}
        awLoading={activeWindows.isLoading}
      />

      <RetentionPanel data={retention.data} loading={retention.isLoading} />

      {/* WAU, not daily actives: the DAU tile now carries the daily series
          and two charts of one series on one page is a duplication. */}
      <ActiveMembersPanel
        data={activeWindows.data?.daily ?? []}
        stickiness={activeWindows.data?.stickiness ?? null}
        loading={activeWindows.isLoading || !activeWindows.data}
        isError={activeWindows.isError}
        onRetry={() => activeWindows.refetch()}
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

function MetricGrid({ loading, data, ops, opsLoading, aw, awLoading }: {
  loading: boolean;
  data: ReturnType<typeof useOverviewMetrics>['data'];
  ops?: OpsHealth;
  opsLoading: boolean;
  /** null while unresolved OR when a cached payload predates the RPC. */
  aw: ActiveWindows | null;
  awLoading: boolean;
}) {
  const act = ops?.activity;
  // UNRESOLVED IS NOT ABSENT: a missing block keeps the four window tiles in
  // their loading state rather than rendering a zero.
  const wLoading = awLoading || !aw;

  /**
   * 27 weekly actives means one thing against 84 members and another against
   * 8,400, so every ACTIVE-WINDOW figure carries its share of the membership.
   *
   * The denominator is the SAME totalUsers the Members tile shows - NOT
   * ops.activation.members_total, which applies its own deleted_at filter and
   * would put two different member totals on one screen. Returns null while
   * the total is unresolved: a share of an unknown denominator is not a figure.
   */
  const totalMembers = loading ? null : (data?.totalUsers ?? null);
  const share = (v: number | null | undefined): number | null =>
    v == null || totalMembers == null || totalMembers <= 0 ? null : (v / totalMembers) * 100;

  return (
    <section
      className="admin-v2-metric-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 10,
      }}
    >
      {/*
        WAU leads: golfers play once or twice a week, so the weekly window is
        the headline and DAU is a live pulse beside it. WAU and MAU are
        distinct rolling counts from the database - never summed from a daily
        series, which would count a member once per day they appeared.
      */}
      <MetricCard
        label="WAU"
        value={wLoading ? null : aw!.wau.current}
        delta={wLoading ? undefined : pctDelta(aw!.wau.current, aw!.wau.previous)}
        deltaLabel="vs prev 7d"
        sparkline={aw?.daily.map(d => d.wau)}
        sharePct={wLoading ? null : share(aw!.wau.current)}
        to="/admin-v2/analytics?tab=engagement"
        loading={wLoading}
      />
      <MetricCard
        label="DAU"
        value={wLoading ? null : aw!.dau.current}
        delta={wLoading ? undefined : pctDelta(aw!.dau.current, aw!.dau.previous)}
        deltaLabel="vs same day last week"
        sparkline={aw?.daily.map(d => d.dau)}
        sharePct={wLoading ? null : share(aw!.dau.current)}
        to="/admin-v2/analytics?tab=engagement"
        loading={wLoading}
      />
      <MetricCard
        label="MAU"
        value={wLoading ? null : aw!.mau.current}
        delta={wLoading ? undefined : pctDelta(aw!.mau.current, aw!.mau.previous)}
        deltaLabel="vs prev 30d"
        sparkline={aw?.daily.map(d => d.mau)}
        sharePct={wLoading ? null : share(aw!.mau.current)}
        to="/admin-v2/analytics?tab=engagement"
        loading={wLoading}
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

/**
 * Local to-par. NOT imported from the member tokens: that module carries
 * member-surface colours, and pulling it in would couple two palettes.
 * ROUND FIRST, THEN BRANCH - taking the sign before rounding renders "-0.0"
 * on a value fractionally under par.
 */
function toParParts(gross: number, par: number): { text: string; color: string } {
  const rounded = Math.round(gross - par);
  if (rounded === 0) return { text: 'E', color: t.inkMuted };
  if (rounded < 0) return { text: `\u2212${Math.abs(rounded)}`, color: t.danger };
  return { text: `+${rounded}`, color: t.ink };
}

const KIND_LABEL: Record<FeedKind, { text: string; color: string }> = {
  member: { text: 'JOINED', color: t.ok },
  post:   { text: 'POST',   color: t.inkFaint },
  review: { text: 'REVIEW', color: t.ink },
};

/**
 * 4a CONSECUTIVE, NOT GLOBAL. Runs of the same member in the ALREADY SORTED
 * order collapse; if another member posts between two of Matt's, that is three
 * groups, not two, and the feed stays strictly chronological.
 *
 * 4e Grouping is PRESENTATION and runs AFTER the 8-item slice. The panel does
 * not fetch more to fill the space grouping frees - that would change what
 * "latest 8" means.
 */
function groupConsecutive(items: FeedItem[]): FeedItem[][] {
  const groups: FeedItem[][] = [];
  for (const it of items) {
    const last = groups[groups.length - 1];
    if (last && last[0].memberId && last[0].memberId === it.memberId) last.push(it);
    else groups.push([it]);
  }
  return groups;
}

/**
 * 4d ONE NOUN. Mixed kinds read "{n} items" - never "2 posts and a review",
 * which does not fit the row and reads as a sentence rather than a figure.
 */
function groupLabel(group: FeedItem[]): string {
  const kinds = new Set(group.map(g => g.kind));
  if (kinds.size > 1) return `${group.length} items`;
  const kind = group[0].kind;
  if (kind === 'post') return `${group.length} posts`;
  if (kind === 'review') return `${group.length} reviews`;
  return `${group.length} items`;
}

/** 4c/4f One collapsed row per run. Collapsed ALWAYS on mount - the newest
 *  group does not auto-expand, or the panel reverts to its dominated state. */
function FeedGroup({
  group, first, onOpenPost, onOpenCourse,
}: {
  group: FeedItem[]; first: boolean;
  onOpenPost: (id: string) => void;
  onOpenCourse: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const head = group[0];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: '10px 0', textAlign: 'left', cursor: 'pointer',
          background: 'transparent', border: 'none',
          borderTop: first ? 'none' : `1px solid ${t.hairline}`,
          borderTopStyle: first ? 'none' : 'solid',
          borderTopWidth: first ? 0 : 1, borderTopColor: t.hairline,
          color: 'inherit',
        }}
      >
        {head.avatarUrl ? (
          <SquircleAvatar src={head.avatarUrl} alt={head.memberName} size={28} hairlineRing ringColor={t.line} />
        ) : (
          <span aria-hidden style={{ width: 28, height: 28, borderRadius: 9, border: `1px solid ${t.hairline}`, flexShrink: 0 }} />
        )}
        <span style={{
          color: t.ink, fontSize: 13, fontWeight: 700, minWidth: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {head.memberName}
        </span>
        <span style={{ ...LABEL, flexShrink: 0 }}>{groupLabel(group)}</span>
        <span style={{ flex: 1 }} />
        {/* The age of the MOST RECENT item: the group sits where its newest
            member sits, so any other age would misplace it. */}
        <span style={{ ...LABEL, ...FIG, flexShrink: 0 }}>{relTime(head.created_at)}</span>
        <ChevronDown
          size={14} color={t.inkFaint} aria-hidden
          style={{
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 160ms ease',
          }}
        />
      </button>

      {open ? (
        <div style={{ paddingLeft: 38 }}>
          {group.map((it, i) => (
            <FeedRow
              key={it.id} item={it} first={i === 0}
              onOpenPost={onOpenPost}
              onOpenCourse={onOpenCourse}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}

function LatestInClubhouse({
  items, loading, isError, onRetry,
}: {
  items: FeedItem[];
  loading: boolean; isError: boolean; onRetry: () => void;
}) {
  const [openPost, setOpenPost] = React.useState<string | null>(null);
  const [openCourse, setOpenCourse] = React.useState<string | null>(null);
  const groups = React.useMemo(() => groupConsecutive(items), [items]);


  return (
    <section style={CARD}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <span style={KICKER}>Latest in the clubhouse</span>
        <Link to="/admin-v2/content" style={{ ...LABEL, color: t.inkMuted, textDecoration: 'none' }}>ALL</Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0, 1, 2].map(i => <Skeleton key={i} height={52} />)}
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
  // Post rows -> post insight sheet; review rows -> course insight sheet.
  const opensSheet =
    (item.kind === 'post' && !!item.postId) ||
    (item.kind === 'review' && !!item.courseId);

  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    padding: '10px 0',
    borderTop: first ? 'none' : `1px solid ${t.hairline}`,
    textDecoration: 'none', color: 'inherit',
    background: 'transparent', border: 'none', width: '100%', textAlign: 'left',
    cursor: 'pointer',
  };

  const kind = KIND_LABEL[item.kind];
  const round = item.round;

  const inner = (
    <>
      {/* 4.2h The 28px slot is reserved either way so bodies align. */}
      {item.avatarUrl ? (
        <SquircleAvatar src={item.avatarUrl} alt={item.subject} size={28} hairlineRing ringColor={t.line} />
      ) : (
        <span
          aria-hidden
          style={{ width: 28, height: 28, borderRadius: 9, border: `1px solid ${t.hairline}`, flexShrink: 0 }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
          <span style={{ color: t.ink, fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.subject}
          </span>
          <span style={{ ...LABEL, color: kind.color, flexShrink: 0 }}>{kind.text}</span>
        </div>
        {item.body && (
          <div
            style={{
              color: t.inkMuted, fontSize: 13, marginTop: 2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            {item.body}
          </div>
        )}
        {(item.warnings.length > 0 || item.meta.length > 0 || round) && (
          <div
            style={{
              ...LABEL, ...FIG, marginTop: 3,
              display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 8,
            }}
          >
            {item.warnings.map(w => (
              <span key={w} style={{ color: t.dangerText, fontWeight: 700 }}>{w}</span>
            ))}
            {item.meta.map(mt => <span key={mt}>{mt}</span>)}
            {round && (() => {
              const p = toParParts(round.gross, round.par);
              return (
                <span style={{ color: t.inkMuted }}>
                  <span style={{ color: t.ink, fontWeight: 700 }}>{round.gross}</span>{' '}
                  <span style={{ color: p.color, fontWeight: 700 }}>{p.text}</span>
                  {round.courseName ? ` - ${round.courseName}` : ''}
                </span>
              );
            })()}
          </div>
        )}
      </div>
      {/* 4.2a Right rail: age only. Nothing else may sit in this column. */}
      <span style={{ ...LABEL, ...FIG, flexShrink: 0, marginTop: 1 }}>{relTime(item.created_at)}</span>
      <ChevronRight size={14} color={t.inkFaint} style={{ marginTop: 1, flexShrink: 0 }} />
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
        style={{ ...rowStyle, borderTopStyle: first ? 'none' : 'solid', borderTopWidth: first ? 0 : 1, borderTopColor: t.hairline }}
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


