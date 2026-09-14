import { useMemo } from 'react';

import { DEFAULT_FILTERS } from '@/components/explore-tab-new/courseled/boardFilters';
import { useBoardCourses } from '@/components/explore-tab-new/courseled/hooks/useBoardCourses';
import { useCourseCardMeta } from '@/components/explore-tab-new/courseled/hooks/useCourseCardMeta';
import { useUserWantToPlay } from '@/hooks/useUserWantToPlay';

import { useTop100RankIndex, type RankListSlug } from './useTop100RankIndex';

import type { ViewerScoreScope } from './useViewerScoreScope';

/**
 * THE COURSE SHELF SOURCES (BRIEF_EXPLORE_MAGAZINE PHASE C, §3a-§3c).
 *
 * GEOGRAPHY IS NEVER RE-DERIVED HERE. County and country arrive from the shared
 * useViewerScoreScope resolver (its own header names Phase C as the reuse
 * target); this file only asks the board for courses and filters them.
 *
 * THE COUNTY FILTER IS CLIENT-SIDE, ON EVIDENCE. get_board_courses passes
 * p_region_kind/p_region_value straight to board_pool, whose ok_region predicate
 * reads:
 *
 *   when p_region_kind is null         then true
 *   when p_region_kind = 'country'     then c.country     = p_region_value
 *   when p_region_kind = 'sub_country' then c.sub_country = p_region_value
 *   else true
 *
 * There is NO region (county) branch, and `else true` means an invented
 * p_region_kind='region' would silently pass EVERY course rather than fail —
 * the worst possible outcome. So the county shelf takes path (a) of §3a: it
 * asks for a BOUNDED set (the viewer's sub_country when known) and filters to
 * golf_courses.region client-side. The schema-adjacent p_region proposal is
 * filed, unapplied, in docs/sql/explore_phase_c_region_and_club.md.
 */

export interface CourseShelfRow {
  courseId: string;
  name: string | null;
  area: string | null;
  imageUrl: string | null;
  rounds: number;
  rating: number | null;
  ratingCount: number;
  /** Top 100 rank, when the course carries one. */
  rank: number | null;
  /** THE LIST THE RANK CAME FROM, read from the membership — never inferred from
   *  a null field. Null means the scope is unresolved and the chip shows the
   *  rank with NO label. */
  rankScope: RankListSlug | null;
}

/** §3a AROUND {county} — most tracked rounds, then rating. */
export function useCountyCourses(
  viewerId: string | undefined,
  geography: ViewerScoreScope,
  enabled: boolean,
) {
  const county = geography.county;
  const filters = useMemo(
    () => ({
      ...DEFAULT_FILTERS,
      window: '90' as const,
      regionKind: geography.country ? ('sub_country' as const) : null,
      regionValue: geography.country ?? null,
    }),
    [geography.country],
  );
  const board = useBoardCourses(viewerId, filters, { limit: 60, enabled: enabled && !!county, sort: 'played' });
  const ids = useMemo(() => (board.data?.rows ?? []).map((row) => row.course_id), [board.data]);
  const meta = useCourseCardMeta(ids);

  const rows = useMemo<CourseShelfRow[]>(() => {
    if (!county) return [];
    return (board.data?.rows ?? [])
      /* THE COUNTY IS golf_courses.region EXACTLY — never the board's `area`,
         which falls back to sub_country and would fold a whole nation in. */
      .filter((row) => meta.data?.get(row.course_id)?.rawRegion === county)
      .map((row) => ({
        courseId: row.course_id,
        name: row.name,
        area: row.area,
        imageUrl: row.thumbnail_image ?? meta.data?.get(row.course_id)?.imageUrl ?? null,
        rounds: row.rounds,
        rating: row.rating,
        ratingCount: row.rating_count,
        rank: null,
        rankScope: null,
      }))
      .sort((a, b) => (b.rounds - a.rounds) || ((b.rating ?? 0) - (a.rating ?? 0)))
      .slice(0, 12);
  }, [board.data, meta.data, county]);

  return {
    rows,
    isFetched: !enabled || !county ? true : board.isFetched && (ids.length === 0 || meta.isFetched),
  };
}

/**
 * §3b AROUND THE WORLD — the published rank table, ordered by rank.
 *
 * THE SCOPE IS THE LIST, READ FROM THE MEMBERSHIP (useTop100RankIndex). The old
 * implementation looked for a list slug that does not exist (`top-100-worldwide`
 * against a table whose slugs are global / gb-i / usa / europe), so its `world`
 * flag was always false and every tile was then labelled GB&I downstream.
 */
export function useWorldTop100Courses(enabled: boolean) {
  const { index, isFetched: indexFetched } = useTop100RankIndex(enabled);

  const picked = useMemo(() => {
    if (!index) return [] as Array<{ courseId: string; rank: number; scope: RankListSlug }>;
    return Array.from(index.entries())
      .map(([courseId, standing]) => ({ courseId, ...standing }))
      /* The best-ranked courses lead; the scope only ever labels them. */
      .sort((a, b) => a.rank - b.rank || a.courseId.localeCompare(b.courseId))
      .slice(0, 14);
  }, [index]);

  const ids = useMemo(() => picked.map((row) => row.courseId), [picked]);
  const meta = useCourseCardMeta(ids);

  const rows = useMemo<CourseShelfRow[]>(
    () =>
      picked.map((row) => {
        const course = meta.data?.get(row.courseId);
        return {
          courseId: row.courseId,
          name: course?.name ?? null,
          area: course?.region ?? course?.subCountry ?? null,
          imageUrl: course?.imageUrl ?? null,
          rounds: 0,
          rating: null,
          ratingCount: 0,
          rank: row.rank,
          rankScope: row.scope,
        };
      }),
    [picked, meta.data],
  );

  return { rows, isFetched: !enabled ? true : indexFetched && (ids.length === 0 || meta.isFetched) };
}

/**
 * §3c ON YOUR LIST — course_shortlists through useUserWantToPlay.
 *
 * CONTRADICTION, REPORTED: §3c asks the subline to be "the strongest recent
 * event at that course" where one exists. Nothing on this page holds a
 * per-course recent-event index, and inventing one would mean a read per tile.
 * The subline is therefore the AREA in every case — a fact we hold — and the
 * event subline waits for the Phase D ranker, which already computes events.
 */
export function useListCourses(viewerId: string | undefined, enabled: boolean) {
  const { wantToPlay, isLoading } = useUserWantToPlay(enabled ? viewerId : undefined);
  /* THE RANK AND ITS SCOPE COME FROM THE MEMBERSHIP INDEX, not from
     useUserWantToPlay's global_rank / regional_rank — that hook resolves its
     lists by slugs that do not exist in top100_lists (`top-100-worldwide`,
     `top-100-usa`), so both fields are always undefined and this rail has never
     shown a rank at all. Reported; that hook is left as it is. */
  const { index } = useTop100RankIndex(enabled);
  const rows = useMemo<CourseShelfRow[]>(
    () =>
      (wantToPlay ?? []).slice(0, 12).map((row) => {
        const standing = index?.get(row.course_id) ?? null;
        return {
          courseId: row.course_id,
          name: row.course_name,
          area: row.sub_country ?? row.country ?? null,
          imageUrl: row.thumbnail_image,
          rounds: 0,
          rating: null,
          ratingCount: 0,
          rank: standing?.rank ?? null,
          rankScope: standing?.scope ?? null,
        };
      }),
    [wantToPlay, index],
  );
  return { rows, total: wantToPlay?.length ?? 0, isFetched: !enabled || !viewerId ? true : !isLoading };
}
