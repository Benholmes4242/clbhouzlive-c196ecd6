/**
 * useNavMenuData - Lightweight data hooks for the Tour Hub navigation menu
 * 
 * Provides live tournament count, current leader teaser, player count,
 * top college teaser, and world #1 name for the nav overlay cards.
 * All queries use aggressive caching to keep the menu snappy.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';

/**
 * Count of currently in-progress tournaments
 */
export function useLiveTournamentCount() {
  return useQuery({
    queryKey: ['live-tournament-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('sr_tournaments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'inprogress');
      return count || 0;
    },
    staleTime: 60_000, // 1 minute
  });
}

/**
 * Current leader of the first in-progress tournament
 * Returns: { playerName, score, tournamentName } or null
 */
export function useLiveLeaderTeaser() {
  return useQuery({
    queryKey: ['live-leader-teaser'],
    queryFn: async () => {
      // Get the first in-progress tournament
      const { data: tournament } = await supabase
        .from('sr_tournaments')
        .select('id, name')
        .eq('status', 'inprogress')
        .limit(1)
        .maybeSingle();

      if (!tournament) return null;

      // Get all players at position 1 from that tournament's leaderboard
      const { data: leaders } = await supabase
        .from('sr_leaderboards')
        .select('score, position, player_id, sr_players!sr_leaderboards_player_id_fkey(full_name)')
        .eq('tournament_id', tournament.id)
        .eq('position', 1);

      if (!leaders || leaders.length === 0) return null;

      const first = leaders[0];
      const tiedCount = leaders.length;

      if (tiedCount > 1) {
        return {
          playerName: `${tiedCount} tied for the lead`,
          playerId: null,
          score: first.score,
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          isTied: true,
        };
      }

      const playerData = first.sr_players as unknown as { full_name: string } | null;
      const fullName = playerData?.full_name || 'Unknown';
      const nameParts = fullName.split(' ');
      const displayName = nameParts.length >= 2
        ? `${nameParts[0][0]}. ${nameParts.slice(1).join(' ')}`
        : fullName;

      return {
        playerName: displayName,
        playerId: first.player_id,
        score: first.score,
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        isTied: false,
      };
    },
    staleTime: 60_000, // 1 minute
  });
}

/**
 * Total count of players in the database
 */
export function usePlayerCount() {
  return useQuery({
    queryKey: ['player-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('sr_players')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
    staleTime: 600_000, // 10 minutes
  });
}

/**
 * Top college by earnings
 * Returns: { name, earnings, logoUrl } or null
 */
export function useTopCollegeTeaser() {
  return useQuery({
    queryKey: ['top-college-teaser'],
    queryFn: async () => {
      // Get the latest season_id (same approach as useCurrentSeasonId)
      const { data: latestSeason } = await supabase
        .from('college_season_stats')
        .select('season_id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latestSeason?.season_id) return null;

      const { data } = await supabase
        .from('college_season_stats')
        .select('normalized_name, earnings_total')
        .eq('season_id', latestSeason.season_id)
        .order('earnings_total', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) return null;

      // Get college name
      const { data: media } = await supabase
        .from('college_media')
        .select('college_name')
        .eq('normalized_name', data.normalized_name)
        .maybeSingle();

      const collegeName = media?.college_name || data.normalized_name;

      return {
        name: collegeName,
        earnings: data.earnings_total,
        logoUrl: getCollegeLogoUrl(collegeName),
      };
    },
    staleTime: 600_000, // 10 minutes
  });
}

/**
 * Prefetch nav menu data on trigger hover/press
 */
export function usePrefetchNavMenu() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.prefetchQuery({
      queryKey: ['live-tournament-count'],
      queryFn: async () => {
        const { count } = await supabase
          .from('sr_tournaments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'inprogress');
        return count || 0;
      },
      staleTime: 60_000,
    });
  };
}
