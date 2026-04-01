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
  wau:          number;
  mau:          number;
  dauMauRatio:  number;
  wauTrend:     DailyBucket[];
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

  const [allUsers, newUsers, activeEvents, wauRes, mauRes] = await Promise.all([
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('user_profiles').select('created_at').gte('created_at', since).is('deleted_at', null),
    supabase.from('analytics_events').select('created_at, user_id').gte('created_at', since).not('user_id', 'is', null),
    supabase.from('analytics_events').select('user_id').gte('created_at', new Date(Date.now() - 7 * 24 * 3600_000).toISOString()).not('user_id', 'is', null).limit(50000),
    supabase.from('analytics_events').select('user_id').gte('created_at', new Date(Date.now() - 30 * 24 * 3600_000).toISOString()).not('user_id', 'is', null).limit(50000),
  ]);

  const signupTrend = fillBuckets(newUsers.data ?? [], days);
  const dau         = uniqueDailyUsers(
    (activeEvents.data ?? []) as { created_at: string; user_id: string | null }[],
    days
  );
  const dauValues   = dau.map(d => d.value);
  const avgDau      = dauValues.length ? Math.round(dauValues.reduce((a, b) => a + b, 0) / dauValues.length) : 0;
  const peakDau     = dauValues.length ? Math.max(...dauValues) : 0;

  const wau = new Set((wauRes.data ?? []).map(r => r.user_id)).size;
  const mau = new Set((mauRes.data ?? []).map(r => r.user_id)).size;
  const dauMauRatio = mau > 0 ? Math.round((avgDau / mau) * 1000) / 10 : 0;

  // Build WAU trend (rolling 7-day unique users, one point per day for last 30 days)
  const mauEvents = (mauRes.data ?? []) as { user_id: string | null }[];
  // We need created_at for WAU trend, re-fetch with created_at
  const { data: mauEventsWithDate } = await supabase
    .from('analytics_events')
    .select('created_at, user_id')
    .gte('created_at', new Date(Date.now() - 37 * 24 * 3600_000).toISOString())
    .not('user_id', 'is', null)
    .limit(50000);

  const wauTrend: DailyBucket[] = [];
  for (let i = 29; i >= 0; i--) {
    const dayEnd = new Date();
    dayEnd.setDate(dayEnd.getDate() - i);
    dayEnd.setHours(23, 59, 59, 999);
    const dayStart = new Date(dayEnd);
    dayStart.setDate(dayStart.getDate() - 7);

    const uniqueUsers = new Set<string>();
    for (const e of mauEventsWithDate ?? []) {
      if (!e.user_id) continue;
      const t = new Date(e.created_at).getTime();
      if (t >= dayStart.getTime() && t <= dayEnd.getTime()) {
        uniqueUsers.add(e.user_id);
      }
    }
    wauTrend.push({ date: toDateKey(dayEnd.toISOString()), value: uniqueUsers.size });
  }

  return {
    period,
    signupTrend,
    dau,
    totalUsers:    allUsers.count ?? 0,
    newThisPeriod: newUsers.data?.length ?? 0,
    avgDau,
    peakDau,
    retentionD7:   null,
    wau,
    mau,
    dauMauRatio,
    wauTrend,
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

// ─── Engagement analytics types & fetcher ─────────────────────────────────────

export interface EngagementAnalyticsData {
  totalEvents: number;
  avgEventsPerUserPerDay: number;
  uniqueUsers: number;
  busiestHour: number;
  dailyTrend: DailyBucket[];
  topEvents: { name: string; count: number; uniqueUsers: number }[];
  hourlyBreakdown: { hour: number; count: number }[];
}

async function fetchEngagementAnalytics(period: AnalyticsPeriod): Promise<EngagementAnalyticsData> {
  const days = periodToDays(period);
  const since = startOf(period).toISOString();

  const { data: events } = await supabase
    .from('analytics_events')
    .select('created_at, name, user_id')
    .gte('created_at', since)
    .limit(10000);

  const rows = events ?? [];
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
  const busiestHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
    ? parseInt(Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0][0])
    : 0;

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
  for (let h = 0; h < 24; h++) {
    hourlyBreakdown.push({ hour: h, count: hourCounts[h] || 0 });
  }

  return { totalEvents, avgEventsPerUserPerDay, uniqueUsers, busiestHour, dailyTrend, topEvents, hourlyBreakdown };
}

