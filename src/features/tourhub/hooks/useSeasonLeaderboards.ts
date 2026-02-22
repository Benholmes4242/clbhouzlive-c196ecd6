// src/features/tourhub/hooks/useSeasonLeaderboards.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';

// ============================================
// TYPES
// ============================================

export type CategoryId =
  | 'sg_total'
  | 'scoring_avg'
  | 'earnings'
  | 'distance'
  | 'accuracy'
  | 'gir_pct'
  | 'putting'
  | 'scrambling'
  | 'sand_saves';

export interface LeaderboardPlayer {
  rank: number;
  playerId: string;
  playerName: string;
  firstName: string;
  lastName: string;
  countryCode: string;
  photoUrl: string | null;
  tourCode?: string;
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

export interface AvailableSeason {
  id: string;
  year: number;
  hasStats: boolean;
}

export interface SeasonLeaderboardsData {
  year: number;
  tourName: string;
  categories: LeaderboardCategory[];
  availableSeasons: AvailableSeason[];
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
  sg_total: {
    name: 'SG: Total',
    icon: '📊',
    description: 'Total strokes gained vs field average',
    dbKey: 'strokes_gained_total',
    unit: '',
    higherIsBetter: true,
    formatValue: (val) => (val >= 0 ? '+' : '') + val.toFixed(2),
  },
  scoring_avg: {
    name: 'Scoring',
    icon: '📋',
    description: 'Average score per round',
    dbKey: 'scoring_avg',
    unit: '',
    higherIsBetter: false,
    formatValue: (val) => val.toFixed(2),
  },
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
  gir_pct: {
    name: 'GIR',
    icon: '✅',
    description: 'Greens in regulation percentage',
    dbKey: 'gir_pct',
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
  sand_saves: {
    name: 'Sand Saves',
    icon: '🏖️',
    description: 'Sand save percentage from greenside bunkers',
    dbKey: 'sand_saves_pct',
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
  earnings: {
    name: 'Earnings',
    icon: '💰',
    description: 'Total season earnings',
    dbKey: 'earnings',
    unit: '',
    higherIsBetter: true,
    formatValue: (val) => {
      if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
      if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
      return `$${Math.round(val)}`;
    },
  },
};

// ============================================
// SKILL LEVEL CALCULATION
// ============================================

const PERCENTILE_THRESHOLDS: Record<CategoryId, { min: number; max: number }> = {
  sg_total: { min: -1, max: 2.5 },
  scoring_avg: { min: 72, max: 68 },
  earnings: { min: 100_000, max: 15_000_000 },
  distance: { min: 280, max: 330 },
  accuracy: { min: 50, max: 75 },
  gir_pct: { min: 55, max: 75 },
  putting: { min: 30, max: 27 },
  scrambling: { min: 50, max: 70 },
  sand_saves: { min: 35, max: 65 },
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

async function fetchSeasonLeaderboards(requestedYear?: number): Promise<SeasonLeaderboardsData> {
  // Step 1: Get all PGA seasons ordered by year (newest first)
  const { data: allSeasons, error: seasonsError } = await supabase
    .from('sr_seasons')
    .select('id, year')
    .ilike('tour_name', 'pga')
    .order('year', { ascending: false });

  if (seasonsError || !allSeasons?.length) {
    throw new Error('Failed to fetch seasons');
  }

  // Step 2: Check which seasons have statistics data
  const seasonsWithStatsCheck = await Promise.all(
    allSeasons.map(async (season) => {
      const { count, error: countError } = await supabase
        .from('sr_player_statistics')
        .select('*', { count: 'exact', head: true })
        .eq('season_id', season.id);

      return {
        id: season.id,
        year: season.year,
        hasStats: !countError && count !== null && count > 0,
      };
    })
  );

  const seenYears = new Set<number>();
  const availableSeasons = seasonsWithStatsCheck
    .filter((s) => {
      if (s.hasStats && !seenYears.has(s.year)) {
        seenYears.add(s.year);
        return true;
      }
      return false;
    })
    .sort((a, b) => b.year - a.year);

  if (availableSeasons.length === 0) {
    throw new Error('No seasons with statistics data found');
  }

  // Step 3: Determine which season to use
  let seasonData: AvailableSeason;

  if (requestedYear) {
    const requested = availableSeasons.find((s) => s.year === requestedYear);
    seasonData = requested || availableSeasons[0];
  } else {
    seasonData = availableSeasons[0];
  }

  // Step 4: Fetch all player statistics for this season
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
        country,
        pga_tour_id
      )
    `)
    .eq('season_id', seasonData.id);

  if (statsError || !statsData) {
    throw new Error('Failed to fetch player statistics');
  }

  // Step 5: Process data for each category
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
          pga_tour_id: string | null;
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
          photoUrl: null, // Components resolve headshots via getPlayerHeadshotUrl
          initials: `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase(),
          statValue,
          statDisplayValue: config.formatValue(statValue),
          statUnit: config.unit,
          skillLevel: level,
          skillProgress: progress,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    // Sort by stat value (respecting higherIsBetter)
    playersWithStats.sort((a, b) => {
      if (config.higherIsBetter) {
        return b.statValue - a.statValue;
      }
      return a.statValue - b.statValue;
    });

    // Take top 10 and assign ranks
    const top10 = playersWithStats.slice(0, 10).map((player, index) => ({
      ...player,
      rank: index + 1,
    }));

    const topTenAverage =
      top10.length > 0
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
    availableSeasons,
  };
}

// ============================================
// HOOK EXPORT
// ============================================

export function useSeasonLeaderboards(year?: number) {
  return useQuery({
    queryKey: ['season-leaderboards', 'pga', year ?? 'latest'],
    queryFn: () => fetchSeasonLeaderboards(year),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
