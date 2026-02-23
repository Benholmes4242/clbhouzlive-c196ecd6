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
  /** True if tournament is in date range but has no leaderboard data with strokes yet */
  isStartingSoon?: boolean;
  leader: {
    id: string;
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
  pgaTourId: string | null;
  tourCode: string;
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
  pgaTourId: string | null;
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
  pgaTourId: string | null;
  tourCode: string;
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
      const today = new Date().toISOString().split('T')[0];
      
      // Get all live tournaments + "starting soon" tournaments (created/scheduled but within date range)
      // Using .or() to combine: status=inprogress OR (status in created,scheduled AND start_date<=today AND end_date>=today)
      const { data: tournaments, error: tError } = await supabase
        .from('sr_tournaments')
        .select(`
          id,
          name,
          status,
          start_date,
          end_date,
          purse,
          venue_name,
          venue_city,
          season:sr_seasons!inner(tour_id, tour_name)
        `)
        .or(`status.eq.inprogress,and(status.in.(created,scheduled),start_date.lte.${today},end_date.gte.${today})`)
        .order('start_date', { ascending: true });

      if (tError) throw tError;
      if (!tournaments?.length) return [];

      // Fetch leaders for each tournament in parallel
      // NOTE: Course images are now fetched in the component using useVenueImage hook
      const tournamentsWithLeaders = await Promise.all(
        tournaments.map(async (t: any) => {
          // Fetch leader - only players who have actually played (strokes > 0 and position not null)
          // This prevents showing "E" for players before play has started
          const { data: leader } = await supabase
            .from('sr_leaderboards')
            .select(`
              position,
              score,
              player_id,
              player:sr_players!inner(id, first_name, last_name)
            `)
            .eq('tournament_id', t.id)
            .gt('strokes', 0)
            .not('position', 'is', null)
            .order('position', { ascending: true })
            .limit(1)
            .maybeSingle();

          // Determine if this is a "starting soon" tournament (in date range but no actual play yet)
          const isStartingSoon = t.status !== 'inprogress' || !leader;

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
            isStartingSoon,
            leader: leader ? {
              id: (leader.player as any).id,
              name: `${(leader.player as any).first_name} ${(leader.player as any).last_name}`,
              score: leader.score,
              scoreDisplay: formatScore(leader.score),
            } : null,
          } as LiveTournamentWithLeader;
        })
      );

      return tournamentsWithLeaders;
    },
    staleTime: 5 * 1000,          // 5s — Realtime handles freshness
    refetchInterval: false,        // No polling — Realtime pushes updates
    refetchOnWindowFocus: true,
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

      // Only show tournaments with start_date > today (future)
      // Tournaments starting today are shown in "Live Right Now" as "Starting Soon"
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
        .gt('start_date', today)
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
      // Get the latest ranking_date to avoid mixing old and new data
      const { data: latestDateRow } = await supabase
        .from('sr_world_rankings')
        .select('ranking_date')
        .order('ranking_date', { ascending: false })
        .limit(1)
        .single();
      
      const latestDate = latestDateRow?.ranking_date;

      let query = supabase
        .from('sr_world_rankings')
        .select(`
          rank,
          prior_rank,
          avg_points,
          player:sr_players!inner(id, first_name, last_name, country, photo_url, pga_tour_id, tour_codes)
        `)
        // NOTE: photo_url is NOT used for display — headshots come from R2 via getPlayerHeadshotUrl()
        .not('prior_rank', 'is', null)
        .order('rank', { ascending: true })
        .limit(200);
      
      if (latestDate) {
        query = query.eq('ranking_date', latestDate);
      }

      const { data, error } = await query;

    if (error) throw error;

    // Calculate movers with rank change >= 3
    const allMovers = (data || [])
      .map((row: any) => {
        const rankChange = (row.prior_rank || row.rank) - row.rank; // Positive = moved up
        return {
          playerId: row.player.id,
          firstName: row.player.first_name,
          lastName: row.player.last_name,
          country: row.player.country,
          photoUrl: row.player.photo_url,
          pgaTourId: row.player.pga_tour_id,
          tourCode: row.player.tour_codes?.[0] ?? 'pga',
          rank: row.rank,
          priorRank: row.prior_rank,
          rankChange,
          avgPoints: row.avg_points,
        } as RankingMover;
      })
      .filter(m => Math.abs(m.rankChange) >= 3);

      // Return top 8 upward + top 8 downward to ensure both strips have data
      const upMovers = allMovers.filter(m => m.rankChange > 0).sort((a, b) => b.rankChange - a.rankChange).slice(0, 8);
      const downMovers = allMovers.filter(m => m.rankChange < 0).sort((a, b) => a.rankChange - b.rankChange).slice(0, 8);

      return [...upMovers, ...downMovers];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// MODULE 4: Season Leaders (By Tour) - Hybrid API + Calculated Approach
