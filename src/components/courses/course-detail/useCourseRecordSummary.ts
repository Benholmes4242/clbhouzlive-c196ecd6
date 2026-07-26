/**
 * useCourseRecordSummary - read-only view over the EXISTING course legends
 * query (useCourseLegends -> get_course_legends RPC). No new query, no RPC.
 *
 * The RPC applies champions_visibility per row, so any holder who has
 * restricted visibility is already absent from `data` here.
 *
 * ASCII only.
 */
import { useMemo } from 'react';
import { useCourseLegends } from '@/hooks/gam/useCourseLegends';
import type { CourseLegendRow, LegendCategory } from '@/lib/gam/types';
import { CHAMPIONS_ORDER_ALL_TIME } from '@/components/profile/handicap/whs/sections/course-legends/_shared/championsOrder';

/** Preview order for the record book: record first, then the headline boards. */
export const RECORD_BOOK_ORDER: LegendCategory[] = [
  'lowest_gross_all_time',
  'most_rounds_all_time',
  'best_stableford_all_time',
  'most_birdies_all_time',
  'best_score_diff_all_time',
];

export interface CourseRecordSummary {
  isLoading: boolean;
  /** Rank-1 holder per category (all-time window). */
  holders: Map<LegendCategory, CourseLegendRow>;
  /** Ordered rank-1 rows for the record book preview, max 5. */
  previewRows: { category: LegendCategory; row: CourseLegendRow }[];
  /** The course record (lowest gross, all time), or null. */
  courseRecord: CourseLegendRow | null;
  /** All-time categories with nobody on the board. */
  unclaimedCount: number;
  hasAnyHolder: boolean;
}

export function useCourseRecordSummary(
  courseId: string | undefined,
  viewerId?: string | null,
): CourseRecordSummary {
  const { data, isLoading } = useCourseLegends(courseId, viewerId ?? null);

  return useMemo(() => {
    const holders = new Map<LegendCategory, CourseLegendRow>();
    (data ?? []).forEach((row) => {
      if (row.rank !== 1) return;
      if (!holders.has(row.category)) holders.set(row.category, row);
    });

    const previewRows = RECORD_BOOK_ORDER
      .filter((c) => holders.has(c))
      .slice(0, 5)
      .map((category) => ({ category, row: holders.get(category)! }));

    const unclaimedCount = CHAMPIONS_ORDER_ALL_TIME
      .filter((c) => !holders.has(c)).length;

    return {
      isLoading,
      holders,
      previewRows,
      courseRecord: holders.get('lowest_gross_all_time') ?? null,
      unclaimedCount,
      hasAnyHolder: holders.size > 0,
    };
  }, [data, isLoading]);
}
