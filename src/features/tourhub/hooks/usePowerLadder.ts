/**
 * usePowerLadder - Power Ladder ranking system hook
 * 
 * Provides tiered world rankings with movement, momentum, and gamification data.
 * Tiers: Elite (#1-5), Champions (#6-20), Contenders (#21-75), Chasers (#76-200)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type PowerTier = 'elite' | 'champions' | 'contenders' | 'chasers';
export type MovementDirection = 'up' | 'down' | 'flat';

export interface PowerLadderPlayer {
  id: string;
  rank: number;
  priorRank: number | null;
  avgPoints: number;
  tier: PowerTier;
  tierRank: number; // Position within tier (e.g., 3rd in Elite)
  rankChange: number; // Positive = moved up, negative = moved down
  movementDirection: MovementDirection;
  movementMagnitude: number; // Absolute value of rank change
  distanceToPromotion: number; // Ranks until next tier
  momentumScore: number; // 0-100 based on recent movement
  player: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    photoUrl: string | null;
    country: string | null;
  };
}

export interface PowerLadderData {
  players: PowerLadderPlayer[];
  totalCount: number;
  tierCounts: Record<PowerTier, number>;
}

// Tier boundaries
const TIER_BOUNDARIES = {
  elite: { min: 1, max: 5 },
  champions: { min: 6, max: 20 },
  contenders: { min: 21, max: 75 },
  chasers: { min: 76, max: 200 },
} as const;

// Tier icons and colors
export const TIER_CONFIG: Record<PowerTier, { 
  icon: string; 
  label: string;
  gradient: string;
  shadow: string;
  bgClass: string;
  textClass: string;
}> = {
  elite: {
    icon: '👑',
    label: 'Elite',
    gradient: 'from-amber-500 to-yellow-500',
    shadow: 'shadow-amber-500/30',
    bgClass: 'bg-gradient-to-r from-amber-500 to-yellow-500',
    textClass: 'text-amber-600',
  },
  champions: {
    icon: '🏆',
    label: 'Champions',
    gradient: 'from-purple-500 to-indigo-500',
    shadow: 'shadow-purple-500/30',
    bgClass: 'bg-gradient-to-r from-purple-500 to-indigo-500',
    textClass: 'text-purple-600',
  },
  contenders: {
    icon: '⚔️',
    label: 'Contenders',
    gradient: 'from-blue-500 to-cyan-500',
    shadow: 'shadow-blue-500/30',
    bgClass: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    textClass: 'text-blue-600',
  },
  chasers: {
    icon: '🎯',
    label: 'Chasers',
    gradient: 'from-emerald-500 to-teal-500',
    shadow: 'shadow-emerald-500/30',
    bgClass: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    textClass: 'text-emerald-600',
  },
};

/**
 * Calculate which tier a rank belongs to
 */
function getTierForRank(rank: number): PowerTier {
  if (rank <= 5) return 'elite';
  if (rank <= 20) return 'champions';
  if (rank <= 75) return 'contenders';
  return 'chasers';
}

/**
 * Calculate position within tier
 */
function getTierRank(rank: number): number {
  const tier = getTierForRank(rank);
  return rank - TIER_BOUNDARIES[tier].min + 1;
}

/**
 * Calculate distance to next tier promotion
 */
function getDistanceToPromotion(rank: number): number {
  const tier = getTierForRank(rank);
  if (tier === 'elite') return 0; // Already at top
  return rank - TIER_BOUNDARIES[tier].min + 1;
}

/**
 * Calculate momentum score (0-100) based on recent rank changes
 * Higher movement = higher momentum
 */
function calculateMomentumScore(rankChange: number, currentRank: number): number {
  if (rankChange === 0) return 50; // Neutral
  
  // Positive changes (moving up) get higher scores
  // Scale by magnitude and current rank (harder to move at top)
  const magnitude = Math.abs(rankChange);
  const rankMultiplier = currentRank <= 20 ? 2 : currentRank <= 75 ? 1.5 : 1;
  
  if (rankChange > 0) {
    // Moving up
    return Math.min(100, 50 + magnitude * rankMultiplier * 5);
  } else {
    // Moving down
    return Math.max(0, 50 - magnitude * rankMultiplier * 3);
  }
}

