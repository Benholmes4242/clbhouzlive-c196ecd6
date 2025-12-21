/**
 * Mock video data hook for stress testing
 * 
 * When DISCOVER_VIDEOS_MOCK_DATA is true, returns mock videos instead of real data.
 * This hook wraps useLongFormVideosQuery and swaps in mock data when enabled.
 */

import { useMemo } from 'react';
import { useLongFormVideosQuery } from './useLongFormVideosQuery';
import { DISCOVER_VIDEOS_MOCK_DATA } from '@/utils/featureFlags';
import { getMockVideosBySection, MOCK_VIDEOS } from '@/components/videos/mockVideosData';
import type { LongFormVideo } from '@/components/videos/LongFormVideoTile';

interface UseMockVideosQueryOptions {
  section?: 'recommended' | 'trending' | 'following' | 'courses' | 'all';
  limit?: number;
  followedCreatorIds?: string[];
  creatorUserId?: string;
  sort?: 'latest' | 'popular';
  searchQuery?: string;
  category?: string;
  getBoostScore?: (creatorId: string, category?: string) => number;
  enabled?: boolean;
}

/**
 * Hook that returns mock videos when DISCOVER_VIDEOS_MOCK_DATA is enabled,
 * otherwise delegates to the real useLongFormVideosQuery.
 */
export const useMockVideosQuery = (options: UseMockVideosQueryOptions = {}) => {
  const { section = 'all', limit = 10, enabled = true } = options;

  // Always call the real hook to maintain hook order
  const realQuery = useLongFormVideosQuery({
    ...options,
    // Disable real query when mock data is enabled
    enabled: enabled && !DISCOVER_VIDEOS_MOCK_DATA,
  });

  // Generate mock data when flag is enabled
  const mockVideos = useMemo<LongFormVideo[]>(() => {
    if (!DISCOVER_VIDEOS_MOCK_DATA || !enabled) return [];
    return getMockVideosBySection(section, limit);
  }, [section, limit, enabled]);

  // Return mock data or real data based on flag
  if (DISCOVER_VIDEOS_MOCK_DATA) {
    return {
      videos: mockVideos,
      isLoading: false,
      error: null,
      refetch: async () => {},
    };
  }

  return realQuery;
};

/**
 * Hook for Continue Watching - returns empty when mock mode is on
 * since mock videos don't have watch progress
 */
export const useMockContinueWatching = () => {
  if (DISCOVER_VIDEOS_MOCK_DATA) {
    return {
      videos: [],
      isLoading: false,
    };
  }
  // Return null to indicate real hook should be used
  return null;
};

export default useMockVideosQuery;
