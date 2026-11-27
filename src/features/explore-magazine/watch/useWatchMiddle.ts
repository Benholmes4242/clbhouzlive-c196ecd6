/** WS2 reads: the four WATCH_S2_V1 RPCs. Signed-out callers are disabled (the RPCs return nothing anyway). */
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { COURSE_SHELF_LIMIT, GRID_PAGE, nextCursor, type WatchRegionCourseRow, type WatchRegionRow, type WatchVideoRow } from './watchMiddle';

export function useCourseVideos(userId: string | null | undefined) {
  return useQuery<WatchVideoRow[]>({
    queryKey: ['watch-s2', 'course-videos', userId],
    enabled: !!userId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_watch_course_videos', { p_limit: COURSE_SHELF_LIMIT });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useWatchRegions(userId: string | null | undefined) {
  return useQuery<WatchRegionRow[]>({
    queryKey: ['watch-s2', 'regions', userId],
    enabled: !!userId,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_watch_regions');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useRegionCourses(userId: string | null | undefined, region: string | null) {
  return useQuery<WatchRegionCourseRow[]>({
    queryKey: ['watch-s2', 'region-courses', userId, region],
    enabled: !!userId && !!region,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_watch_region_courses', { p_region: region as string });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type GridSource = { kind: 'courses' } | { kind: 'region'; region: string; courseId: string | null };

export async function fetchGridPage(src: GridSource, before?: string): Promise<WatchVideoRow[]> {
  if (src.kind === 'courses') {
    const { data, error } = await supabase.rpc('get_watch_course_videos', { p_limit: GRID_PAGE, ...(before ? { p_before: before } : {}) });
    if (error) throw error;
    return data ?? [];
  }
  const { data, error } = await supabase.rpc('get_watch_region_videos', {
    p_region: src.region,
    p_limit: GRID_PAGE,
    ...(src.courseId ? { p_course_id: src.courseId } : {}),
    ...(before ? { p_before: before } : {}),
  });
  if (error) throw error;
  return (data ?? []) as WatchVideoRow[];
}

export function useGridVideos(userId: string | null | undefined, src: GridSource) {
  return useInfiniteQuery<WatchVideoRow[], Error>({
    queryKey: ['watch-s2', 'grid', userId, src],
    enabled: !!userId,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => fetchGridPage(src, pageParam as string | undefined),
    getNextPageParam: (last) => nextCursor(last),
  });
}
