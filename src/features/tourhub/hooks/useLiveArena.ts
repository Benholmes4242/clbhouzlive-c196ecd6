/**
 * useLiveArena - Live tournament data with enriched metrics
 * 
 * Features:
 * - Leader + chase pack extraction from sr_leaderboards
 * - Volatility index calculation (0-100 based on score compression)
 * - Momentum tags generation ('Tight Race', 'Final Round', etc.)
 * - Auto-refresh every 2 minutes for live data
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LiveArenaPlayer {
  id: string;
  playerId: string;
  position: number;
  score: number;
  scoreDisplay: string;
  thru: string | null;
  thruUpdatedAt: string | null;
  money: number | null;
  round_1: number | null;
  round_2: number | null;
  round_3: number | null;
  round_4: number | null;
  player: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    photoUrl: string | null;
    headshotOverride: string | null;
    tourCode: string | null;
    country: string | null;
  };
}

export interface LiveArenaTournament {
  id: string;
  name: string;
  tourSlug: string;
  status: string;
  currentRound: number | null;
  totalRounds: number;
  purse: number | null;
  venueName: string | null;
  venueCity: string | null;
  venuePar: number | null;
  venueYardage: number | null;
  startDate: string;
  endDate: string;
  timezone: string | null;
  
  // Leader data
  leader: LiveArenaPlayer | null;
  
  // Chase pack (positions 2-5)
  chasePack: LiveArenaPlayer[];
  
  // Volatility metrics
  volatilityIndex: number;
  scoreSpread: number;
  
  // Momentum tags
  momentumTags: string[];
  
  // Leader scorecard stats
  leaderStats: {
    totalBirdies: number;
    totalEagles:  number;
    totalBogeys:  number;
    totalPars:    number;
    rounds:       (number | null)[];
    drivingDistance?: number | null;
    drivingAccuracy?: number | null;
    greensInReg?:     number | null;
    puttingAverage?:  number | null;
  } | null;
}

type MomentumTag = 'Tight Race' | 'Runaway Leader' | 'Final Round' | 'Moving Day' | 'Cut Day' | 'Playoff Potential';

/**
 * Calculate volatility index based on score compression
 * Higher volatility = tighter race
 */
function calculateVolatility(leader: LiveArenaPlayer | null, chasePack: LiveArenaPlayer[]): number {
  if (!leader || chasePack.length === 0) return 50;
  
  const leaderScore = leader.score;
  const chaseScores = chasePack.map(p => p.score);
  
  // Calculate average gap from leader
  const avgGap = chaseScores.reduce((sum, s) => sum + (s - leaderScore), 0) / chaseScores.length;
  
  // Convert gap to volatility (smaller gap = higher volatility)
  // 0 gap = 100 volatility, 10+ gap = 0 volatility
  const volatility = Math.max(0, Math.min(100, 100 - (avgGap * 10)));
  
  return Math.round(volatility);
}

/**
 * Generate momentum tags based on tournament state
 */
function generateMomentumTags(
  tournament: any,
  leader: LiveArenaPlayer | null,
  chasePack: LiveArenaPlayer[],
  volatility: number
): MomentumTag[] {
  const tags: MomentumTag[] = [];
  
  // Tight race tag
  if (volatility >= 70) {
    tags.push('Tight Race');
  } else if (volatility <= 30 && leader) {
    tags.push('Runaway Leader');
  }
  
  // Round-based tags
  const currentRound = tournament.current_round;
  const totalRounds = 4; // Standard PGA event
  
  if (currentRound === totalRounds) {
    tags.push('Final Round');
  } else if (currentRound === 3) {
    tags.push('Moving Day');
  } else if (currentRound === 2) {
    tags.push('Cut Day');
  }
  
  // Playoff potential
  if (volatility >= 90 && currentRound === totalRounds) {
    tags.push('Playoff Potential');
  }
  
  return tags;
}

/**
 * Parse score display from raw score
 */
