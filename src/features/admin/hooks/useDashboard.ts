import { useQueries } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecentAuditEntry {
  id:          string;
  action:      string;
  adminUserId: string;
  targetEmail: string | null;
  createdAt:   string;
  details:     Record<string, unknown> | null;
}

export type EgSyncStatus = 'green' | 'amber' | 'red' | 'idle';

export interface EgSyncHealth {
  status: EgSyncStatus;
  total_connected: number;
  status_ok_count: number;
  auth_failed: number;
  eg_unavailable: number;
  consecutive_failures_total: number;
  /** consecutive_failures >= 5: skipped by the normal sweep, surfaced here. */
  poisoned_count: number;
  /** Newest last_synced_at across all non-deleted connections. */
  freshest_sync_at: string | null;
  /** Age of that newest sync. Red above 12h — this is the outage detector. */
  freshest_hours_ago: number | null;
  /** Connections whose own last_synced_at is older than 12h. */
  stale_12h_count: number;
  last_attempt_at: string | null;
  cron_last_run_at: string | null;
  cron_last_status: string | null;
  cron_hours_ago: number | null;
  computed_at: string;
}

export interface HourlyBucket { hour: number; count: number; }
export interface TopActiveUser { userId: string; displayName: string; avatarUrl: string | null; eventCount: number; }

export interface TodayGlance {
  postsByHour: HourlyBucket[];
  topActiveUsers: TopActiveUser[];
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchTodayGlance(): Promise<TodayGlance> {
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const since = startOfToday.toISOString();

  const [postsRes, eventsRes] = await Promise.all([
    // FIX: read directly from posts (analytics_events 'post_published' is never written)
    supabase.from('posts').select('created_at').gte('created_at', since).limit(2000),
    supabase.from('analytics_events').select('user_id').gte('created_at', since).not('user_id', 'is', null).limit(5000),
  ]);

  const hourCounts: Record<number, number> = {};
  for (let h = 0; h < 24; h++) hourCounts[h] = 0;
  for (const r of postsRes.data ?? []) {
    const h = new Date(r.created_at).getHours();
    hourCounts[h]++;
  }
  const postsByHour: HourlyBucket[] = Object.entries(hourCounts).map(([h, count]) => ({ hour: parseInt(h), count }));

  const userCounts: Record<string, number> = {};
  for (const r of (eventsRes.data ?? []) as { user_id: string }[]) {
    userCounts[r.user_id] = (userCounts[r.user_id] || 0) + 1;
  }
  const top3Ids = Object.entries(userCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([userId, eventCount]) => ({ userId, eventCount }));

  let topActiveUsers: TopActiveUser[] = [];
  if (top3Ids.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name, username, profile_photo_url')
      .in('id', top3Ids.map(t => t.userId));
    const map = new Map((profiles ?? []).map(p => [p.id, p]));
    topActiveUsers = top3Ids.map(t => ({
      userId: t.userId,
      displayName: map.get(t.userId)?.display_name ?? map.get(t.userId)?.username ?? t.userId.slice(0, 8),
      avatarUrl: map.get(t.userId)?.profile_photo_url ?? null,
      eventCount: t.eventCount,
    }));
  }

  return { postsByHour, topActiveUsers };
}

async function fetchEgSyncHealth(): Promise<EgSyncHealth> {
  const { data, error } = await supabase.rpc('get_eg_sync_health' as any);
  if (error) throw error;
  return data as EgSyncHealth;
}

/**
 * Retained but UNREFERENCED: it answers "what did I do", not "how is the
 * platform", so it is no longer part of useDashboard's return.
 */
async function fetchRecentAudit(): Promise<RecentAuditEntry[]> {
  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('id, action, admin_user_id, target_email, created_at, details')
    .order('created_at', { ascending: false })
    .limit(8);
  if (error) throw error;
  return (data ?? []).map(e => ({
    id: e.id, action: e.action, adminUserId: e.admin_user_id,
    targetEmail: e.target_email, createdAt: e.created_at,
    details: e.details as Record<string, unknown> | null,
  }));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDashboard() {
  const results = useQueries({
    queries: [
      { queryKey: ['admin-v2', 'dashboard', 'glance'], queryFn: fetchTodayGlance,  staleTime: 2*60_000, refetchInterval: 5*60_000 },
      { queryKey: ['admin-v2', 'dashboard', 'eg'],     queryFn: fetchEgSyncHealth, staleTime: 60_000,  refetchInterval: 120_000 },
    ],
  });

  const [glanceQ, egQ] = results;

  return {
    glance: { data: glanceQ.data as TodayGlance | undefined, isLoading: glanceQ.isLoading },
    egSyncHealth: {
      data: egQ.data as EgSyncHealth | undefined,
      isLoading: egQ.isLoading,
      isError:   egQ.isError,
    },
    isAnyLoading: results.some(r => r.isLoading),
    refetchAll:   () => results.forEach(r => r.refetch()),
  };
}