// ─── Navigation analytics types & fetcher ─────────────────────────────────────

export interface NavigationAnalyticsData {
  totalPageViews: number;
  mostVisitedPage: string;
  avgSessionDuration: number;
  topNavTab: string;
  dailyPageViews: DailyBucket[];
  pageBreakdown: { path: string; views: number; uniqueUsers: number; avgDuration: number | null }[];
  navTabBreakdown: { tab: string; count: number }[];
}

async function fetchNavigationAnalytics(period: AnalyticsPeriod): Promise<NavigationAnalyticsData> {
  const days = periodToDays(period);
  const since = startOf(period).toISOString();

  const [pvRes, peRes, ntRes] = await Promise.all([
    supabase.from('analytics_events').select('created_at, user_id, props').eq('name', 'page_view').gte('created_at', since).limit(5000),
    supabase.from('analytics_events').select('props').eq('name', 'page_exit').gte('created_at', since).limit(5000),
    supabase.from('analytics_events').select('props').eq('name', 'nav_tab_tap').gte('created_at', since).limit(5000),
  ]);

  const pvRows = pvRes.data ?? [];
  const peRows = peRes.data ?? [];
  const ntRows = ntRes.data ?? [];

  const totalPageViews = pvRows.length;
  const dailyPageViews = fillBuckets(pvRows, days);

  const pathData: Record<string, { views: number; users: Set<string>; durations: number[] }> = {};
  for (const r of pvRows) {
    const path = (r.props as any)?.path ?? 'unknown';
    if (!pathData[path]) pathData[path] = { views: 0, users: new Set(), durations: [] };
    pathData[path].views++;
    if (r.user_id) pathData[path].users.add(r.user_id);
  }

  const durationByPath: Record<string, number[]> = {};
  for (const r of peRows) {
    const p = (r.props as any)?.path ?? 'unknown';
    const d = (r.props as any)?.duration_sec;
    if (typeof d === 'number') {
      if (!durationByPath[p]) durationByPath[p] = [];
      durationByPath[p].push(d);
    }
  }

  const pageBreakdown = Object.entries(pathData)
    .sort((a, b) => b[1].views - a[1].views)
    .slice(0, 30)
    .map(([path, d]) => ({
      path,
      views: d.views,
      uniqueUsers: d.users.size,
      avgDuration: durationByPath[path]?.length
        ? Math.round(durationByPath[path].reduce((a, b) => a + b, 0) / durationByPath[path].length)
        : null,
    }));

  const mostVisitedPage = pageBreakdown[0]?.path ?? '—';

  const allDurations = Object.values(durationByPath).flat();
  const avgSessionDuration = allDurations.length
    ? Math.round(allDurations.reduce((a, b) => a + b, 0) / allDurations.length)
    : 0;

  const tabCounts: Record<string, number> = {};
  for (const r of ntRows) {
    const tab = (r.props as any)?.tab ?? 'unknown';
    tabCounts[tab] = (tabCounts[tab] || 0) + 1;
  }
  const navTabBreakdown = Object.entries(tabCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([tab, count]) => ({ tab, count }));

  const topNavTab = navTabBreakdown[0]?.tab ?? '—';

  return { totalPageViews, mostVisitedPage, avgSessionDuration, topNavTab, dailyPageViews, pageBreakdown, navTabBreakdown };
}

// ─── Echo analytics types & fetcher ───────────────────────────────────────────

export interface EchoAnalyticsData {
  totalQueries: number;
  uniqueUsers: number;
  avgPerUser: number;
  dailyTrend: DailyBucket[];
  recentQueries: { queryText: string; username: string | null; createdAt: string }[];
}