function formatScore(score: number | null): string {
  if (score === null || score === undefined) return 'E';
  if (score === 0) return 'E';
  return score > 0 ? `+${score}` : `${score}`;
}

/**
 * Fetch live arena data for all live tournaments
 */
async function fetchLiveArenaData(): Promise<LiveArenaTournament[]> {
  // First get live tournaments
  const { data: tournaments, error: tournamentsError } = await supabase
    .from('sr_tournaments')
    .select('*')
    .eq('status', 'inprogress')
    .order('start_date', { ascending: true });

  if (tournamentsError) throw tournamentsError;
  if (!tournaments || tournaments.length === 0) return [];

  // Batch fetch top 10 for ALL live tournaments in a single query (fixes N+1)
  const tournamentIds = tournaments.map((t: any) => t.id);
  const { data: allLeaderboard, error: lbError } = await supabase
    .from('sr_leaderboards')
    .select(`
      id,
      tournament_id,
      player_id,
      position,
      score,
      money,
      thru,
      thru_updated_at,
      round_1,
      round_2,
      round_3,
      round_4,
      player:sr_players!sr_leaderboards_player_id_fkey (
        id,
        first_name,
        last_name,
        full_name,
        photo_url,
        headshot_override,
        tour_codes,
        country
      )
    `)
    .in('tournament_id', tournamentIds)
    .lte('position', 10)
    .order('position', { ascending: true });

  if (lbError) {
    console.error('Error fetching leaderboards:', lbError);
  }

  // Group leaderboard entries by tournament_id
  const leaderboardByTournament: Record<string, any[]> = {};
  for (const entry of allLeaderboard || []) {
    const tid = entry.tournament_id;
    if (!leaderboardByTournament[tid]) leaderboardByTournament[tid] = [];
    leaderboardByTournament[tid].push(entry);
  }

  const results: LiveArenaTournament[] = [];
  
  for (const tournament of tournaments) {
    const leaderboard = leaderboardByTournament[tournament.id] || [];

    // Transform leaderboard data
    const players: LiveArenaPlayer[] = leaderboard.map((entry: any) => ({
      id: entry.id,
      playerId: entry.player_id,
      position: entry.position,
      score: entry.score || 0,
      scoreDisplay: formatScore(entry.score),
      thru: entry.thru,
      thruUpdatedAt: entry.thru_updated_at ?? null,
      money: entry.money,
      round_1: entry.round_1 ?? null,
      round_2: entry.round_2 ?? null,
      round_3: entry.round_3 ?? null,
      round_4: entry.round_4 ?? null,
      player: {
        id: entry.player?.id || '',
        firstName: entry.player?.first_name || '',
        lastName: entry.player?.last_name || '',
        fullName: entry.player?.full_name || 'Unknown',
        photoUrl: entry.player?.photo_url || null,
        headshotOverride: entry.player?.headshot_override ?? null,
        tourCode: entry.player?.tour_codes?.[0] ?? null,
        country: entry.player?.country || null,
      },
    }));

    // Extract leader and chase pack
    const leader = players.find(p => p.position === 1) || null;
    const chasePack = players.filter(p => p.position >= 2 && p.position <= 5);
    
    // Calculate metrics
    const volatility = calculateVolatility(leader, chasePack);
    const scoreSpread = leader && chasePack.length > 0
      ? Math.abs(chasePack[chasePack.length - 1].score - leader.score)
      : 0;
    
    // Derive tour slug from event_type or season
    const eventType  = (tournament.event_type || '').toLowerCase();
    const tourName   = (tournament.name       || '').toLowerCase();
    const tourSlug =
      tourName.includes('liv golf')                                                     ? 'liv'   :
      tourName.includes('lpga')                                                         ? 'lpga'  :
      tourName.includes('korn ferry') || tourName.includes('kft')                      ? 'kft'   :
      tourName.includes('dp world') || tourName.includes('european tour')              ? 'euro'  :
      tourName.includes('pga tour champions') || tourName === 'champions tour'         ? 'champ' :
      tourName.includes('liv')                                                          ? 'liv'   :
      eventType.includes('liv')                                                         ? 'liv'   :
      eventType.includes('european') || eventType.includes('dp')                       ? 'euro'  :
      eventType.includes('lpga')                                                        ? 'lpga'  :
      eventType.includes('champions')                                                   ? 'champ' :
      'pga';
    
    const estimatedRound = (tournament as any).current_round ?? 1;
    
    const momentumTags = generateMomentumTags(
      { ...tournament, current_round: estimatedRound }, 
      leader, 
      chasePack, 
      volatility
    );

    // Fetch leader scorecard stats
    let leaderStats: LiveArenaTournament['leaderStats'] = null;
    if (leader) {
      const { data: scorecardData } = await supabase
        .from('sr_scorecards')
        .select('birdies, eagles, bogeys, pars, round_score, round_number')
        .eq('tournament_id', tournament.id)
        .eq('player_id', leader.playerId)
        .order('round_number', { ascending: true });

      if (scorecardData && scorecardData.length > 0) {
        // Fetch leader season stats
        let drivingDistance: number | null = null;
        let drivingAccuracy: number | null = null;
        let greensInReg: number | null = null;
        let puttingAverage: number | null = null;

        const { data: seasonStats } = await supabase
          .from('sr_player_statistics')
          .select('driving_distance, driving_accuracy, greens_in_reg, putting_average')
          .eq('player_id', leader.playerId)
          .order('season_id', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (seasonStats) {
          drivingDistance = seasonStats.driving_distance;
          drivingAccuracy = seasonStats.driving_accuracy;
          greensInReg     = seasonStats.greens_in_reg;
          puttingAverage  = seasonStats.putting_average;
        }

        leaderStats = {
          totalBirdies: scorecardData.reduce((sum, r) => sum + (r.birdies ?? 0), 0),
          totalEagles:  scorecardData.reduce((sum, r) => sum + (r.eagles  ?? 0), 0),
          totalBogeys:  scorecardData.reduce((sum, r) => sum + (r.bogeys  ?? 0), 0),
          totalPars:    scorecardData.reduce((sum, r) => sum + (r.pars    ?? 0), 0),
          rounds:       [1, 2, 3, 4].map(n =>
            scorecardData.find(r => r.round_number === n)?.round_score ?? null
          ),
          drivingDistance,
          drivingAccuracy,
          greensInReg,
          puttingAverage,
        };
      }
    }

    results.push({
      id: tournament.id,
      name: tournament.name,
      tourSlug,
      status: tournament.status || 'unknown',
      currentRound: estimatedRound,
      totalRounds: 4,
      purse: tournament.purse,
      venueName: tournament.venue_name,
      venueCity: tournament.venue_city,
      venuePar: tournament.venue_par,
      venueYardage: tournament.venue_yardage,
      startDate: tournament.start_date || '',
      endDate: tournament.end_date || '',
      timezone: tournament.timezone ?? null,
      leader,
      chasePack,
      volatilityIndex: volatility,
      scoreSpread,
      momentumTags,
      leaderStats,
    });
  }

  return results;
}

/**
 * Main Live Arena hook
 * Fetches live tournament data with chase pack and volatility metrics
 * Auto-refreshes every 2 minutes
 */
export function useLiveArena() {
  return useQuery({
    queryKey: ['live-arena', 'v2'],
    queryFn: fetchLiveArenaData,
    staleTime: 30_000,             // 30s — matches sync interval
    refetchInterval: false,        // No polling — Realtime pushes updates
    refetchOnWindowFocus: false,   // Realtime handles updates; focus refetch triggers unnecessary feed rebuilds
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Get single live tournament by ID
 */
export function useLiveArenaTournament(tournamentId: string) {
  const { data, isLoading, error } = useLiveArena();
  
  const tournament = data?.find(t => t.id === tournamentId);
  
  return {
    data: tournament,
    isLoading,
    error,
  };
}
