import { useQueries } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TrendPoint } from '../components/ui/AdminKpiCard';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardKpis {
  totalUsers:      { value: number; delta: number; trend: TrendPoint[] };
  newUsersToday:   { value: number; delta: number };
  activeUsers24h:  { value: number; delta: number };
  postsToday:      { value: number; delta: number };
}

export interface ActionQueue {
  pendingVerifications: number;
  pendingInvites:       number;
  expiringAccess:       number;
}

export interface ActivityTrendDay {
  date:    string;
  users:   number;
  posts:   number;
  reviews: number;
}

export interface RecentAuditEntry {
  id:          string;
  action:      string;
  adminUserId: string;
  targetEmail: string | null;
  createdAt:   string;
  details:     Record<string, unknown> | null;
}

export type EgSyncStatus = 'green' | 'amber' | 'red' | 'idle';

export interface EgSyncHealth {
  status: EgSyncStatus;
  total_connected: number;
  status_ok_count: number;
  auth_failed: number;
  eg_unavailable: number;
  consecutive_failures_total: number;
  last_attempt_at: string | null;
  cron_last_run_at: string | null;
  cron_last_status: string | null;
  cron_hours_ago: number | null;
  computed_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateKey(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
}

function buildDailyBuckets(
  rows: { created_at: string }[],
  days: number
): TrendPoint[] {
  const buckets: Record<string, number> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    buckets[toDateKey(d.toISOString())] = 0;
  }
  for (const row of rows) {
    const key = toDateKey(row.created_at);
    if (key in buckets) buckets[key]++;
  }
  return Object.entries(buckets).map(([date, value]) => ({ date, value }));
}

function uniqueCount(rows: { user_id: string }[]): number {
  return new Set(rows.map(r => r.user_id)).size;
}

function calcDelta(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

// ─── Individual fetchers ──────────────────────────────────────────────────────

async function fetchKpis(): Promise<DashboardKpis> {
  const now          = new Date();
  const oneDayAgo    = new Date(now.getTime() - 24  * 3600_000);
  const twoDaysAgo   = new Date(now.getTime() - 48  * 3600_000);
  const fourteenAgo  = new Date(now.getTime() - 14  * 24 * 3600_000);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday.getTime() - 86_400_000);

  const [
    totalUsersRes,
    todayUsersRes,
    yesterdayUsersRes,
    usersLast14d,
    active24h,
    activePrev24h,
    postsToday,
    postsYesterday,
  ] = await Promise.all([
    supabase.from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null),
    supabase.from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .gte('created_at', startOfToday.toISOString()),
    supabase.from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .gte('created_at', startOfYesterday.toISOString())
      .lt('created_at', startOfToday.toISOString()),
    supabase.from('user_profiles').select('created_at')
      .gte('created_at', fourteenAgo.toISOString()).is('deleted_at', null),
    supabase.from('analytics_events').select('user_id')
      .gte('created_at', oneDayAgo.toISOString()).not('user_id', 'is', null),
    supabase.from('analytics_events').select('user_id')
      .gte('created_at', twoDaysAgo.toISOString())
      .lt('created_at', oneDayAgo.toISOString())
      .not('user_id', 'is', null),
    supabase.from('posts').select('id', { count: 'exact', head: true })
      .gte('created_at', startOfToday.toISOString()),
    supabase.from('posts').select('id', { count: 'exact', head: true })
      .gte('created_at', startOfYesterday.toISOString())
      .lt('created_at', startOfToday.toISOString()),
  ]);

  const totalCount     = totalUsersRes.count ?? 0;
  const todayUsers     = todayUsersRes.count ?? 0;
  const yesterdayUsers = yesterdayUsersRes.count ?? 0;
  const trend          = buildDailyBuckets(usersLast14d.data ?? [], 14);

  const active24hCount     = uniqueCount((active24h.data ?? []) as { user_id: string }[]);
  const activePrev24hCount = uniqueCount((activePrev24h.data ?? []) as { user_id: string }[]);
  const postsTodayCount    = postsToday.count ?? 0;
  const postsYestCount     = postsYesterday.count ?? 0;

  return {
    totalUsers:     { value: totalCount,     delta: calcDelta(totalCount, totalCount - todayUsers), trend },
    newUsersToday:  { value: todayUsers,     delta: calcDelta(todayUsers, yesterdayUsers) },
    activeUsers24h: { value: active24hCount, delta: calcDelta(active24hCount, activePrev24hCount) },
    postsToday:     { value: postsTodayCount, delta: calcDelta(postsTodayCount, postsYestCount) },
  };
}

async function fetchActionQueue(): Promise<ActionQueue> {
  const now = new Date();
  const in7d = new Date(now.getTime() + 7 * 24 * 3600_000);

  const [bizVerif, golferVerif, invites, expiring] = await Promise.all([
    supabase.from('business_verification_requests')
      .select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('golfer_verification_requests')
      .select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('admin_invitations')
      .select('id', { count: 'exact', head: true })
      .is('accepted_at', null)
      .gte('expires_at', now.toISOString()),
    supabase.from('admin_memberships')
      .select('user_id', { count: 'exact', head: true })
      .not('expires_at', 'is', null)
      .lte('expires_at', in7d.toISOString())
      .gte('expires_at', now.toISOString()),
  ]);

  return {
    pendingVerifications: (bizVerif.count ?? 0) + (golferVerif.count ?? 0),
    pendingInvites:       invites.count ?? 0,
    expiringAccess:       expiring.count ?? 0,
  };
}

