/**
 * useOverviewModules - Data hooks for the 7 Overview modules
 * Live-first, cross-tour, narrative-driven data fetching
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TourId, TOUR_CONFIG } from './useOverviewData';
import { useTournamentsCache, type CachedTournament, type TournamentsCache } from '@/hooks/useTournamentsCache';

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
  currentRound: number;
  leader: {
    id: string;
    name: string;
    country: string | null;
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
  const { data: cache, isLoading: cacheLoading } = useTournamentsCache();

  return useQuery({
    queryKey: ['overview-live-right-now', cache ? 'ready' : 'waiting'],
    queryFn: async () => {
      if (!cache?.live.length) return [];

      const tournamentIds = cache.live.map(t => t.id);

      // Batch fetch leaders for ALL live tournaments in a single query
      const { data: allLeaders } = await supabase
        .from('sr_leaderboards')
        .select(`
          tournament_id,
          position,
          score,
          player_id,
          team_id,
          thru,
          round_1,
          round_2,
          round_3,
          round_4,
          player:sr_players!sr_leaderboards_player_id_fkey(id, first_name, last_name, full_name, country),
          team:sr_teams!sr_leaderboards_team_id_fkey(id, display_name, abbr_name)
        `)
        .in('tournament_id', tournamentIds)
        .eq('position', 1)
        .gt('strokes', 0)
        .not('position', 'is', null);

      // Build leader map (synthesize player from team for team events) and count ties
      const leaderMap: Record<string, any> = {};
      const leaderCountMap: Record<string, number> = {};
      for (const entry of (allLeaders || []) as any[]) {
        leaderCountMap[entry.tournament_id] = (leaderCountMap[entry.tournament_id] ?? 0) + 1;
        if (!leaderMap[entry.tournament_id]) {
          if (!entry.player && entry.team) {
            const teamName = entry.team.abbr_name || entry.team.display_name || 'Team';
            entry.player = {
              id: entry.team.id,
              first_name: '',
              last_name: '',
              full_name: teamName,
            };
          }
          leaderMap[entry.tournament_id] = entry;
        }
      }

      return cache.live.map((t): LiveTournamentWithLeader => {
        const leaderEntry = leaderMap[t.id] || null;
        const isStartingSoon = t.status !== 'inprogress' || !leaderEntry;

        // Compute current round from leader's round scores + thru
        const r1 = leaderEntry?.round_1;
        const r2 = leaderEntry?.round_2;
        const r3 = leaderEntry?.round_3;
        const r4 = leaderEntry?.round_4;
        const thru = leaderEntry?.thru;
        const midRound = thru != null && thru > 0 && thru < 18;
        let currentRound = 1;
        if (r4 != null) currentRound = 4;
        else if (r3 != null) currentRound = 4; // R3 complete → R4 is current (final round)
        else if (r2 != null) currentRound = 3;
        else if (r1 != null) currentRound = 2;

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
          currentRound,
          leader: leaderEntry
            ? leaderCountMap[t.id] > 1
              ? {
                  id: (leaderEntry.player as any).id,
                  name: `${leaderCountMap[t.id]} tied`,
                  country: null,
                  score: leaderEntry.score,
                  scoreDisplay: formatScore(leaderEntry.score),
                }
              : {
                  id: (leaderEntry.player as any).id,
                  name: `${(leaderEntry.player as any).first_name} ${(leaderEntry.player as any).last_name}`,
                  country: (leaderEntry.player as any).country ?? null,
                  score: leaderEntry.score,
                  scoreDisplay: formatScore(leaderEntry.score),
                }
            : null,
        };
      });
    },
    enabled: !!cache,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

// MODULE 2: Coming Up Next — REMOVED (Brief 36, dead consumer deleted)

// ============================================================================
// MODULE 3: Movers This Week (World Rankings)
// ============================================================================

export function useRankingMovers(tourCode: string = 'pga') {
  return useQuery({
    queryKey: ['overview-ranking-movers', tourCode],
    queryFn: async () => {
      // Non-PGA tours use tour_season_rankings which lacks prior_rank data
      // so movers are not available — return empty
      if (tourCode !== 'pga') {
        return [] as RankingMover[];
      }

      const { data, error } = await supabase
        .from('sr_world_rankings')
        .select(`
          rank,
          prior_rank,
          avg_points,
          ranking_date,
          player:sr_players!inner(id, first_name, last_name, country, photo_url, pga_tour_id, tour_codes)
        `)
        // NOTE: photo_url is NOT used for display — headshots come from R2 via getPlayerHeadshotUrl()
        .not('prior_rank', 'is', null)
        .order('ranking_date', { ascending: false })
        .order('rank', { ascending: true })
        .limit(200);

      if (error) throw error;

      // Post-filter to latest date only
      const latestDate = data?.[0]?.ranking_date ?? null;
      const latestRows = latestDate ? (data ?? []).filter(r => r.ranking_date === latestDate) : (data ?? []);

    // Calculate movers with rank change >= 3
    const allMovers = (latestRows)
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
  const { data: cache } = useTournamentsCache();

  return useQuery({
    queryKey: ['overview-season-leaders', tourSlug, cache ? 'ready' : 'waiting'],
    queryFn: async (): Promise<SeasonLeadersResult> => {
      // Map tour slug to EXACT tour_name match
      const tourNameMap: Record<TourId, string> = {
        'pga': 'pga',
        'euro': 'EURO',
        'lpga': 'LPGA',
        'liv': 'LIV',
        'champ': 'CHAMP',
        'pgad': 'PGAD',
      };
      const exactTourName = tourNameMap[tourSlug] || tourSlug;
      
      const calendarYear = new Date().getFullYear();
      const yearsToTry = [calendarYear + 1, calendarYear, calendarYear - 1];
      
      let season = null;
      
      // Use the cache to check which seasons have closed tournaments (avoids per-tour head queries)
      const cacheCompletedSeasonIds = new Set(
        (cache?.completed || [])
          .filter(t => t.winner_id)
          .map(t => t.season_id)
          .filter((id): id is string => !!id)
      );
      
      const findBestSeason = async (year: number): Promise<typeof season> => {
        const { data: seasons } = await supabase
          .from('sr_seasons')
          .select('id, tour_id, tour_name, year')
          .eq('year', year)
          .ilike('tour_name', exactTourName);
        
        const matches = seasons?.filter(s => 
          s.tour_name.toLowerCase() === exactTourName.toLowerCase()
        ) || [];
        
        if (matches.length === 0) return null;
        if (matches.length === 1) return matches[0];
        
        // Multiple seasons: prefer one with closed tournaments (check cache first, no DB query)
        for (const candidate of matches) {
          if (cacheCompletedSeasonIds.has(candidate.id)) {
            return candidate;
          }
        }
        
        // Cache didn't cover it (older data) — fall back to a single head query
        for (const candidate of matches) {
          const { count } = await supabase
            .from('sr_tournaments')
            .select('id', { count: 'exact', head: true })
            .eq('season_id', candidate.id)
            .eq('status', 'closed')
            .not('winner_id', 'is', null);
          
          if (count && count > 0) return candidate;
        }
        
        return matches[0];
      };
      
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
        return await getLeadersFromApiStats(season, tourSlug);
      } else {
        return await calculateLeadersFromLeaderboards(season, tourSlug, cache);
      }
    },
    enabled: !!cache,
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
async function calculateLeadersFromLeaderboards(season: any, tourSlug: TourId, cache?: TournamentsCache | null): Promise<SeasonLeadersResult> {
  
  // === PART 1: Get WINS from closed tournament winners ===
  // NOTE: This queries the full season (not just 7-day cache window)
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
  const playerWinsMap = new Map<string, {
    srId: string;
    wins: number;
    estimatedEarnings: number;
    playerData: any;
  }>();
  
  for (const tournament of closedTournaments || []) {
    const winnerSrId = String(tournament.winner_id);
    if (!winnerSrId || winnerSrId === 'null') continue;
    
    const rawData = tournament.raw_data as any;
    const winnerData = rawData?.winner;
    
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
  
  // === PART 2: Get live tournament IDs from cache (avoids another sr_tournaments query) ===
  const liveTournamentIds = cache?.live
    .filter(t => t.season_id === season.id)
    .map(t => t.id) || [];
  
  // Fallback if cache doesn't cover this season
  if (liveTournamentIds.length === 0) {
    const { data: liveTournaments } = await supabase
      .from('sr_tournaments')
      .select('id')
      .eq('season_id', season.id)
      .eq('status', 'inprogress');
    
    liveTournamentIds.push(...(liveTournaments || []).map(t => t.id));
  }
  
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
        player:sr_players!sr_leaderboards_player_id_fkey(
          id,
          sr_id,
          first_name,
          last_name,
          photo_url,
          pga_tour_id
        )
      `)
      .in('tournament_id', liveTournamentIds)
      .not('position', 'is', null)
      .not('player_id', 'is', null);

    liveLeaderboardData = (data || []).filter((row: any) => row.player);
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
          statLabel: 'Total Points',
          statValue: worldNo1.avg_points ? Math.round(worldNo1.avg_points).toLocaleString() : 'N/A',
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

// MODULE 7: Live Golf Pulse — REMOVED (Brief 36, dead consumer deleted)

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

export function useWorldRankingsFull(tourCode: string = 'pga') {
  return useQuery({
    queryKey: ['world-rankings-full', tourCode],
    queryFn: async (): Promise<WorldRankingEntry[]> => {
      // Non-PGA tours: use tour_season_rankings (Race to Dubai, Rolex Rankings, LIV standings, KFT)
      if (tourCode !== 'pga') {
        return await fetchTourSeasonRankingsAsWorldEntries(tourCode);
      }

      // PGA: use sr_world_rankings (OWGR)
      const { data, error } = await supabase
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
        .order('ranking_date', { ascending: false })
        .order('rank', { ascending: true });

      if (error) {
        console.error('[WorldRankings] Query error:', error);
        throw error;
      }

      // Post-filter to latest date
      const latestDate = data?.[0]?.ranking_date ?? null;
      const latestRows = latestDate ? (data ?? []).filter(r => r.ranking_date === latestDate) : (data ?? []);

      // Client-side tour filter (PGA = all OWGR players)
      const tourFiltered = latestRows;
      
      // Process data to extract all stats from raw_data.statistics
      return tourFiltered.map((entry: any): WorldRankingEntry => {
        const rankChange = entry.prior_rank ? entry.prior_rank - entry.rank : 0;
        const rawStats = entry.raw_data?.statistics;
        
        const avgPoints = entry.avg_points ?? 
          (rawStats?.avg_points ? parseFloat(rawStats.avg_points) : null) ?? 
          (entry.raw_data?.avg_points ? parseFloat(entry.raw_data.avg_points) : null) ??
          null;
        
        const totalPoints = rawStats?.points 
          ? parseFloat(rawStats.points) 
          : (entry.points ? parseFloat(entry.points) : null);
        
        const eventsPlayed = entry.events_played ?? 
          (rawStats?.events_played ? parseInt(rawStats.events_played) : null);
        
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

/**
 * Fetch tour_season_rankings and map to WorldRankingEntry shape
 * Used for DPWT, LPGA, LIV, Korn Ferry
 */
