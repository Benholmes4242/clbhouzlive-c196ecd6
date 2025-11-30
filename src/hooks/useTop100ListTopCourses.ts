import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Top100ListTopCourse = {
  listId: string;
  listSlug: string;
  topCourse: {
    id: string;
    name: string;
    thumbnail_image: string | null;
  } | null;
};

/**
 * Fetches the #1 ranked course for each Top 100 list
 * Used to display hero images on region cards
 */
export function useTop100ListTopCourses() {
  return useQuery({
    queryKey: ['top100-list-top-courses'],
    queryFn: async (): Promise<Top100ListTopCourse[]> => {
      // Fetch all active Top 100 lists
      const { data: lists, error: listsError } = await supabase
        .from('top100_lists')
        .select('id, slug')
        .eq('is_active', true)
        .order('sort_order');

      if (listsError) throw listsError;
      if (!lists) return [];

      // For each list, fetch the course ranked #1
      const topCourses = await Promise.all(
        lists.map(async (list) => {
          const { data: membership, error: membershipError } = await supabase
            .from('course_top100_memberships')
            .select(`
              course_id,
              rank,
              golf_courses!inner (
                id,
                name,
                thumbnail_image
              )
            `)
            .eq('list_id', list.id)
            .eq('rank', 1)
            .single();

          if (membershipError || !membership) {
            return {
              listId: list.id,
              listSlug: list.slug,
              topCourse: null,
            };
          }

          const course = (membership as any).golf_courses;

          return {
            listId: list.id,
            listSlug: list.slug,
            topCourse: {
              id: course.id,
              name: course.name,
              thumbnail_image: course.thumbnail_image,
            },
          };
        })
      );

      return topCourses;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - top courses don't change often
    gcTime: 60 * 60 * 1000, // 60 minutes
  });
}
