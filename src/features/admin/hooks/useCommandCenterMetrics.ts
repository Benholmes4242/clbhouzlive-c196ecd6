import { useQuery, useQueries } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ============ Types ============

export interface KpiMetric {
  value: number;
  previousValue?: number;
  trend?: 'up' | 'down' | 'neutral';
  trendPercent?: number;
}

export interface PlatformHealthMetrics {
  totalUsers: KpiMetric;
  activeUsers24h: KpiMetric;
  activeUsers7d: KpiMetric;
  newUsersToday: KpiMetric;
  totalAdmins: number;
}

export interface ActionQueueMetrics {
  pendingVerifications: number;
  pendingAdminInvites: number;
  expiringAdminAccess: number;
}

export interface ContentMetrics {
  postsToday: number;
  reviewsToday: number;
  postsThisWeek: number;
  reviewsThisWeek: number;
}

export interface TrendDataPoint {
  date: string;
  value: number;
}

export interface TrendsMetrics {
  userSignups: TrendDataPoint[];
  postActivity: TrendDataPoint[];
  reviewActivity: TrendDataPoint[];
}

export interface SystemStatus {
  isHealthy: boolean;
  lastSyncAt: Date | null;
  errorMessage: string | null;
  latencyMs: number | null;
}

export interface RecentAuditEntry {
  id: string;
  action: string;
  adminUserId: string;
  targetEmail: string | null;
  createdAt: string;
  details: Record<string, unknown> | null;
}

export interface CommandCenterMetrics {
  platformHealth: PlatformHealthMetrics;
  actionQueues: ActionQueueMetrics;
  content: ContentMetrics;
  trends: TrendsMetrics;
  systemStatus: SystemStatus;
  recentAuditLog: RecentAuditEntry[];
}

// ============ Fetch Functions ============

async function fetchPlatformHealth(): Promise<PlatformHealthMetrics> {
  const startTime = performance.now();
  
  // Current period stats
  const { data: current, error: currentError } = await supabase
    .from('user_profiles')
    .select('id, created_at', { count: 'exact', head: false })
    .is('deleted_at', null);
    
  if (currentError) throw currentError;

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Get UNIQUE active users from analytics_events (not event count)
  const [active24hData, active7dData, activePrev7dData] = await Promise.all([
    supabase
      .from('analytics_events')
      .select('user_id')
      .gte('created_at', oneDayAgo.toISOString())
      .not('user_id', 'is', null),
    supabase
      .from('analytics_events')
      .select('user_id')
      .gte('created_at', sevenDaysAgo.toISOString())
      .not('user_id', 'is', null),
    supabase
      .from('analytics_events')
      .select('user_id')
      .gte('created_at', fourteenDaysAgo.toISOString())
      .lt('created_at', sevenDaysAgo.toISOString())
      .not('user_id', 'is', null)
  ]);

  // Count unique user_ids using Set
  const active24h = new Set(active24hData.data?.map(e => e.user_id)).size;
  const active7d = new Set(active7dData.data?.map(e => e.user_id)).size;
  const activePrev7d = new Set(activePrev7dData.data?.map(e => e.user_id)).size;

  // New users today and yesterday for trend
  const newToday = current?.filter(u => new Date(u.created_at) >= oneDayAgo).length || 0;
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const newYesterday = current?.filter(u => {
    const created = new Date(u.created_at);
    return created >= twoDaysAgo && created < oneDayAgo;
  }).length || 0;

  // Admin count - only active (non-expired) memberships
  const { count: adminCount } = await supabase
    .from('admin_memberships')
    .select('user_id', { count: 'exact', head: true })
    .or('expires_at.is.null,expires_at.gt.now()');

  const totalUsers = current?.length || 0;
  
  // Calculate trends
  const calcTrend = (current: number, previous: number): { trend: 'up' | 'down' | 'neutral'; percent: number } => {
    if (previous === 0) return { trend: current > 0 ? 'up' : 'neutral', percent: current > 0 ? 100 : 0 };
    const percent = Math.round(((current - previous) / previous) * 100);
    return {
      trend: percent > 0 ? 'up' : percent < 0 ? 'down' : 'neutral',
      percent: Math.abs(percent)
    };
  };

  const active7dTrend = calcTrend(active7d, activePrev7d);
  const newTodayTrend = calcTrend(newToday, newYesterday);

  return {
    totalUsers: { value: totalUsers },
    activeUsers24h: { value: active24h },
    activeUsers7d: { 
      value: active7d, 
      previousValue: activePrev7d,
      trend: active7dTrend.trend,
      trendPercent: active7dTrend.percent
    },
    newUsersToday: { 
      value: newToday,
      previousValue: newYesterday,
      trend: newTodayTrend.trend,
      trendPercent: newTodayTrend.percent
    },
    totalAdmins: adminCount || 0
  };
}