async function fetchTourSeasonRankingsAsWorldEntries(tourCode: string): Promise<WorldRankingEntry[]> {
  const { data, error } = await supabase
    .from('tour_season_rankings' as any)
    .select('*')
    .eq('tour_code', tourCode.toLowerCase() === 'euro' ? 'euro' : tourCode.toLowerCase())
    .eq('season_year', new Date().getFullYear())
    .order('position', { ascending: true })
    .limit(200);

  if (error) {
    console.error('[WorldRankings] tour_season_rankings error:', error);
    throw error;
  }

  const rows = (data || []) as any[];
  if (rows.length === 0) return [];

  // Batch-fetch player details for rows with player_id
  const playerIds = rows.map(r => r.player_id).filter(Boolean) as string[];
  let playerMap: Record<string, any> = {};

  if (playerIds.length > 0) {
    const { data: players } = await supabase
      .from('sr_players')
      .select('id, first_name, last_name, photo_url, country, pga_tour_id, tour_codes')
      .in('id', playerIds);

    for (const p of players || []) {
      playerMap[p.id] = p;
    }
  }

  return rows.map((row: any): WorldRankingEntry => {
    const player = row.player_id ? playerMap[row.player_id] : null;
    const nameParts = (row.player_name || '').split(' ');
    const firstName = player?.first_name || nameParts[0] || '';
    const lastName = player?.last_name || nameParts.slice(1).join(' ') || '';

    return {
      rank: row.position,
      prior_rank: null,
      rank_change: 0,
      tied: false,
      avg_points: row.points ?? null,
      total_points: row.points ?? null,
      events_played: row.tournaments_played ?? null,
      points_gained: null,
      points_lost: null,
      ranking_date: row.scraped_at?.split('T')[0] ?? null,
      player: {
        id: player?.id || row.player_id || row.id,
        first_name: firstName,
        last_name: lastName,
        photo_url: player?.photo_url ?? null,
        country: player?.country || row.country || null,
        pga_tour_id: player?.pga_tour_id ?? null,
        tour_codes: player?.tour_codes ?? [tourCode],
      },
    };
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

// ============================================================================
// All Tours Ticker — persistent rail data (live ∪ completed ∪ upcoming)
// ============================================================================

export type TickerCellStatus = 'live' | 'completed' | 'upcoming';

export interface TickerCellData {
  id: string;
  name: string;
  status: TickerCellStatus;
  startDate: string;
  endDate: string;
  tourSlug: TourId;
  /** Live: leader name. Completed: winner name. Upcoming: null. */
  personName: string | null;
  /** Live: country. Completed: country. Upcoming: venue country. */
  country: string | null;
  /** Live: e.g. "-14". Completed: final score. Upcoming: null. */
  scoreDisplay: string | null;
  /** Days until start (upcoming only). */
  daysUntilStart: number | null;
}

export interface TickerData {
  live: TickerCellData[];
  completed: TickerCellData[];
  upcoming: TickerCellData[];
}

export function useAllToursTickerData() {
  const { data: cache, isLoading: cacheLoading } = useTournamentsCache();

  return useQuery({
    queryKey: ['all-tours-ticker', cache ? 'ready' : 'waiting'],
    queryFn: async (): Promise<TickerData> => {
      if (!cache) return { live: [], completed: [], upcoming: [] };

      const liveIds = cache.live.map(t => t.id);
      const completedIds = cache.completed.map(t => t.id);
      const allIds = [...liveIds, ...completedIds];

      // Single batched leaderboard query — fetches both live leaders + completed winners
      const { data: allLeaders } = allIds.length > 0
        ? await supabase
            .from('sr_leaderboards')
            .select(`
              tournament_id, position, score, player_id, team_id, strokes,
              player:sr_players!sr_leaderboards_player_id_fkey(id, first_name, last_name, full_name, country),
              team:sr_teams!sr_leaderboards_team_id_fkey(id, display_name, abbr_name)
            `)
            .in('tournament_id', allIds)
            .eq('position', 1)
            .gt('strokes', 0)
            .not('position', 'is', null)
        : { data: [] as any[] };

      const leaderMap: Record<string, any> = {};
      const leaderCountMap: Record<string, number> = {};
      for (const entry of (allLeaders || []) as any[]) {
        leaderCountMap[entry.tournament_id] = (leaderCountMap[entry.tournament_id] ?? 0) + 1;
        if (!leaderMap[entry.tournament_id]) {
          if (!entry.player && entry.team) {
            const teamName = entry.team.abbr_name || entry.team.display_name || 'Team';
            entry.player = { id: entry.team.id, first_name: '', last_name: '', full_name: teamName };
          }
          leaderMap[entry.tournament_id] = entry;
        }
      }

      const buildCell = (
        t: CachedTournament,
        status: TickerCellStatus,
      ): TickerCellData => {
        const leaderEntry = leaderMap[t.id] || null;
        const tied = leaderEntry && leaderCountMap[t.id] > 1;
        const personName = leaderEntry
          ? tied
            ? `${leaderCountMap[t.id]} tied`
            : `${(leaderEntry.player as any).first_name} ${(leaderEntry.player as any).last_name}`.trim()
          : null;
        const country = leaderEntry && !tied ? ((leaderEntry.player as any).country ?? null) : null;
        const scoreDisplay = leaderEntry ? formatScore(leaderEntry.score) : null;

        return {
          id: t.id,
          name: t.name,
          status,
          startDate: t.start_date,
          endDate: t.end_date,
          tourSlug: mapTourSlug(t.season.tour_name),
          personName,
          country,
          scoreDisplay,
          daysUntilStart: null,
        };
      };

      const buildUpcomingCell = (t: CachedTournament): TickerCellData => {
        const start = new Date(t.start_date + 'T12:00:00Z').getTime();
        const now = Date.now();
        const daysUntilStart = Math.max(0, Math.ceil((start - now) / 86400000));
        return {
          id: t.id,
          name: t.name,
          status: 'upcoming',
          startDate: t.start_date,
          endDate: t.end_date,
          tourSlug: mapTourSlug(t.season.tour_name),
          personName: null,
          country: t.venue_country,
          scoreDisplay: null,
          daysUntilStart,
        };
      };

      // De-dup: if a tour already has a live cell, skip its completed cell.
      // Per-tour cap: keep the most recent completed event per tour to prevent
      // a single tour from monopolising the rail.
      const live = cache.live.map(t => buildCell(t, 'live'));
      const liveTourSlugs = new Set(live.map(c => c.tourSlug));

      const completedByTour: Record<string, TickerCellData[]> = {};
      for (const t of cache.completed) {
        const cell = buildCell(t, 'completed');
        if (liveTourSlugs.has(cell.tourSlug)) continue;
        (completedByTour[cell.tourSlug] ??= []).push(cell);
      }
      const completed = Object.values(completedByTour)
        .map(cells => cells.sort((a, b) => b.endDate.localeCompare(a.endDate))[0])
        .filter((c): c is TickerCellData => !!c);

      // Upcoming preview cells (only used for deep-empty fallback): top 3 by start date.
      const upcoming = [...cache.upcoming]
        .sort((a, b) => a.start_date.localeCompare(b.start_date))
        .slice(0, 3)
        .map(buildUpcomingCell);

      return { live, completed, upcoming };
    },
    enabled: !cacheLoading,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

