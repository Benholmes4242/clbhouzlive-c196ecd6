/**
 * useExploreMoments - Hook for fetching explore moments from unified view
 * 
 * Phase 2: Adds trending support, caching, and prefetch
 * Phase 3: Adds filtering by time frame, region, and sort order
 */

import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export type RegionKey = 'GBI' | 'EU' | 'USA' | 'ROW';
export type TimeFilter = 'all' | 'year' | 'month' | 'week';
export type SortFilter = 'recent' | 'liked';

export interface ExploreFilters {
  timeFrame: TimeFilter;
  region: RegionKey | 'all';
  sort: SortFilter;
}

export interface ExploreMoment {
  moment_id: string;
  source_type: 'post' | 'review';
  source_id: string;
  course_id: string;
  course_name: string | null;
  user_id: string;
  created_at: string;
  media_type: string;
  media_url: string;
  thumbnail_url: string;
  stream_id: string | null;
  aspect_ratio: number | null;
  display_order: number | null;
  region_key: RegionKey | null;
  likes_count: number | null;
  duration_seconds: number | null;
  // Creator info for tile overlays (Watch tab alignment)
  creator?: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  } | null;
}

export interface TrendingMoment extends ExploreMoment {
  likes_count: number;
  comments_count: number;
  shares_count: number;
  trend_score: number;
}

export interface RegionStats {
  region_key: RegionKey;
  moments_last_30_days: number;
  thumbnail_url: string | null;
}

// Cache TTLs (in milliseconds)
const CACHE_TTL = {
  regionStats: 15 * 60 * 1000,    // 15 minutes
  trending: 10 * 60 * 1000,       // 10 minutes
  discover: 5 * 60 * 1000,        // 5 minutes
  search: 2 * 60 * 1000,          // 2 minutes
};

const PAGE_SIZE = 20;

// Helper to get date cutoff for time filter
const getTimeFilterDate = (timeFrame?: TimeFilter): Date | null => {
  if (!timeFrame || timeFrame === 'all') return null;
  
  const now = new Date();
  switch (timeFrame) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'year':
      return new Date(now.getFullYear(), 0, 1);
    default:
      return null;
  }
};

/**
 * Fetch paginated explore moments with cursor-based pagination
 * Now supports filtering by time frame, region, and sort
 */