async function fetchActivityTrend(days = 14): Promise<ActivityTrendDay[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const iso = startDate.toISOString();

  const [users, posts, reviews] = await Promise.all([
    supabase.from('user_profiles').select('created_at').gte('created_at', iso).is('deleted_at', null).limit(5000),
    supabase.from('posts').select('created_at').gte('created_at', iso).limit(5000),
    supabase.from('course_ratings').select('created_at').gte('created_at', iso).limit(5000),
  ]);

  const buckets: Record<string, ActivityTrendDay> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = toDateKey(d.toISOString());
    buckets[key] = { date: key, users: 0, posts: 0, reviews: 0 };
  }

  for (const r of users.data ?? []) {
    const k = toDateKey(r.created_at);
    if (buckets[k]) buckets[k].users++;
  }
  for (const r of posts.data ?? []) {
    const k = toDateKey(r.created_at);
    if (buckets[k]) buckets[k].posts++;
  }
  for (const r of reviews.data ?? []) {
    const k = toDateKey(r.created_at);
    if (buckets[k]) buckets[k].reviews++;
  }

  return Object.values(buckets);
}

// ─── Today at a glance fetchers ───────────────────────────────────────────────

export interface HourlyBucket { hour: number; count: number; }
export interface TopActiveUser { userId: string; displayName: string; eventCount: number; }

export interface TodayGlance {
  postsByHour: HourlyBucket[];
  topActiveUsers: TopActiveUser[];
}

async function fetchTodayGlance(): Promise<TodayGlance> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const since = startOfToday.toISOString();

  const [postsRes, eventsRes] = await Promise.all([
    supabase.from('analytics_events')
      .select('created_at')
      .eq('name', 'post_published')
      .gte('created_at', since)
      .limit(2000),
    supabase.from('analytics_events')
      .select('user_id')
      .gte('created_at', since)
      .not('user_id', 'is', null)
      .limit(5000),
  ]);

  // Posts by hour
  const hourCounts: Record<number, number> = {};
  for (let h = 0; h < 24; h++) hourCounts[h] = 0;
  for (const r of postsRes.data ?? []) {
    const h = new Date(r.created_at).getHours();
    hourCounts[h]++;
  }
  const postsByHour: HourlyBucket[] = Object.entries(hourCounts)
    .map(([h, count]) => ({ hour: parseInt(h), count }));

  // Top 3 active users
  const userCounts: Record<string, number> = {};
  for (const r of (eventsRes.data ?? []) as { user_id: string }[]) {
    userCounts[r.user_id] = (userCounts[r.user_id] || 0) + 1;
  }
  const top3Ids = Object.entries(userCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([userId, eventCount]) => ({ userId, eventCount }));

  let topActiveUsers: TopActiveUser[] = [];
  if (top3Ids.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name, username')
      .in('id', top3Ids.map(t => t.userId));

    const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));
    topActiveUsers = top3Ids.map(t => ({
      userId: t.userId,
      displayName: profileMap.get(t.userId)?.display_name
        ?? profileMap.get(t.userId)?.username
        ?? t.userId.slice(0, 8),
      eventCount: t.eventCount,
    }));
  }

  return { postsByHour, topActiveUsers };
}

async function fetchEgSyncHealth(): Promise<EgSyncHealth> {
  const { data, error } = await supabase.rpc('get_eg_sync_health' as any);
  if (error) throw error;
  return data as EgSyncHealth;
}

async function fetchRecentAudit(): Promise<RecentAuditEntry[]> {
  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('id, action, admin_user_id, target_email, created_at, details')
    .order('created_at', { ascending: false })
    .limit(8);

  if (error) throw error;

  return (data ?? []).map(e => ({
    id:          e.id,
    action:      e.action,
    adminUserId: e.admin_user_id,
    targetEmail: e.target_email,
    createdAt:   e.created_at,
    details:     e.details as Record<string, unknown> | null,
  }));
}

// ─── Main hook ────────────────────────────────────────────────────────────────

export function useAdminV2Dashboard() {
  const results = useQueries({
    queries: [
      {
        queryKey: ['admin-v2', 'dashboard', 'kpis'],
        queryFn:  fetchKpis,
        staleTime: 60_000,
        refetchInterval: 120_000,
      },
      {
        queryKey: ['admin-v2', 'dashboard', 'queue'],
        queryFn:  fetchActionQueue,
        staleTime: 30_000,
        refetchInterval: 60_000,
      },
      {
        queryKey: ['admin-v2', 'dashboard', 'trend', 14],
        queryFn:  () => fetchActivityTrend(14),
        staleTime: 5 * 60_000,
        refetchInterval: 10 * 60_000,
      },
      {
        queryKey: ['admin-v2', 'dashboard', 'audit'],
        queryFn:  fetchRecentAudit,
        staleTime: 30_000,
        refetchInterval: 60_000,
      },
      {
        queryKey: ['admin-v2', 'dashboard', 'glance'],
        queryFn:  fetchTodayGlance,
        staleTime: 2 * 60_000,
        refetchInterval: 5 * 60_000,
      },
    ],
  });

  const [kpisQ, queueQ, trendQ, auditQ, glanceQ] = results;

  return {
    kpis:        { data: kpisQ.data,  isLoading: kpisQ.isLoading  },
    queue:       { data: queueQ.data, isLoading: queueQ.isLoading },
    trend:       { data: trendQ.data, isLoading: trendQ.isLoading },
    audit:       { data: auditQ.data, isLoading: auditQ.isLoading },
    glance:      { data: glanceQ.data, isLoading: glanceQ.isLoading },
    isAnyLoading: results.some(r => r.isLoading),
    refetchAll:  () => results.forEach(r => r.refetch()),
  };
}
