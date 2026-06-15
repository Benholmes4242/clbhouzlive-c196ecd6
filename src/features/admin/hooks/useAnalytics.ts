import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AnalyticsPeriod = '7d' | '14d' | '30d' | '90d';
export interface DailyBucket { date: string; value: number; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function periodToDays(p: AnalyticsPeriod): number {
  return p === '7d' ? 7 : p === '14d' ? 14 : p === '30d' ? 30 : 90;
}
function startOf(period: AnalyticsPeriod): Date {
  const d = new Date();
  d.setDate(d.getDate() - periodToDays(period));
  d.setHours(0, 0, 0, 0);
  return d;
}
function toDateKey(iso: string | Date): string {
  return new Date(iso).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
}
function emptyBuckets(days: number): Record<string, number> {
  const b: Record<string, number> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    b[toDateKey(d)] = 0;
  }
  return b;
}
function fillBuckets(rows: { created_at: string }[], days: number): DailyBucket[] {
  const b = emptyBuckets(days);
  for (const r of rows) {
    const k = toDateKey(r.created_at);
    if (k in b) b[k]++;
  }
  return Object.entries(b).map(([date, value]) => ({ date, value }));
}
function uniqueDailyUsers(
  rows: { created_at: string; user_id: string | null }[],
  days: number,
): DailyBucket[] {
  const dayMap: Record<string, Set<string>> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayMap[toDateKey(d)] = new Set();
  }
  for (const r of rows) {
    if (!r.user_id) continue;
    const k = toDateKey(r.created_at);
    if (k in dayMap) dayMap[k].add(r.user_id);
  }
  return Object.entries(dayMap).map(([date, set]) => ({ date, value: set.size }));
}

// ─── Platform ─────────────────────────────────────────────────────────────────

export interface PlatformAnalyticsData {
  period: AnalyticsPeriod;
  signupTrend: DailyBucket[];
  dau: DailyBucket[];
  totalUsers: number;
  newThisPeriod: number;
  avgDau: number;
  peakDau: number;
  wau: number;
  mau: number;
  dauMauRatio: number;
  echoTotal: number;
  echoUniqueUsers: number;
}

async function fetchPlatform(period: AnalyticsPeriod): Promise<PlatformAnalyticsData> {
  const days = periodToDays(period);
  const since = startOf(period).toISOString();

  const [allUsers, newUsers, activeEvents, wauRes, mauRes, echoRes] = await Promise.all([
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('user_profiles').select('created_at').gte('created_at', since).is('deleted_at', null),
    supabase.from('analytics_events').select('created_at, user_id').gte('created_at', since).not('user_id', 'is', null).limit(50000),
    supabase.from('analytics_events').select('user_id').gte('created_at', new Date(Date.now() - 7 * 86400_000).toISOString()).not('user_id', 'is', null).limit(50000),
    supabase.from('analytics_events').select('user_id').gte('created_at', new Date(Date.now() - 30 * 86400_000).toISOString()).not('user_id', 'is', null).limit(50000),
    supabase.from('analytics_events').select('user_id').eq('name', 'echo_query').gte('created_at', since).limit(5000),
  ]);

  const signupTrend = fillBuckets(newUsers.data ?? [], days);
  const dau = uniqueDailyUsers((activeEvents.data ?? []) as any, days);
  const dauValues = dau.map(d => d.value);
  const avgDau = dauValues.length ? Math.round(dauValues.reduce((a, b) => a + b, 0) / dauValues.length) : 0;
  const peakDau = dauValues.length ? Math.max(...dauValues) : 0;
  const wau = new Set((wauRes.data ?? []).map(r => r.user_id)).size;
  const mau = new Set((mauRes.data ?? []).map(r => r.user_id)).size;
  const dauMauRatio = mau > 0 ? Math.round((avgDau / mau) * 1000) / 10 : 0;

  const echoRows = echoRes.data ?? [];
  const echoTotal = echoRows.length;
  const echoUniqueUsers = new Set(echoRows.filter(r => r.user_id).map(r => r.user_id!)).size;

  return {
    period,
    signupTrend,
    dau,
    totalUsers: allUsers.count ?? 0,
    newThisPeriod: newUsers.data?.length ?? 0,
    avgDau,
    peakDau,
    wau,
    mau,
    dauMauRatio,
    echoTotal,
    echoUniqueUsers,
  };
}

