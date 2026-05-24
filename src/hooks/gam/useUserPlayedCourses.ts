import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { __hydrateHeaderImages } from './useDiscoverCoursesThisWeek';

export interface PlayedCourseRow {
  course_id: string;
  course_name: string;
  course_region: string | null;
  course_country: string | null;
  course_type: string | null;
  course_header_image?: string | null;
  rounds_count?: number | null;
  last_played_at?: string | null;
}

/**
 * Backed by the future RPC `get_user_played_courses` (ships in the follow-up
 * SQL chunk after file 04). Until then this returns an empty array on RPC
 * error so the UI renders the empty stub instead of throwing.
 */
export function useUserPlayedCourses(userId: string | undefined) {
  return useQuery({
    queryKey: ['gam', 'user-played-courses', userId],
    enabled: Boolean(userId),
    staleTime: 60_000,
    queryFn: async (): Promise<PlayedCourseRow[]> => {
      const { data, error } = await (supabase.rpc as any)('get_user_played_courses', {
        p_user_id: userId!,
        p_limit: 24,
      });
      if (error) return [];
      const rows = (data ?? []) as PlayedCourseRow[];
      return __hydrateHeaderImages(rows);
    },
  });
}