async function fetchActionQueues(): Promise<ActionQueueMetrics> {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [businessVerifications, golferVerifications, invites, expiringAccess] = await Promise.all([
    supabase
      .from('business_verification_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('golfer_verification_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('admin_invitations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('admin_memberships')
      .select('user_id', { count: 'exact', head: true })
      .not('expires_at', 'is', null)
      .lte('expires_at', sevenDaysFromNow.toISOString())
      .gte('expires_at', now.toISOString())
  ]);

  // Combine business + golfer verification requests
  const pendingVerifications = (businessVerifications.count ?? 0) + (golferVerifications.count ?? 0);

  return {
    pendingVerifications,
    pendingAdminInvites: invites.count || 0,
    expiringAdminAccess: expiringAccess.count || 0
  };
}

async function fetchContentMetrics(): Promise<ContentMetrics> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [postsToday, reviewsToday, postsWeek, reviewsWeek] = await Promise.all([
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneDayAgo.toISOString()),
    supabase
      .from('course_ratings')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneDayAgo.toISOString()),
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString()),
    supabase
      .from('course_ratings')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())
  ]);

  return {
    postsToday: postsToday.count || 0,
    reviewsToday: reviewsToday.count || 0,
    postsThisWeek: postsWeek.count || 0,
    reviewsThisWeek: reviewsWeek.count || 0
  };
}

