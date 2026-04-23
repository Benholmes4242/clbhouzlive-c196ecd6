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
import { getContextLabel } from '../utils/tournamentClassification';

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
const TOUR_PRIORITY_ORDER: Record<string, number> = {
  pga: 0, liv: 1, euro: 2, lpga: 3, pgad: 4, champ: 5,
};

function getTourSlug(tourName: string): string {
  const n = tourName?.toLowerCase().trim();
  if (n === 'pga' || n === 'pga tour') return 'pga';
  if (n === 'euro' || n === 'dp world' || n === 'european tour') return 'euro';
  if (n === 'lpga' || n === 'lpga tour') return 'lpga';
  if (n === 'liv' || n === 'liv golf') return 'liv';
  if (n === 'pgad' || n === 'korn ferry') return 'pgad';
  if (n === 'champ' || n === 'champions') return 'champ';
  return 'pga';
}

export function useLiveLeaderTeaser() {
  return useQuery({
    queryKey: ['live-leader-teaser'],
    queryFn: async () => {
      // Fetch ALL live tournaments with enough data to prioritise
      const { data: liveTournaments } = await supabase
        .from('sr_tournaments')
        .select('id, name, purse, season:sr_seasons!inner(tour_name)')
        .eq('status', 'inprogress')
        .order('purse', { ascending: false });

      if (!liveTournaments || liveTournaments.length === 0) return null;

      // Score each live tournament — majors always win
      const scored = liveTournaments.map(t => {
        const tourName = (t.season as any)?.tour_name || '';
        const tourSlug = getTourSlug(tourName);
        const label = getContextLabel({ name: t.name, tourName });
        const isMajor = label === 'MAJOR CHAMPIONSHIP';

        return {
          id: t.id,
          name: t.name,
          isMajor,
          tourPriority: TOUR_PRIORITY_ORDER[tourSlug] ?? 99,
          purse: t.purse ?? 0,
        };
      });

      scored.sort((a, b) => {
        if (a.isMajor !== b.isMajor) return a.isMajor ? -1 : 1;
        if (a.tourPriority !== b.tourPriority) return a.tourPriority - b.tourPriority;
        return b.purse - a.purse;
      });

      const tournament = scored[0];

      // Get all leaders at position 1 — supports both player and team events
      const { data: leaders } = await supabase
        .from('sr_leaderboards')
        .select(`
          score, position, player_id, team_id,
          player:sr_players!sr_leaderboards_player_id_fkey(full_name),
          team:sr_teams!sr_leaderboards_team_id_fkey(display_name, abbr_name)
        `)
        .eq('tournament_id', tournament.id)
        .eq('position', 1);

      if (!leaders || leaders.length === 0) return null;

      const first = leaders[0] as any;
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

      // Resolve display name from team or player
      let displayName = 'Unknown';
      if (first.team) {
        displayName = first.team.abbr_name || first.team.display_name || 'Team';
      } else if (first.player) {
        const fullName = first.player.full_name || 'Unknown';
        const nameParts = fullName.split(' ');
        displayName = nameParts.length >= 2
          ? `${nameParts[0][0]}. ${nameParts.slice(1).join(' ')}`
          : fullName;
      }

      return {
        playerName: displayName,
        playerId: first.player_id,
        score: first.score,
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        isTied: false,
      };
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
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
