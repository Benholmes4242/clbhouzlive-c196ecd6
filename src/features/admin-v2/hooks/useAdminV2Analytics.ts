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

// ─── Engagement analytics ─────────────────────────────────────────────────────

export interface EngagementAnalyticsData {
  totalEvents: number;
  avgEventsPerUserDay: number;
  mostActiveUser: string;
  busiestHour: number;
  dailyVolume: DailyBucket[];
  topEvents: { name: string; count: number; uniqueUsers: number }[];
}

async function fetchEngagementAnalytics(period: AnalyticsPeriod): Promise<EngagementAnalyticsData> {
  const days = periodToDays(period);
  const since = startOf(period).toISOString();

  const { data: events } = await supabase
    .from('analytics_events')
    .select('name, user_id, created_at')
    .gte('created_at', since);

  const rows = events ?? [];
  const totalEvents = rows.length;

  // Avg events per user per day
  const userDays = new Map<string, Set<string>>();
  const hourCounts: Record<number, number> = {};
  const userCounts = new Map<string, number>();
  const eventCounts = new Map<string, { count: number; users: Set<string> }>();

  for (const r of rows) {
    const day = r.created_at.slice(0, 10);
    const hour = new Date(r.created_at).getHours();
    hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;

    if (r.user_id) {
      if (!userDays.has(r.user_id)) userDays.set(r.user_id, new Set());
      userDays.get(r.user_id)!.add(day);
      userCounts.set(r.user_id, (userCounts.get(r.user_id) ?? 0) + 1);
    }

    if (!eventCounts.has(r.name)) eventCounts.set(r.name, { count: 0, users: new Set() });
    const ec = eventCounts.get(r.name)!;
    ec.count++;
    if (r.user_id) ec.users.add(r.user_id);
  }

  const uniqueUserCount = userDays.size || 1;
  const avgEventsPerUserDay = Math.round(totalEvents / uniqueUserCount / Math.max(days, 1));

  let mostActiveUserId = '—';
  let maxCount = 0;
  for (const [uid, cnt] of userCounts) {
    if (cnt > maxCount) { maxCount = cnt; mostActiveUserId = uid; }
  }

  // Resolve username
  let mostActiveUser = mostActiveUserId;
  if (mostActiveUserId !== '—') {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('id', mostActiveUserId)
      .single();
    if (profile?.username) mostActiveUser = `@${profile.username} (${maxCount})`;
  }

  const busiestHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;

  const topEvents = Array.from(eventCounts.entries())
    .map(([name, { count, users }]) => ({ name, count, uniqueUsers: users.size }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  return {
    totalEvents,
    avgEventsPerUserDay,
    mostActiveUser,
    busiestHour: Number(busiestHour),
    dailyVolume: fillBuckets(rows, days),
    topEvents,
  };
}

export function useEngagementAnalytics(period: AnalyticsPeriod) {
  return useQuery({
    queryKey: ['admin-v2', 'analytics', 'engagement', period],
    queryFn: () => fetchEngagementAnalytics(period),
    staleTime: 5 * 60_000,
  });
}

// ─── Navigation analytics ─────────────────────────────────────────────────────

export interface NavigationAnalyticsData {
  totalPageViews: number;
  mostVisitedPage: string;
  avgSessionDuration: number;
  mostTappedTab: string;
  dailyPageViews: DailyBucket[];
  pageTable: { path: string; views: number; uniqueUsers: number; avgTimeSec: number }[];
  navTabs: { tab: string; count: number }[];
}

async function fetchNavigationAnalytics(period: AnalyticsPeriod): Promise<NavigationAnalyticsData> {
  const days = periodToDays(period);
  const since = startOf(period).toISOString();

  const [pvRes, peRes, navRes] = await Promise.all([
    supabase.from('analytics_events').select('created_at, user_id, props').eq('name', 'page_view').gte('created_at', since),
    supabase.from('analytics_events').select('created_at, user_id, props').eq('name', 'page_exit').gte('created_at', since),
    supabase.from('analytics_events').select('created_at, props').eq('name', 'nav_tab_tap').gte('created_at', since),
  ]);

  const pvRows = pvRes.data ?? [];
  const peRows = peRes.data ?? [];
  const navRows = navRes.data ?? [];

  // Page views by path
  const pathStats = new Map<string, { views: number; users: Set<string>; totalSec: number; exitCount: number }>();
  for (const r of pvRows) {
    const path = (r.props as any)?.path ?? '/';
    if (!pathStats.has(path)) pathStats.set(path, { views: 0, users: new Set(), totalSec: 0, exitCount: 0 });
    const s = pathStats.get(path)!;
    s.views++;
    if (r.user_id) s.users.add(r.user_id);
  }
  for (const r of peRows) {
    const path = (r.props as any)?.path ?? '/';
    const dur = Number((r.props as any)?.duration_sec) || 0;
    if (pathStats.has(path)) {
      pathStats.get(path)!.totalSec += dur;
      pathStats.get(path)!.exitCount++;
    }
  }

  const pageTable = Array.from(pathStats.entries())
    .map(([path, s]) => ({
      path,
      views: s.views,
      uniqueUsers: s.users.size,
      avgTimeSec: s.exitCount > 0 ? Math.round(s.totalSec / s.exitCount) : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 30);

  // Nav tabs
  const tabCounts = new Map<string, number>();
  for (const r of navRows) {
    const tab = (r.props as any)?.tab ?? 'unknown';
    tabCounts.set(tab, (tabCounts.get(tab) ?? 0) + 1);
  }
  const navTabs = Array.from(tabCounts.entries())
    .map(([tab, count]) => ({ tab, count }))
    .sort((a, b) => b.count - a.count);

  // Avg session duration from page_exit
  const totalDuration = peRows.reduce((sum, r) => sum + (Number((r.props as any)?.duration_sec) || 0), 0);
  const avgSessionDuration = peRows.length > 0 ? Math.round(totalDuration / peRows.length) : 0;

  return {
    totalPageViews: pvRows.length,
    mostVisitedPage: pageTable[0]?.path ?? '—',
    avgSessionDuration,
    mostTappedTab: navTabs[0]?.tab ?? '—',
    dailyPageViews: fillBuckets(pvRows, days),
    pageTable,
    navTabs,
  };
}

export function useNavigationAnalytics(period: AnalyticsPeriod) {
  return useQuery({
    queryKey: ['admin-v2', 'analytics', 'navigation', period],
    queryFn: () => fetchNavigationAnalytics(period),
    staleTime: 5 * 60_000,
  });
}

// ─── Echo AI analytics ────────────────────────────────────────────────────────

export interface EchoAnalyticsData {
  totalQueries: number;
  uniqueUsers: number;
  avgPerUser: number;
  dailyVolume: DailyBucket[];
  recentQueries: { queryText: string; username: string; createdAt: string }[];
}

async function fetchEchoAnalytics(period: AnalyticsPeriod): Promise<EchoAnalyticsData> {
  const days = periodToDays(period);
  const since = startOf(period).toISOString();

  const { data: echoEvents } = await supabase
    .from('analytics_events')
    .select('created_at, user_id, props')
    .eq('name', 'echo_query')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(200);

  const rows = echoEvents ?? [];
  const uniqueUserIds = new Set(rows.map(r => r.user_id).filter(Boolean));

  // Resolve usernames
  const userIds = Array.from(uniqueUserIds) as string[];
  let usernameMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, username')
      .in('id', userIds.slice(0, 50));
    for (const p of profiles ?? []) {
      if (p.username) usernameMap.set(p.id, p.username);
    }
  }

  const recentQueries = rows.map(r => ({
    queryText: (r.props as any)?.query_text ?? '(no text)',
    username: r.user_id ? usernameMap.get(r.user_id) ?? '' : '',
    createdAt: r.created_at,
  }));

  return {
    totalQueries: rows.length,
    uniqueUsers: uniqueUserIds.size,
    avgPerUser: uniqueUserIds.size > 0 ? Math.round(rows.length / uniqueUserIds.size) : 0,
    dailyVolume: fillBuckets(rows, days),
    recentQueries,
  };
}

export function useEchoAnalytics(period: AnalyticsPeriod) {
  return useQuery({
    queryKey: ['admin-v2', 'analytics', 'echo', period],
    queryFn: () => fetchEchoAnalytics(period),
    staleTime: 5 * 60_000,
  });
}

// ─── Social & Messaging analytics ────────────────────────────────────────────

export interface SocialAnalyticsData {
  messagesSent: number;
  newConversations: number;
  followActions: number;
  totalFollows: number;
  messagesTrend: DailyBucket[];
  conversationsTrend: DailyBucket[];
  mostFollowed: { username: string; displayName: string; followerCount: number }[];
}

async function fetchSocialAnalytics(period: AnalyticsPeriod): Promise<SocialAnalyticsData> {
  const days = periodToDays(period);
  const since = startOf(period).toISOString();

  const [messagesRes, convsRes, followsRes, totalFollowsRes, topFollowedRes] = await Promise.all([
    supabase.from('messages' as any).select('created_at').gte('created_at', since),
    supabase.from('conversations' as any).select('created_at').gte('created_at', since),
    supabase.from('analytics_events').select('created_at').eq('name', 'social_follow_toggled').gte('created_at', since),
    supabase.from('user_follows' as any).select('id', { count: 'exact', head: true }),
    supabase.from('user_follows' as any).select('followed_id').limit(1000),
  ]);

  const messages = messagesRes.data ?? [];
  const convs = convsRes.data ?? [];
  const follows = followsRes.data ?? [];

  // Most followed users
  const followCounts = new Map<string, number>();
  for (const f of (topFollowedRes.data ?? []) as any[]) {
    followCounts.set(f.followed_id, (followCounts.get(f.followed_id) ?? 0) + 1);
  }
  const topFollowedIds = Array.from(followCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  let mostFollowed: SocialAnalyticsData['mostFollowed'] = [];
  if (topFollowedIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, username, display_name')
      .in('id', topFollowedIds.map(t => t[0]));

    const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));
    mostFollowed = topFollowedIds.map(([id, count]) => {
      const p = profileMap.get(id);
      return {
        username: p?.username ?? id.slice(0, 8),
        displayName: p?.display_name ?? '',
        followerCount: count,
      };
    });
  }

  return {
    messagesSent: messages.length,
    newConversations: convs.length,
    followActions: follows.length,
    totalFollows: totalFollowsRes.count ?? 0,
    messagesTrend: fillBuckets(messages, days),
    conversationsTrend: fillBuckets(convs, days),
    mostFollowed,
  };
}

export function useSocialAnalytics(period: AnalyticsPeriod) {
  return useQuery({
    queryKey: ['admin-v2', 'analytics', 'social', period],
    queryFn: () => fetchSocialAnalytics(period),
    staleTime: 5 * 60_000,
  });
}
