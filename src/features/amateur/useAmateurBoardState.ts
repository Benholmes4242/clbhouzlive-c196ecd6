import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  DEFAULT_FILTERS,
  normalizeFilters,
  type BoardFilters,
  type BoardKey,
  type CourseBoardKey,
} from '@/components/explore-tab-new/courseled/boardFilters';
import { useBoardFacets } from '@/components/explore-tab-new/courseled/hooks/useBoardFacets';
import { useBoardPage } from '@/components/explore-tab-new/courseled/hooks/useBoardPage';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { useCircleSize } from './useCircleSize';

/**
 * THE EXPLORE LEADERBOARD'S STATE (BRIEF_EXPLORE_LEADERBOARD_STATES).
 *
 * §1 THE ENTRY STATE IS FIXED: MOST RECENT / YOUR CIRCLE / 14 DAYS / ALL
 * COURSES, every entry. No rotation, no handicap default, no remembered
 * selection. This state is page-local, so leaving and returning resets it.
 *
 * §2 THERE IS ALWAYS A LIST OF SCORES, and any pool wider than the member's
 * circle is DECLARED — the chips, the count line and a stated sentence all move
 * together. That is the whole difference from the step-down ladder this
 * replaces: the widening is announced, never silent, and the two pools are
 * never mixed in one ranked list.
 *
 * TWO WIDENINGS, BOTH DECLARED:
 *   D  the member follows NOBODY   -> the entry filter IS Everyone. Nothing was
 *      widened, because there was never a circle, so no sentence is owed.
 *   C  the member HAS a circle but it is silent for the window -> the list
 *      becomes Everyone and the block says why (`widened`).
 *
 * NOTHING NEW REACHES THE DATABASE — get_board_page / get_board_facets /
 * get_board_courses are untouched.
 */
/** One read serves the visible cut, the pinned own row and the panel's count. */
const PAGE_FETCH = 200;

/** §1 — the one entry state, always. */
export const ENTRY_BOARD: BoardKey = 'recent';
export const ENTRY_FILTERS: BoardFilters = normalizeFilters({
  ...DEFAULT_FILTERS,
  scope: 'circle',
  window: '14',
  courses: 'any',
});

export function useAmateurBoardState(userId: string | undefined) {
  const [filters, setFilters] = useState<BoardFilters>(ENTRY_FILTERS);
  const [board, setBoard] = useState<BoardKey>(ENTRY_BOARD);
  const [courseBoard, setCourseBoard] = useState<CourseBoardKey>('played');
  const [panelOpen, setPanelOpen] = useState(false);
  /* Set only when THIS hook widened the pool for the member (state C), so the
     block knows it owes a sentence. Any hand on the filter clears it. */
  const [widened, setWidened] = useState(false);
  const touched = useRef(false);

  /* HAS THIS MEMBER A CIRCLE AT ALL? The answer separates state D from state C
     and it decides the entry filter, so it is asked for on mount, not on
     failure. `null` while unknown: we never guess. */
  const circle = useCircleSize(userId, !!userId);
  const hasCircle = circle.data == null ? null : circle.data > 0;

  const facets = useBoardFacets(userId, board, filters, { enabled: true });
  /* ONE READ, TWO READERS. The leaderboard block renders these rows and the
     filter panel states their count; react-query serves both from the same key,
     so the count in the panel can never disagree with the rows on the page. */
  const page = useBoardPage(userId, board, filters, { limit: PAGE_FETCH, enabled: true });

  /* D — NO CIRCLE, NO CIRCLE FILTER. The entry state resolves to Everyone
     before any board read lands on an empty circle, so a member who follows
     nobody never sees a board flicker through empty. */
  useEffect(() => {
    if (touched.current || hasCircle !== false) return;
    setFilters((prev) => (prev.scope === 'everyone' ? prev : normalizeFilters({ ...prev, scope: 'everyone' })));
  }, [hasCircle]);

  /* C — A CIRCLE THAT SAID NOTHING THIS FORTNIGHT. The list becomes Everyone
     and `widened` makes the page say so. Once, and only while the member has
     not touched the filter themselves. */
  useEffect(() => {
    if (touched.current || hasCircle !== true) return;
    if (filters.scope !== 'circle' || !page.isSuccess) return;
    if ((page.data?.total ?? 0) > 0) return;
    analyticsEvents.track('amateur_board_widened_to_everyone', { board });
    setWidened(true);
    setFilters((prev) => normalizeFilters({ ...prev, scope: 'everyone' }));
  }, [hasCircle, filters.scope, page.isSuccess, page.data?.total, board]);

  const changeFilters = useCallback((next: BoardFilters) => {
    touched.current = true;
    setWidened(false);
    analyticsEvents.track('amateur_filter_changed', {
      scope: next.scope,
      window: next.window,
      courses: next.courses,
      band: next.band,
      competition: next.competition,
      region: next.regionKind ?? 'all',
    });
    setFilters(normalizeFilters(next));
  }, []);

  const changeBoard = useCallback((next: BoardKey) => {
    analyticsEvents.track('amateur_board_changed', { board: next });
    setBoard(next);
  }, []);

  const changeCourseBoard = useCallback((next: CourseBoardKey) => {
    analyticsEvents.track('amateur_course_board_changed', { board: next });
    setCourseBoard(next);
  }, []);

  const resetFilters = useCallback(() => {
    touched.current = true;
    setWidened(false);
    analyticsEvents.track('amateur_filter_reset', {});
    setFilters({ ...ENTRY_FILTERS });
  }, []);

  /* §3 B — THE MEMBER WIDENS A THIN CIRCLE THEMSELVES. It writes the same
     filter object the rail reads, so the chips and the count move with it. */
  const seeEveryone = useCallback(() => {
    touched.current = true;
    setWidened(false);
    analyticsEvents.track('amateur_see_everyone_tapped', {});
    setFilters((prev) => normalizeFilters({ ...prev, scope: 'everyone' }));
  }, []);

  return useMemo(
    () => ({
      ready: true,
      board,
      filters,
      courseBoard,
      facets,
      page,
      total: page.data?.total ?? 0,
      /** null while the head-count is in flight; the block waits rather than guess. */
      hasCircle,
      /** True only for state C: the page widened the pool and owes a sentence. */
      widened,
      panelOpen,
      openPanel: () => {
        analyticsEvents.track('amateur_filter_opened', { board });
        setPanelOpen(true);
      },
      closePanel: () => setPanelOpen(false),
      changeBoard,
      changeFilters,
      changeCourseBoard,
      resetFilters,
      seeEveryone,
    }),
    [board, filters, courseBoard, facets, page, hasCircle, widened, panelOpen, changeBoard, changeFilters, changeCourseBoard, resetFilters, seeEveryone],
  );
}

export type AmateurBoardState = ReturnType<typeof useAmateurBoardState>;
