import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  errors_24h: number;
  /** MEMBER-ONLY denominator. Bots and anonymous traffic are excluded. */
  sessions_24h: number;
  users_hit_24h: number;
}

export interface OpsHealth {
  /** Sorted by members DESC then sessions DESC by the RPC. Render as given. */
  clients: OpsClientRow[];
  traffic: OpsTraffic;
  errors: OpsErrors;
  window_days: number;
  computed_at: string;
}

export function useOpsHealth(days = 7) {
  return useQuery<OpsHealth>({
    queryKey: ['admin-v2', 'ops-health', days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_ops_health', { p_days: days });
      if (error) throw error;
      return data as unknown as OpsHealth;
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}
