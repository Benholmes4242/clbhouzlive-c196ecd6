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
  college_normalized: string | null;
  turned_pro: number | null;
  country: string | null;
  country_code: string | null;
  photo_url: string | null;
  height: string | null;
  weight: string | null;
}

// Raw data structure from SportsRadar
interface RawStatistics {
  world_rank?: number;
  points?: number;
  points_rank?: number;
  earnings?: number;
  earnings_rank?: number;
  scoring_avg?: number;
  drive_avg?: number;
  drive_acc?: number;
  gir_pct?: number;
  putt_avg?: number;
  sand_saves_pct?: number;
  scrambling_pct?: number;
  birdies_per_round?: number;
  holes_per_eagle?: number;
  strokes_gained?: number;
  strokes_gained_tee_green?: number;
  strokes_gained_total?: number;
  first_place?: number;
  second_place?: number;
  third_place?: number;
  top_10?: number;
  top_25?: number;
  cuts?: number;
  cuts_made?: number;
  events_played?: number;
  withdrawals?: number;
}

export interface TourPlayerStatistics {
  id: string;
  player_id: string;
  season_id: string;
  // Core stats from columns
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
  // Extracted from raw_data
  world_rank: number | null;
  earnings: number | null;
  earnings_rank: number | null;
  scrambling: number | null;
  birdies_per_round: number | null;
  strokes_gained_total: number | null;
  // Joined player data
  player?: TourPlayer;
}

