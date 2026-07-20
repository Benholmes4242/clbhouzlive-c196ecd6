import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NorthStarData {
  dauToday: number;
  dauYesterday: number;
  wau: number;
  wauPrev: number;
  mau: number;
  signups7d: number;
  signupsPrev7d: number;
  d1Retention: number | null;
  d7Retention: number | null;

  totalUsers: number;
}

function calcDelta(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

async function fetchNorthStar(): Promise<NorthStarData> {
  const now = Date.now();
  const day = 86_400_000;
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday.getTime() - day);
  const sevenAgo = new Date(now - 7 * day);
  const fourteenAgo = new Date(now - 14 * day);
  const thirtyAgo = new Date(now - 30 * day);

  const [
    dauTodayRes,
    dauYestRes,
    wauRes,
    wauPrevRes,
    mauRes,
    signups7Res,
    signupsPrev7Res,
    totalUsersRes,
    signupsD1Res,
    signupsD7Res,
    activityD1Res,
    activityD7Res,
  ] = await Promise.all([
    supabase.from('analytics_events').select('user_id').gte('created_at', startOfToday.toISOString()).not('user_id', 'is', null).limit(50000),
    supabase.from('analytics_events').select('user_id').gte('created_at', startOfYesterday.toISOString()).lt('created_at', startOfToday.toISOString()).not('user_id', 'is', null).limit(50000),
    supabase.from('analytics_events').select('user_id').gte('created_at', sevenAgo.toISOString()).not('user_id', 'is', null).limit(50000),
    supabase.from('analytics_events').select('user_id').gte('created_at', fourteenAgo.toISOString()).lt('created_at', sevenAgo.toISOString()).not('user_id', 'is', null).limit(50000),
    supabase.from('analytics_events').select('user_id').gte('created_at', thirtyAgo.toISOString()).not('user_id', 'is', null).limit(50000),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }).is('deleted_at', null).gte('created_at', sevenAgo.toISOString()),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }).is('deleted_at', null).gte('created_at', fourteenAgo.toISOString()).lt('created_at', sevenAgo.toISOString()),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    // D1 cohort: signed up 2 days ago (window 2d..1d)
    supabase.from('user_profiles').select('id').is('deleted_at', null).gte('created_at', new Date(now - 2 * day).toISOString()).lt('created_at', new Date(now - 1 * day).toISOString()).limit(2000),
    // D7 cohort: signed up 8 days ago (window 8d..7d)
    supabase.from('user_profiles').select('id').is('deleted_at', null).gte('created_at', new Date(now - 8 * day).toISOString()).lt('created_at', new Date(now - 7 * day).toISOString()).limit(2000),
    // Activity 1..0 days ago window
    supabase.from('analytics_events').select('user_id').gte('created_at', new Date(now - 1 * day).toISOString()).not('user_id', 'is', null).limit(50000),
    // Activity 1..0 days ago window (same as above, reused for D7 lookup — we still need it, alias)
    supabase.from('analytics_events').select('user_id').gte('created_at', new Date(now - 1 * day).toISOString()).not('user_id', 'is', null).limit(50000),
  ]);

  const uniq = (rows: any[]) => new Set(rows.filter(r => r.user_id).map(r => r.user_id as string));

  const dauToday = uniq(dauTodayRes.data ?? []).size;
  const dauYesterday = uniq(dauYestRes.data ?? []).size;
  const wau = uniq(wauRes.data ?? []).size;
  const wauPrev = uniq(wauPrevRes.data ?? []).size;
  const mau = uniq(mauRes.data ?? []).size;

  const activeIds = uniq(activityD1Res.data ?? []);
  const activeIdsD7 = uniq(activityD7Res.data ?? []);

  const d1Cohort = signupsD1Res.data ?? [];
  const d7Cohort = signupsD7Res.data ?? [];
  const MIN_COHORT = 3;
  const d1Retention = d1Cohort.length >= MIN_COHORT
    ? Math.round((d1Cohort.filter(u => activeIds.has(u.id)).length / d1Cohort.length) * 100)
    : null;
  const d7Retention = d7Cohort.length >= MIN_COHORT
    ? Math.round((d7Cohort.filter(u => activeIdsD7.has(u.id)).length / d7Cohort.length) * 100)
    : null;


  return {
    dauToday,
    dauYesterday,
    wau,
    wauPrev,
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
