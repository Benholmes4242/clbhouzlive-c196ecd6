/**
 * ⚠️ POSTGREST RETURNS AT MOST 2000 ROWS — whatever `.limit()` says.
 *
 * REMEDIATED (batch 2, pre-emptive). The glance card pulled a whole day of
 * events to rank today's most active members: ~1,400 rows against the 2000
 * cap, i.e. 70% of the ceiling. It would have broken on the busiest days only
 * and looked correct again the following week. Both the hourly posts buckets
 * and the top-three ranking are now counted by get_admin_dashboard_glance.
 *
 * STANDING RULE: no admin figure is computed by counting rows in the browser.
 * Counting happens in Postgres. A new metric needs an RPC, not a select and a
 * Set.
 */
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
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const { data, error } = await supabase.rpc('get_admin_dashboard_glance' as never, { p_tz: tz } as never);
  if (error) throw error;
  const payload = data as unknown as {
    posts_by_hour: { hour: number; count: number }[];
    top_active_users: { user_id: string; display_name: string; avatar_url: string | null; event_count: number }[];
  } | null;
  if (!payload) throw new Error('get_admin_dashboard_glance returned no payload');

  const postsByHour: HourlyBucket[] = (payload.posts_by_hour ?? [])
    .map(b => ({ hour: b.hour, count: b.count }));

  const topActiveUsers: TopActiveUser[] = (payload.top_active_users ?? []).map(u => ({
    userId: u.user_id,
    displayName: u.display_name,
    avatarUrl: u.avatar_url,
    eventCount: u.event_count,
  }));

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
