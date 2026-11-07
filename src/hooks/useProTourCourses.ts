import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProTourCourseEvent {
  eventName: string;
  finish: string | null;
  playedOn: string;
  source: 'owgr' | 'sportradar';
}

/**
 * One row per tour course for a verified pro. The RPC is the authority; a
 * failed read leaves the archive in its ordinary member shape rather than
 * blocking the whole profile section.
 */
export function useProTourCourses(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['pro-tour-courses', userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<Map<string, ProTourCourseEvent>> => {
      try {
        const { data, error } = await supabase.rpc('get_pro_tour_courses', { p_user_id: userId! });
        if (error) {
          console.error('get_pro_tour_courses failed', error);
          return new Map();
        }
        return new Map(
          (data ?? []).map((row) => [
            row.course_id,
            {
              eventName: row.event_name,
              finish: row.finish ?? null,
              playedOn: row.played_on,
              source: row.source === 'sportradar' ? 'sportradar' : 'owgr',
            },
          ]),
        );
      } catch (error) {
        console.error('get_pro_tour_courses failed', error);
        return new Map();
      }
    },
  });
}
