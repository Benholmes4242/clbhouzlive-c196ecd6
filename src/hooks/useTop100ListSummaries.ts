import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type HeroCourse = {
  id: string;
  name: string;
  country: string | null;
  region: string | null;
  cover_image_url: string | null;
  rank_in_list: number;
};

export type Top100ListSummary = {
  id: string;
  name: string;
  slug: string;
  total_courses: number;
  played_count: number;
  hero_course: HeroCourse | null;
};

/**
 * Fetches complete Top 100 list summaries including #1 ranked course hero data
 * Used to display region cards with hero images and user progress
 */
export function useTop100ListSummaries(userId: string | undefined) {
  return useQuery({
    queryKey: ['top100-list-summaries', userId],
    queryFn: async (): Promise<Top100ListSummary[]> => {
      // Fetch all active Top 100 lists
      const { data: lists, error: listsError } = await supabase
        .from('top100_lists')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('sort_order');

      if (listsError) throw listsError;
      if (!lists) return [];

      // For each list, fetch complete data
      const summaries = await Promise.all(
        lists.map(async (list) => {
          // Get total courses in this list
          const { count: totalCourses, error: countError } = await supabase
            .from('course_top100_memberships')
            .select('*', { count: 'exact', head: true })
            .eq('list_id', list.id);

          if (countError) throw countError;

          // Get user's played count for this list
          let playedCount = 0;
          if (userId) {
            const { data: userActivity, error: activityError } = await supabase
              .from('user_course_activity')
              .select('course_id')
              .eq('user_id', userId)
              .eq('is_top100', true);

            if (!activityError && userActivity) {
              const playedCourseIds = new Set(userActivity.map(a => a.course_id));

              const { data: listMemberships, error: membershipsError } = await supabase
                .from('course_top100_memberships')
                .select('course_id')
                .eq('list_id', list.id)
                .in('course_id', Array.from(playedCourseIds));

              if (!membershipsError && listMemberships) {
                playedCount = listMemberships.length;
              }
            }
          }

          // Fetch the #1 ranked course for hero image
          const { data: heroCourse, error: heroError } = await supabase
            .from('course_top100_memberships')
            .select(`
              rank,
              golf_courses!inner (
                id,
                name,
                country,
                region,
                thumbnail_image
              )
            `)
            .eq('list_id', list.id)
            .eq('rank', 1)
            .maybeSingle();

          let hero: HeroCourse | null = null;
          if (!heroError && heroCourse) {
            const course = (heroCourse as any).golf_courses;
            hero = {
              id: course.id,
              name: course.name,
              country: course.country,
              region: course.region,
              cover_image_url: course.thumbnail_image,
              rank_in_list: heroCourse.rank,
            };
          }

          return {
            id: list.id,
            name: list.name,
            slug: list.slug,
            total_courses: totalCourses || 0,
            played_count: playedCount,
            hero_course: hero,
          };
        })
      );

      return summaries;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
