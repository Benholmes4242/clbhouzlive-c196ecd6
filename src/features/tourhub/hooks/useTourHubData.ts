import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types based on database schema
export interface TourSeason {
  id: string;
  sr_id: string;
  tour_name: string;
  year: number;
  name: string;
}

export interface TourTournament {
  id: string;
  sr_id: string;
  season_id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
  purse: number | null;
  currency: string | null;
  venue_name: string | null;
  venue_city: string | null;
  venue_state: string | null;
  venue_country: string | null;
  venue_course_name: string | null;
  venue_par: number | null;
  venue_yardage: number | null;
  defending_champion: string | null;
}

export interface TourPlayer {
  id: string;
  sr_id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  birth_date: string | null;
  birth_place: string | null;
  residence: string | null;
  college: string | null;
  turned_pro: number | null;
  country: string | null;
  country_code: string | null;
  photo_url: string | null;
}

export interface TourPlayerStatistics {
  id: string;
  player_id: string;
  season_id: string;
  fedex_points: number | null;
  fedex_rank: number | null;
  events_played: number | null;
  cuts_made: number | null;
  wins: number | null;
  top_10s: number | null;
  top_25s: number | null;
  scoring_average: number | null;
  driving_distance: number | null;
  driving_accuracy: number | null;
  greens_in_reg: number | null;
  putting_average: number | null;
  sand_saves: number | null;
  // Joined player data
  player?: TourPlayer;
}

// Hook: Get current/latest season
export function useTourSeason() {
  return useQuery({
    queryKey: ['tourhub', 'season'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sr_seasons')
        .select('*')
        .order('year', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        console.error('Error fetching season:', error);
        return null;
      }
      return data as TourSeason;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook: Get all tournaments for a season
export function useTourTournaments(seasonId?: string) {
  return useQuery({
    queryKey: ['tourhub', 'tournaments', seasonId],
    queryFn: async () => {
      let query = supabase
        .from('sr_tournaments')
        .select('*')
        .order('start_date', { ascending: true });
      
      if (seasonId) {
        query = query.eq('season_id', seasonId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching tournaments:', error);
        return [];
      }
      return (data || []) as TourTournament[];
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook: Get single tournament
export function useTourTournament(tournamentId: string) {
  return useQuery({
    queryKey: ['tourhub', 'tournament', tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sr_tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();
      
      if (error) {
        console.error('Error fetching tournament:', error);
        return null;
      }
      return data as TourTournament;
    },
    enabled: !!tournamentId,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook: Get all players
export function useTourPlayers(search?: string) {
  return useQuery({
    queryKey: ['tourhub', 'players', search],
    queryFn: async () => {
      let query = supabase
        .from('sr_players')
        .select('*')
        .order('full_name', { ascending: true });
      
      if (search && search.length >= 2) {
        query = query.ilike('full_name', `%${search}%`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching players:', error);
        return [];
      }
      return (data || []) as TourPlayer[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Hook: Get single player
export function useTourPlayer(playerId: string) {
  return useQuery({
    queryKey: ['tourhub', 'player', playerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sr_players')
        .select('*')
        .eq('id', playerId)
        .single();
      
      if (error) {
        console.error('Error fetching player:', error);
        return null;
      }
      return data as TourPlayer;
    },
    enabled: !!playerId,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook: Get player statistics with player info joined
export function useTourPlayerStatistics(seasonId?: string) {
  return useQuery({
    queryKey: ['tourhub', 'player-statistics', seasonId],
    queryFn: async () => {
      // First get statistics
      let query = supabase
        .from('sr_player_statistics')
        .select('*');
      
      if (seasonId) {
        query = query.eq('season_id', seasonId);
      }
      
      const { data: stats, error: statsError } = await query;
      
      if (statsError) {
        console.error('Error fetching player statistics:', statsError);
        return [];
      }
      
      if (!stats || stats.length === 0) return [];
      
      // Get player IDs
      const playerIds = [...new Set(stats.map(s => s.player_id))];
      
      // Fetch players
      const { data: players, error: playersError } = await supabase
        .from('sr_players')
        .select('*')
        .in('id', playerIds);
      
      if (playersError) {
        console.error('Error fetching players for stats:', playersError);
        return stats as TourPlayerStatistics[];
      }
      
      // Join player data
      const playerMap = new Map(players?.map(p => [p.id, p]) || []);
      const enrichedStats = stats.map(stat => ({
        ...stat,
        player: playerMap.get(stat.player_id),
      })) as TourPlayerStatistics[];
      
      // Sort by fedex_rank if available, otherwise by events_played
      return enrichedStats.sort((a, b) => {
        if (a.fedex_rank && b.fedex_rank) return a.fedex_rank - b.fedex_rank;
        if (a.fedex_rank) return -1;
        if (b.fedex_rank) return 1;
        return (b.events_played || 0) - (a.events_played || 0);
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Hook: Check if tables have data (for empty state handling)
export function useTourHubDataStatus() {
  return useQuery({
    queryKey: ['tourhub', 'data-status'],
    queryFn: async () => {
      const [tournaments, players, playerStats, leaderboards, teeTimes, holeStats, summaries] = await Promise.all([
        supabase.from('sr_tournaments').select('id', { count: 'exact', head: true }),
        supabase.from('sr_players').select('id', { count: 'exact', head: true }),
        supabase.from('sr_player_statistics').select('id', { count: 'exact', head: true }),
        supabase.from('sr_leaderboards').select('id', { count: 'exact', head: true }),
        supabase.from('sr_tee_times').select('id', { count: 'exact', head: true }),
        supabase.from('sr_hole_statistics').select('id', { count: 'exact', head: true }),
        supabase.from('sr_tournament_summaries').select('id', { count: 'exact', head: true }),
      ]);
      
      return {
        tournaments: tournaments.count || 0,
        players: players.count || 0,
        playerStats: playerStats.count || 0,
        leaderboards: leaderboards.count || 0,
        teeTimes: teeTimes.count || 0,
        holeStats: holeStats.count || 0,
        summaries: summaries.count || 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Hook: Get leaderboard for a tournament (empty state aware)
export function useTourLeaderboard(tournamentId: string) {
  return useQuery({
    queryKey: ['tourhub', 'leaderboard', tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sr_leaderboards')
        .select(`
          *,
          player:sr_players(*)
        `)
        .eq('tournament_id', tournamentId)
        .order('position', { ascending: true });
      
      if (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!tournamentId,
    staleTime: 60 * 1000, // 1 minute for potentially live data
  });
}

// Hook: Get tee times for a tournament (empty state aware)
export function useTourTeeTimes(tournamentId: string) {
  return useQuery({
    queryKey: ['tourhub', 'tee-times', tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sr_tee_times')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('round_number', { ascending: true });
      
      if (error) {
        console.error('Error fetching tee times:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!tournamentId,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook: Get hole statistics for a tournament (empty state aware)
export function useTourHoleStats(tournamentId: string) {
  return useQuery({
    queryKey: ['tourhub', 'hole-stats', tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sr_hole_statistics')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('hole_number', { ascending: true });
      
      if (error) {
        console.error('Error fetching hole statistics:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!tournamentId,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook: Get tournament summary (empty state aware)
export function useTourTournamentSummary(tournamentId: string) {
  return useQuery({
    queryKey: ['tourhub', 'tournament-summary', tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sr_tournament_summaries')
        .select('*')
        .eq('tournament_id', tournamentId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // Not found is ok
        console.error('Error fetching tournament summary:', error);
        return null;
      }
      return data || null;
    },
    enabled: !!tournamentId,
    staleTime: 5 * 60 * 1000,
  });
}
