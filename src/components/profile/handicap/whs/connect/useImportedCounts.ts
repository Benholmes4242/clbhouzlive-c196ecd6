import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ImportedCounts {
  rounds: number;
  courses: number;
  friends: number;
}

/**
 * Counts come from whs_imported_counts(p_connection_id) - one row, computed
 * server-side. The function is SECURITY INVOKER on purpose, so RLS on
 * whs_scores / whs_friends still scopes a member to their own connection.
 * A null result means "not readable yet" - the caller must render the
 * still-importing state, NEVER a zero.
 */
export function useImportedCounts(connectionId: string | null | undefined, options?: { allowZero?: boolean }) {
  return useQuery<ImportedCounts | null>({
    queryKey: options?.allowZero ? ['whs-imported-counts', connectionId, 'including-zero'] : ['whs-imported-counts', connectionId],
    enabled: !!connectionId,
    refetchInterval: (q) => (q.state.data ? false : 2500),
    queryFn: async () => {
      if (!connectionId) return null;
      const { data, error } = await supabase.rpc('whs_imported_counts' as any, {
        p_connection_id: connectionId,
      });
      if (error) throw error;
      const row = (Array.isArray(data) ? data[0] : data) as
        | { rounds: number | string; courses: number | string; friends: number | string }
        | null
        | undefined;
      if (!row) return null;
      // bigints arrive as strings over PostgREST - coerce before rendering.
      const rounds = Number(row.rounds ?? 0);
      // Completion can show a confirmed empty record; legacy polling callers
      // retain their null-on-zero behavior and independent cache shape.
      if (rounds === 0 && !options?.allowZero) return null;
      return {
        rounds,
        courses: Number(row.courses ?? 0),
        friends: Number(row.friends ?? 0),
      };
    },
  });
}
