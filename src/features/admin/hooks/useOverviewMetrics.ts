/**
 * ⚠️ POSTGREST RETURNS AT MOST 2000 ROWS — whatever `.limit()` says.
 *
 * Measured 7 Sep 2026: a request for 50,000 rows against a 23,295-row table
 * came back with exactly 2000. analytics_events holds ~20,100 rows per
 * fortnight and ~50,100 per 30 days, so ANY raw select over a window wider
 * than roughly a day is silently truncated — and with no ORDER BY the 2000
 * you get are physical order, i.e. the OLDEST slice of an append-only table.
 *
 * Raising the limit does not help. Adding .order() only changes which slice
 * you lose. Distinct-user counts, totals and buckets computed in the browser
 * from a truncated pull are WRONG, not approximate.
 *
 * The fix is always the same: aggregate in Postgres behind an admin-gated RPC
 * (see get_admin_audiences / get_platform_activity) and return one row.
 */
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
    .limit(POSTGREST_ROW_CAP);
  if (error) throw error;
  // 5-minute window: far under the cap today. If it ever hits it, this figure
  // is truncated and must move into Postgres like the rest.
  assertNotTruncated('useLiveInApp', 'last 5 minutes', data?.length);
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
// Both day-long windows are counted in Postgres by get_admin_intraday. The
// browser pull that preceded it compared a partial day (under the cap) against
// a whole day (1,652 rows and climbing), so the ghost — and only the ghost —
// was the side that would truncate first, flattering today.

export interface HourPoint { hour: number; today: number | null; last: number | null }

async function fetchIntraday(): Promise<HourPoint[]> {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const { data, error } = await supabase.rpc('get_admin_intraday' as never, { p_tz: tz } as never);
  if (error) throw error;
  const payload = data as unknown as {
    current_hour: number;
    hours: { hour: number; today: number; last: number }[];
  } | null;
  if (!payload) throw new Error('get_admin_intraday returned no payload');
  return (payload.hours ?? [])
    .filter(h => h.hour <= payload.current_hour)
    .map(h => ({ hour: h.hour, today: h.today, last: h.last }));
}

export function useRightNowHourly() {
  return useQuery({
    queryKey: ['admin-v2', 'overview', 'intraday'],
    queryFn: fetchIntraday,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

// ─── METRIC SPARKLINES (14 daily counts, split into current 7d + prior 7d) ─────

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

interface OverviewSeriesRow {
  date: string;
  sessions: number;
  signups: number;
  posts: number;
  reviews: number;
}

async function fetchMetrics(): Promise<MetricsBundle> {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const [activityRes, metricsRes] = await Promise.all([
    // Distinct-user counting is an aggregation: it runs in the database.
    supabase.rpc('get_platform_activity', { p_days: 14 }),
    // So is every per-day bucket behind the "vs last week" arrows.
    supabase.rpc('get_admin_overview_metrics' as never, { p_days: 14, p_tz: tz } as never),
  ]);
  if (metricsRes.error) throw metricsRes.error;

  const payload = metricsRes.data as unknown as {
    series: OverviewSeriesRow[];
    total_users: number;
  } | null;
  if (!payload) throw new Error('get_admin_overview_metrics returned no payload');
  const series = payload.series ?? [];

  const activity = Array.isArray(activityRes.data) ? activityRes.data[0] : undefined;
  const activityTrend = Array.isArray(activity?.trend) ? (activity!.trend as unknown as TrendPoint[]) : [];
  const dauDaily = activityTrend.map(p => p.value);

  const column = (key: keyof Omit<OverviewSeriesRow, 'date'>) => series.map(r => r[key] ?? 0);

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
    signups: toSeries(column('signups')),
    sessions: toSeries(column('sessions')),
    posts: toSeries(column('posts')),
    reviews: toSeries(column('reviews')),
    totalUsers: payload.total_users ?? 0,
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
