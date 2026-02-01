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
  money: number | null;
  player: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    photoUrl: string | null;
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
  
  // Leader data
  leader: LiveArenaPlayer | null;
  
  // Chase pack (positions 2-5)
  chasePack: LiveArenaPlayer[];
  
  // Volatility metrics
  volatilityIndex: number; // 0-100, higher = tighter race
  scoreSpread: number; // Shots between 1st and 5th
  
  // Momentum tags
  momentumTags: string[];
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

  // For each live tournament, fetch leaderboard data
  const results: LiveArenaTournament[] = [];
  
  for (const tournament of tournaments) {
    // Fetch top 10 from leaderboard
    const { data: leaderboard, error: lbError } = await supabase
      .from('sr_leaderboards')
      .select(`
        id,
        player_id,
        position,
        score,
        money,
        thru,
        player:sr_players!sr_leaderboards_player_id_fkey (
          id,
          first_name,
          last_name,
          full_name,
          photo_url,
          country
        )
      `)
      .eq('tournament_id', tournament.id)
      .lte('position', 10)
      .order('position', { ascending: true });

    if (lbError) {
      console.error('Error fetching leaderboard:', lbError);
      continue;
    }

    // Transform leaderboard data
    const players: LiveArenaPlayer[] = (leaderboard || []).map((entry: any) => ({
      id: entry.id,
      playerId: entry.player_id,
      position: entry.position,
      score: entry.score || 0,
      scoreDisplay: formatScore(entry.score),
      thru: entry.thru,
      money: entry.money,
      player: {
        id: entry.player?.id || '',
        firstName: entry.player?.first_name || '',
        lastName: entry.player?.last_name || '',
        fullName: entry.player?.full_name || 'Unknown',
        photoUrl: entry.player?.photo_url || null,
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
    const eventType = (tournament.event_type || '').toLowerCase();
    const tourSlug = eventType.includes('pga') ? 'pga' : 
                     eventType.includes('european') || eventType.includes('dp') ? 'euro' :
                     eventType.includes('liv') ? 'liv' : 'pga';
    
    // Current round isn't directly available, estimate from cut_round or default to 1
    const estimatedRound = tournament.cut_round ? Math.min(tournament.cut_round, 4) : 1;
    
    const momentumTags = generateMomentumTags(
      { ...tournament, current_round: estimatedRound }, 
      leader, 
      chasePack, 
      volatility
    );

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
      leader,
      chasePack,
      volatilityIndex: volatility,
      scoreSpread,
      momentumTags,
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
    queryKey: ['live-arena'],
    queryFn: fetchLiveArenaData,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 2, // Auto-refresh every 2 minutes
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
