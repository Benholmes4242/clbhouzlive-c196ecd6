/**
 * Field size for course crowns: how many members have a posted round at a
 * course, derived from the legends view (which carries a row per member per
 * category and is readable by any authenticated member).
 *
 * On most courses one member is the only person who has posted, so the crown
 * is being first through the door rather than a feat. Saying so is what makes
 * the contested ones mean something.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useCourseFieldSizes(courseIds: string[]) {
  const ids = Array.from(new Set(courseIds.filter(Boolean))).sort();
  return useQuery({
    queryKey: ['gam', 'course-field-sizes', ids],
    enabled: ids.length > 0,
    staleTime: 60 * 60 * 1000,
    queryFn: async (): Promise<Map<string, number>> => {
      const { data, error } = await supabase
        .from('gam_course_legends_view')
        .select('course_id, user_id')
        .in('course_id', ids)
        .eq('is_current', true);
      if (error) throw error;
      const sets = new Map<string, Set<string>>();
      for (const row of data ?? []) {
        const courseId = row.course_id as string | null;
        const userId = row.user_id as string | null;
        if (!courseId || !userId) continue;
        const set = sets.get(courseId) ?? new Set<string>();
        set.add(userId);
        sets.set(courseId, set);
      }
      const out = new Map<string, number>();
      sets.forEach((set, courseId) => out.set(courseId, set.size));
      return out;
    },
  });
}

export default useCourseFieldSizes;