export function useInfiniteExploreMoments(
  regionKey?: RegionKey,
  filters?: Partial<ExploreFilters>
) {
  // Merge regionKey prop with filters.region (prop takes precedence for region pages)
  const effectiveRegion = regionKey || (filters?.region && filters.region !== 'all' ? filters.region : undefined);
  const timeFrame = filters?.timeFrame || 'all';
  const sortBy = filters?.sort || 'recent';

  return useInfiniteQuery({
    queryKey: ['explore-moments', effectiveRegion, timeFrame, sortBy],
    queryFn: async ({ pageParam }) => {
      let query = supabase
        .from('explore_moments')
        .select('moment_id, source_type, source_id, course_id, course_name, user_id, created_at, media_type, media_url, thumbnail_url, stream_id, aspect_ratio, display_order, region_key, likes_count, duration_seconds')
        .not('media_url', 'is', null)
        .limit(PAGE_SIZE);

      // Filter by region if provided
      if (effectiveRegion) {
        query = query.eq('region_key', effectiveRegion);
      }

      // Filter by time frame
      const timeDate = getTimeFilterDate(timeFrame);
      if (timeDate) {
        query = query.gte('created_at', timeDate.toISOString());
      }

      // Sort order
      if (sortBy === 'liked') {
        query = query.order('likes_count', { ascending: false, nullsFirst: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }
      
      // Secondary sort for stable pagination
      query = query.order('moment_id', { ascending: false });

      // Cursor pagination
      if (pageParam) {
        query = query.lt('created_at', pageParam.created_at);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        moments: (data || []) as ExploreMoment[],
        nextCursor: data && data.length === PAGE_SIZE 
          ? { created_at: data[data.length - 1].created_at, moment_id: data[data.length - 1].moment_id }
          : null,
      };
    },
    initialPageParam: null as { created_at: string; moment_id: string } | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: CACHE_TTL.discover,
  });
}

/**
 * Fetch trending moments using RPC (last 7 days weighted by engagement)
 */
export function useTrendingMoments(limit = 40, regionKey?: RegionKey) {
  return useQuery({
    queryKey: ['explore-trending', regionKey, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('rpc_explore_trending', {
          p_limit: limit,
          p_region_key: regionKey || null,
        });

      if (error) {
        console.error('Trending RPC error:', error);
        // Fallback to latest if RPC fails
        const fallbackQuery = supabase
.from('explore_moments')
          .select('moment_id, source_type, source_id, course_id, course_name, user_id, created_at, media_type, media_url, thumbnail_url, stream_id, aspect_ratio, display_order, region_key, likes_count, duration_seconds')
          .not('media_url', 'is', null)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(limit);

        if (regionKey) {
          fallbackQuery.eq('region_key', regionKey);
        }

        const { data: fallbackData } = await fallbackQuery;
        return (fallbackData || []).map(m => ({
          ...m,
          likes_count: 0,
          comments_count: 0,
          shares_count: 0,
          trend_score: 0,
        })) as TrendingMoment[];
      }

      return (data || []) as TrendingMoment[];
    },
    staleTime: CACHE_TTL.trending,
  });
}

/**
 * Fetch "New this week" moments for a specific region
 * Uses trending RPC with limit 10, falls back to latest
 */
export function useNewThisWeekByRegion(regionKey: RegionKey) {
  return useQuery({
    queryKey: ['explore-new-this-week', regionKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('rpc_explore_trending', {
          p_limit: 12,
          p_region_key: regionKey,
        });

      if (error) {
        // Fallback to latest
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: fallbackData } = await supabase
          .from('explore_moments')
          .select('moment_id, source_type, source_id, course_id, course_name, user_id, created_at, media_type, media_url, thumbnail_url, stream_id, aspect_ratio, display_order, region_key, likes_count, duration_seconds')
          .not('media_url', 'is', null)
          .eq('region_key', regionKey)
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(12);

        return (fallbackData || []).map(m => ({
          ...m,
          likes_count: 0,
          comments_count: 0,
          shares_count: 0,
          trend_score: 0,
        })) as TrendingMoment[];
      }

      return (data || []) as TrendingMoment[];
    },
    staleTime: CACHE_TTL.trending,
  });
}

/**
 * Combined hook for all region stats (counts + thumbnails)
 */
export function useExploreRegionStats() {
  return useQuery({
    queryKey: ['explore-region-stats'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const regions: RegionKey[] = ['GBI', 'EU', 'USA', 'ROW'];
      const stats: RegionStats[] = [];

      for (const regionKey of regions) {
        // Get count
        const { count } = await supabase
          .from('explore_moments')
          .select('*', { count: 'exact', head: true })
          .eq('region_key', regionKey)
          .gte('created_at', thirtyDaysAgo.toISOString());

        // Get thumbnail (recent moment or fallback)
        let thumbnailUrl: string | null = null;

        const { data: recentMoment } = await supabase
          .from('explore_moments')
          .select('thumbnail_url')
          .eq('region_key', regionKey)
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (recentMoment?.thumbnail_url) {
          thumbnailUrl = recentMoment.thumbnail_url;
        } else {
          const { data: topCourse } = await supabase
            .from('golf_courses')
            .select('thumbnail_image')
            .eq('region_key', regionKey)
            .not('thumbnail_image', 'is', null)
            .order('global_rank', { ascending: true, nullsFirst: false })
            .limit(1)
            .maybeSingle();

          thumbnailUrl = topCourse?.thumbnail_image || null;
        }

        stats.push({
          region_key: regionKey,
          moments_last_30_days: count || 0,
          thumbnail_url: thumbnailUrl,
        });
      }

      return stats;
    },
    staleTime: CACHE_TTL.regionStats,
  });
}

/**
 * Prefetch hook - call on Explore mount to warm cache
 */
export function useExplorePrefetch() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch region stats
    queryClient.prefetchQuery({
      queryKey: ['explore-region-stats'],
      queryFn: async () => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const regions: RegionKey[] = ['GBI', 'EU', 'USA', 'ROW'];
        const stats: RegionStats[] = [];

        for (const regionKey of regions) {
          const { count } = await supabase
            .from('explore_moments')
            .select('*', { count: 'exact', head: true })
            .eq('region_key', regionKey)
            .gte('created_at', thirtyDaysAgo.toISOString());

          let thumbnailUrl: string | null = null;
          const { data: recentMoment } = await supabase
            .from('explore_moments')
            .select('thumbnail_url')
            .eq('region_key', regionKey)
            .gte('created_at', thirtyDaysAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (recentMoment?.thumbnail_url) {
            thumbnailUrl = recentMoment.thumbnail_url;
          } else {
            const { data: topCourse } = await supabase
              .from('golf_courses')
              .select('thumbnail_image')
              .eq('region_key', regionKey)
              .not('thumbnail_image', 'is', null)
              .order('global_rank', { ascending: true, nullsFirst: false })
              .limit(1)
              .maybeSingle();
            thumbnailUrl = topCourse?.thumbnail_image || null;
          }

          stats.push({
            region_key: regionKey,
            moments_last_30_days: count || 0,
            thumbnail_url: thumbnailUrl,
          });
        }
        return stats;
      },
      staleTime: CACHE_TTL.regionStats,
    });

    // Prefetch global trending (in background)
    queryClient.prefetchQuery({
      queryKey: ['explore-trending', undefined, 40],
      queryFn: async () => {
        const { data } = await supabase.rpc('rpc_explore_trending', {
          p_limit: 40,
          p_region_key: null,
        });
        return (data || []) as TrendingMoment[];
      },
      staleTime: CACHE_TTL.trending,
    });

    // Prefetch "new this week" for each region
    const regions: RegionKey[] = ['GBI', 'EU', 'USA', 'ROW'];
    regions.forEach(regionKey => {
      queryClient.prefetchQuery({
        queryKey: ['explore-new-this-week', regionKey],
        queryFn: async () => {
          const { data } = await supabase.rpc('rpc_explore_trending', {
            p_limit: 12,
            p_region_key: regionKey,
          });
          return (data || []) as TrendingMoment[];
        },
        staleTime: CACHE_TTL.trending,
      });
    });
  }, [queryClient]);
}
