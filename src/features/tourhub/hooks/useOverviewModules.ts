/**
 * useOverviewModules - Data hooks for the 7 Overview modules
 * Live-first, cross-tour, narrative-driven data fetching
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TourId, TOUR_CONFIG } from './useOverviewData';

// ============================================================================
// Types
// ============================================================================

export interface LiveTournamentWithLeader {
  id: string;
  name: string;
  status: string;
  startDate: string;
  purse: number | null;
  tourId: string;
  tourSlug: TourId;
  venueName: string | null;
  venueCity: string | null;
  leader: {
    name: string;
    score: number;
    scoreDisplay: string;
  } | null;
}

export interface UpcomingTournament {
  id: string;
  name: string;
  startDate: string;
  venueCity: string | null;
  venueCountry: string | null;
  purse: number | null;
  tourId: string;
  tourSlug: TourId;
}

export interface RankingMover {
  playerId: string;
  firstName: string;
  lastName: string;
  country: string | null;
  photoUrl: string | null;
  rank: number;
  priorRank: number | null;
  rankChange: number;
  avgPoints: number | null;
}

export interface TourLeader {
  playerId: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  value: number;
}

export interface TourLeadersData {
  tourId: TourId;
  tourName: string;
  year?: number;
  winsLeader: TourLeader | null;
  earningsLeader: TourLeader | null;
  scoringLeader: TourLeader | null;
}

export interface SpotlightPlayer {
  playerId: string;
  firstName: string;
  lastName: string;
  country: string | null;
  photoUrl: string | null;
  label: string;
  statLabel: string;
  statValue: string;
  rank?: number;
}

export interface CourseThisWeek {
  tournamentId: string;
  tournamentName: string;
  venueName: string | null;
  venueCity: string | null;
  venuePar: number | null;
  venueYardage: number | null;
  tourSlug: TourId;
}

export interface LivePulseStats {
  liveNow: number;
  activePlayers: number;
  birdiesToday: number;
  avgScore: number;
}

// ============================================================================
// Helpers
// ============================================================================

function mapTourSlug(tourName: string): TourId {
  const normalized = tourName?.toLowerCase().trim();
  if (normalized === 'pga' || normalized === 'pga tour') return 'pga';
  if (normalized === 'euro' || normalized === 'dp world' || normalized === 'european tour') return 'euro';
  if (normalized === 'lpga' || normalized === 'lpga tour') return 'lpga';
  if (normalized === 'liv' || normalized === 'liv golf') return 'liv';
  if (normalized === 'pgad' || normalized === 'korn ferry') return 'pgad';
  if (normalized === 'champ' || normalized === 'champions') return 'champ';
  return 'pga';
}

function formatScore(score: number): string {
  if (score === 0) return 'E';
  return score > 0 ? `+${score}` : `${score}`;
}

// ============================================================================
// MODULE 1: Live Right Now
// ============================================================================

export function useLiveRightNow() {
  return useQuery({
    queryKey: ['overview-live-right-now'],
    queryFn: async () => {
      // Get all live tournaments with venue info
      const { data: tournaments, error: tError } = await supabase
        .from('sr_tournaments')
        .select(`
          id,
          name,
          status,
          start_date,
          purse,
          venue_name,
          venue_city,
          season:sr_seasons!inner(tour_id, tour_name)
        `)
        .eq('status', 'inprogress')
        .order('start_date', { ascending: true });

      if (tError) throw tError;
      if (!tournaments?.length) return [];

      // Fetch leaders for each tournament in parallel
      // NOTE: Course images are now fetched in the component using useVenueImage hook
      const tournamentsWithLeaders = await Promise.all(
        tournaments.map(async (t: any) => {
          // Fetch leader
          const { data: leader } = await supabase
            .from('sr_leaderboards')
            .select(`
              position,
              score,
              player:sr_players!inner(first_name, last_name)
            `)
            .eq('tournament_id', t.id)
            .order('position', { ascending: true })
            .limit(1)
            .maybeSingle();

          return {
            id: t.id,
            name: t.name,
            status: t.status,
            startDate: t.start_date,
            purse: t.purse,
            tourId: t.season.tour_id,
            tourSlug: mapTourSlug(t.season.tour_name),
            venueName: t.venue_name,
            venueCity: t.venue_city,
            leader: leader ? {
              name: `${(leader.player as any).first_name} ${(leader.player as any).last_name}`,
              score: leader.score,
              scoreDisplay: formatScore(leader.score),
            } : null,
          } as LiveTournamentWithLeader;
        })
      );

      return tournamentsWithLeaders;
    },
    staleTime: 30 * 1000, // 30 seconds for live data
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

// ============================================================================
// MODULE 2: Coming Up Next (Next 7 Days)
// ============================================================================

export function useComingUpNext() {
  return useQuery({
    queryKey: ['overview-coming-up-next'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('sr_tournaments')
        .select(`
          id,
          name,
          start_date,
          venue_city,
          venue_country,
          purse,
          season:sr_seasons!inner(tour_id, tour_name)
        `)
        .in('status', ['scheduled', 'created'])
        .gte('start_date', today)
        .lte('start_date', nextWeek)
        .order('start_date', { ascending: true })
        .limit(8);

      if (error) throw error;

      return (data || []).map((row: any): UpcomingTournament => ({
        id: row.id,
        name: row.name,
        startDate: row.start_date,
        venueCity: row.venue_city,
        venueCountry: row.venue_country,
        purse: row.purse,
        tourId: row.season.tour_id,
        tourSlug: mapTourSlug(row.season.tour_name),
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// MODULE 3: Movers This Week (World Rankings)
// ============================================================================

export function useRankingMovers() {
  return useQuery({
    queryKey: ['overview-ranking-movers'],
    queryFn: async () => {
      // First, get all rankings with prior_rank
      const { data, error } = await supabase
        .from('sr_world_rankings')
        .select(`
          rank,
          prior_rank,
          avg_points,
          player:sr_players!inner(id, first_name, last_name, country, photo_url)
        `)
        .not('prior_rank', 'is', null)
        .order('rank', { ascending: true })
        .limit(200);

      if (error) throw error;

      // Calculate movers with rank change >= 3
      const movers = (data || [])
        .map((row: any) => {
          const rankChange = (row.prior_rank || row.rank) - row.rank; // Positive = moved up
          return {
            playerId: row.player.id,
            firstName: row.player.first_name,
            lastName: row.player.last_name,
            country: row.player.country,
            photoUrl: row.player.photo_url,
            rank: row.rank,
            priorRank: row.prior_rank,
            rankChange,
            avgPoints: row.avg_points,
          } as RankingMover;
        })
        .filter(m => Math.abs(m.rankChange) >= 3)
        .sort((a, b) => Math.abs(b.rankChange) - Math.abs(a.rankChange)) // Biggest movers first
        .slice(0, 8);

      return movers;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// MODULE 4: Season Leaders (By Tour)
// ============================================================================

export function useSeasonLeaders(tourSlug: TourId) {
  return useQuery({
    queryKey: ['overview-season-leaders', tourSlug],
    queryFn: async () => {
      // Find the latest year that has statistics data for this tour
      const tourPattern = tourSlug === 'euro' ? 'euro' : tourSlug;
      
      const { data: latestSeasonData } = await supabase
        .from('sr_player_statistics')
        .select('season:sr_seasons!inner(id, year, tour_name)')
        .ilike('sr_seasons.tour_name', `%${tourPattern}%`)
        .order('sr_seasons.year', { ascending: false })
        .limit(1);

      // Default to 2025 if no data found
      const latestYear = (latestSeasonData?.[0]?.season as any)?.year || 2025;

      // Get season ID for the selected tour and year
      const { data: seasons, error: sError } = await supabase
        .from('sr_seasons')
        .select('id, tour_id, tour_name, year')
        .eq('year', latestYear)
        .ilike('tour_name', `%${tourPattern}%`)
        .limit(1);

      if (sError) throw sError;
      if (!seasons?.length) return { tourId: tourSlug, tourName: TOUR_CONFIG[tourSlug]?.name || tourSlug, year: latestYear, winsLeader: null, earningsLeader: null, scoringLeader: null };

      const seasonId = seasons[0].id;
      const actualYear = seasons[0].year;

      // Get all player statistics for this season, including raw_data
      const { data: stats, error: stError } = await supabase
        .from('sr_player_statistics')
        .select(`
          wins,
          fedex_points,
          scoring_average,
          raw_data,
          player:sr_players!inner(id, first_name, last_name, photo_url)
        `)
        .eq('season_id', seasonId)
        .gt('events_played', 0);

      if (stError) throw stError;
      if (!stats?.length) return { tourId: tourSlug, tourName: TOUR_CONFIG[tourSlug]?.name || tourSlug, year: actualYear, winsLeader: null, earningsLeader: null, scoringLeader: null };

      // Process stats - extract from raw_data when columns are NULL
      const processed = stats.map((s: any) => {
        const rawStats = s.raw_data?.statistics || {};
        return {
          playerId: s.player.id,
          firstName: s.player.first_name,
          lastName: s.player.last_name,
          photoUrl: s.player.photo_url,
          // Try column first, fall back to raw_data
          wins: s.wins ?? rawStats.first_place ?? 0,
          earnings: s.fedex_points ?? rawStats.earnings ?? 0,
          scoringAvg: s.scoring_average ?? rawStats.scoring_avg ?? 999,
        };
      });

      // Find leaders in each category
      const winsLeader = [...processed].filter(p => p.wins > 0).sort((a, b) => b.wins - a.wins)[0];
      const earningsLeader = [...processed].filter(p => p.earnings > 0).sort((a, b) => b.earnings - a.earnings)[0];
      const scoringLeader = [...processed]
        .filter(s => s.scoringAvg && s.scoringAvg < 100)
        .sort((a, b) => a.scoringAvg - b.scoringAvg)[0];

      return {
        tourId: tourSlug,
        tourName: TOUR_CONFIG[tourSlug]?.name || tourSlug,
        year: actualYear,
        winsLeader: winsLeader ? {
          playerId: winsLeader.playerId,
          firstName: winsLeader.firstName,
          lastName: winsLeader.lastName,
          photoUrl: winsLeader.photoUrl,
          value: winsLeader.wins,
        } : null,
        earningsLeader: earningsLeader ? {
          playerId: earningsLeader.playerId,
          firstName: earningsLeader.firstName,
          lastName: earningsLeader.lastName,
          photoUrl: earningsLeader.photoUrl,
          value: earningsLeader.earnings,
        } : null,
        scoringLeader: scoringLeader ? {
          playerId: scoringLeader.playerId,
          firstName: scoringLeader.firstName,
          lastName: scoringLeader.lastName,
          photoUrl: scoringLeader.photoUrl,
          value: scoringLeader.scoringAvg,
        } : null,
      } as TourLeadersData;
    },
    staleTime: 10 * 60 * 1000,
  });
}

// ============================================================================
// MODULE 5: Player Spotlight
// ============================================================================

export function usePlayerSpotlight() {
  return useQuery({
    queryKey: ['overview-player-spotlight'],
    queryFn: async () => {
      // Get World No. 1
      const { data: worldNo1, error } = await supabase
        .from('sr_world_rankings')
        .select(`
          rank,
          avg_points,
          player:sr_players!inner(id, first_name, last_name, country, photo_url)
        `)
        .eq('rank', 1)
        .maybeSingle();

      if (error) throw error;

      if (worldNo1) {
        const player = worldNo1.player as any;
        return {
          playerId: player.id,
          firstName: player.first_name,
          lastName: player.last_name,
          country: player.country,
          photoUrl: player.photo_url,
          label: 'World No. 1',
          statLabel: 'Avg Points',
          statValue: worldNo1.avg_points?.toFixed(2) || 'N/A',
          rank: 1,
        } as SpotlightPlayer;
      }

      return null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// MODULE 6: Course Intelligence (This Week's Venues)
// ============================================================================

export function useCoursesThisWeek() {
  return useQuery({
    queryKey: ['overview-courses-this-week'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('sr_tournaments')
        .select(`
          id,
          name,
          venue_name,
          venue_city,
          venue_par,
          venue_yardage,
          season:sr_seasons!inner(tour_id, tour_name)
        `)
        .in('status', ['scheduled', 'inprogress'])
        .gte('start_date', today)
        .lte('start_date', nextWeek)
        .order('start_date', { ascending: true })
        .limit(6);

      if (error) throw error;

      // NOTE: Course images are now fetched in the component using useVenueImage hook
      return (data || []).map((row: any): CourseThisWeek => ({
        tournamentId: row.id,
        tournamentName: row.name,
        venueName: row.venue_name,
        venueCity: row.venue_city,
        venuePar: row.venue_par,
        venueYardage: row.venue_yardage,
        tourSlug: mapTourSlug(row.season.tour_name),
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// MODULE 7: Live Golf Pulse
// ============================================================================

export function useLiveGolfPulse() {
  return useQuery({
    queryKey: ['overview-live-pulse'],
    queryFn: async () => {
      // Parallel queries
      const [liveRes, activePlayersRes] = await Promise.all([
        supabase
          .from('sr_tournaments')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'inprogress'),
        supabase
          .from('sr_leaderboards')
          .select('id', { count: 'exact', head: true })
          .in('status', ['active', 'cut']),
      ]);

      // Get all leaderboard data for live tournaments to calculate stats
      const { data: liveLeaderboards } = await supabase
        .from('sr_leaderboards')
        .select(`
          score,
          tournament:sr_tournaments!inner(status)
        `)
        .eq('sr_tournaments.status', 'inprogress');

      // Calculate average score
      const scores = (liveLeaderboards || [])
        .map((l: any) => l.score)
        .filter((s: number | null) => s !== null && !isNaN(s));
      
      const avgScore = scores.length > 0 
        ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length 
        : 0;

      // Estimate birdies (scores under par indicate birdies made)
      const birdiesToday = scores.filter((s: number) => s < 0).length * 3; // Rough estimate

      return {
        liveNow: liveRes.count || 0,
        activePlayers: activePlayersRes.count || 0,
        birdiesToday,
        avgScore: Math.round(avgScore * 10) / 10,
      } as LivePulseStats;
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}