async function fetchTrends(days = 14): Promise<TrendsMetrics> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get raw data
  const [usersData, postsData, reviewsData] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .is('deleted_at', null),
    supabase
      .from('posts')
      .select('created_at')
      .gte('created_at', startDate.toISOString()),
    supabase
      .from('course_ratings')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
  ]);

  // Helper to group by date
  const groupByDate = (items: { created_at: string }[] | null): TrendDataPoint[] => {
    const counts: Record<string, number> = {};
    
    // Initialize all dates in range with 0
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      counts[date.toISOString().split('T')[0]] = 0;
    }
    
    // Count items per date
    items?.forEach(item => {
      const date = item.created_at.split('T')[0];
      counts[date] = (counts[date] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  return {
    userSignups: groupByDate(usersData.data),
    postActivity: groupByDate(postsData.data),
    reviewActivity: groupByDate(reviewsData.data)
  };
}

async function fetchRecentAuditLog(limit = 10): Promise<RecentAuditEntry[]> {
  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('id, action, admin_user_id, target_email, created_at, details')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map(entry => ({
    id: entry.id,
    action: entry.action,
    adminUserId: entry.admin_user_id,
    targetEmail: entry.target_email,
    createdAt: entry.created_at,
    details: entry.details as Record<string, unknown> | null
  }));
}

async function checkSystemHealth(): Promise<SystemStatus> {
  const startTime = performance.now();
  
  try {
    // Simple health check - query a small table
    const { error } = await supabase
      .from('admin_memberships')
      .select('user_id')
      .limit(1);

    const latencyMs = Math.round(performance.now() - startTime);

    if (error) {
      return {
        isHealthy: false,
        lastSyncAt: new Date(),
        errorMessage: error.message,
        latencyMs
      };
    }

    return {
      isHealthy: true,
      lastSyncAt: new Date(),
      errorMessage: null,
      latencyMs
    };
  } catch (err) {
    return {
      isHealthy: false,
      lastSyncAt: new Date(),
      errorMessage: err instanceof Error ? err.message : 'Unknown error',
      latencyMs: Math.round(performance.now() - startTime)
    };
  }
}

// ============ Main Hook ============

export interface UseCommandCenterOptions {
  /** Refetch interval in ms (default: 60000 = 1 minute) */
  refetchInterval?: number;
  /** Number of days for trend data (default: 14) */
  trendDays?: number;
  /** Enable/disable individual sections */
  enabled?: {
    platformHealth?: boolean;
    actionQueues?: boolean;
    content?: boolean;
    trends?: boolean;
    auditLog?: boolean;
    systemStatus?: boolean;
  };
}

export function useCommandCenterMetrics(options: UseCommandCenterOptions = {}) {
  const {
    refetchInterval = 60000,
    trendDays = 14,
    enabled = {}
  } = options;

  const {
    platformHealth: enableHealth = true,
    actionQueues: enableQueues = true,
    content: enableContent = true,
    trends: enableTrends = true,
    auditLog: enableAudit = true,
    systemStatus: enableSystem = true
  } = enabled;

  // Use parallel queries for better performance
  const results = useQueries({
    queries: [
      {
        queryKey: ['admin', 'command-center', 'platform-health'],
        queryFn: fetchPlatformHealth,
        staleTime: 30000,
        refetchInterval,
        enabled: enableHealth
      },
      {
        queryKey: ['admin', 'command-center', 'action-queues'],
        queryFn: fetchActionQueues,
        staleTime: 30000,
        refetchInterval,
        enabled: enableQueues
      },
      {
        queryKey: ['admin', 'command-center', 'content'],
        queryFn: fetchContentMetrics,
        staleTime: 30000,
        refetchInterval,
        enabled: enableContent
      },
      {
        queryKey: ['admin', 'command-center', 'trends', trendDays],
        queryFn: () => fetchTrends(trendDays),
        staleTime: 60000,
        refetchInterval: refetchInterval * 2, // Trends refresh less often
        enabled: enableTrends
      },
      {
        queryKey: ['admin', 'command-center', 'audit-log'],
        queryFn: () => fetchRecentAuditLog(10),
        staleTime: 30000,
        refetchInterval,
        enabled: enableAudit
      },
      {
        queryKey: ['admin', 'command-center', 'system-status'],
        queryFn: checkSystemHealth,
        staleTime: 15000,
        refetchInterval: 30000, // Check health more frequently
        enabled: enableSystem
      }
    ]
  });

  const [
    platformHealthResult,
    actionQueuesResult,
    contentResult,
    trendsResult,
    auditLogResult,
    systemStatusResult
  ] = results;

  const isLoading = results.some(r => r.isLoading);
  const isError = results.some(r => r.isError);
  const errors = results.filter(r => r.error).map(r => r.error);

  return {
    // Individual section data with loading states
    platformHealth: {
      data: platformHealthResult.data,
      isLoading: platformHealthResult.isLoading,
      error: platformHealthResult.error
    },
    actionQueues: {
      data: actionQueuesResult.data,
      isLoading: actionQueuesResult.isLoading,
      error: actionQueuesResult.error
    },
    content: {
      data: contentResult.data,
      isLoading: contentResult.isLoading,
      error: contentResult.error
    },
    trends: {
      data: trendsResult.data,
      isLoading: trendsResult.isLoading,
      error: trendsResult.error
    },
    auditLog: {
      data: auditLogResult.data,
      isLoading: auditLogResult.isLoading,
      error: auditLogResult.error
    },
    systemStatus: {
      data: systemStatusResult.data,
      isLoading: systemStatusResult.isLoading,
      error: systemStatusResult.error
    },

    // Aggregate states
    isLoading,
    isError,
    errors,

    // Refetch all data
    refetchAll: () => {
      results.forEach(r => r.refetch());
    }
  };
}

// Export types for consumers
export type { TrendDataPoint as ChartDataPoint };
