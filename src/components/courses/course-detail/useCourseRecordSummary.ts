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
  /**
   * Gap from the champion as an UNSIGNED magnitude, e.g. "4" or "60". The
   * direction is carried by the word in the string, so a sign here could only
   * ever contradict it ("-60 behind").
   */
  gap: string;
  /** True when the gap means the viewer is BEHIND the champion. */
  behind: boolean;
}

export interface CourseRecordSummary {
  isLoading: boolean;
  /** Rank-1 holder per category (all-time window). */
  holders: Map<LegendCategory, CourseLegendRow>;
  /** Every rank-1 holder per category, ordered. Length 1 on an untied board. */
  holderGroups: Map<LegendCategory, CourseLegendRow[]>;
  /**
   * Ordered boards for the record book preview, max 5. `rows` is the holder
   * group; `row` (= rows[0]) is kept only so the unmounted CourseRecordBook.tsx
   * still compiles.
   */
  previewRows: { category: LegendCategory; row: CourseLegendRow; rows: CourseLegendRow[] }[];
  /** The course record (lowest gross, all time), or null. */
  courseRecord: CourseLegendRow | null;
  /** Every holder of the course record (lowest gross, all time). */
  courseRecordHolders: CourseLegendRow[];
  /** All-time categories with nobody on the board. */
  unclaimedCount: number;
  hasAnyHolder: boolean;
  /** Viewer's own row per category (any rank), with gap from the champion. */
  viewerByCategory: Map<LegendCategory, ViewerStanding>;
}

/**
 * Tie key. MUST stay in step with valueKey in
 * supabase/functions/gam-evaluator/legendRanks.ts (Deno; cannot be imported).
 */
const valueKey = (v: number | string): string => Number(v).toFixed(6);

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
        // Unsigned magnitude: the word ("behind") owns the direction.
        gap: Math.abs(diff).toFixed(1).replace(/\.0$/, ''),
        behind,
      });
    });

    // Joint holders: group by VALUE against the min-rank anchor, never by rank,
    // so boards still carrying pre-competition positional ranks (1,2,..) show
    // every holder, and this agrees with Champions' positionsFor().
    const byCategory = new Map<LegendCategory, CourseLegendRow[]>();
    (data ?? []).forEach((row) => {
      const list = byCategory.get(row.category);
      if (list) list.push(row); else byCategory.set(row.category, [row]);
    });
    const holderGroups = new Map<LegendCategory, CourseLegendRow[]>();
    byCategory.forEach((rows, category) => {
      const anchor = rows.reduce((a, b) => (b.rank < a.rank ? b : a));
      const key = valueKey(anchor.value);
      const group = rows
        .filter((r) => valueKey(r.value) === key)
        .sort((a, b) => {
          if (a.is_self !== b.is_self) return a.is_self ? -1 : 1;
          return String(a.attained_at ?? '').localeCompare(String(b.attained_at ?? ''));
        });
      holderGroups.set(category, group);
    });

    const previewRows = RECORD_BOOK_ORDER
      .filter((c) => holders.has(c))
      .slice(0, 5)
      .map((category) => {
        const rows = holderGroups.get(category) ?? [holders.get(category)!];
        return { category, row: rows[0], rows };
      });

    const unclaimedCount = CHAMPIONS_ORDER_ALL_TIME
      .filter((c) => !holders.has(c)).length;

    const courseRecord = holders.get('lowest_gross_all_time') ?? null;
    return {
      isLoading,
      holders,
      holderGroups,
      previewRows,
      courseRecord,
      courseRecordHolders: courseRecord
        ? holderGroups.get('lowest_gross_all_time') ?? [courseRecord]
        : [],
      unclaimedCount,
      hasAnyHolder: holders.size > 0,
      viewerByCategory,
    };
  }, [data, isLoading]);
}
