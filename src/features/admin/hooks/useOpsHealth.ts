import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { currentBuildId } from '@/lib/buildFreshness';

/**
 * get_admin_ops_health - the RPC owns the definition of "member", "bot" and
 * "session". No client-side filtering of bots happens here or downstream.
 */
export interface OpsClientRow {
  client: string;
  members: number;
  sessions: number;
}

export interface OpsTraffic {
  events: number;
  members: number;
  bot_sessions: number;
  member_sessions: number;
  anonymous_events: number;
}

export interface OpsErrorTop {
  kind: string;
  last: string;
  count: number;
  route: string | null;
  users: number;
  message: string;
}

export interface OpsErrors {
  top: OpsErrorTop[];
  /** CURRENT-BUILD ONLY. Errors reported by outdated clients are separated. */
  errors_24h: number;
  /** Errors whose reporting client was not on this build (or was unlabelled). */
  outdated_errors_24h: number;
  outdated_users_24h: number;
  /** Distinct build ids seen across the error window — the stuck-client count. */
  distinct_builds: number;
  /** MEMBER-ONLY denominator. Bots and anonymous traffic are excluded. */
  sessions_24h: number;
  users_hit_24h: number;
}

/**
 * Rounds counted on play_date, NOT created_at: a member connecting a handicap
 * backfills history, which would spike created_at by dozens on one day.
 */
export interface OpsActivity {
  rounds_in_window: number;
  rounds_prev_window: number;
  rounds_members: number;
  /** 14 points, zeros included. Render every day; do not smooth or drop. */
  daily: { date: string; n: number }[];
}

/**
 * Handicap connection is activation: without it a member gets no rounds, no
 * scorecards, no crowns and no stat browse.
 */
export interface OpsActivation {
  members_total: number;
  connected: number;
  synced: number;
  syncing: number;
  failing: number;
  connected_in_window: number;
}

/** gam_evaluation_queue. EG sync green means data ARRIVED, not that it was processed. */
export interface OpsPipeline {
  unprocessed: number;
  oldest_wait_sec: number;
  median_process_sec: number;
  retrying: number;
  errored: number;
  by_status: Record<string, number>;
}

export interface OpsHealth {
  /** Sorted by members DESC then sessions DESC by the RPC. Render as given. */
  clients: OpsClientRow[];
  traffic: OpsTraffic;
  errors: OpsErrors;
  activity: OpsActivity;
  activation: OpsActivation;
  pipeline: OpsPipeline;
  window_days: number;
  computed_at: string;
}


export function useOpsHealth(days = 7) {
  // The build id travels with the request: the figure has to describe the build
  // the viewer is running or it cannot be acted on.
  const buildId = currentBuildId();
  return useQuery<OpsHealth>({
    queryKey: ['admin-v2', 'ops-health', days, buildId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_ops_health', { p_days: days, p_build_id: buildId });
      if (error) throw error;
      return data as unknown as OpsHealth;
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}
