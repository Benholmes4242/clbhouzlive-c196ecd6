import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

/**
 * THE BOARD'S OPT-OUT SET (BRIEF_LEADERBOARD_ROW_PROVENANCE_AND_OPTOUT §S3.1).
 *
 * THE GOVERNING FLAG IS `user_profiles.show_in_exploration_leaderboards`. The
 * Discover crown board is the amateur-circuit ranking that sits in the courses
 * area, and that column is the only per-surface leaderboard opt-out this app
 * holds for it. `show_in_handicap_leaderboards` governs the handicap boards and
 * is DELIBERATELY not consulted here (see useGolfThisWeek.ts:202 — Ben overruled
 * consulting it for the handicap BAND scope; it is not this board's switch).
 * `peer_comparison_visible` and `show_handicap` are handicap-figure controls,
 * not board membership, so neither is read.
 *
 * EXCLUSION, NOT HIDING: the caller filters the board POOL with this set, before
 * ranking and before the header stat rail is counted, so positions close up and
 * the rail agrees with the rows on screen.
 *
 * ABSENT MEANS ELIGIBLE. A member id that does not come back — an unresolvable
 * profile, a failed read — is NOT excluded: a fetch fault must not silently
 * empty a board.
 */
export function useLeaderboardOptOuts(userIds: readonly string[]) {
  const key = useMemo(() => [...new Set(userIds)].sort(), [userIds]);

  const query = useQuery<string[]>({
    queryKey: ['courseled', 'board-optouts', key],
    enabled: key.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, show_in_exploration_leaderboards')
        .in('id', key as string[]);
      if (error) throw error;
      return (data ?? [])
        .filter((r) => r.show_in_exploration_leaderboards === false)
        .map((r) => r.id as string);
    },
  });

  return useMemo(() => new Set(query.data ?? []), [query.data]);
}