export function usePlatformAnalytics(period: AnalyticsPeriod) {
  return useQuery({ queryKey: ['admin-v2', 'analytics', 'platform', period], queryFn: () => fetchPlatform(period), staleTime: 5 * 60_000 });
}

// ─── Engagement ───────────────────────────────────────────────────────────────

export interface EngagementAnalyticsData {
  totalEvents: number;
  avgEventsPerUserPerDay: number;
  uniqueUsers: number;
  busiestHour: number;
  dailyTrend: DailyBucket[];
  topEvents: { name: string; count: number; uniqueUsers: number }[];
  hourlyBreakdown: { hour: number; count: number }[];
  social: { messagesSent: number; followActions: number; friendRequests: number };
}

async function fetchEngagement(period: AnalyticsPeriod): Promise<EngagementAnalyticsData> {
  const days = periodToDays(period);
  const since = startOf(period).toISOString();

  const [eventsRes, msgRes, followRes, friendRes] = await Promise.all([
    supabase.from('analytics_events').select('created_at, name, user_id').gte('created_at', since).limit(10000),
    supabase.from('analytics_events').select('id', { count: 'exact', head: true }).eq('name', 'message_sent').gte('created_at', since),
    supabase.from('analytics_events').select('id', { count: 'exact', head: true }).eq('name', 'social_follow_toggled').gte('created_at', since),
    supabase.from('analytics_events').select('id', { count: 'exact', head: true }).eq('name', 'social_friend_request_sent').gte('created_at', since),
  ]);

  const rows = eventsRes.data ?? [];
  const totalEvents = rows.length;
  const userIds = new Set(rows.filter(r => r.user_id).map(r => r.user_id!));
  const uniqueUsers = userIds.size;
  const avgEventsPerUserPerDay = uniqueUsers > 0 && days > 0
    ? Math.round((totalEvents / uniqueUsers / days) * 10) / 10
    : 0;

  const hourCounts: Record<number, number> = {};
  for (const r of rows) {
    const h = new Date(r.created_at).getHours();
    hourCounts[h] = (hourCounts[h] || 0) + 1;
  }
  const busiestEntry = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
  const busiestHour = busiestEntry ? parseInt(busiestEntry[0]) : 0;
  const dailyTrend = fillBuckets(rows, days);

  const eventCounts: Record<string, { count: number; users: Set<string> }> = {};
  for (const r of rows) {
    if (!eventCounts[r.name]) eventCounts[r.name] = { count: 0, users: new Set() };
    eventCounts[r.name].count++;
    if (r.user_id) eventCounts[r.name].users.add(r.user_id);
  }
  const topEvents = Object.entries(eventCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20)
    .map(([name, d]) => ({ name, count: d.count, uniqueUsers: d.users.size }));

  const hourlyBreakdown: { hour: number; count: number }[] = [];
  for (let h = 0; h < 24; h++) hourlyBreakdown.push({ hour: h, count: hourCounts[h] || 0 });

  return {
    totalEvents,
    avgEventsPerUserPerDay,
    uniqueUsers,
    busiestHour,
    dailyTrend,
    topEvents,
    hourlyBreakdown,
    social: {
      messagesSent: msgRes.count ?? 0,
      followActions: followRes.count ?? 0,
      friendRequests: friendRes.count ?? 0,
    },
  };
}

export function useEngagementAnalytics(period: AnalyticsPeriod) {
  return useQuery({ queryKey: ['admin-v2', 'analytics', 'engagement', period], queryFn: () => fetchEngagement(period), staleTime: 5 * 60_000 });
}

// ─── Retention ────────────────────────────────────────────────────────────────

export interface RetentionCohort {
  cohortLabel: string;
  cohortSize: number;
  retention: (number | null)[];
}
export interface RetentionData {
  cohorts: RetentionCohort[];
  d7Retention: number;
  d30Retention: number;
  avgSessionLength: number;
  churnRisk: number;
}

