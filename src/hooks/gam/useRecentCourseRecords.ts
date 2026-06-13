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
 * RPC returns one record per course (gross-leads priority, trivial filtered).
 */
export function useRecentCourseRecords(limit = 8) {
  return useQuery<RecentCourseRecord[]>({
    queryKey: ['gam', 'recent-course-records', { limit }],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_recent_course_records', {
        p_limit: limit,
      });
      if (error) throw error;
      return (data ?? []) as RecentCourseRecord[];
    },
  });
}
