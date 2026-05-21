import { useGamRpc } from './_useGamRpc';
import type { LegendCategory } from '@/lib/gam/types';

export interface CourseLegendHolderRow {
  course_id: string;
  category: LegendCategory;
  rank: number;
  user_id: string;
  display_name: string;
  photo_url: string | null;
  value: number;
  attained_at: string;
  is_self: boolean;
  your_rank: number | null;
  your_value: number | null;
  your_gap_to_first: number | null;
}

/**
 * Batch-fetches rank-1 legend holders for multiple courses, plus the
 * viewer's own rank/value/gap-to-first for each course-category.
 *
 * Used by CourseLegendsCard on the Compete tab to render the Crown
 * Holders grid + the contextual tap footer.
 */
export function useCourseLegendHolders(
  userId: string | undefined,
  courseIds: string[],
) {
  return useGamRpc<CourseLegendHolderRow[]>(
    'get_legend_holders_for_courses',
    userId && courseIds.length > 0
      ? { p_user_id: userId, p_course_ids: courseIds }
      : ({} as { p_user_id: string; p_course_ids: string[] }),
    {
      enabled: Boolean(userId) && courseIds.length > 0,
      staleTime: 60_000,
    },
  );
}
