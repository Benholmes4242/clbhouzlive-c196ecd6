/**
 * usePlayerSkillTree - RPG-style player attribute system
 * 
 * Maps existing PGA stats into 5 RPG-style attributes:
 * - Power: drive_avg (Higher = Better)
 * - Precision: drive_acc, gir_pct (Higher = Better)
 * - Scoring: birdies_per_round, scoring_avg (Birdies↑, Scoring↓)
 * - Recovery: scrambling_pct, sand_saves_pct (Higher = Better)
 * - Consistency: strokes_gained_total (Higher = Better)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type SkillAttributeKey = 'power' | 'precision' | 'scoring' | 'recovery' | 'consistency';

export interface SkillAttribute {
  name: string;
  key: SkillAttributeKey;
  icon: string;
  color: string;
  gradient: string;
  score: number; // 0-100
  level: number; // 1-10
  percentile: number; // 0-100 within tour
  rawValue: number | null;
  unit: string;
  description: string;
}

export interface PlayerSkillTree {
  playerId: string;
  playerName: string;
  photoUrl: string | null;
  country: string | null;
  attributes: SkillAttribute[];
  strongestAttribute: SkillAttributeKey | null;
  overallLevel: number; // Average of all levels
}

export interface SkillLeader {
  playerId: string;
  playerName: string;
  photoUrl: string | null;
  country: string | null;
  attribute: SkillAttribute;
  rank: number;
}

// Attribute configuration
export const SKILL_ATTRIBUTES: Record<SkillAttributeKey, {
  name: string;
  icon: string;
  color: string;
  gradient: string;
  description: string;
  unit: string;
}> = {
  power: {
    name: 'Driving Distance',
    icon: '💪',
    color: 'text-red-500',
    gradient: 'from-red-500 to-orange-500',
    description: 'Raw driving distance off the tee',
    unit: 'yds',
  },
  precision: {
    name: 'Driving Accuracy',
    icon: '🎯',
    color: 'text-blue-500',
    gradient: 'from-blue-500 to-indigo-500',
    description: 'Accuracy in fairways and greens',
    unit: '%',
  },
  scoring: {
    name: 'Birdies per Round',
    icon: '🔥',
    color: 'text-amber-500',
    gradient: 'from-amber-500 to-yellow-500',
    description: 'Birdie-making ability and low scoring',
    unit: '',
  },
  recovery: {
    name: 'Scrambling',
    icon: '🛡️',
    color: 'text-green-500',
    gradient: 'from-green-500 to-emerald-500',
    description: 'Scrambling and sand save efficiency',
    unit: '%',
  },
  consistency: {
    name: 'SG Total',
    icon: '⚡',
    color: 'text-purple-500',
    gradient: 'from-purple-500 to-violet-500',
    description: 'Overall strokes gained performance',
    unit: '',
  },
};

interface RawPlayerStats {
  player_id: string;
  raw_data: any; // JSON from Supabase, will be typed at access point
  player?: {
    id: string;
    full_name: string;
    first_name: string;
    last_name: string;
    photo_url: string | null;
    country: string | null;
  };
}

/**
 * Convert a percentile (0-100) to a level (1-10)
 */
function percentileToLevel(percentile: number): number {
  return Math.min(10, Math.max(1, Math.ceil(percentile / 10)));
}

/**
 * Exaggerate percentile differences for more dramatic radar shapes.
 * Power curve: sqrt stretches mid-range values outward (like FIFA).
 * Minimum 15% so the shape never collapses to nothing.
 */
export function normalizeForChart(percentile: number): number {
  const min = 0.15;
  const max = 1.0;
  const curved = Math.pow(percentile / 100, 0.6);
  return min + curved * (max - min);
}

/**
 * Calculate percentile rank within array of values
 * Returns 0-100 where 100 is the best
 */
function calculatePercentile(value: number, allValues: number[], higherIsBetter: boolean): number {
  const sorted = [...allValues].sort((a, b) => a - b);
  const rank = sorted.indexOf(value);
  const percentile = (rank / Math.max(sorted.length - 1, 1)) * 100;
  
  // For "higher is better", higher values should get higher percentiles
  return Math.round(higherIsBetter ? percentile : 100 - percentile);
}

/**
 * Fetch all player stats for skill tree calculations
 */
