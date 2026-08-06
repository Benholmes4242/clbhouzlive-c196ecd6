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
import {
  formatGapFromChampion,
  isLowerBetterCategory,
} from '@/components/profile/handicap/whs/sections/course-legends/drilldown/_shared/helpers';

/** Preview order for the record book: record first, then the headline boards. */
export const RECORD_BOOK_ORDER: LegendCategory[] = [
  'lowest_gross_all_time',
  'most_rounds_all_time',
  'best_stableford_all_time',
  'most_birdies_all_time',
  'best_score_diff_all_time',
];

/** The viewing member's own standing on a board they do not hold. */
export interface ViewerStanding {
  row: CourseLegendRow;
  /** Signed gap from the champion, e.g. "+4" or "-60". */
  gap: string;
  /** True when the gap means the viewer is BEHIND the champion. */
  behind: boolean;
}

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
  /** Viewer's own row per category (any rank), with gap from the champion. */
  viewerByCategory: Map<LegendCategory, ViewerStanding>;
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

    // Viewer's own best row per category, gap derived against the rank-1 value.
    const viewerRows = new Map<LegendCategory, CourseLegendRow>();
    (data ?? []).forEach((row) => {
      if (!row.is_self) return;
      const current = viewerRows.get(row.category);
      if (!current || row.rank < current.rank) viewerRows.set(row.category, row);
    });

    const viewerByCategory = new Map<LegendCategory, ViewerStanding>();
    viewerRows.forEach((row, category) => {
      const champion = holders.get(category);
      if (!champion) return;
      const diff = row.value - champion.value;
      // Direction is category-dependent: on lowest-gross style boards a HIGHER
      // value is worse, everywhere else a LOWER value is worse.
      const behind = isLowerBetterCategory(category) ? diff > 0 : diff < 0;
      viewerByCategory.set(category, {
        row,
        gap: formatGapFromChampion(category, row.value, champion.value),
        behind,
      });
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
      viewerByCategory,
    };
  }, [data, isLoading]);
}
