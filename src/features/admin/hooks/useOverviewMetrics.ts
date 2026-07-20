import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const DAY = 86_400_000;

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function daysAgo(n: number) { return new Date(Date.now() - n * DAY); }
function dayKey(d: Date) { return d.toISOString().slice(0, 10); }

type EventRow = { user_id: string | null; created_at: string };

// ─── RIGHT NOW: live count (distinct users in last 5 min) ─────────────────────

async function fetchLiveCount(): Promise<number> {
  const since = new Date(Date.now() - 5 * 60_000).toISOString();
  const { data, error } = await supabase
    .from('analytics_events')
    .select('user_id')
    .gte('created_at', since)
    .not('user_id', 'is', null)
    .limit(2000);
  if (error) throw error;
  const set = new Set<string>();
  for (const r of (data as { user_id: string }[]) ?? []) if (r.user_id) set.add(r.user_id);
  return set.size;
}

export function useLiveInApp() {
  return useQuery({
    queryKey: ['admin-v2', 'overview', 'live-in-app'],
    queryFn: fetchLiveCount,
    refetchInterval: 30_000,
    staleTime: 15_000,
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

function bucketUniquesByDay(rows: EventRow[], days: number): number[] {
  const buckets: Record<string, Set<string>> = {};
  for (let i = days - 1; i >= 0; i--) buckets[dayKey(daysAgo(i))] = new Set();
  for (const r of rows) {
    if (!r.user_id) continue;
    const k = dayKey(new Date(r.created_at));
    if (k in buckets) buckets[k].add(r.user_id);
  }
  return Object.values(buckets).map(s => s.size);
}

async function fetchMetrics(): Promise<MetricsBundle> {
  const since14 = daysAgo(14).toISOString();
  const [eventsRes, sessionsRes, signupsRes, postsRes, reviewsRes, totalRes] = await Promise.all([
    supabase.from('analytics_events').select('user_id, created_at').gte('created_at', since14).not('user_id', 'is', null).limit(50000),
    supabase.from('analytics_events').select('created_at').eq('name', 'session_start').gte('created_at', since14).limit(20000),
    supabase.from('user_profiles').select('created_at').is('deleted_at', null).gte('created_at', since14).limit(20000),
    supabase.from('posts').select('created_at').gte('created_at', since14).limit(20000),
    supabase.from('course_ratings').select('created_at').gte('created_at', since14).limit(20000),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }).is('deleted_at', null),
  ]);

  const dauDaily = bucketUniquesByDay((eventsRes.data as EventRow[]) ?? [], 14);
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

// ─── ACTIVE MEMBERS: 1d / 7d / 28d rolling over the last 28 days ───────────────

export interface ActivePoint { date: string; d1: number; d7: number; d28: number }

async function fetchActiveMembers28d(): Promise<ActivePoint[]> {
  const since = daysAgo(56).toISOString();
  const { data, error } = await supabase
    .from('analytics_events')
    .select('user_id, created_at')
    .gte('created_at', since)
    .not('user_id', 'is', null)
    .limit(50000);
  if (error) throw error;

  const rows = (data as EventRow[]) ?? [];
  // Group user_ids by day
  const byDay: Map<string, Set<string>> = new Map();
  for (const r of rows) {
    if (!r.user_id) continue;
    const k = dayKey(new Date(r.created_at));
    if (!byDay.has(k)) byDay.set(k, new Set());
    byDay.get(k)!.add(r.user_id);
  }

  const points: ActivePoint[] = [];
  for (let i = 27; i >= 0; i--) {
    const target = daysAgo(i);
    const targetKey = dayKey(target);
    const d1 = byDay.get(targetKey)?.size ?? 0;
    const s7 = new Set<string>();
    const s28 = new Set<string>();
    for (let j = 0; j < 28; j++) {
      const k = dayKey(new Date(target.getTime() - j * DAY));
      const bucket = byDay.get(k);
      if (!bucket) continue;
      if (j < 7) for (const u of bucket) s7.add(u);
      for (const u of bucket) s28.add(u);
    }
    points.push({ date: targetKey, d1, d7: s7.size, d28: s28.size });
  }
  return points;
}

export function useActiveMembers28d() {
  return useQuery({
    queryKey: ['admin-v2', 'overview', 'active-members-28d'],
    queryFn: fetchActiveMembers28d,
    staleTime: 5 * 60_000,
    refetchInterval: 10 * 60_000,
  });
}

// Delta helper
export function pctDelta(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}