async function fetchAllPlayerStats(): Promise<RawPlayerStats[]> {
  const { data, error } = await supabase
    .from('sr_player_statistics')
    .select(`
      player_id,
      raw_data,
      player:sr_players!sr_player_statistics_player_id_fkey (
        id,
        full_name,
        first_name,
        last_name,
        photo_url,
        country
      )
    `)
    .not('raw_data->statistics->drive_avg', 'is', null);

  if (error) throw error;
  return data || [];
}

/**
 * Calculate skill attributes from raw stats with percentile rankings
 */
function calculateSkillAttributes(
  stats: RawPlayerStats['raw_data']['statistics'],
  allStats: RawPlayerStats[]
): SkillAttribute[] {
  if (!stats) return [];

  // Extract all values for percentile calculations
  const allDriveAvg = allStats
    .map(s => s.raw_data?.statistics?.drive_avg)
    .filter((v): v is number => v != null);
  
  const allDriveAcc = allStats
    .map(s => s.raw_data?.statistics?.drive_acc)
    .filter((v): v is number => v != null);
  
  const allGirPct = allStats
    .map(s => s.raw_data?.statistics?.gir_pct)
    .filter((v): v is number => v != null);
  
  const allBirdies = allStats
    .map(s => s.raw_data?.statistics?.birdies_per_round)
    .filter((v): v is number => v != null);
  
  const allScoringAvg = allStats
    .map(s => s.raw_data?.statistics?.scoring_avg)
    .filter((v): v is number => v != null);
  
  const allScrambling = allStats
    .map(s => s.raw_data?.statistics?.scrambling_pct)
    .filter((v): v is number => v != null);
  
  const allSandSaves = allStats
    .map(s => s.raw_data?.statistics?.sand_saves_pct)
    .filter((v): v is number => v != null);
  
  const allSGTotal = allStats
    .map(s => s.raw_data?.statistics?.strokes_gained_total)
    .filter((v): v is number => v != null);

  const attributes: SkillAttribute[] = [];

  // Power: drive_avg (Higher = Better)
  if (stats.drive_avg != null) {
    const percentile = calculatePercentile(stats.drive_avg, allDriveAvg, true);
    attributes.push({
      ...SKILL_ATTRIBUTES.power,
      key: 'power',
      score: percentile,
      level: percentileToLevel(percentile),
      percentile,
      rawValue: stats.drive_avg,
    });
  }

  // Precision: Average of drive_acc and gir_pct (Higher = Better)
  if (stats.drive_acc != null || stats.gir_pct != null) {
    const accPercentile = stats.drive_acc != null 
      ? calculatePercentile(stats.drive_acc, allDriveAcc, true) 
      : 50;
    const girPercentile = stats.gir_pct != null 
      ? calculatePercentile(stats.gir_pct, allGirPct, true) 
      : 50;
    const avgPercentile = Math.round((accPercentile + girPercentile) / 2);
    
    attributes.push({
      ...SKILL_ATTRIBUTES.precision,
      key: 'precision',
      score: avgPercentile,
      level: percentileToLevel(avgPercentile),
      percentile: avgPercentile,
      rawValue: stats.gir_pct ?? stats.drive_acc ?? null,
    });
  }

  // Scoring: birdies_per_round (Higher = Better) and scoring_avg (Lower = Better)
  if (stats.birdies_per_round != null || stats.scoring_avg != null) {
    const birdiePercentile = stats.birdies_per_round != null 
      ? calculatePercentile(stats.birdies_per_round, allBirdies, true) 
      : 50;
    const scoringPercentile = stats.scoring_avg != null 
      ? calculatePercentile(stats.scoring_avg, allScoringAvg, false) 
      : 50;
    const avgPercentile = Math.round((birdiePercentile + scoringPercentile) / 2);
    
    attributes.push({
      ...SKILL_ATTRIBUTES.scoring,
      key: 'scoring',
      score: avgPercentile,
      level: percentileToLevel(avgPercentile),
      percentile: avgPercentile,
      rawValue: stats.birdies_per_round ?? null,
    });
  }

  // Recovery: scrambling_pct and sand_saves_pct (Higher = Better)
  if (stats.scrambling_pct != null || stats.sand_saves_pct != null) {
    const scramblingPercentile = stats.scrambling_pct != null 
      ? calculatePercentile(stats.scrambling_pct, allScrambling, true) 
      : 50;
    const sandPercentile = stats.sand_saves_pct != null 
      ? calculatePercentile(stats.sand_saves_pct, allSandSaves, true) 
      : 50;
    const avgPercentile = Math.round((scramblingPercentile + sandPercentile) / 2);
    
    attributes.push({
      ...SKILL_ATTRIBUTES.recovery,
      key: 'recovery',
      score: avgPercentile,
      level: percentileToLevel(avgPercentile),
      percentile: avgPercentile,
      rawValue: stats.scrambling_pct ?? null,
    });
  }

  // Consistency: strokes_gained_total (Higher = Better)
  if (stats.strokes_gained_total != null) {
    const percentile = calculatePercentile(stats.strokes_gained_total, allSGTotal, true);
    attributes.push({
      ...SKILL_ATTRIBUTES.consistency,
      key: 'consistency',
      score: percentile,
      level: percentileToLevel(percentile),
      percentile,
      rawValue: stats.strokes_gained_total,
    });
  }

  return attributes;
}

