// src/features/tourhub/hooks/useSeasonLeaderboards.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { resolvePhotoUrl } from '../utils/resolvePhotoUrl';

// ============================================
// TYPES
// ============================================

export type CategoryId = 'distance' | 'accuracy' | 'scrambling' | 'putting' | 'sg_total';

export interface LeaderboardPlayer {
  rank: number;
  playerId: string;
  playerName: string;
  firstName: string;
  lastName: string;
  countryCode: string;
  photoUrl: string | null;
  initials: string;
  statValue: number;
  statDisplayValue: string;
  statUnit: string;
  skillLevel: number;
  skillProgress: number;
}

export interface LeaderboardCategory {
  id: CategoryId;
  name: string;
  icon: string;
  description: string;
  players: LeaderboardPlayer[];
  topTenAverage: number;
}

export interface SeasonLeaderboardsData {
  year: number;
  tourName: string;
  categories: LeaderboardCategory[];
}

// ============================================
// CATEGORY CONFIGURATION
// ============================================

export const CATEGORY_CONFIG: Record<CategoryId, {
  name: string;
  icon: string;
  description: string;
  dbKey: string;
  unit: string;
  higherIsBetter: boolean;
  formatValue: (val: number) => string;
}> = {
  distance: {
    name: 'Distance',
    icon: '🏌️',
    description: 'Average driving distance off the tee',
    dbKey: 'drive_avg',
    unit: 'yds',
    higherIsBetter: true,
    formatValue: (val) => val.toFixed(1),
  },
  accuracy: {
    name: 'Accuracy',
    icon: '🎯',
    description: 'Driving accuracy percentage - fairways hit',
    dbKey: 'drive_acc',
    unit: '%',
    higherIsBetter: true,
    formatValue: (val) => val.toFixed(1),
  },
  scrambling: {
    name: 'Scrambling',
    icon: '🔄',
    description: 'Percentage of pars or better when missing GIR',
    dbKey: 'scrambling_pct',
    unit: '%',
    higherIsBetter: true,
    formatValue: (val) => val.toFixed(1),
  },
  putting: {
    name: 'Putting',
    icon: '🕳️',
    description: 'Average putts per round',
    dbKey: 'putt_avg',
    unit: 'putts',
    higherIsBetter: false,
    formatValue: (val) => val.toFixed(2),
  },
  sg_total: {
    name: 'SG: Total',
    icon: '📊',
    description: 'Total strokes gained vs field average',
    dbKey: 'strokes_gained_total',
    unit: '',
    higherIsBetter: true,
    formatValue: (val) => (val >= 0 ? '+' : '') + val.toFixed(2),
  },
};

// ============================================
// SKILL LEVEL CALCULATION
// ============================================

const PERCENTILE_THRESHOLDS: Record<CategoryId, { min: number; max: number }> = {
  distance: { min: 280, max: 330 },
  accuracy: { min: 50, max: 75 },
  scrambling: { min: 50, max: 70 },
  putting: { min: 30, max: 27 },
  sg_total: { min: -1, max: 2.5 },
};

function calculateSkillLevel(
  value: number,
  categoryId: CategoryId
): { level: number; progress: number } {
  const thresholds = PERCENTILE_THRESHOLDS[categoryId];
  const config = CATEGORY_CONFIG[categoryId];
  
  let normalizedValue: number;
  
  if (config.higherIsBetter) {
    normalizedValue = (value - thresholds.min) / (thresholds.max - thresholds.min);
  } else {
    normalizedValue = (thresholds.min - value) / (thresholds.min - thresholds.max);
  }
  
  normalizedValue = Math.max(0, Math.min(1, normalizedValue));
  
  const rawLevel = normalizedValue * 9 + 1;
  const level = Math.min(10, Math.max(1, Math.floor(rawLevel)));
  const progress = Math.round((rawLevel - level) * 100);
  
  return { level, progress };
}

// ============================================
// DATA FETCHING
// ============================================

async function fetchSeasonLeaderboards(): Promise<SeasonLeaderboardsData> {
  // Get current PGA season
  const { data: seasonData, error: seasonError } = await supabase
    .from('sr_seasons')
    .select('id, year')
    .ilike('tour_name', 'pga')
    .gte('year', 2024)
    .order('year', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (seasonError || !seasonData) {
    throw new Error('Failed to fetch season data');
  }

  // Fetch all player statistics for this season
  const { data: statsData, error: statsError } = await supabase
    .from('sr_player_statistics')
    .select(`
      player_id,
      raw_data,
      sr_players!inner (
        id,
        first_name,
        last_name,
        photo_url,
        country
      )
    `)
    .eq('season_id', seasonData.id);

  if (statsError || !statsData) {
    throw new Error('Failed to fetch player statistics');
  }

  // Process data for each category
  const categories: LeaderboardCategory[] = [];

  for (const [categoryId, config] of Object.entries(CATEGORY_CONFIG)) {
    const catId = categoryId as CategoryId;
    
    const playersWithStats = statsData
      .map((row) => {
        const rawData = row.raw_data as { statistics?: Record<string, number> } | null;
        const stats = rawData?.statistics;
        const statValue = stats?.[config.dbKey];
        const player = row.sr_players as { 
          id: string; 
          first_name: string | null; 
          last_name: string | null; 
          photo_url: string | null; 
          country: string | null; 
        } | null;

        if (typeof statValue !== 'number' || !player) {
          return null;
        }

        const { level, progress } = calculateSkillLevel(statValue, catId);
        const firstName = player.first_name || '';
        const lastName = player.last_name || '';

        return {
          playerId: player.id,
          playerName: `${firstName} ${lastName}`.trim(),
          firstName,
          lastName,
          countryCode: player.country || 'USA',
          photoUrl: resolvePhotoUrl(player.photo_url),
          initials: `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase(),
          statValue,
          statDisplayValue: config.formatValue(statValue),
          statUnit: config.unit,
          skillLevel: level,
          skillProgress: progress,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    playersWithStats.sort((a, b) => {
      if (config.higherIsBetter) {
        return b.statValue - a.statValue;
      }
      return a.statValue - b.statValue;
    });

    const top10 = playersWithStats.slice(0, 10).map((player, index) => ({
      ...player,
      rank: index + 1,
    }));

    const topTenAverage = top10.length > 0
      ? top10.reduce((sum, p) => sum + p.statValue, 0) / top10.length
      : 0;

    categories.push({
      id: catId,
      name: config.name,
      icon: config.icon,
      description: config.description,
      players: top10,
      topTenAverage,
    });
  }

  return {
    year: seasonData.year,
    tourName: 'PGA Tour',
    categories,
  };
}

// ============================================
// HOOK EXPORT
// ============================================

export function useSeasonLeaderboards() {
  return useQuery({
    queryKey: ['season-leaderboards', 'pga', 2025],
    queryFn: fetchSeasonLeaderboards,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
