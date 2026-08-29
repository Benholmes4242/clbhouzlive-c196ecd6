import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * BRIEF_HEALTH_DELETION_INTEGRITY — the seventh Health-board subsystem.
 *
 * admin_deletion_integrity() joins user_profiles to auth.users, which
 * PostgREST cannot reach, so this goes through the RPC. It reads ZERO
 * forever when erasure is working; anything else is the August incident
 * repeating itself.
 *
 * A non-admin gets a Postgres error here (the function is not granted to
 * anon). Per the brief the hook resolves to null and the chip shows idle —
 * a Postgres error is NEVER surfaced on the board. Cadence matches
 * useOpsHealth exactly: staleTime 60s, refetch 120s.
 */
export interface DeletionIntegrity {
  /** Deleted profile, auth row alive, NOT banned. Can still write anywhere. */
  live_sessions: number;
  /** Deleted profile, auth row alive, IS banned. Contained, not erased. */
  unbanned: number;
  /** Deleted profile, auth row gone. The correct end state. */
  orphan_profiles: number;
  /** Oldest unresolved live_sessions case, or null. */
  worst_seen: string | null;
}

export function useDeletionIntegrity() {
  return useQuery<DeletionIntegrity | null>({
    queryKey: ['admin-v2', 'deletion-integrity'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_deletion_integrity' as any);
      if (error) return null;
      const row = (Array.isArray(data) ? data[0] : data) as DeletionIntegrity | undefined;
      return row ?? null;
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}
