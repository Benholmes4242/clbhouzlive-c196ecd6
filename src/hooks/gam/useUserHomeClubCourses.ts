import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { __hydrateHeaderImages } from './useDiscoverCoursesThisWeek';

export interface HomeClubCourseRow {
  course_id: string;
  course_name: string;
  course_region: string | null;
  course_country: string | null;
  course_type: string | null;
  course_header_image?: string | null;
  rounds_count?: number | null;
  last_played_at?: string | null;
  home_club_name: string | null;
}

/**
 * Backed by RPC `get_user_home_club_courses`. Returns courses matching the
 * user's `home_club` string via fuzzy match. Includes home-club courses the
 * user hasn't played (LEFT JOIN). Swallows RPC errors and returns empty
 * so the UI can render an empty stub instead of throwing.
 */
export function useUserHomeClubCourses(userId: string | undefined) {
  return useQuery({
    queryKey: ['gam', 'user-home-club-courses', userId],
    enabled: Boolean(userId),
    staleTime: 60_000,
    queryFn: async (): Promise<HomeClubCourseRow[]> => {
      const { data, error } = await (supabase.rpc as any)('get_user_home_club_courses', {
        p_user_id: userId!,
      });
      if (error) return [];
      const rows = (data ?? []) as HomeClubCourseRow[];
      return __hydrateHeaderImages(rows);
    },
  });
}
