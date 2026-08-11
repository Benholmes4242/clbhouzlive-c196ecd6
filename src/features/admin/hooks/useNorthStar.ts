import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NorthStarData {
  dauToday: number;
  dauYesterday: number;
  wau: number;
  /**
   * Prior 7-day window (7–14d ago) unique actives. NOT AVAILABLE.
   * get_platform_activity exposes only the current WAU; a union of unique
   * user_ids over a prior window cannot be derived from the per-day trend
   * (daily DAUs cannot be summed into a unique count). Reported, not guessed.
   */
  wauPrev: number | null;
  mau: number;
  signups7d: number;
  signupsPrev7d: number;
  d1Retention: number | null;
  d7Retention: number | null;

  totalUsers: number;
}

type TrendPoint = { date: string; value: number };

function calcDelta(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

async function fetchNorthStar(): Promise<NorthStarData> {
  const now = Date.now();
  const day = 86_400_000;
  const sevenAgo = new Date(now - 7 * day);
  const fourteenAgo = new Date(now - 14 * day);

  const [
    activityRes,
    signups7Res,
    signupsPrev7Res,
    totalUsersRes,
    signupsD1Res,
    signupsD7Res,
    activityD1Res,
  ] = await Promise.all([
    // Distinct-user counting is an aggregation: it runs in the database.
    supabase.rpc('get_platform_activity', { p_days: 30 }),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }).is('deleted_at', null).gte('created_at', sevenAgo.toISOString()),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }).is('deleted_at', null).gte('created_at', fourteenAgo.toISOString()).lt('created_at', sevenAgo.toISOString()),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    // D1 cohort: signed up 2 days ago (window 2d..1d)
    supabase.from('user_profiles').select('id').is('deleted_at', null).gte('created_at', new Date(now - 2 * day).toISOString()).lt('created_at', new Date(now - 1 * day).toISOString()).limit(2000),
    // D7 cohort: signed up 8 days ago (window 8d..7d)
    supabase.from('user_profiles').select('id').is('deleted_at', null).gte('created_at', new Date(now - 8 * day).toISOString()).lt('created_at', new Date(now - 7 * day).toISOString()).limit(2000),
    // Cohort retention needs member IDENTITIES, not a count, so no RPC can serve
    // it today. Single-day window, so the cap is not biting; flagged in the report.
    supabase.from('analytics_events').select('user_id').gte('created_at', new Date(now - 1 * day).toISOString()).not('user_id', 'is', null).limit(50000),
  ]);

  const activity = Array.isArray(activityRes.data) ? activityRes.data[0] : undefined;
  const trend: TrendPoint[] = Array.isArray(activity?.trend) ? (activity!.trend as unknown as TrendPoint[]) : [];

  const dauToday = activity?.dau_today ?? 0;
  const dauYesterday = trend.length >= 2 ? (trend[trend.length - 2]?.value ?? 0) : 0;
  const wau = activity?.wau ?? 0;
  const mau = activity?.mau ?? 0;

  const activeIds = new Set(((activityD1Res.data ?? []) as { user_id: string | null }[]).filter(r => r.user_id).map(r => r.user_id as string));

  const d1Cohort = signupsD1Res.data ?? [];
  const d7Cohort = signupsD7Res.data ?? [];
  const MIN_COHORT = 3;
  const d1Retention = d1Cohort.length >= MIN_COHORT
    ? Math.round((d1Cohort.filter(u => activeIds.has(u.id)).length / d1Cohort.length) * 100)
    : null;
  const d7Retention = d7Cohort.length >= MIN_COHORT
    ? Math.round((d7Cohort.filter(u => activeIds.has(u.id)).length / d7Cohort.length) * 100)
    : null;


  return {
    dauToday,
    dauYesterday,
    wau,
    wauPrev: null,
    mau,
    signups7d: signups7Res.count ?? 0,
    signupsPrev7d: signupsPrev7Res.count ?? 0,
    d1Retention,
    d7Retention,
    totalUsers: totalUsersRes.count ?? 0,
  };
}

export function useNorthStar() {
  return useQuery({
    queryKey: ['admin-v2', 'dashboard', 'north-star'],
    queryFn: fetchNorthStar,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

export const northStarDelta = calcDelta;
