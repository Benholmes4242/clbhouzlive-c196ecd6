import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
 * Latest N course records across the network, newest-first.
 * Reads from the precomputed discover_rail_cache table.
 */
export function useRecentCourseRecords(limit = 8) {
  return useQuery<RecentCourseRecord[]>({
    queryKey: ['gam', 'recent-course-records', { limit }],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discover_rail_cache')
        .select('payload')
        .eq('rail_key', 'latest_records')
        .maybeSingle();
      if (error) throw error;
      const rows = (data?.payload ?? []) as unknown as RecentCourseRecord[];
      return rows.slice(0, limit);
    },
  });
}
