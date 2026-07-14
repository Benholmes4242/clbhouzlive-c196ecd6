/**
 * useWallLevels -- batch medal counts for a set of user ids.
 *
 * Backed by the get_wall_medals(p_user_ids uuid[]) RPC (single call,
 * dedup + 5min stale). Feature-detects on error: returns an empty map
 * so callers simply omit their gems -- no placeholders, no zeros.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useWallLevels(userIds: (string | null | undefined)[]) {
  const deduped = Array.from(
    new Set(userIds.filter((id): id is string => typeof id === 'string' && id.length > 0)),
  ).sort();

  return useQuery<Map<string, number>>({
    queryKey: ['gam', 'wall-levels', deduped],
    enabled: deduped.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: false,
    queryFn: async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.rpc as any)('get_wall_medals', {
          p_user_ids: deduped,
        });
        if (error || !Array.isArray(data)) return new Map<string, number>();
        const out = new Map<string, number>();
        for (const row of data as Array<{ user_id: string; medals: number }>) {
          if (row && typeof row.user_id === 'string') {
            out.set(row.user_id, typeof row.medals === 'number' ? row.medals : 0);
          }
        }
        return out;
      } catch {
        return new Map<string, number>();
      }
    },
  });
}

export default useWallLevels;
