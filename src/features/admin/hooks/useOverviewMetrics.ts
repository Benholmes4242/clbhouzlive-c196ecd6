import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const DAY = 86_400_000;

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function daysAgo(n: number) { return new Date(Date.now() - n * DAY); }
function dayKey(d: Date) { return d.toISOString().slice(0, 10); }

type TrendPoint = { date: string; value: number };

// ─── RIGHT NOW: live count (distinct users in last 5 min) ─────────────────────
// Shared source for the Dashboard Right-Now strip AND the Analytics Live tab.
// Same queryKey → react-query dedups; polling runs once regardless of how many
// components mount it. Polling is visibility-gated (paused when tab is hidden).

export interface LiveUserRow { user_id: string; latestAt: string; }
export interface LiveInApp { count: number; users: LiveUserRow[]; }

const gatedInterval = (ms: number) => () =>
  typeof document !== 'undefined' && document.visibilityState === 'hidden'
    ? false
    : ms;

async function fetchLive(): Promise<LiveInApp> {
  const since = new Date(Date.now() - 5 * 60_000).toISOString();
  const { data, error } = await supabase
    .from('analytics_events')
    .select('user_id, created_at')
    .gte('created_at', since)
    .not('user_id', 'is', null)
    .limit(2000);
  if (error) throw error;
  const latest = new Map<string, string>();
  for (const r of (data as { user_id: string; created_at: string }[]) ?? []) {
    if (!r.user_id) continue;
    const prev = latest.get(r.user_id);
    if (!prev || r.created_at > prev) latest.set(r.user_id, r.created_at);
  }
  const users: LiveUserRow[] = Array.from(latest, ([user_id, latestAt]) => ({ user_id, latestAt }))
    .sort((a, b) => (a.latestAt < b.latestAt ? 1 : -1));
  return { count: users.length, users };
}

export function useLiveInApp() {
  return useQuery({
    queryKey: ['admin-v2', 'overview', 'live-in-app'],
    queryFn: fetchLive,
    refetchInterval: gatedInterval(15_000),
    refetchIntervalInBackground: false,
    staleTime: 10_000,
  });
}

// ─── RIGHT NOW: today intraday + same-weekday-last-week ghost ──────────────────

export interface HourPoint { hour: number; today: number | null; last: number | null }

async function fetchIntraday(): Promise<HourPoint[]> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const lastWeekStart = new Date(todayStart.getTime() - 7 * DAY);
  const lastWeekEnd = new Date(lastWeekStart.getTime() + DAY);
  const currentHour = now.getHours();

  const [todayRes, lastRes] = await Promise.all([
    supabase.from('analytics_events').select('created_at').gte('created_at', todayStart.toISOString()).limit(20000),
    supabase.from('analytics_events').select('created_at').gte('created_at', lastWeekStart.toISOString()).lt('created_at', lastWeekEnd.toISOString()).limit(20000),
  ]);

  const todayBuckets = new Array(24).fill(0);
  const lastBuckets = new Array(24).fill(0);
  for (const r of (todayRes.data as { created_at: string }[]) ?? []) {
    const h = new Date(r.created_at).getHours();
    if (h >= 0 && h < 24) todayBuckets[h]++;
  }
  for (const r of (lastRes.data as { created_at: string }[]) ?? []) {
    const h = new Date(r.created_at).getHours();
    if (h >= 0 && h < 24) lastBuckets[h]++;
  }

  const points: HourPoint[] = [];
  for (let h = 0; h <= currentHour; h++) {
    points.push({ hour: h, today: todayBuckets[h], last: lastBuckets[h] });
  }
  return points;
}