// ============================================================================

interface SeasonLeadersResult extends TourLeadersData {
  source: 'api' | 'calculated' | 'none';
  message?: string;
}

export function useSeasonLeaders(tourSlug: TourId) {
  return useQuery({
    queryKey: ['overview-season-leaders', tourSlug],
    queryFn: async (): Promise<SeasonLeadersResult> => {
      // Map tour slug to EXACT tour_name match
      // IMPORTANT: Use exact matches to avoid 'pga' matching 'LPGA'
      const tourNameMap: Record<TourId, string> = {
        'pga': 'pga',
        'euro': 'EURO',
        'lpga': 'LPGA',
        'liv': 'LIV',
        'champ': 'CHAMP',
        'pgad': 'PGAD',
      };
      const exactTourName = tourNameMap[tourSlug] || tourSlug;
      
      // Golf seasons often span calendar years (e.g., 2025-2026 season)
      // Try current year + 1 first (the "golf season year"), then current year, then previous
      const calendarYear = new Date().getFullYear();
      const yearsToTry = [calendarYear + 1, calendarYear, calendarYear - 1];
      
      let season = null;
      
      // Helper to find the best season (prefer one with tournament data)
      const findBestSeason = async (year: number): Promise<typeof season> => {
        const { data: seasons } = await supabase
          .from('sr_seasons')
          .select('id, tour_id, tour_name, year')
          .eq('year', year)
          .ilike('tour_name', exactTourName);
        
        // Find exact matches (case-insensitive)
        const matches = seasons?.filter(s => 
          s.tour_name.toLowerCase() === exactTourName.toLowerCase()
        ) || [];
        
        if (matches.length === 0) return null;
        if (matches.length === 1) return matches[0];
        
        // Multiple seasons exist - prefer the one with closed tournaments with winners
        for (const candidate of matches) {
          const { count } = await supabase
            .from('sr_tournaments')
            .select('id', { count: 'exact', head: true })
            .eq('season_id', candidate.id)
            .eq('status', 'closed')
            .not('winner_id', 'is', null);
          
          if (count && count > 0) {
            return candidate;
          }
        }
        
        // No season has tournament data, return first match
        return matches[0];
      };
      
      // Try each year in order
      for (const year of yearsToTry) {
        const found = await findBestSeason(year);
        if (found) {
          season = found;
          break;
        }
      }
      
      const emptyResult: SeasonLeadersResult = {
        tourId: tourSlug,
        tourName: TOUR_CONFIG[tourSlug]?.name || tourSlug,
        year: calendarYear,
        winsLeader: null,
        earningsLeader: null,
        scoringLeader: null,
        source: 'none',
        message: 'No season data available',
      };
      
      if (!season) {
        return emptyResult;
      }
      
      // CHECK: Does this tour have API statistics?
      const { data: apiStatsCheck } = await supabase
        .from('sr_player_statistics')
        .select('id')
        .eq('season_id', season.id)
        .limit(1);
      
      const hasApiStats = apiStatsCheck && apiStatsCheck.length > 0;
      
      if (hasApiStats) {
        // === USE API STATISTICS (PGA Tour) ===
        return await getLeadersFromApiStats(season, tourSlug);
      } else {
        // === CALCULATE FROM LEADERBOARDS (Other Tours) ===
        return await calculateLeadersFromLeaderboards(season, tourSlug);
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Helper: Get leaders from sr_player_statistics (PGA Tour)
async function getLeadersFromApiStats(season: any, tourSlug: TourId): Promise<SeasonLeadersResult> {
  const { data: statsData } = await supabase
    .from('sr_player_statistics')
    .select(`
      wins,
      fedex_points,
      scoring_average,
      raw_data,
      player:sr_players!inner(
        id,
        first_name,
        last_name,
        photo_url,
        pga_tour_id
      )
    `)
    .eq('season_id', season.id);
  
  if (!statsData?.length) {
    return {
      tourId: tourSlug,
      tourName: TOUR_CONFIG[tourSlug]?.name || tourSlug,
      year: season.year,
      winsLeader: null,
      earningsLeader: null,
      scoringLeader: null,
      source: 'api',
      message: 'No statistics available',
    };
  }
  
  // Process stats - extract from raw_data if columns are null
  const processedStats = statsData.map((stat: any) => ({
    player: stat.player,
    wins: stat.wins ?? stat.raw_data?.statistics?.first_place ?? stat.raw_data?.statistics?.wins ?? 0,
    earnings: stat.fedex_points ?? stat.raw_data?.statistics?.earnings ?? stat.raw_data?.statistics?.official_money ?? 0,
    scoringAverage: stat.scoring_average ?? stat.raw_data?.statistics?.scoring_average ?? stat.raw_data?.statistics?.scoring_avg ?? null,
  }));
  
  // Find leaders
  const winsLeader = processedStats
    .filter((p: any) => p.wins > 0)
    .sort((a: any, b: any) => b.wins - a.wins)[0] || null;
  
  const earningsLeader = processedStats
    .filter((p: any) => p.earnings > 0)
    .sort((a: any, b: any) => b.earnings - a.earnings)[0] || null;
  
  const scoringLeader = processedStats
    .filter((p: any) => p.scoringAverage && p.scoringAverage > 0 && p.scoringAverage < 100)
    .sort((a: any, b: any) => a.scoringAverage - b.scoringAverage)[0] || null;
  
  return {
    tourId: tourSlug,
    tourName: TOUR_CONFIG[tourSlug]?.name || tourSlug,
    year: season.year,
    winsLeader: winsLeader ? {
      playerId: winsLeader.player.id,
      firstName: winsLeader.player.first_name,
      lastName: winsLeader.player.last_name,
      photoUrl: winsLeader.player.photo_url,
      pgaTourId: winsLeader.player.pga_tour_id || null,
      value: winsLeader.wins,
    } : null,
    earningsLeader: earningsLeader ? {
      playerId: earningsLeader.player.id,
      firstName: earningsLeader.player.first_name,
      lastName: earningsLeader.player.last_name,
      photoUrl: earningsLeader.player.photo_url,
      pgaTourId: earningsLeader.player.pga_tour_id || null,
      value: earningsLeader.earnings,
    } : null,
    scoringLeader: scoringLeader ? {
      playerId: scoringLeader.player.id,
      firstName: scoringLeader.player.first_name,
      lastName: scoringLeader.player.last_name,
      photoUrl: scoringLeader.player.photo_url,
      pgaTourId: scoringLeader.player.pga_tour_id || null,
      value: scoringLeader.scoringAverage,
    } : null,
    source: 'api',
  };
}

// Helper: Calculate leaders from sr_tournaments winner data + sr_leaderboards for live (Other Tours)
async function calculateLeadersFromLeaderboards(season: any, tourSlug: TourId): Promise<SeasonLeadersResult> {
  
  // === PART 1: Get WINS from closed tournament winners ===
  const { data: closedTournaments } = await supabase
    .from('sr_tournaments')
    .select(`
      id,
      name,
      winner_id,
      purse,
      raw_data
    `)
    .eq('season_id', season.id)
    .eq('status', 'closed')
    .not('winner_id', 'is', null);
  
  // Aggregate wins and earnings by player from closed tournaments
  // NOTE: winner_id is UUID in DB, sr_id is TEXT - we need to convert to string
  const playerWinsMap = new Map<string, {
    srId: string;
    wins: number;
    estimatedEarnings: number;
    playerData: any;
  }>();
  
  for (const tournament of closedTournaments || []) {
    // Convert UUID to string for matching with sr_players.sr_id (TEXT)
    const winnerSrId = String(tournament.winner_id);
    if (!winnerSrId || winnerSrId === 'null') continue;
    
    // Get winner info from raw_data (cast to any for JSON type)
    const rawData = tournament.raw_data as any;
    const winnerData = rawData?.winner;
    
    // Estimate winner earnings (~18% of purse is typical)
    const purse = parseFloat(String(tournament.purse || rawData?.purse || '0'));
    const winnerEarnings = purse * 0.18;
    
    if (!playerWinsMap.has(winnerSrId)) {
      playerWinsMap.set(winnerSrId, {
        srId: winnerSrId,
        wins: 0,
        estimatedEarnings: 0,
        playerData: winnerData,
      });
    }
    
    const stats = playerWinsMap.get(winnerSrId)!;
    stats.wins++;
    stats.estimatedEarnings += winnerEarnings;
  }
  
  // === PART 2: Get live tournament leaders from sr_leaderboards ===
  const { data: liveTournaments } = await supabase
    .from('sr_tournaments')
    .select('id')
    .eq('season_id', season.id)
    .eq('status', 'inprogress');
  
  const liveTournamentIds = (liveTournaments || []).map(t => t.id);
  
  let liveLeaderboardData: any[] = [];
  if (liveTournamentIds.length > 0) {
    const { data } = await supabase
      .from('sr_leaderboards')
      .select(`
        position,
        position_tied,
        money,
        strokes,
        round_1,
        round_2,
        round_3,
        round_4,
        tournament_id,
        player:sr_players!inner(
          id,
          sr_id,
          first_name,
          last_name,
          photo_url,
          pga_tour_id
        )
      `)
      .in('tournament_id', liveTournamentIds)
      .not('position', 'is', null);
    
    liveLeaderboardData = data || [];
  }
  
  // === PART 3: Build final player stats ===
  
  // First, get player details for winners (need photo_url, etc.)
  const winnerSrIds = Array.from(playerWinsMap.keys());
  let winnersWithDetails: any[] = [];
  
  if (winnerSrIds.length > 0) {
    const { data: players } = await supabase
      .from('sr_players')
      .select('id, sr_id, first_name, last_name, photo_url, pga_tour_id')
      .in('sr_id', winnerSrIds);
    
    winnersWithDetails = players || [];
  }
  
  // Build combined stats map
  const finalStatsMap = new Map<string, {
    playerId: string;
    srId: string;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
    pgaTourId: string | null;
    wins: number;
    earnings: number;
    totalStrokes: number;
    totalRounds: number;
  }>();
  
  // Add winners from closed tournaments
  for (const [srId, winnerStats] of playerWinsMap) {
    const playerDetails = winnersWithDetails.find(p => p.sr_id === srId);
    if (playerDetails) {
      finalStatsMap.set(srId, {
        playerId: playerDetails.id,
        srId: srId,
        firstName: playerDetails.first_name || winnerStats.playerData?.first_name || '',
        lastName: playerDetails.last_name || winnerStats.playerData?.last_name || '',
        photoUrl: playerDetails.photo_url,
        pgaTourId: playerDetails.pga_tour_id || null,
        wins: winnerStats.wins,
        earnings: winnerStats.estimatedEarnings,
        totalStrokes: 0,
        totalRounds: 0,
      });
    }
  }
  
  // Add/merge data from live leaderboards
  for (const entry of liveLeaderboardData) {
    const srId = entry.player.sr_id;
    
    if (!finalStatsMap.has(srId)) {
      finalStatsMap.set(srId, {
        playerId: entry.player.id,
        srId: srId,
        firstName: entry.player.first_name,
        lastName: entry.player.last_name,
        photoUrl: entry.player.photo_url,
        pgaTourId: entry.player.pga_tour_id || null,
        wins: 0,
        earnings: 0,
        totalStrokes: 0,
        totalRounds: 0,
      });
    }
    
    const stats = finalStatsMap.get(srId)!;
    
    // Add earnings from live tournament
    if (entry.money) {
      stats.earnings += Number(entry.money);
    }
    
    // Accumulate for scoring average
    let roundsPlayed = 0;
    let totalStrokes = 0;
    
    [entry.round_1, entry.round_2, entry.round_3, entry.round_4].forEach((score: number | null) => {
      if (score && score > 50 && score < 100) {
        roundsPlayed++;
        totalStrokes += score;
      }
    });
    
    if (roundsPlayed > 0) {
      stats.totalStrokes += totalStrokes;
      stats.totalRounds += roundsPlayed;
    }
  }
  
  // Convert to array with scoring average
  const playersArray = Array.from(finalStatsMap.values()).map(stats => ({
    ...stats,
    scoringAverage: stats.totalRounds >= 4
      ? Number((stats.totalStrokes / stats.totalRounds).toFixed(2))
      : null,
  }));
  
  // No data at all?
  if (playersArray.length === 0) {
    return {
      tourId: tourSlug,
      tourName: TOUR_CONFIG[tourSlug]?.name || tourSlug,
      year: season.year,
      winsLeader: null,
      earningsLeader: null,
      scoringLeader: null,
      source: 'calculated',
      message: 'No tournament data available yet',
    };
  }
  
  // === PART 4: Find leaders ===
  
  // Wins leader - from actual completed tournament wins
  const winsLeader = playersArray
    .filter(p => p.wins > 0)
    .sort((a, b) => b.wins - a.wins)[0] || null;
  
  // Earnings leader
  const earningsLeader = playersArray
    .filter(p => p.earnings > 0)
    .sort((a, b) => b.earnings - a.earnings)[0] || null;
  
  // Scoring leader (minimum 8 rounds for meaningful average)
  const scoringLeader = playersArray
    .filter(p => p.scoringAverage !== null && p.totalRounds >= 8)
    .sort((a, b) => a.scoringAverage! - b.scoringAverage!)[0] || null;
  
  return {
    tourId: tourSlug,
    tourName: TOUR_CONFIG[tourSlug]?.name || tourSlug,
    year: season.year,
    winsLeader: winsLeader ? {
      playerId: winsLeader.playerId,
      firstName: winsLeader.firstName,
      lastName: winsLeader.lastName,
      photoUrl: winsLeader.photoUrl,
      pgaTourId: winsLeader.pgaTourId || null,
      value: winsLeader.wins,
    } : null,
    earningsLeader: earningsLeader ? {
      playerId: earningsLeader.playerId,
      firstName: earningsLeader.firstName,
      lastName: earningsLeader.lastName,
      photoUrl: earningsLeader.photoUrl,
      pgaTourId: earningsLeader.pgaTourId || null,
      value: earningsLeader.earnings,
    } : null,
    scoringLeader: scoringLeader ? {
      playerId: scoringLeader.playerId,
      firstName: scoringLeader.firstName,
      lastName: scoringLeader.lastName,
      photoUrl: scoringLeader.photoUrl,
      pgaTourId: scoringLeader.pgaTourId || null,
      value: scoringLeader.scoringAverage!,
    } : null,
    source: 'calculated',
  };
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
          player:sr_players!inner(id, first_name, last_name, country, photo_url, pga_tour_id, tour_codes)
        `)
        // NOTE: photo_url is NOT used for display — headshots come from R2 via getPlayerHeadshotUrl()
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
          pgaTourId: player.pga_tour_id || null,
          tourCode: player.tour_codes?.[0] ?? 'pga',
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
    staleTime: 5 * 1000,          // 5s — Realtime handles freshness
    refetchInterval: false,        // No polling — Realtime pushes updates
    refetchOnWindowFocus: true,
  });
}

// ============================================================================
// MODULE 8: World Rankings Full (Top 200 for browsing)
// Enhanced to extract all available OWGR statistics from raw_data
// ============================================================================

export interface WorldRankingEntry {
  rank: number;
  prior_rank: number | null;
  rank_change: number;
  tied: boolean;
  avg_points: number | null;
  total_points: number | null;
  events_played: number | null;
  points_gained: number | null;
  points_lost: number | null;
  ranking_date: string | null;
  player: {
    id: string;
    first_name: string;
    last_name: string;
    photo_url: string | null;
    country: string | null;
    pga_tour_id: string | null;
    tour_codes?: string[] | null;
  };
}

export function useWorldRankingsFull() {
  return useQuery({
    queryKey: ['world-rankings-full'],
    queryFn: async (): Promise<WorldRankingEntry[]> => {
      // First get the latest ranking_date to avoid duplicate rows from older syncs
      const { data: latestDateRow } = await supabase
        .from('sr_world_rankings')
        .select('ranking_date')
        .order('ranking_date', { ascending: false })
        .limit(1)
        .single();
      
      const latestDate = latestDateRow?.ranking_date;

      let query = supabase
        .from('sr_world_rankings')
        .select(`
          rank,
          prior_rank,
          points,
          avg_points,
          events_played,
          tied,
          ranking_date,
          raw_data,
          player:sr_players!inner(
            id,
            first_name,
            last_name,
            photo_url,
            country,
            pga_tour_id,
            tour_codes
          )
        `)
        .gte('rank', 1)
        .lte('rank', 200)
        .order('rank', { ascending: true });
      
      if (latestDate) {
        query = query.eq('ranking_date', latestDate);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('[WorldRankings] Query error:', error);
        throw error;
      }
      
      // Process data to extract all stats from raw_data.statistics
      return (data || []).map((entry: any): WorldRankingEntry => {
        // Calculate rank change (positive = moved up, negative = moved down)
        const rankChange = entry.prior_rank ? entry.prior_rank - entry.rank : 0;
        
        // Extract statistics from raw_data.statistics JSONB field
        const rawStats = entry.raw_data?.statistics;
        
        // Avg points: column > raw_data.statistics.avg_points > raw_data.avg_points > points column
        const avgPoints = entry.avg_points ?? 
          (rawStats?.avg_points ? parseFloat(rawStats.avg_points) : null) ?? 
          (entry.raw_data?.avg_points ? parseFloat(entry.raw_data.avg_points) : null) ??
          null;
        
        // Total points: raw_data.statistics.points > points column
        const totalPoints = rawStats?.points 
          ? parseFloat(rawStats.points) 
          : (entry.points ? parseFloat(entry.points) : null);
        
        // Events played: column > raw_data.statistics.events_played
        const eventsPlayed = entry.events_played ?? 
          (rawStats?.events_played ? parseInt(rawStats.events_played) : null);
        
        // Points gained/lost this week
        const pointsGained = rawStats?.points_gained 
          ? parseFloat(rawStats.points_gained) 
          : null;
        const pointsLost = rawStats?.points_lost 
          ? parseFloat(rawStats.points_lost) 
          : null;
        
        return {
          rank: entry.rank,
          prior_rank: entry.prior_rank,
          rank_change: rankChange,
          tied: entry.tied ?? false,
          avg_points: avgPoints,
          total_points: totalPoints,
          events_played: eventsPlayed,
          points_gained: pointsGained,
          points_lost: pointsLost,
          ranking_date: entry.ranking_date ?? null,
          player: entry.player,
        };
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// MODULE 9: Season Stats (PGA 2025 Stats Leaders)
// ============================================================================

interface StatPlayer {
  playerId: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  value: number;
  displayValue: string;
}

interface SeasonStatsData {
  year: number;
  tourName: string;
  categories: Record<string, StatPlayer[]>;
}

export function useSeasonStats() {
  return useQuery({
    queryKey: ['season-stats-2025'],
    queryFn: async (): Promise<SeasonStatsData> => {
      // Get PGA 2025 season
      const { data: season } = await supabase
        .from('sr_seasons')
        .select('id, tour_name, year')
        .eq('year', 2025)
        .ilike('tour_name', '%pga%')
        .limit(1)
        .maybeSingle();
      
      if (!season) {
        return { year: 2025, tourName: 'PGA Tour', categories: {} };
      }
      
      // Get all player stats with raw_data
      const { data: statsData } = await supabase
        .from('sr_player_statistics')
        .select(`
          raw_data,
          player:sr_players!inner(
            id,
            first_name,
            last_name,
            photo_url
          )
        `)
        .eq('season_id', season.id);
      
      if (!statsData?.length) {
        return { year: 2025, tourName: 'PGA Tour', categories: {} };
      }
      
      // Define categories with JSON keys and formatting
      const categoryDefs = [
        { id: 'driving_distance', jsonKey: 'drive_avg', sortAsc: false, format: (v: number) => `${v.toFixed(1)} yds`, minValue: 250, maxValue: 400 },
        { id: 'driving_accuracy', jsonKey: 'drive_acc', sortAsc: false, format: (v: number) => `${v.toFixed(1)}%`, minValue: 40, maxValue: 100 },
        { id: 'scrambling', jsonKey: 'scrambling_pct', sortAsc: false, format: (v: number) => `${v.toFixed(1)}%`, minValue: 40, maxValue: 100 },
        { id: 'putting', jsonKey: 'putt_avg', sortAsc: true, format: (v: number) => v.toFixed(3), minValue: 1.5, maxValue: 2.0 },
        { id: 'sg_total', jsonKey: 'strokes_gained_total', sortAsc: false, format: (v: number) => v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2), minValue: -5, maxValue: 5 },
      ];
      
      const categories: Record<string, StatPlayer[]> = {};
      
      for (const def of categoryDefs) {
        // Extract values for this stat from raw_data
        const playersWithStat = statsData
          .map((row: any) => {
            const rawValue = row.raw_data?.statistics?.[def.jsonKey];
            const value = parseFloat(rawValue);
            
            if (isNaN(value)) return null;
            if (def.minValue !== undefined && value < def.minValue) return null;
            if (def.maxValue !== undefined && value > def.maxValue) return null;
            
            return {
              playerId: row.player.id,
              firstName: row.player.first_name,
              lastName: row.player.last_name,
              photoUrl: row.player.photo_url,
              value,
              displayValue: def.format(value),
            };
          })
          .filter(Boolean) as StatPlayer[];
        
        // Sort by value
        playersWithStat.sort((a, b) => 
          def.sortAsc ? a.value - b.value : b.value - a.value
        );
        
        // Take top 10
        categories[def.id] = playersWithStat.slice(0, 10);
      }
      
      return {
        year: 2025,
        tourName: 'PGA Tour',
        categories,
      };
    },
    staleTime: 10 * 60 * 1000,
  });
}