/**
 * Fetch and transform Power Ladder data
 */
async function fetchPowerLadderData(tier?: PowerTier, limit?: number): Promise<PowerLadderData> {
  // Query world rankings with player data
  let query = supabase
    .from('sr_world_rankings')
    .select(`
      id,
      rank,
      prior_rank,
      points,
      raw_data,
      player:sr_players!sr_world_rankings_player_id_fkey (
        id,
        first_name,
        last_name,
        full_name,
        country,
        photo_url
      )
    `)
    .lte('rank', 200)
    .gte('rank', 1)
    .order('rank', { ascending: true });

  // Apply tier filter if specified
  if (tier) {
    const { min, max } = TIER_BOUNDARIES[tier];
    query = query.gte('rank', min).lte('rank', max);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Transform data to PowerLadderPlayer format
  const players: PowerLadderPlayer[] = (data || []).map((row: any) => {
    const rank = row.rank;
    const priorRank = row.prior_rank ?? null;
    const rankChange = priorRank !== null ? priorRank - rank : 0;
    const avgPoints = parseFloat(row.raw_data?.statistics?.avg_points) || row.points || 0;
    
    const playerData = row.player;
    
    return {
      id: row.id,
      rank,
      priorRank,
      avgPoints,
      tier: getTierForRank(rank),
      tierRank: getTierRank(rank),
      rankChange,
      movementDirection: rankChange > 0 ? 'up' : rankChange < 0 ? 'down' : 'flat',
      movementMagnitude: Math.abs(rankChange),
      distanceToPromotion: getDistanceToPromotion(rank),
      momentumScore: calculateMomentumScore(rankChange, rank),
      player: {
        id: playerData?.id || '',
        firstName: playerData?.first_name || '',
        lastName: playerData?.last_name || '',
        fullName: playerData?.full_name || 'Unknown',
        photoUrl: playerData?.photo_url || null,
        country: playerData?.country || null,
      },
    };
  });

  // Apply limit if specified
  const limitedPlayers = limit ? players.slice(0, limit) : players;

  // Calculate tier counts
  const tierCounts: Record<PowerTier, number> = {
    elite: players.filter(p => p.tier === 'elite').length,
    champions: players.filter(p => p.tier === 'champions').length,
    contenders: players.filter(p => p.tier === 'contenders').length,
    chasers: players.filter(p => p.tier === 'chasers').length,
  };

  return {
    players: limitedPlayers,
    totalCount: players.length,
    tierCounts,
  };
}

/**
 * Main Power Ladder hook with optional tier filtering and limit
 */
export function usePowerLadder(options?: { tier?: PowerTier; limit?: number }) {
  return useQuery({
    queryKey: ['power-ladder', options?.tier, options?.limit],
    queryFn: () => fetchPowerLadderData(options?.tier, options?.limit),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Convenience hook for Elite tier players (#1-5)
 */
export function useElitePlayers(limit?: number) {
  return usePowerLadder({ tier: 'elite', limit });
}

/**
 * Convenience hook for Champions tier players (#6-20)
 */
export function useChampionsPlayers(limit?: number) {
  return usePowerLadder({ tier: 'champions', limit });
}

/**
 * Convenience hook for Contenders tier players (#21-75)
 */
export function useContendersPlayers(limit?: number) {
  return usePowerLadder({ tier: 'contenders', limit });
}

/**
 * Convenience hook for Chasers tier players (#76-200)
 */
export function useChasersPlayers(limit?: number) {
  return usePowerLadder({ tier: 'chasers', limit });
}

/**
 * Get single player by ID from Power Ladder
 */
export function usePowerLadderPlayer(playerId: string) {
  const { data, isLoading, error } = usePowerLadder();
  
  const player = data?.players.find(p => p.player.id === playerId);
  
  return {
    data: player,
    isLoading,
    error,
  };
}
