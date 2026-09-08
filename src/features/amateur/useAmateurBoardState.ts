import { useCallback, useMemo, useState } from 'react';

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

/**
 * THE AMATEUR PAGE'S ONE FILTER (BRIEF_AMATEUR_PAGE).
 *
 * ONE QUESTION GOVERNS TWO BLOCKS. The leaderboard and the courses block read
 * the SAME BoardFilters object; each keeps its own board axis. State lives at
 * the page so neither block can hold a filter the other does not, and so the
 * rail has one owner.
 *
 * THE ENTRY STATE IS FIXED (BRIEF_EXPLORE_FIXED_ENTRY_STATE §1). Every entry
 * opens on MOST RECENT / YOUR CIRCLE / 14 DAYS / ALL COURSES. No rotation, no
 * handicap default, no remembered selection, and NO STEP-DOWN when the result is
 * thin: the page never widens the filter on the member's behalf. A thin result
 * stays thin and the leaderboard block says so. The member changes board and
 * filter freely; leaving and returning resets to the entry state, because this
 * state is page-local and the page unmounts on leaving.
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

  const facets = useBoardFacets(userId, board, filters, { enabled: true });
  /* ONE READ, TWO READERS. The leaderboard block renders these rows and the
     filter panel states their count; react-query serves both from the same key,
     so the count in the panel can never disagree with the rows on the page. */
  const page = useBoardPage(userId, board, filters, { limit: PAGE_FETCH, enabled: true });

  const changeFilters = useCallback((next: BoardFilters) => {
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
    analyticsEvents.track('amateur_filter_reset', {});
    setFilters({ ...ENTRY_FILTERS });
  }, []);

  /* §2 — THE MEMBER WIDENS THE POOL, NEVER THE PAGE. This is the one path from
     a thin or empty circle to Everyone, and because it writes the same filter
     object the rail reads, the chips move with it. */
  const seeEveryone = useCallback(() => {
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
    [board, filters, courseBoard, facets, page, panelOpen, changeBoard, changeFilters, changeCourseBoard, resetFilters, seeEveryone],
  );
}

export type AmateurBoardState = ReturnType<typeof useAmateurBoardState>;
