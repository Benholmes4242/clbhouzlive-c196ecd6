import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Top100MapScope = 'global-top-100' | 'gb-i-top-100' | 'usa-top-100' | 'europe-top-100';

export interface Top100MapCourse {
  id: string;
  name: string;
  country: string | null;
  sub_country: string | null;
  latitude: number;
  longitude: number;
  rank: number | null;
  list_slug: Top100MapScope;
  is_played: boolean;
}

export function useTop100MapCourses(scope: Top100MapScope, userId?: string) {
  return useQuery({
    queryKey: ['top100-map-courses', scope, userId],
    queryFn: async (): Promise<Top100MapCourse[]> => {
      // 1) Find the list matching the scope
      const { data: lists, error: listsError } = await supabase
        .from('top100_lists')
        .select('id, slug')
        .eq('slug', scope)
        .eq('is_active', true);

      if (listsError) throw listsError;
      if (!lists || lists.length === 0) return [];

      const listId = lists[0].id;

      // 2) Get course memberships + golf_courses data
      const { data: memberships, error: membershipsError } = await supabase
        .from('course_top100_memberships')
        .select(`
          course_id,
          rank,
          golf_courses:course_id (
            id,
            name,
            country,
            sub_country,
            latitude,
            longitude
          )
        `)
        .eq('list_id', listId);

      if (membershipsError) throw membershipsError;

      // 3) Get user's played courses if userId provided
      let playedCourseIds = new Set<string>();
      if (userId) {
        const { data: userActivity, error: activityError } = await supabase
          .from('user_course_activity')
          .select('course_id')
          .eq('user_id', userId);

        if (!activityError && userActivity) {
          playedCourseIds = new Set(userActivity.map((a: any) => a.course_id));
        }
      }

      // 4) Transform and filter for courses with coordinates
      const coursesMap = new Map<string, Top100MapCourse>();

      (memberships || []).forEach((m: any) => {
        const course = m.golf_courses;
        if (!course || !course.latitude || !course.longitude) return;

        const existingCourse = coursesMap.get(course.id);
        const currentRank = m.rank || 9999;

        // Keep the best (lowest) rank if duplicate
        if (!existingCourse || (existingCourse.rank || 9999) > currentRank) {
          coursesMap.set(course.id, {
            id: course.id,
            name: course.name,
            country: course.country,
            sub_country: course.sub_country,
            latitude: course.latitude,
            longitude: course.longitude,
            rank: m.rank,
            list_slug: scope,
            is_played: playedCourseIds.has(course.id),
          });
        }
      });

      return Array.from(coursesMap.values());
    },
    staleTime: 60_000,
  });
}