export function useRightNowHourly() {
  return useQuery({
    queryKey: ['admin-v2', 'overview', 'intraday'],
    queryFn: fetchIntraday,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

// ─── METRIC SPARKLINES (14d daily counts, split client-side into 7d + 7d-prev) ─

export interface MetricSeries {
  current: number;
  previous: number;
  sparkline: number[]; // last 7 days, oldest → newest
}

export interface MetricsBundle {
  dau: MetricSeries;
  signups: MetricSeries;
  sessions: MetricSeries;
  posts: MetricSeries;
  reviews: MetricSeries;
  totalUsers: number;
}

function bucketByDay(rows: { created_at: string }[], days: number): number[] {
  const buckets: Record<string, number> = {};
  for (let i = days - 1; i >= 0; i--) buckets[dayKey(daysAgo(i))] = 0;
  for (const r of rows) {
    const k = dayKey(new Date(r.created_at));
    if (k in buckets) buckets[k]++;
  }
  return Object.values(buckets);
}

async function fetchMetrics(): Promise<MetricsBundle> {
  const since14 = daysAgo(14).toISOString();
  const [activityRes, sessionsRes, signupsRes, postsRes, reviewsRes, totalRes] = await Promise.all([
    // Distinct-user counting is an aggregation: it runs in the database.
    supabase.rpc('get_platform_activity', { p_days: 14 }),
    supabase.from('analytics_events').select('created_at').eq('name', 'session_start').gte('created_at', since14).limit(20000),
    supabase.from('user_profiles').select('created_at').is('deleted_at', null).gte('created_at', since14).limit(20000),
    supabase.from('posts').select('created_at').gte('created_at', since14).limit(20000),
    supabase.from('course_ratings').select('created_at').gte('created_at', since14).limit(20000),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }).is('deleted_at', null),
  ]);


  const activity = Array.isArray(activityRes.data) ? activityRes.data[0] : undefined;
  const activityTrend = Array.isArray(activity?.trend) ? (activity!.trend as unknown as TrendPoint[]) : [];
  const dauDaily = activityTrend.map(p => p.value);
  const sessionsDaily = bucketByDay((sessionsRes.data as { created_at: string }[]) ?? [], 14);
  const signupsDaily = bucketByDay((signupsRes.data as { created_at: string }[]) ?? [], 14);
  const postsDaily = bucketByDay((postsRes.data as { created_at: string }[]) ?? [], 14);
  const reviewsDaily = bucketByDay((reviewsRes.data as { created_at: string }[]) ?? [], 14);

  const toSeries = (arr: number[]): MetricSeries => {
    const prev = arr.slice(0, 7);
    const cur = arr.slice(7);
    return {
      current: cur.reduce((a, b) => a + b, 0),
      previous: prev.reduce((a, b) => a + b, 0),
      sparkline: cur,
    };
  };

  // DAU: current = today's uniques; previous = same-weekday-last-week uniques
  const dauToday = dauDaily[dauDaily.length - 1] ?? 0;
  const dauLastWeek = dauDaily[dauDaily.length - 8] ?? 0;

  return {
    dau: { current: dauToday, previous: dauLastWeek, sparkline: dauDaily.slice(7) },
    signups: toSeries(signupsDaily),
    sessions: toSeries(sessionsDaily),
    posts: toSeries(postsDaily),
    reviews: toSeries(reviewsDaily),
    totalUsers: totalRes.count ?? 0,
  };
}

export function useOverviewMetrics() {
  return useQuery({
    queryKey: ['admin-v2', 'overview', 'metrics'],
    queryFn: fetchMetrics,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

// ─── ACTIVE MEMBERS: daily actives over the last 28 days ───────────────────────
// Sourced from get_platform_activity, the same aggregation the Engagement card
// uses. Rolling 7-day / 28-day unique unions are NOT derivable from a per-day
// trend, so those lines were removed rather than approximated — see the report.

export interface ActivePoint { date: string; d1: number }

async function fetchActiveMembers28d(): Promise<ActivePoint[]> {
  const { data, error } = await supabase.rpc('get_platform_activity', { p_days: 28 });
  if (error) throw error;
  const activity = Array.isArray(data) ? data[0] : undefined;
  const trend = Array.isArray(activity?.trend) ? (activity!.trend as unknown as TrendPoint[]) : [];
  return trend.map(p => ({ date: p.date, d1: p.value }));
}


export function useActiveMembers28d() {
  return useQuery({
    queryKey: ['admin-v2', 'overview', 'active-members-28d'],
    queryFn: fetchActiveMembers28d,
    staleTime: 5 * 60_000,
    refetchInterval: 10 * 60_000,
  });
}

// Delta helper.
// Returns null when there is no comparable previous period: a previous of 0
// has no percentage change, and returning 100 made "from nothing" and a
// genuine doubling indistinguishable. Callers render "New" for null.
export function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  // Round FIRST, to an INTEGER, so callers branch on the rendered value and
  // every delta in the grid carries the same precision. A one-decimal round
  // here printed "233.3%" beside "80%" - four tiles apart, one grid.
  return Math.round(((current - previous) / previous) * 100);
}
