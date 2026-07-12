/**
 * useLiveAlumni — cross-references the day's live tournament field
 * (from players-v2 useLivePlayerIds) against alumni college membership.
 *
 * Returns:
 *   - totalLive:   number of alumni currently on the course
 *   - byCollege:   Record<normalized_name, liveCount>
 *
 * JSON-safe (Record, not Map). ONE membership query per fetch.
 *
 * Verified columns (types.ts):
 *   sr_players: id, college_normalized
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLivePlayerIds } from '@/features/tourhub/players-v2/data/useLivePlayerIds';

export interface LiveAlumniData {
  totalLive: number;
  byCollege: Record<string, number>;
}

export function useLiveAlumni() {
  const { data: liveMap } = useLivePlayerIds();
  const livePlayerIds = liveMap ? Object.keys(liveMap) : [];
  const idKey = livePlayerIds.sort().join(',');

  return useQuery<LiveAlumniData>({
    queryKey: ['college-v2', 'live-alumni', idKey],
    enabled: livePlayerIds.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      if (livePlayerIds.length === 0) return { totalLive: 0, byCollege: {} };

      const { data, error } = await supabase
        .from('sr_players')
        .select('id, college_normalized')
        .in('id', livePlayerIds)
        .not('college_normalized', 'is', null);

      if (error) return { totalLive: 0, byCollege: {} };

      const byCollege: Record<string, number> = {};
      let totalLive = 0;
      for (const row of data ?? []) {
        const key = row.college_normalized;
        if (!key) continue;
        byCollege[key] = (byCollege[key] ?? 0) + 1;
        totalLive += 1;
      }
      return { totalLive, byCollege };
    },
  });
}