async function fetchRetention(): Promise<RetentionData> {
  const since = new Date();
  since.setDate(since.getDate() - 84);

  const [usersRes, eventsRes] = await Promise.all([
    supabase.from('user_profiles').select('id, created_at').gte('created_at', since.toISOString()).is('deleted_at', null).limit(10000),
    supabase.from('analytics_events').select('user_id, created_at').gte('created_at', since.toISOString()).not('user_id', 'is', null).limit(50000),
  ]);
  const users = usersRes.data ?? [];
  const events = eventsRes.data ?? [];

  const userActivity = new Map<string, Set<number>>();
  for (const e of events) {
    if (!e.user_id) continue;
    const weekNum = Math.floor((Date.now() - new Date(e.created_at).getTime()) / (7 * 86400_000));
    if (!userActivity.has(e.user_id)) userActivity.set(e.user_id, new Set());
    userActivity.get(e.user_id)!.add(weekNum);
  }

  const cohorts: Record<number, string[]> = {};
  for (const u of users) {
    const signupWeek = Math.floor((Date.now() - new Date(u.created_at).getTime()) / (7 * 86400_000));
    if (!cohorts[signupWeek]) cohorts[signupWeek] = [];
    cohorts[signupWeek].push(u.id);
  }

  const cohortRows: RetentionCohort[] = Object.entries(cohorts)
    .filter(([week]) => parseInt(week) <= 11)
    .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
    .map(([cohortWeek, userIds]) => {
      const weekNum = parseInt(cohortWeek);
      const retention = Array.from({ length: 9 }, (_, offset) => {
        const targetWeek = weekNum - offset;
        if (targetWeek < 0) return null;
        const active = userIds.filter(id => userActivity.get(id)?.has(targetWeek)).length;
        return userIds.length > 0 ? Math.round((active / userIds.length) * 100) : 0;
      });
      return {
        cohortLabel: `Week of ${new Date(Date.now() - weekNum * 7 * 86400_000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
        cohortSize: userIds.length,
        retention,
      };
    });

  const d7Users = users.filter(u => {
    const age = Date.now() - new Date(u.created_at).getTime();
    return age >= 7 * 86400_000 && age < 14 * 86400_000;
  });
  const d7Active = d7Users.filter(u => userActivity.get(u.id)?.has(0)).length;
  const d7Retention = d7Users.length > 0 ? Math.round((d7Active / d7Users.length) * 100) : 0;

  const d30Users = users.filter(u => {
    const age = Date.now() - new Date(u.created_at).getTime();
    return age >= 30 * 86400_000 && age < 60 * 86400_000;
  });
  const d30Active = d30Users.filter(u => {
    const weeks = userActivity.get(u.id);
    if (!weeks) return false;
    return [...weeks].some(w => w < 5);
  }).length;
  const d30Retention = d30Users.length > 0 ? Math.round((d30Active / d30Users.length) * 100) : 0;

  const { data: exitEvents } = await supabase
    .from('analytics_events')
    .select('props')
    .eq('name', 'page_exit')
    .gte('created_at', new Date(Date.now() - 30 * 86400_000).toISOString())
    .limit(5000);
  const durations = (exitEvents ?? [])
    .map(e => (e.props as any)?.duration_sec)
    .filter((d): d is number => typeof d === 'number' && d > 0 && d < 3600);
  const avgSessionLength = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  const churnRisk = users.filter(u => {
    const weeks = userActivity.get(u.id);
    if (!weeks) return false;
    return weeks.has(1) && !weeks.has(0);
  }).length;

  return { cohorts: cohortRows, d7Retention, d30Retention, avgSessionLength, churnRisk };
}

export function useRetentionAnalytics() {
  return useQuery({ queryKey: ['admin-v2', 'analytics', 'retention'], queryFn: fetchRetention, staleTime: 5 * 60_000 });
}

// ─── Growth ───────────────────────────────────────────────────────────────────

export interface FunnelStep { label: string; count: number; pct: number; dropPct: number; }
export interface GeoRow { country: string; userCount: number; newThisPeriod: number; pctOfTotal: number; }
export interface GrowthData { funnel: FunnelStep[]; geo: GeoRow[]; }

async function fetchGrowth(period: AnalyticsPeriod): Promise<GrowthData> {
  const since = startOf(period).toISOString();

  // Funnel — only stages with confirmed real events
  const [signupAttempts, signupSuccess, onboardingStarted, onboardingComplete, addedPhoto, allRes, newRes] = await Promise.all([
    supabase.from('analytics_events').select('id', { count: 'exact', head: true })
      .in('name', ['signup_success', 'signup_failed']).gte('created_at', since),
    supabase.from('analytics_events').select('id', { count: 'exact', head: true })
      .eq('name', 'signup_success').gte('created_at', since),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true })
      .gte('created_at', since).is('deleted_at', null),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true })
      .gte('created_at', since).is('deleted_at', null).eq('has_completed_onboarding', true),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true })
      .gte('created_at', since).is('deleted_at', null).not('profile_photo_url', 'is', null),
    supabase.from('user_profiles').select('country').is('deleted_at', null).not('country', 'is', null),
    supabase.from('user_profiles').select('country').is('deleted_at', null).not('country', 'is', null).gte('created_at', since),
  ]);

  const rawCounts = [
    signupAttempts.count ?? 0,
    signupSuccess.count ?? 0,
    onboardingStarted.count ?? 0,
    onboardingComplete.count ?? 0,
    addedPhoto.count ?? 0,
  ];
  const labels = ['Signup Attempted', 'Account Created', 'Profile Started', 'Onboarding Complete', 'Photo Added'];
  const top = rawCounts[0] || 1;
  const funnel: FunnelStep[] = rawCounts.map((count, i) => ({
    label: labels[i],
    count,
    pct: Math.round((count / top) * 100),
    dropPct: i === 0 ? 0 : rawCounts[i - 1] > 0
      ? Math.round(((rawCounts[i - 1] - count) / rawCounts[i - 1]) * 100)
      : 0,
  }));

  const allRows = allRes.data ?? [];
  const newRows = newRes.data ?? [];
  const total = allRows.length || 1;
  const countryTotals = new Map<string, number>();
  const countryNew = new Map<string, number>();
  for (const r of allRows) if (r.country) countryTotals.set(r.country, (countryTotals.get(r.country) ?? 0) + 1);
  for (const r of newRows) if (r.country) countryNew.set(r.country, (countryNew.get(r.country) ?? 0) + 1);
  const geo: GeoRow[] = Array.from(countryTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([country, userCount]) => ({
      country,
      userCount,
      newThisPeriod: countryNew.get(country) ?? 0,
      pctOfTotal: Math.round((userCount / total) * 100 * 10) / 10,
    }));

  return { funnel, geo };
}

export function useGrowthAnalytics(period: AnalyticsPeriod) {
  return useQuery({ queryKey: ['admin-v2', 'analytics', 'growth', period], queryFn: () => fetchGrowth(period), staleTime: 5 * 60_000 });
}

// ─── Content ──────────────────────────────────────────────────────────────────

interface CourseRatingAggregateRow { course_id: string | null; avg_overall_score: number | null; review_count: number | null; }

export interface ContentAnalyticsData {
  postsTrend: DailyBucket[];
  reviewsTrend: DailyBucket[];
  totalPosts: number;
  totalReviews: number;
  postsThisPeriod: number;
  reviewsThisPeriod: number;
  videoPostsThisPeriod: number;
  topReviewedCourses: { name: string; country: string; count: number; avgRating: number }[];
}

async function fetchContent(period: AnalyticsPeriod): Promise<ContentAnalyticsData> {
  const days = periodToDays(period);
  const since = startOf(period).toISOString();

  const [posts, reviews, topRatingsRes, totalPostsRes, totalReviewsRes, videoPostsRes] = await Promise.all([
    supabase.from('posts').select('created_at').gte('created_at', since).limit(10000),
    supabase.from('course_ratings').select('created_at').gte('created_at', since).limit(10000),
    supabase.from('course_rating_aggregates' as any).select('course_id, review_count, avg_overall_score').order('review_count', { ascending: false }).limit(10),
    supabase.from('posts').select('id', { count: 'exact', head: true }),
    supabase.from('course_ratings').select('id', { count: 'exact', head: true }),
    supabase.from('post_media').select('post_id', { count: 'exact', head: true }).eq('media_type', 'video').gte('created_at', since),
  ]);

  const topRatings = (topRatingsRes.data ?? []) as unknown as CourseRatingAggregateRow[];
  const topCourseIds = topRatings.map(r => r.course_id).filter(Boolean) as string[];
  const { data: topCourseNames } = topCourseIds.length > 0
    ? await supabase.from('golf_courses').select('id, name, country').in('id', topCourseIds)
    : { data: [] };
  const courseNameMap = new Map((topCourseNames ?? []).map(c => [c.id, c]));

  return {
    postsTrend: fillBuckets(posts.data ?? [], days),
    reviewsTrend: fillBuckets(reviews.data ?? [], days),
    totalPosts: totalPostsRes.count ?? 0,
    totalReviews: totalReviewsRes.count ?? 0,
    postsThisPeriod: posts.data?.length ?? 0,
    reviewsThisPeriod: reviews.data?.length ?? 0,
    videoPostsThisPeriod: videoPostsRes.count ?? 0,
    topReviewedCourses: topRatings.map(r => ({
      name: courseNameMap.get(r.course_id ?? '')?.name ?? 'Unknown',
      country: courseNameMap.get(r.course_id ?? '')?.country ?? '',
      count: r.review_count ?? 0,
      avgRating: r.avg_overall_score ?? 0,
    })),
  };
}

export function useContentAnalytics(period: AnalyticsPeriod) {
  return useQuery({ queryKey: ['admin-v2', 'analytics', 'content', period], queryFn: () => fetchContent(period), staleTime: 5 * 60_000 });
}

// ─── Auth & Security ──────────────────────────────────────────────────────────

export interface AuthAnalyticsData {
  signupSuccessTrend: DailyBucket[];
  signupFailTrend: DailyBucket[];
  loginSuccessTrend: DailyBucket[];
  loginFailTrend: DailyBucket[];
  totalSignups: number;
  totalLogins: number;
  failedLogins: number;
  signupFailRate: number;
  loginFailRate: number;
  onboardingComplete: number;
  onboardingTotal: number;
}

async function fetchAuth(period: AnalyticsPeriod): Promise<AuthAnalyticsData> {
  const days = periodToDays(period);
  const since = startOf(period).toISOString();
  const names = ['signup_success', 'signup_failed', 'login_success', 'login_failed', 'auth_failed'];

  const [authEvents, totalProfilesRes, completedOnboardingRes] = await Promise.all([
    supabase.from('analytics_events').select('created_at, name, user_id').in('name', names).gte('created_at', since).limit(10000),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }).is('deleted_at', null).eq('has_completed_onboarding', true),
  ]);

  const events = authEvents.data ?? [];
  const signupSuccess = events.filter(e => e.name === 'signup_success');
  const signupFail = events.filter(e => e.name === 'signup_failed');
  const loginSuccess = events.filter(e => e.name === 'login_success');
  const loginFail = events.filter(e => e.name === 'login_failed' || e.name === 'auth_failed');

  const totalSignups = signupSuccess.length + signupFail.length;
  const totalLogins = loginSuccess.length + loginFail.length;

  return {
    signupSuccessTrend: fillBuckets(signupSuccess, days),
    signupFailTrend: fillBuckets(signupFail, days),
    loginSuccessTrend: fillBuckets(loginSuccess, days),
    loginFailTrend: fillBuckets(loginFail, days),
    totalSignups,
    totalLogins,
    failedLogins: loginFail.length,
    signupFailRate: totalSignups > 0 ? Math.round((signupFail.length / totalSignups) * 100) : 0,
    loginFailRate: totalLogins > 0 ? Math.round((loginFail.length / totalLogins) * 100) : 0,
    onboardingComplete: completedOnboardingRes.count ?? 0,
    onboardingTotal: totalProfilesRes.count ?? 0,
  };
}

export function useAuthAnalytics(period: AnalyticsPeriod) {
  return useQuery({ queryKey: ['admin-v2', 'analytics', 'auth', period], queryFn: () => fetchAuth(period), staleTime: 5 * 60_000 });
}
