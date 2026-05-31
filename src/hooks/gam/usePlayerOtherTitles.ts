import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LegendWindow } from '@/lib/gam/types';

export interface OtherTitleRow {
  course_id: string;
  course_name: string;
  category: string;
  attained_at: string;
}

/**
 * Fetches a player's OTHER rank-1, current titles (excluding the current course).
 * Used to render the "Also champion at Y" sub-line under champion rows.
 *
 * Reads `gam_course_legends_view` directly (same source as useUserTopLegends).
 * Cached per (userId, excludeCourseId, window). staleTime 60s.
 *
 * TODO(field-size gate): the view has no participant_count column. Thin titles
 * (e.g. course with only 2 distinct players in a category) will show until a
 * field-size source lands. Gate behind SHOW_THIN_TITLES if/when needed.
 */
export function usePlayerOtherTitles(
  userId: string | undefined,
  excludeCourseId: string | undefined,
  window: LegendWindow,
) {
  return useQuery({
    queryKey: ['gam', 'player-other-titles', userId, excludeCourseId, window],
    enabled: Boolean(userId && excludeCourseId),
    staleTime: 60_000,
    queryFn: async (): Promise<OtherTitleRow[]> => {
      let q = supabase
        .from('gam_course_legends_view')
        .select('course_id, course_name, category, attained_at')
        .eq('user_id', userId!)
        .eq('is_current', true)
        .eq('rank', 1)
        .neq('course_id', excludeCourseId!);

      if (window === '90d') q = q.like('category', '%_90d');
      else q = q.like('category', '%_all_time');

      const { data, error } = await q
        .order('attained_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []).map((r) => ({
        course_id: r.course_id ?? '',
        course_name: r.course_name ?? 'a course',
        category: String(r.category ?? ''),
        attained_at: r.attained_at ?? '',
      }));
    },
  });
}
