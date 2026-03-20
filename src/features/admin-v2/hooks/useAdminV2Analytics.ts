import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CourseRatingAggregateRow {
  course_id:         string | null;
  avg_overall_score: number | null;
  review_count:      number | null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type AnalyticsPeriod = '7d' | '14d' | '30d' | '90d';

export interface DailyBucket { date: string; value: number; }

export interface PlatformAnalyticsData {
  period:       AnalyticsPeriod;
  signupTrend:  DailyBucket[];
  dau:          DailyBucket[];
  totalUsers:   number;
  newThisPeriod:number;
  avgDau:       number;
  peakDau:      number;
  retentionD7:  number | null;
}

export interface ContentAnalyticsData {
  period:        AnalyticsPeriod;
  postsTrend:    DailyBucket[];
  reviewsTrend:  DailyBucket[];
  totalPosts:    number;
  totalReviews:  number;
  postsThisPeriod:   number;
  reviewsThisPeriod: number;
  topReviewedCourses: { name: string; country: string; count: number; avgRating: number }[];
}

export interface AuthAnalyticsData {
  period:            AnalyticsPeriod;
  signupSuccessTrend: DailyBucket[];
  signupFailTrend:    DailyBucket[];
  loginSuccessTrend:  DailyBucket[];
  loginFailTrend:     DailyBucket[];
  totalSignups:       number;
  totalLogins:        number;
  failedLogins:       number;
  signupFailRate:     number;
  loginFailRate:      number;
  onboardingComplete: number;
  onboardingTotal:    number;
  profileIssues:      { id: string; username: string | null; issue: string; createdAt: string }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function periodToDays(p: AnalyticsPeriod): number {
  return p === '7d' ? 7 : p === '14d' ? 14 : p === '30d' ? 30 : 90;
}

function startOf(period: AnalyticsPeriod): Date {
  const d = new Date();
  d.setDate(d.getDate() - periodToDays(period));
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateKey(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
}

function emptyBuckets(days: number): Record<string, number> {
  const b: Record<string, number> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    b[toDateKey(d.toISOString())] = 0;
  }
  return b;
}

function fillBuckets(
  rows: { created_at: string }[],
  days: number
): DailyBucket[] {
  const b = emptyBuckets(days);
  for (const r of rows) {
    const k = toDateKey(r.created_at);
    if (k in b) b[k]++;
  }
  return Object.entries(b).map(([date, value]) => ({ date, value }));
}

function uniqueDailyUsers(
  rows: { created_at: string; user_id: string | null }[],
  days: number
): DailyBucket[] {
  const dayMap: Record<string, Set<string>> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayMap[toDateKey(d.toISOString())] = new Set();
  }
  for (const r of rows) {
    if (!r.user_id) continue;
    const k = toDateKey(r.created_at);
    if (k in dayMap) dayMap[k].add(r.user_id);
  }
  return Object.entries(dayMap).map(([date, set]) => ({ date, value: set.size }));
}

// ─── Platform analytics fetcher ───────────────────────────────────────────────

async function fetchPlatformAnalytics(period: AnalyticsPeriod): Promise<PlatformAnalyticsData> {
  const days  = periodToDays(period);
  const since = startOf(period).toISOString();

  const [allUsers, newUsers, activeEvents] = await Promise.all([
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('user_profiles').select('created_at').gte('created_at', since).is('deleted_at', null),
    supabase.from('analytics_events').select('created_at, user_id').gte('created_at', since).not('user_id', 'is', null),
  ]);

  const signupTrend = fillBuckets(newUsers.data ?? [], days);
  const dau         = uniqueDailyUsers(
    (activeEvents.data ?? []) as { created_at: string; user_id: string | null }[],
    days
  );
  const dauValues   = dau.map(d => d.value);
  const avgDau      = dauValues.length ? Math.round(dauValues.reduce((a, b) => a + b, 0) / dauValues.length) : 0;
  const peakDau     = dauValues.length ? Math.max(...dauValues) : 0;

  return {
    period,
    signupTrend,
    dau,
    totalUsers:    allUsers.count ?? 0,
    newThisPeriod: newUsers.data?.length ?? 0,
    avgDau,
    peakDau,
    retentionD7:   null,
  };
}

// ─── Content analytics fetcher ────────────────────────────────────────────────

async function fetchContentAnalytics(period: AnalyticsPeriod): Promise<ContentAnalyticsData> {
  const days  = periodToDays(period);
  const since = startOf(period).toISOString();

  const [posts, reviews, topRatingsRes] = await Promise.all([
    supabase.from('posts').select('created_at').gte('created_at', since),
    supabase.from('course_ratings').select('created_at').gte('created_at', since),
    supabase
      .from('course_rating_aggregates' as any)
      .select('course_id, review_count, avg_overall_score')
      .order('review_count', { ascending: false })
      .limit(10),
  ]);

  const topRatings = (topRatingsRes.data ?? []) as unknown as CourseRatingAggregateRow[];
  const topCourseIds = topRatings.map(r => r.course_id).filter(Boolean) as string[];
  const { data: topCourseNames } = topCourseIds.length > 0
    ? await supabase.from('golf_courses').select('id, name, country').in('id', topCourseIds)
    : { data: [] };

  const courseNameMap = new Map((topCourseNames ?? []).map(c => [c.id, c]));

  const totalPostsRes   = await supabase.from('posts').select('id', { count: 'exact', head: true });
  const totalReviewsRes = await supabase.from('course_ratings').select('id', { count: 'exact', head: true });

  return {
    period,
    postsTrend:    fillBuckets(posts.data ?? [], days),
    reviewsTrend:  fillBuckets(reviews.data ?? [], days),
    totalPosts:    totalPostsRes.count ?? 0,
    totalReviews:  totalReviewsRes.count ?? 0,
    postsThisPeriod:   posts.data?.length ?? 0,
    reviewsThisPeriod: reviews.data?.length ?? 0,
    topReviewedCourses: topRatings.map(r => ({
      name:      courseNameMap.get(r.course_id ?? '')?.name ?? 'Unknown',
      country:   courseNameMap.get(r.course_id ?? '')?.country ?? '',
      count:     r.review_count ?? 0,
      avgRating: r.avg_overall_score ?? 0,
    })),
  };
}

// ─── Auth analytics fetcher ───────────────────────────────────────────────────

async function fetchAuthAnalytics(period: AnalyticsPeriod): Promise<AuthAnalyticsData> {
  const days  = periodToDays(period);
  const since = startOf(period).toISOString();

  const authEventNames = ['signup_success', 'signup_failed', 'login_success', 'login_failed', 'auth_failed'];

  const [authEvents, totalProfilesRes, completedOnboardingRes, profileIssuesData] = await Promise.all([
    supabase
      .from('analytics_events')
      .select('created_at, name, user_id')
      .in('name', authEventNames)
      .gte('created_at', since),
    supabase.from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null),
    supabase.from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('has_completed_onboarding', true),
    supabase.from('user_profiles')
      .select('id, username, has_completed_onboarding, profile_photo_url, created_at')
      .is('deleted_at', null)
      .or('has_completed_onboarding.is.false,profile_photo_url.is.null,username.is.null')
      .limit(20)
      .order('created_at', { ascending: false }),
  ]);

  const events = authEvents.data ?? [];

  const signupSuccess = events.filter(e => e.name === 'signup_success');
  const signupFail    = events.filter(e => e.name === 'signup_failed');
  const loginSuccess  = events.filter(e => e.name === 'login_success');
  const loginFail     = events.filter(e => e.name === 'login_failed' || e.name === 'auth_failed');

  const onboardingTotal    = totalProfilesRes.count ?? 0;
  const onboardingComplete = completedOnboardingRes.count ?? 0;

  const profileIssues = (profileIssuesData.data ?? []).map((p: any) => ({
    id:        p.id,
    username:  p.username,
    issue:     !p.has_completed_onboarding
      ? 'Incomplete onboarding'
      : !p.profile_photo_url
        ? 'No avatar'
        : 'Missing username',
    createdAt: p.created_at,
  }));

  const totalSignups = signupSuccess.length + signupFail.length;
  const totalLogins  = loginSuccess.length + loginFail.length;

  return {
    period,
    signupSuccessTrend: fillBuckets(signupSuccess, days),
    signupFailTrend:    fillBuckets(signupFail,    days),
    loginSuccessTrend:  fillBuckets(loginSuccess,  days),
    loginFailTrend:     fillBuckets(loginFail,     days),
    totalSignups,
    totalLogins,
    failedLogins:    loginFail.length,
    signupFailRate:  totalSignups > 0 ? Math.round((signupFail.length / totalSignups) * 100) : 0,
    loginFailRate:   totalLogins  > 0 ? Math.round((loginFail.length  / totalLogins)  * 100) : 0,
    onboardingComplete,
    onboardingTotal,
    profileIssues,
  };
}

// ─── Exported hooks ───────────────────────────────────────────────────────────

export function usePlatformAnalytics(period: AnalyticsPeriod) {
  return useQuery({
    queryKey:  ['admin-v2', 'analytics', 'platform', period],
    queryFn:   () => fetchPlatformAnalytics(period),
    staleTime: 5 * 60_000,
  });
}

export function useContentAnalytics(period: AnalyticsPeriod) {
  return useQuery({
    queryKey:  ['admin-v2', 'analytics', 'content', period],
    queryFn:   () => fetchContentAnalytics(period),
    staleTime: 5 * 60_000,
  });
}

export function useAuthAnalytics(period: AnalyticsPeriod) {
  return useQuery({
    queryKey:  ['admin-v2', 'analytics', 'auth', period],
    queryFn:   () => fetchAuthAnalytics(period),
    staleTime: 5 * 60_000,
  });
}
