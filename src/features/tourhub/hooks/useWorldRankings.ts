/**
 * useWorldRankings - Unified hook for world golf rankings data
 * 
 * Single source of truth for:
 * - Menu overlay World Rankings carousel
 * - Leaders page World Rankings category
 * - Players page "Top Ranked" tab
 * 
 * Handles proper sorting: valid ranks (>=1) ascending, then unranked at bottom
 */

import { useMemo } from 'react';
import { useTourSeason, useTourPlayerStatistics, type TourPlayer, type TourPlayerStatistics } from './useTourHubData';

export interface WorldRankedPlayer {
  playerId: string;
  playerName: string;
  country: string | null;
  countryCode: string | null;
  photoUrl: string | null;
  worldRank: number | null;
  earnings: number | null;
  eventsPlayed: number | null;
  top10s: number | null;
  cutsMade: number | null;
  scoringAvg: number | null;
  fedexRank: number | null;
  isRanked: boolean;
  player?: TourPlayer;
  stats?: TourPlayerStatistics;
}

/**
 * Format country name to Title Case
 */
export function toTitleCase(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

/**
 * CDN base URL for player headshots
 */
const CDN_BASE_URL = 'https://media.clbhouz.co.uk';

/**
 * Resolve photo URL - prefix with CDN if it's a relative path
 */
function resolvePhotoUrl(photoUrl: string | null | undefined): string | null {
  if (!photoUrl) return null;
  // Already absolute URL
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl;
  }
  // Relative path - prefix with CDN
  return `${CDN_BASE_URL}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
}

/**
 * Extract world rank from player stats raw_data
 */
function extractWorldRank(stat: any): number | null {
  const rank = stat?.raw_data?.statistics?.world_rank;
  if (typeof rank === 'number' && rank >= 1) {
    return rank;
  }
  return null;
}

/**
 * Extract earnings from player stats raw_data
 */
function extractEarnings(stat: any): number | null {
  return stat?.raw_data?.statistics?.earnings ?? null;
}

/**
 * Extract scoring average from player stats raw_data
 */
function extractScoringAvg(stat: any): number | null {
  return stat?.raw_data?.statistics?.scoring_avg ?? null;
}

/**
 * Extract top 10s from player stats raw_data
 */
function extractTop10s(stat: any): number | null {
  return stat?.raw_data?.statistics?.top_10 ?? null;
}

/**
 * Unified World Rankings hook
 * Returns players sorted by world rank (valid ranks first, ascending)
 */
export function useWorldRankings(options?: { limit?: number }) {
  const { data: season } = useTourSeason();
  const { data: playerStats, isLoading, error } = useTourPlayerStatistics(season?.id);
  
  const rankedPlayers = useMemo<WorldRankedPlayer[]>(() => {
    if (!playerStats) return [];
    
    // Map all players with their rankings
    const mapped: WorldRankedPlayer[] = playerStats
      .filter(stat => stat.player) // Must have player data
      .map(stat => {
        const worldRank = extractWorldRank(stat);
        return {
          playerId: stat.player_id,
          playerName: stat.player?.full_name || 'Unknown',
          country: stat.player?.country,
          countryCode: stat.player?.country_code,
          photoUrl: resolvePhotoUrl(stat.player?.photo_url),
          worldRank,
          earnings: extractEarnings(stat),
          eventsPlayed: stat.events_played,
          top10s: extractTop10s(stat),
          cutsMade: stat.cuts_made,
          scoringAvg: extractScoringAvg(stat),
          fedexRank: stat.fedex_rank,
          isRanked: worldRank !== null && worldRank >= 1,
          player: stat.player,
          stats: stat,
        };
      });
    
    // Sort: ranked players first (ascending by rank), then unranked (by name)
    const sorted = mapped.sort((a, b) => {
      // Both ranked: sort by rank ascending
      if (a.isRanked && b.isRanked) {
        return (a.worldRank || 9999) - (b.worldRank || 9999);
      }
      // a is ranked, b is not: a comes first
      if (a.isRanked && !b.isRanked) return -1;
      // b is ranked, a is not: b comes first
      if (!a.isRanked && b.isRanked) return 1;
      // Both unranked: sort alphabetically
      return a.playerName.localeCompare(b.playerName);
    });
    
    // Apply limit if specified
    if (options?.limit) {
      return sorted.slice(0, options.limit);
    }
    
    return sorted;
  }, [playerStats, options?.limit]);
  
  // Debug logging - moved outside useMemo for proper side effects
  const debugInfo = useMemo(() => {
    if (!playerStats || playerStats.length === 0) return null;
    
    const withRank = rankedPlayers.filter(p => p.isRanked);
    const withZeroRank = playerStats.filter(s => {
      const r = extractWorldRank(s);
      return r === null || r === 0;
    });
    
    return {
      totalRows: playerStats.length,
      rankedPlayers: withRank.length,
      unrankedOrZero: withZeroRank.length,
      top5: rankedPlayers.slice(0, 5).map(p => ({ 
        name: p.playerName, 
        rank: p.worldRank 
      })),
    };
  }, [playerStats, rankedPlayers]);
  
  // Log only when debug info changes
  if (debugInfo) {
    console.log('[useWorldRankings] Stats:', debugInfo);
  }
  
  return {
    data: rankedPlayers,
    rankedOnly: rankedPlayers.filter(p => p.isRanked),
    isLoading,
    error,
  };
}

/**
 * Hook specifically for the top N world ranked players
 * Used by: Menu carousel, Leaders spotlight
 */
export function useTopWorldRanked(limit: number = 50) {
  const { rankedOnly, isLoading, error } = useWorldRankings();
  
  return {
    data: rankedOnly.slice(0, limit),
    isLoading,
    error,
  };
}