/**
 * Main hook to fetch skill tree for a specific player
 */
export function usePlayerSkillTree(playerId: string) {
  return useQuery({
    queryKey: ['player-skill-tree', playerId],
    queryFn: async (): Promise<PlayerSkillTree | null> => {
      const allStats = await fetchAllPlayerStats();
      
      const playerStats = allStats.find(s => s.player_id === playerId);
      if (!playerStats) return null;

      const attributes = calculateSkillAttributes(playerStats.raw_data?.statistics, allStats);
      const strongestAttribute = attributes.length > 0
        ? attributes.reduce((prev, curr) => curr.score > prev.score ? curr : prev).key
        : null;
      
      const overallLevel = attributes.length > 0
        ? Math.round(attributes.reduce((sum, a) => sum + a.level, 0) / attributes.length)
        : 1;

      return {
        playerId,
        playerName: playerStats.player?.full_name || 'Unknown',
        photoUrl: playerStats.player?.photo_url || null,
        country: playerStats.player?.country || null,
        attributes,
        strongestAttribute,
        overallLevel,
      };
    },
    staleTime: 1000 * 60 * 30, // 30 minutes — rankings don't change frequently
    enabled: !!playerId,
  });
}

/**
 * Hook to fetch top leaders for a specific skill attribute
 */
export function useSkillTreeLeaders(attribute: SkillAttributeKey, limit: number = 10) {
  return useQuery({
    queryKey: ['skill-tree-leaders', attribute, limit],
    queryFn: async (): Promise<SkillLeader[]> => {
      const allStats = await fetchAllPlayerStats();
      
      // Calculate skill attributes for all players
      const playersWithAttributes = allStats
        .map(playerStats => {
          const attributes = calculateSkillAttributes(playerStats.raw_data?.statistics, allStats);
          const targetAttribute = attributes.find(a => a.key === attribute);
          
          if (!targetAttribute) return null;
          
          return {
            playerId: playerStats.player_id,
            playerName: playerStats.player?.full_name || 'Unknown',
            photoUrl: playerStats.player?.photo_url || null,
            country: playerStats.player?.country || null,
            attribute: targetAttribute,
          };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null);

      // Sort by attribute score descending
      const sorted = playersWithAttributes.sort((a, b) => b.attribute.score - a.attribute.score);

      // Add ranks and limit
      return sorted.slice(0, limit).map((p, index) => ({
        ...p,
        rank: index + 1,
      }));
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to get all skill leaders (top player per attribute)
 */
export function useAllSkillLeaders() {
  return useQuery({
    queryKey: ['all-skill-leaders'],
    queryFn: async () => {
      const allStats = await fetchAllPlayerStats();
      
      const leaders: Record<SkillAttributeKey, SkillLeader | null> = {
        power: null,
        precision: null,
        scoring: null,
        recovery: null,
        consistency: null,
      };

      const keys: SkillAttributeKey[] = ['power', 'precision', 'scoring', 'recovery', 'consistency'];
      
      for (const key of keys) {
        const playersWithAttribute = allStats
          .map(playerStats => {
            const attributes = calculateSkillAttributes(playerStats.raw_data?.statistics, allStats);
            const targetAttribute = attributes.find(a => a.key === key);
            
            if (!targetAttribute) return null;
            
            return {
              playerId: playerStats.player_id,
              playerName: playerStats.player?.full_name || 'Unknown',
              photoUrl: playerStats.player?.photo_url || null,
              country: playerStats.player?.country || null,
              attribute: targetAttribute,
            };
          })
          .filter((p): p is NonNullable<typeof p> => p !== null);

        if (playersWithAttribute.length > 0) {
          const sorted = playersWithAttribute.sort((a, b) => b.attribute.score - a.attribute.score);
          leaders[key] = { ...sorted[0], rank: 1 };
        }
      }

      return leaders;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