// Hook: Get current/latest season
// Priority: PGA Tour season with player statistics data
export function useTourSeason() {
  return useQuery({
    queryKey: ['tourhub', 'season'],
    queryFn: async () => {
      // First check which season has player statistics (most valuable)
      const { data: statsSeasons } = await supabase
        .from('sr_player_statistics')
        .select('season_id')
        .limit(1);
      
      if (statsSeasons && statsSeasons.length > 0) {
        // Get the season that has player stats
        const { data: seasonWithStats, error } = await supabase
          .from('sr_seasons')
          .select('*')
          .eq('id', statsSeasons[0].season_id)
          .single();
        
        if (!error && seasonWithStats) {
          console.log('[useTourSeason] Using season with player stats:', seasonWithStats.name);
          return seasonWithStats as TourSeason;
        }
      }
      
      // Fallback: Get most recent PGA Tour season
      const { data: pgaSeason, error: pgaError } = await supabase
        .from('sr_seasons')
        .select('*')
        .or('tour_name.eq.pga,tour_name.eq.PGA Tour')
        .order('year', { ascending: false })
        .limit(1)
        .single();
      
      if (!pgaError && pgaSeason) {
        console.log('[useTourSeason] Using PGA season:', pgaSeason.name);
        return pgaSeason as TourSeason;
      }
      
      // Final fallback: any recent season
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
      console.log('[useTourSeason] Using fallback season:', data.name);
      return data as TourSeason;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook: Get all tournaments for a season (or all if no seasonId)
export function useTourTournaments(seasonId?: string) {
  return useQuery({
    queryKey: ['tourhub', 'tournaments', seasonId || 'all'],
    queryFn: async () => {
      // Get tournaments - if no seasonId, get all recent tournaments
      let query = supabase
        .from('sr_tournaments')
        .select('*')
        .order('start_date', { ascending: true });
      
      // Only filter by season if explicitly provided AND we want season-specific
      // For the Overview/Golf Universe, we want all tournaments
      if (seasonId) {
        // Get tournaments from this season OR any tournaments with matching year
        const { data: seasonData } = await supabase
          .from('sr_seasons')
          .select('year')
          .eq('id', seasonId)
          .single();
        
        if (seasonData?.year) {
          // Get all seasons for this year
          const { data: yearSeasons } = await supabase
            .from('sr_seasons')
            .select('id')
            .eq('year', seasonData.year);
          
          if (yearSeasons && yearSeasons.length > 0) {
            const seasonIds = yearSeasons.map(s => s.id);
            query = query.in('season_id', seasonIds);
          } else {
            query = query.eq('season_id', seasonId);
          }
        } else {
          query = query.eq('season_id', seasonId);
        }
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching tournaments:', error);
        return [];
      }
      console.log('[useTourTournaments] Loaded tournaments:', data?.length || 0);
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

// Helper: Extract and transform raw_data statistics
function extractRawStats(rawData: { statistics?: RawStatistics } | null): Partial<TourPlayerStatistics> {
  if (!rawData?.statistics) return {};
  
  const stats = rawData.statistics;
  return {
    world_rank: stats.world_rank && stats.world_rank > 0 ? stats.world_rank : null,
    earnings: stats.earnings ?? null,
    earnings_rank: stats.earnings_rank ?? null,
    scrambling: stats.scrambling_pct ?? null,
    birdies_per_round: stats.birdies_per_round ?? null,
    strokes_gained_total: stats.strokes_gained_total ?? null,
    // Fill in missing column data from raw
    scoring_average: stats.scoring_avg ?? null,
    driving_distance: stats.drive_avg ?? null,
    driving_accuracy: stats.drive_acc ?? null,
    greens_in_reg: stats.gir_pct ?? null,
    putting_average: stats.putt_avg ?? null,
    sand_saves: stats.sand_saves_pct ?? null,
    top_10s: stats.top_10 ?? null,
    top_25s: stats.top_25 ?? null,
    wins: stats.first_place ?? null,
    fedex_points: stats.points ?? null,
    fedex_rank: stats.points_rank ?? null,
  };
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
      }
      
      // Join player data and extract raw stats
      const playerMap = new Map(players?.map(p => [p.id, p]) || []);
      const enrichedStats = stats.map(stat => {
        const rawExtracted = extractRawStats(stat.raw_data as { statistics?: RawStatistics } | null);
        
        return {
          ...stat,
          // Use column data first, fall back to raw_data
          fedex_points: stat.fedex_points ?? rawExtracted.fedex_points ?? null,
          fedex_rank: stat.fedex_rank ?? rawExtracted.fedex_rank ?? null,
          wins: stat.wins ?? rawExtracted.wins ?? null,
          top_10s: stat.top_10s ?? rawExtracted.top_10s ?? null,
          top_25s: stat.top_25s ?? rawExtracted.top_25s ?? null,
          scoring_average: stat.scoring_average ?? rawExtracted.scoring_average ?? null,
          driving_distance: stat.driving_distance ?? rawExtracted.driving_distance ?? null,
          driving_accuracy: stat.driving_accuracy ?? rawExtracted.driving_accuracy ?? null,
          greens_in_reg: stat.greens_in_reg ?? rawExtracted.greens_in_reg ?? null,
          putting_average: stat.putting_average ?? rawExtracted.putting_average ?? null,
          sand_saves: stat.sand_saves ?? rawExtracted.sand_saves ?? null,
          // Always from raw
          world_rank: rawExtracted.world_rank ?? null,
          earnings: rawExtracted.earnings ?? null,
          earnings_rank: rawExtracted.earnings_rank ?? null,
          scrambling: rawExtracted.scrambling ?? null,
          birdies_per_round: rawExtracted.birdies_per_round ?? null,
          strokes_gained_total: rawExtracted.strokes_gained_total ?? null,
          player: playerMap.get(stat.player_id),
        } as TourPlayerStatistics;
      });
      
      // Debug: log stats before sorting
      const withWorldRank = enrichedStats.filter(s => s.world_rank && s.world_rank > 0);
      const withWins = enrichedStats.filter(s => s.wins && s.wins > 0);
      const withFedexRank = enrichedStats.filter(s => s.fedex_rank && s.fedex_rank > 0);
      console.log('[useTourPlayerStatistics] Data summary:', {
        totalStats: enrichedStats.length,
        withWorldRank: withWorldRank.length,
        withWins: withWins.length,
        withFedexRank: withFedexRank.length,
        sampleRanked: withWorldRank.slice(0, 5).map(s => ({
          playerName: s.player?.full_name,
          playerId: s.player_id,
          worldRank: s.world_rank,
          wins: s.wins,
          fedexRank: s.fedex_rank,
        })),
      });
      
      // Sort by world_rank (properly handling 0/null as unranked)
      return enrichedStats.sort((a, b) => {
        const aRank = a.world_rank && a.world_rank > 0 ? a.world_rank : Infinity;
        const bRank = b.world_rank && b.world_rank > 0 ? b.world_rank : Infinity;
        if (aRank !== bRank) return aRank - bRank;
        // Secondary sort by fedex_rank
        const aFedex = a.fedex_rank && a.fedex_rank > 0 ? a.fedex_rank : Infinity;
        const bFedex = b.fedex_rank && b.fedex_rank > 0 ? b.fedex_rank : Infinity;
        if (aFedex !== bFedex) return aFedex - bFedex;
        // Tertiary sort by events played
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
