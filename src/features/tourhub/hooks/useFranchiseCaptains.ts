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
  collegeNormalized: string;
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
            college_normalized
          )
        `)
        .eq('season_id', seasonId)
        .in('player.college_normalized', collegeNames)
        .order('earnings', { ascending: false });

      if (error) {
        console.error('[useFranchiseCaptains] Error:', error);
        return new Map<string, FranchiseCaptain>();
      }

      // Group by college, take the top earner for each
      const captainMap = new Map<string, FranchiseCaptain>();

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
            collegeNormalized: key,
          });
        }
      }

      return captainMap;
    },
    enabled: collegeNames.length > 0 && !!seasonId,
    staleTime: 10 * 60 * 1000,
  });
}
