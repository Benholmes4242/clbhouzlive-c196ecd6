/**
 * useExploreMoments - Hook for fetching explore moments from unified view
 * 
 * Provides infinite scroll pagination for the Discover grid and region feeds.
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type RegionKey = 'GBI' | 'EU' | 'USA' | 'ROW';

export interface ExploreMoment {
  moment_id: string;
  source_type: 'post' | 'review';
  source_id: string;
  course_id: string;
  user_id: string;
  created_at: string;
  media_type: string;
  media_url: string;
  thumbnail_url: string;
  stream_id: string | null;
  aspect_ratio: number | null;
  display_order: number | null;
  region_key: RegionKey | null;
}

export interface RegionStats {
  region_key: RegionKey;
  moments_last_30_days: number;
  thumbnail_url: string | null;
}

const PAGE_SIZE = 20;

/**
 * Fetch paginated explore moments with cursor-based pagination
 */
export function useInfiniteExploreMoments(regionKey?: RegionKey) {
  return useInfiniteQuery({
    queryKey: ['explore-moments', regionKey],
    queryFn: async ({ pageParam }) => {
      let query = supabase
        .from('explore_moments')
        .select('*')
        .order('created_at', { ascending: false })
        .order('moment_id', { ascending: false })
        .limit(PAGE_SIZE);

      // Filter by region if provided
      if (regionKey) {
        query = query.eq('region_key', regionKey);
      }

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
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Fetch region counts (rolling 30 days)
 */
export function useRegionCounts() {
  return useQuery({
    queryKey: ['explore-region-counts'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('explore_moments')
        .select('region_key')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (error) throw error;

      // Count by region
      const counts: Record<RegionKey, number> = {
        GBI: 0,
        EU: 0,
        USA: 0,
        ROW: 0,
      };

      (data || []).forEach(item => {
        if (item.region_key && counts[item.region_key as RegionKey] !== undefined) {
          counts[item.region_key as RegionKey]++;
        }
      });

      return counts;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch region thumbnail (most recent moment or fallback to top course)
 */
export function useRegionThumbnail(regionKey: RegionKey) {
  return useQuery({
    queryKey: ['explore-region-thumbnail', regionKey],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Try to get most recent moment thumbnail
      const { data: recentMoment } = await supabase
        .from('explore_moments')
        .select('thumbnail_url')
        .eq('region_key', regionKey)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentMoment?.thumbnail_url) {
        return recentMoment.thumbnail_url;
      }

      // Fallback to top-ranked course thumbnail
      const { data: topCourse } = await supabase
        .from('golf_courses')
        .select('thumbnail_image')
        .eq('region_key', regionKey)
        .not('thumbnail_image', 'is', null)
        .order('global_rank', { ascending: true, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      return topCourse?.thumbnail_image || null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
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
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
