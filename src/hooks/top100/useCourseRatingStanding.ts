/**
 * useCourseRatingStanding — standing of one course within the rated pool of a
 * Top 100 list.
 *
 * Reads get_course_rating_standing(p_course_id, p_list_slug DEFAULT NULL).
 * With p_list_slug NULL the function picks the course's list by
 * top100_lists.sort_order ascending, so a course in both Global and GB&I
 * resolves to Global, and returns the label alongside. It returns no row when
 * the course is in no list or sits below t100_verdict_min_ratings.
 *
 * The column is `standing`, not `position` — position is reserved in Postgres.
 *
 * Call this ONLY for a course that already qualifies for the verdict band
 * (ranked and rated). It is not a per-visible-row hook.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CourseRatingStanding {
  standing: number;
  poolSize: number;
  listSlug: string;
  listLabel: string;
}

export function useCourseRatingStanding(
  courseId: string | null | undefined,
  listSlug?: string | null,
  enabled = true,
) {
  return useQuery<CourseRatingStanding | null>({
    queryKey: ['course-rating-standing', courseId, listSlug ?? null],
    enabled: !!courseId && enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_course_rating_standing' as never, {
        p_course_id: courseId,
        p_list_slug: listSlug ?? null,
      } as never);
      if (error) throw error;
      const rows = (data ?? null) as unknown;
      const row = (Array.isArray(rows) ? rows[0] : rows) as Record<string, unknown> | undefined;
      if (!row || row.standing == null) return null;
      return {
        standing: Number(row.standing),
        poolSize: Number(row.pool_size),
        listSlug: String(row.list_slug ?? ''),
        listLabel: String(row.list_label ?? ''),
      };
    },
  });
}
