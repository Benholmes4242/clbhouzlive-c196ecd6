/**
 * useFranchiseCaptains — Fetches the top-earning player (squad captain) for each college.
 * Joins sr_players with sr_player_statistics for current season earnings.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentSeasonId } from './useCollegeStats';

export interface FranchiseCaptain {
  playerId: string;
  fullName: string;
  photoUrl: string | null;
  pgaTourId: string | null;
  earnings: number;
  /** Earnings of the second-highest-earning alumnus on the same college.
   *  Used to gate the captain context line: caller suppresses the captain
   *  when (earnings - runnerUpEarnings) / earnings <= 0.20, falling back to
   *  the {N} alumni subline. Null when the college has only one alumnus
   *  (treat as full dominance — render the captain). */
  runnerUpEarnings: number | null;
  collegeNormalized: string;
  tourCode: string;
}

export function useFranchiseCaptains(collegeNames: string[]) {
  const seasonId = useCurrentSeasonId();

  return useQuery({
    queryKey: ['franchise-captains', collegeNames, seasonId],
    queryFn: async () => {
      if (!collegeNames.length || !seasonId) return new Map<string, FranchiseCaptain>();

      // Fetch all players for these colleges with their season earnings
      const { data, error } = await supabase
        .from('sr_player_statistics')
        .select(`
          earnings,
          player:sr_players!inner(
            id,
            first_name,
            last_name,
            photo_url,
            pga_tour_id,
            college_normalized,
            tour_codes
          )
        `)
        .eq('season_id', seasonId)
        .in('player.college_normalized', collegeNames)
        .order('earnings', { ascending: false });

      if (error) {
        console.error('[useFranchiseCaptains] Error:', error);
        return new Map<string, FranchiseCaptain>();
      }

      // Group by college. The query is already ordered earnings DESC, so the
      // first row per college is the captain (top earner) and the second row
      // is the runner-up used by the >20% margin gate. Colleges with only
      // one alumnus get runnerUpEarnings = null.
      const captainMap = new Map<string, FranchiseCaptain>();
      const runnerUpSet = new Set<string>();

      for (const row of data || []) {
        const player = row.player as any;
        if (!player?.college_normalized) continue;
        const key = player.college_normalized as string;

        if (!captainMap.has(key)) {
          captainMap.set(key, {
            playerId: player.id,
            fullName: `${player.first_name} ${player.last_name}`,
            photoUrl: player.photo_url,
            pgaTourId: player.pga_tour_id || null,
            earnings: row.earnings || 0,
            runnerUpEarnings: null,
            collegeNormalized: key,
            tourCode: player.tour_codes?.[0] ?? 'pga',
          });
        } else if (!runnerUpSet.has(key)) {
          // Second pass for this college — capture runner-up earnings.
          const captain = captainMap.get(key)!;
          captain.runnerUpEarnings = row.earnings || 0;
          runnerUpSet.add(key);
        }
      }

      return captainMap;
    },
    enabled: collegeNames.length > 0 && !!seasonId,
    staleTime: 10 * 60 * 1000,
  });
}