async function fetchEchoAnalytics(period: AnalyticsPeriod): Promise<EchoAnalyticsData> {
  const days = periodToDays(period);
  const since = startOf(period).toISOString();

  const { data: events } = await supabase
    .from('analytics_events')
    .select('created_at, user_id, props')
    .eq('name', 'echo_query')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(500);

  const rows = events ?? [];
  const totalQueries = rows.length;
  const userIds = new Set(rows.filter(r => r.user_id).map(r => r.user_id!));
  const uniqueUsers = userIds.size;
  const avgPerUser = uniqueUsers > 0 ? Math.round((totalQueries / uniqueUsers) * 10) / 10 : 0;
  const dailyTrend = fillBuckets(rows, days);

  const recentUserIds = [...new Set(rows.slice(0, 200).filter(r => r.user_id).map(r => r.user_id!))];
  let usernameMap = new Map<string, string>();
  if (recentUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, username')
      .in('id', recentUserIds.slice(0, 50));
    usernameMap = new Map((profiles ?? []).map(p => [p.id, p.username ?? '']));
  }

  const recentQueries = rows.slice(0, 200).map(r => ({
    queryText: (r.props as any)?.query_text ?? '—',
    username: r.user_id ? (usernameMap.get(r.user_id) ?? null) : null,
    createdAt: r.created_at,
  }));

  return { totalQueries, uniqueUsers, avgPerUser, dailyTrend, recentQueries };
}

// ─── Social analytics types & fetcher ─────────────────────────────────────────

export interface SocialAnalyticsData {
  messagesSent: number;
  newConversations: number;
  followActions: number;
  friendRequests: number;
  dailyMessages: DailyBucket[];
  topFollowed: { username: string; displayName: string; followerCount: number }[];
}

