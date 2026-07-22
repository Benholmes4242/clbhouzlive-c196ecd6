import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { slugToCacheRegion } from '@/components/explore-tab-new/regionScope';
import type { RecordsMode } from '@/components/explore-tab-new/hooks/useRegionFeats';

export interface RecentCourseRecord {
  course_id: string;
  course_name: string;
  category: string;
  value: number;
  attained_at: string;
  thumbnail_image: string | null;
  holder_name: string | null;
  holder_username: string | null;
  holder_avatar: string | null;
}

/**
 * Latest N course records for the active Discover region, newest-first.
 * Reads directly from the precomputed per-region `discover_rail_cache`
 * row (`records:<region>` or `records_alltime:<region>`).
 */
export function useRecentCourseRecords(
  limit = 8,
  region: string | null = null,
  mode: RecordsMode = 'latest',
) {
  const cacheRegion = slugToCacheRegion(region);
  const railKey =
    mode === 'alltime'
      ? `records_alltime:${cacheRegion}`
      : `records:${cacheRegion}`;

  return useQuery<RecentCourseRecord[]>({
    queryKey: ['gam', 'recent-course-records', cacheRegion, mode, railKey, { limit }],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discover_rail_cache')
        .select('payload')
        .eq('rail_key', railKey)
        .maybeSingle();
      if (error) throw error;
      const rows = (data?.payload ?? []) as unknown as RecentCourseRecord[];
      return rows.slice(0, limit);
    },
  });
}