async function fetchSocialAnalytics(period: AnalyticsPeriod): Promise<SocialAnalyticsData> {
  const days = periodToDays(period);
  const since = startOf(period).toISOString();

  const [msgRes, convRes, followRes, friendRes, topFollowedRes] = await Promise.all([
    supabase.from('analytics_events').select('created_at').eq('name', 'message_sent').gte('created_at', since).limit(5000),
    supabase.from('analytics_events').select('created_at').eq('name', 'conversation_started').gte('created_at', since).limit(5000),
    supabase.from('analytics_events').select('created_at').eq('name', 'social_follow_toggled').gte('created_at', since).limit(5000),
    supabase.from('analytics_events').select('created_at').eq('name', 'social_friend_request_sent').gte('created_at', since).limit(5000),
    supabase.from('user_follows' as any).select('followed_id').limit(1000),
  ]);

  const messagesSent = msgRes.data?.length ?? 0;
  const newConversations = convRes.data?.length ?? 0;
  const followActions = followRes.data?.length ?? 0;
  const friendRequests = friendRes.data?.length ?? 0;
  const dailyMessages = fillBuckets(msgRes.data ?? [], days);

  const followCounts: Record<string, number> = {};
  for (const r of (topFollowedRes.data ?? []) as any[]) {
    const fid = r.followed_id;
    if (fid) followCounts[fid] = (followCounts[fid] || 0) + 1;
  }
  const topIds = Object.entries(followCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  let topFollowed: SocialAnalyticsData['topFollowed'] = [];
  if (topIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, username, display_name')
      .in('id', topIds.map(([id]) => id));
    const pMap = new Map((profiles ?? []).map(p => [p.id, p]));
    topFollowed = topIds.map(([id, count]) => ({
      username: pMap.get(id)?.username ?? 'unknown',
      displayName: pMap.get(id)?.display_name ?? '',
      followerCount: count,
    }));
  }

  return { messagesSent, newConversations, followActions, friendRequests, dailyMessages, topFollowed };
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

export function useEngagementAnalytics(period: AnalyticsPeriod) {
  return useQuery({
    queryKey:  ['admin-v2', 'analytics', 'engagement', period],
    queryFn:   () => fetchEngagementAnalytics(period),
    staleTime: 5 * 60_000,
  });
}

export function useNavigationAnalytics(period: AnalyticsPeriod) {
  return useQuery({
    queryKey:  ['admin-v2', 'analytics', 'navigation', period],
    queryFn:   () => fetchNavigationAnalytics(period),
    staleTime: 5 * 60_000,
  });
}

export function useEchoAnalytics(period: AnalyticsPeriod) {
  return useQuery({
    queryKey:  ['admin-v2', 'analytics', 'echo', period],
    queryFn:   () => fetchEchoAnalytics(period),
    staleTime: 5 * 60_000,
  });
}

export function useSocialAnalytics(period: AnalyticsPeriod) {
  return useQuery({
    queryKey:  ['admin-v2', 'analytics', 'social', period],
    queryFn:   () => fetchSocialAnalytics(period),
    staleTime: 5 * 60_000,
  });
}

// ─── Content Performance types & fetcher ──────────────────────────────────────

export interface ContentPerformancePost {
  postId: string;
  userId: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  content: string | null;
  mediaType: 'video' | 'image' | 'mixed' | 'none';
  mediaCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  engagementScore: number;
  createdAt: string;
  isReview: boolean;
}

async function fetchContentPerformance(period: AnalyticsPeriod): Promise<ContentPerformancePost[]> {
  const since = startOf(period).toISOString();

  const { data: posts } = await supabase
    .from('posts')
    .select(`
      id,
      user_id,
      content,
      created_at,
      source_review_id,
      post_media ( id, media_type ),
      post_likes ( id ),
      post_comments ( id )
    `)
    .gte('created_at', since)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(500);

  if (!posts?.length) return [];

  const userIds = [...new Set(posts.map(p => p.user_id).filter(Boolean))];

  const [profilesRes, sharesRes] = await Promise.all([
    supabase.from('user_profiles').select('id, display_name, username, profile_photo_url').in('id', userIds),
    supabase.from('post_shares').select('post_id').in('post_id', posts.map(p => p.id)),
  ]);

  const profileMap = new Map((profilesRes.data ?? []).map(p => [p.id, p]));
  const shareCountMap = new Map<string, number>();
  for (const s of sharesRes.data ?? []) {
    shareCountMap.set(s.post_id, (shareCountMap.get(s.post_id) ?? 0) + 1);
  }

  return posts.map(p => {
    const profile = profileMap.get(p.user_id);
    const likes = (p.post_likes as unknown as any[])?.length ?? 0;
    const comments = (p.post_comments as unknown as any[])?.length ?? 0;
    const shares = shareCountMap.get(p.id) ?? 0;
    const mediaItems = (p.post_media as any[]) ?? [];
    const hasVideo = mediaItems.some((m: any) => m.media_type === 'video');
    const hasImage = mediaItems.some((m: any) => m.media_type === 'image');
    const mediaType: ContentPerformancePost['mediaType'] = mediaItems.length === 0 ? 'none'
      : hasVideo && hasImage ? 'mixed'
      : hasVideo ? 'video'
      : 'image';

    return {
      postId: p.id,
      userId: p.user_id,
      displayName: profile?.display_name ?? 'Unknown',
      username: profile?.username ?? null,
      avatarUrl: profile?.profile_photo_url ?? null,
      content: p.content,
      mediaType,
      mediaCount: mediaItems.length,
      likeCount: likes,
      commentCount: comments,
      shareCount: shares,
      engagementScore: Math.round(likes + comments * 2.5 + shares * 3),
      createdAt: p.created_at,
      isReview: !!p.source_review_id,
    };
  }).sort((a, b) => b.engagementScore - a.engagementScore);
}

export function useContentPerformance(period: AnalyticsPeriod) {
  return useQuery({
    queryKey: ['admin-v2', 'analytics', 'content-performance', period],
    queryFn: () => fetchContentPerformance(period),
    staleTime: 5 * 60_000,
  });
}

// ─── Creator Leaderboard types & fetcher ──────────────────────────────────────

export interface CreatorLeaderboardRow {
  userId: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  country: string | null;
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalEngagement: number;
  followerCount: number;
  engagementRate: number;
  avgEngagementPerPost: number;
  joinedAt: string;
}

async function fetchCreatorLeaderboard(period: AnalyticsPeriod): Promise<CreatorLeaderboardRow[]> {
  const since = startOf(period).toISOString();

  const { data: posts } = await supabase
    .from('posts')
    .select(`
      id,
      user_id,
      post_likes ( id ),
      post_comments ( id )
    `)
    .gte('created_at', since)
    .eq('status', 'published')
    .limit(2000);

  if (!posts?.length) return [];

  const userStats = new Map<string, { posts: number; likes: number; comments: number; shares: number }>();
  for (const p of posts) {
    const uid = p.user_id;
    if (!uid) continue;
    const existing = userStats.get(uid) ?? { posts: 0, likes: 0, comments: 0, shares: 0 };
    existing.posts++;
    existing.likes += (p.post_likes as unknown as any[])?.length ?? 0;
    existing.comments += (p.post_comments as unknown as any[])?.length ?? 0;
    userStats.set(uid, existing);
  }

  const { data: shares } = await supabase
    .from('post_shares')
    .select('post_id')
    .in('post_id', posts.map(p => p.id));

  const postUserMap = new Map(posts.map(p => [p.id, p.user_id]));
  for (const s of shares ?? []) {
    const uid = postUserMap.get(s.post_id);
    if (!uid) continue;
    const existing = userStats.get(uid);
    if (existing) existing.shares++;
  }

  const userIds = [...userStats.keys()];

  const [profilesRes, followersRes] = await Promise.all([
    supabase.from('user_profiles').select('id, display_name, username, profile_photo_url, country, created_at').in('id', userIds),
    supabase.from('user_follows').select('following_id').in('following_id', userIds),
  ]);

  const profileMap = new Map((profilesRes.data ?? []).map(p => [p.id, p]));
  const followerCountMap = new Map<string, number>();
  for (const f of followersRes.data ?? []) {
    followerCountMap.set(f.following_id, (followerCountMap.get(f.following_id) ?? 0) + 1);
  }

  return userIds.map(uid => {
    const stats = userStats.get(uid)!;
    const profile = profileMap.get(uid);
    const followers = followerCountMap.get(uid) ?? 0;
    const totalEngagement = Math.round(stats.likes + stats.comments * 2.5 + stats.shares * 3);
    const engagementRate = followers > 0 ? Math.min(100, Math.round((totalEngagement / followers) * 1000) / 10) : 0;
    const avgEngagementPerPost = stats.posts > 0 ? Math.round(totalEngagement / stats.posts) : 0;

    return {
      userId: uid,
      displayName: profile?.display_name ?? 'Unknown',
      username: profile?.username ?? null,
      avatarUrl: profile?.profile_photo_url ?? null,
      country: profile?.country ?? null,
      totalPosts: stats.posts,
      totalLikes: stats.likes,
      totalComments: stats.comments,
      totalShares: stats.shares,
      totalEngagement,
      followerCount: followers,
      engagementRate,
      avgEngagementPerPost,
      joinedAt: profile?.created_at ?? '',
    };
  })
  .filter(r => r.totalPosts > 0)
  .sort((a, b) => b.totalEngagement - a.totalEngagement)
  .slice(0, 50);
}

export function useCreatorLeaderboard(period: AnalyticsPeriod) {
  return useQuery({
    queryKey: ['admin-v2', 'analytics', 'creator-leaderboard', period],
    queryFn: () => fetchCreatorLeaderboard(period),
    staleTime: 5 * 60_000,
  });
}

// ─── Signup Funnel types & fetcher ────────────────────────────────────────────

export interface FunnelStep {
  label: string;
  count: number;
  pct: number;
  dropPct: number;
}

export interface SignupFunnelData {
  steps: FunnelStep[];
  period: AnalyticsPeriod;
}

async function fetchSignupFunnel(period: AnalyticsPeriod): Promise<SignupFunnelData> {
  const since = startOf(period).toISOString();

  const [
    signupAttempts,
    signupSuccess,
    onboardingStarted,
    onboardingComplete,
    addedPhoto,
    firstPost,
    activeDay7,
  ] = await Promise.all([
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
    supabase.from('analytics_events').select('user_id', { count: 'exact', head: true })
      .eq('name', 'post_published').gte('created_at', since),
    supabase.from('analytics_events').select('user_id').eq('name', 'signup_success')
      .gte('created_at', since).lte('created_at', new Date(Date.now() - 7 * 86400_000).toISOString()),
  ]);

  const day7SignupIds = new Set((activeDay7.data ?? []).map((r: any) => r.user_id).filter(Boolean));
  let day7ActiveCount = 0;
  if (day7SignupIds.size > 0) {
    const { data: recentActive } = await supabase
      .from('analytics_events').select('user_id')
      .in('user_id', [...day7SignupIds])
      .gte('created_at', new Date(Date.now() - 7 * 86400_000).toISOString())
      .not('user_id', 'is', null);
    day7ActiveCount = new Set((recentActive ?? []).map((r: any) => r.user_id)).size;
  }

  const rawCounts = [
    signupAttempts.count ?? 0,
    signupSuccess.count ?? 0,
    onboardingStarted.count ?? 0,
    onboardingComplete.count ?? 0,
    addedPhoto.count ?? 0,
    firstPost.count ?? 0,
    day7ActiveCount,
  ];

  const labels = [
    'Signup Attempted',
    'Account Created',
    'Profile Started',
    'Onboarding Complete',
    'Photo Added',
    'First Post',
    'Active at Day 7',
  ];

  const top = rawCounts[0] || 1;
  const steps: FunnelStep[] = rawCounts.map((count, i) => ({
    label: labels[i],
    count,
    pct: Math.round((count / top) * 100),
    dropPct: i === 0 ? 0 : rawCounts[i - 1] > 0
      ? Math.round(((rawCounts[i - 1] - count) / rawCounts[i - 1]) * 100)
      : 0,
  }));

  return { steps, period };
}

export function useSignupFunnel(period: AnalyticsPeriod) {
  return useQuery({
    queryKey: ['admin-v2', 'analytics', 'funnel', period],
    queryFn: () => fetchSignupFunnel(period),
    staleTime: 5 * 60_000,
  });
}

// ─── Geographic Breakdown types & fetcher ─────────────────────────────────────

export interface GeoBreakdownRow {
  country: string;
  userCount: number;
  newThisPeriod: number;
  pctOfTotal: number;
}

async function fetchGeoBreakdown(period: AnalyticsPeriod): Promise<GeoBreakdownRow[]> {
  const since = startOf(period).toISOString();

  const [allRes, newRes] = await Promise.all([
    supabase.from('user_profiles').select('country').is('deleted_at', null).not('country', 'is', null),
    supabase.from('user_profiles').select('country').is('deleted_at', null).not('country', 'is', null).gte('created_at', since),
  ]);

  const allRows = allRes.data ?? [];
  const newRows = newRes.data ?? [];
  const total = allRows.length || 1;

  const countryTotals = new Map<string, number>();
  const countryNew = new Map<string, number>();

  for (const r of allRows) {
    if (!r.country) continue;
    countryTotals.set(r.country, (countryTotals.get(r.country) ?? 0) + 1);
  }
  for (const r of newRows) {
    if (!r.country) continue;
    countryNew.set(r.country, (countryNew.get(r.country) ?? 0) + 1);
  }

  return Array.from(countryTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([country, userCount]) => ({
      country,
      userCount,
      newThisPeriod: countryNew.get(country) ?? 0,
      pctOfTotal: Math.round((userCount / total) * 100 * 10) / 10,
    }));
}

export function useGeoBreakdown(period: AnalyticsPeriod) {
  return useQuery({
    queryKey: ['admin-v2', 'analytics', 'geo', period],
    queryFn: () => fetchGeoBreakdown(period),
    staleTime: 10 * 60_000,
  });
}

// ─── Feature Adoption types & fetcher ─────────────────────────────────────────

export interface FeatureAdoptionRow {
  feature: string;
  description: string;
  usersWhoUsed: number;
  totalUsers: number;
  adoptionPct: number;
  trend: 'up' | 'down' | 'flat';
  trendPct: number;
}

async function fetchFeatureAdoption(period: AnalyticsPeriod): Promise<FeatureAdoptionRow[]> {
  const since = startOf(period).toISOString();
  const days = periodToDays(period);
  const prevSince = new Date(startOf(period).getTime() - (days * 86400_000)).toISOString();

  const [totalUsersRes, currentEvents, prevEvents] = await Promise.all([
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('analytics_events').select('name, user_id').gte('created_at', since).not('user_id', 'is', null).limit(50000),
    supabase.from('analytics_events').select('name, user_id').gte('created_at', prevSince).lt('created_at', since).not('user_id', 'is', null).limit(50000),
  ]);

  const totalUsers = totalUsersRes.count ?? 1;
  const current = currentEvents.data ?? [];
  const prev = prevEvents.data ?? [];

  const currentSets = new Map<string, Set<string>>();
  const prevSets = new Map<string, Set<string>>();

  for (const e of current) {
    if (!currentSets.has(e.name)) currentSets.set(e.name, new Set());
    currentSets.get(e.name)!.add(e.user_id!);
  }
  for (const e of prev) {
    if (!prevSets.has(e.name)) prevSets.set(e.name, new Set());
    prevSets.get(e.name)!.add(e.user_id!);
  }

  const FEATURES = [
    { feature: 'Clubhouse Feed', description: 'Watched videos in the feed', events: ['page_view'] },
    { feature: 'Post Studio', description: 'Created a post or moment', events: ['post_published'] },
    { feature: 'Review Wizard', description: 'Submitted a course review', events: ['review_submitted', 'rating_submitted'] },
    { feature: 'Commenting', description: 'Posted a comment', events: ['comment_submitted'] },
    { feature: 'Echo AI', description: 'Asked Echo a question', events: ['echo_query'] },
    { feature: 'Tour Hub', description: 'Visited tournament data', events: ['nav_tab_tap'] },
    { feature: 'Messaging', description: 'Sent a direct message', events: ['message_sent'] },
    { feature: 'Course Discovery', description: 'Browsed or searched courses', events: ['nav_tab_tap'] },
    { feature: 'Top 100', description: 'Viewed Top 100 courses', events: ['page_view'] },
    { feature: 'Friend System', description: 'Sent a friend request', events: ['social_friend_request_sent'] },
    { feature: 'Follow System', description: 'Followed another user', events: ['social_follow_toggled'] },
  ];

  return FEATURES.map(f => {
    const usersSet = new Set<string>();
    const prevUsersSet = new Set<string>();
    for (const eventName of f.events) {
      for (const uid of currentSets.get(eventName) ?? []) usersSet.add(uid);
      for (const uid of prevSets.get(eventName) ?? []) prevUsersSet.add(uid);
    }
    const usersWhoUsed = usersSet.size;
    const prevUsersWhoUsed = prevUsersSet.size;
    const adoptionPct = Math.round((usersWhoUsed / totalUsers) * 100 * 10) / 10;
    const trendPct = prevUsersWhoUsed > 0
      ? Math.round(((usersWhoUsed - prevUsersWhoUsed) / prevUsersWhoUsed) * 100)
      : 0;
    const trend: FeatureAdoptionRow['trend'] = trendPct > 2 ? 'up' : trendPct < -2 ? 'down' : 'flat';
    return { feature: f.feature, description: f.description, usersWhoUsed, totalUsers, adoptionPct, trend, trendPct };
  }).sort((a, b) => b.adoptionPct - a.adoptionPct);
}

export function useFeatureAdoption(period: AnalyticsPeriod) {
  return useQuery({
    queryKey: ['admin-v2', 'analytics', 'feature-adoption', period],
    queryFn: () => fetchFeatureAdoption(period),
    staleTime: 5 * 60_000,
  });
}

// ─── Anomaly Alerts types & fetcher ───────────────────────────────────────────

export interface AnomalyAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  currentValue: number;
  baselineValue: number;
  changePct: number;
  detectedAt: string;
}

async function fetchAnomalyAlerts(): Promise<AnomalyAlert[]> {
  const now = Date.now();
  const oneDayAgo    = new Date(now - 86400_000).toISOString();
  const twoDaysAgo   = new Date(now - 2 * 86400_000).toISOString();
  const sevenDaysAgo = new Date(now - 7 * 86400_000).toISOString();

  const [
    dauToday, dauYesterday,
    signupsToday, signupsLast7,
    failToday, failYesterday,
    postsToday, postsLast7,
    incompleteOnboarding,
  ] = await Promise.all([
    supabase.from('analytics_events').select('user_id').gte('created_at', oneDayAgo).not('user_id', 'is', null),
    supabase.from('analytics_events').select('user_id').gte('created_at', twoDaysAgo).lt('created_at', oneDayAgo).not('user_id', 'is', null),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }).gte('created_at', oneDayAgo).is('deleted_at', null),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo).is('deleted_at', null),
    supabase.from('analytics_events').select('id', { count: 'exact', head: true }).in('name', ['login_failed', 'auth_failed']).gte('created_at', oneDayAgo),
    supabase.from('analytics_events').select('id', { count: 'exact', head: true }).in('name', ['login_failed', 'auth_failed']).gte('created_at', twoDaysAgo).lt('created_at', oneDayAgo),
    supabase.from('posts').select('id', { count: 'exact', head: true }).gte('created_at', oneDayAgo),
    supabase.from('posts').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }).gte('created_at', oneDayAgo).is('deleted_at', null).eq('has_completed_onboarding', false),
  ]);

  const alerts: AnomalyAlert[] = [];
  const detectedAt = new Date().toISOString();

  // DAU drop
  const dauTodayCount = new Set((dauToday.data ?? []).map((r: any) => r.user_id)).size;
  const dauYestCount  = new Set((dauYesterday.data ?? []).map((r: any) => r.user_id)).size;
  if (dauYestCount > 0) {
    const changePct = Math.round(((dauTodayCount - dauYestCount) / dauYestCount) * 100);
    if (changePct <= -20) {
      alerts.push({
        id: 'dau-drop', severity: changePct <= -40 ? 'critical' : 'warning',
        title: 'DAU Drop Detected',
        description: `Daily active users dropped ${Math.abs(changePct)}% vs yesterday`,
        currentValue: dauTodayCount, baselineValue: dauYestCount, changePct, detectedAt,
      });
    }
  }

  // Signup spike or drop
  const signupsTodayCount = signupsToday.count ?? 0;
  const signupsAvg7 = Math.round((signupsLast7.count ?? 0) / 7);
  if (signupsAvg7 > 0) {
    const changePct = Math.round(((signupsTodayCount - signupsAvg7) / signupsAvg7) * 100);
    if (changePct >= 100) {
      alerts.push({
        id: 'signup-spike', severity: 'info',
        title: 'Signup Spike',
        description: `Signups today are ${changePct}% above 7-day average`,
        currentValue: signupsTodayCount, baselineValue: signupsAvg7, changePct, detectedAt,
      });
    } else if (changePct <= -50) {
      alerts.push({
        id: 'signup-drop', severity: 'warning',
        title: 'Signup Drop',
        description: `Signups today are ${Math.abs(changePct)}% below 7-day average`,
        currentValue: signupsTodayCount, baselineValue: signupsAvg7, changePct, detectedAt,
      });
    }
  }

  // Login failure spike
  const failTodayCount = failToday.count ?? 0;
  const failYestCount  = failYesterday.count ?? 0;
  if (failYestCount > 0) {
    const changePct = Math.round(((failTodayCount - failYestCount) / failYestCount) * 100);
    if (changePct >= 50 && failTodayCount > 10) {
      alerts.push({
        id: 'login-failures', severity: failTodayCount > 100 ? 'critical' : 'warning',
        title: 'Login Failure Spike',
        description: `Login failures up ${changePct}% vs yesterday (${failTodayCount} total)`,
        currentValue: failTodayCount, baselineValue: failYestCount, changePct, detectedAt,
      });
    }
  }

  // Post volume drop
  const postsTodayCount = postsToday.count ?? 0;
  const postsAvg7 = Math.round((postsLast7.count ?? 0) / 7);
  if (postsAvg7 > 0) {
    const changePct = Math.round(((postsTodayCount - postsAvg7) / postsAvg7) * 100);
    if (changePct <= -60) {
      alerts.push({
        id: 'posts-drop', severity: 'warning',
        title: 'Post Volume Drop',
        description: `Posts today are ${Math.abs(changePct)}% below 7-day average`,
        currentValue: postsTodayCount, baselineValue: postsAvg7, changePct, detectedAt,
      });
    }
  }

  // High incomplete onboarding
  const incompleteCount = incompleteOnboarding.count ?? 0;
  const totalNewToday = signupsTodayCount || 1;
  const incompletePct = Math.round((incompleteCount / totalNewToday) * 100);
  if (incompletePct >= 40 && incompleteCount > 5) {
    alerts.push({
      id: 'onboarding-drop', severity: 'warning',
      title: 'Onboarding Completion Drop',
      description: `${incompletePct}% of today's new users haven't completed onboarding (${incompleteCount} users)`,
      currentValue: incompleteCount, baselineValue: totalNewToday, changePct: -incompletePct, detectedAt,
    });
  }

  // All clear
  if (alerts.length === 0) {
    alerts.push({
      id: 'all-clear', severity: 'info',
      title: 'All Systems Normal',
      description: 'No anomalies detected in the last 24 hours',
      currentValue: 0, baselineValue: 0, changePct: 0, detectedAt,
    });
  }

  return alerts.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });
}

export function useAnomalyAlerts() {
  return useQuery({
    queryKey: ['admin-v2', 'anomaly-alerts'],
    queryFn: fetchAnomalyAlerts,
    staleTime: 5 * 60_000,
    refetchInterval: 10 * 60_000,
  });
}
