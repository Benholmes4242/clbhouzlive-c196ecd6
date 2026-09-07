import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  DEFAULT_FILTERS,
  normalizeFilters,
  type BoardFilters,
  type BoardKey,
  type CourseBoardKey,
} from '@/components/explore-tab-new/courseled/boardFilters';
import { useDiscoverEntryBoard } from '@/components/explore-tab-new/courseled/hooks/useDiscoverEntryBoard';
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
 * NOTHING NEW REACHES THE DATABASE. The filter model, the entry ladder and the
 * facet read are the deployed Discover ones, in the RPC's own vocabulary -
 * get_board_page / get_board_facets / get_board_courses are untouched.
 */
/** One read serves the visible cut, the pinned own row and the panel's count. */
const PAGE_FETCH = 200;

export function useAmateurBoardState(userId: string | undefined) {
  const entry = useDiscoverEntryBoard(userId);

  const [pickedFilters, setFilters] = useState<BoardFilters | null>(null);
  const [pickedBoard, setBoard] = useState<BoardKey | null>(null);
  const [courseBoard, setCourseBoard] = useState<CourseBoardKey>('played');
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    if (pickedBoard || !entry.resolved || !entry.board) return;
    setBoard(entry.board);
    setFilters(normalizeFilters({ ...DEFAULT_FILTERS, window: entry.window, scope: entry.scope }));
  }, [pickedBoard, entry.resolved, entry.board, entry.window, entry.scope]);

  /* READS WAIT FOR THE ENTRY PICK. Firing on the fallback first would spend a
     read on a board the member is about to be moved off. */
  const ready = pickedBoard !== null && pickedFilters !== null;
  const board = pickedBoard ?? entry.board ?? 'recent';
  const filters = pickedFilters ?? DEFAULT_FILTERS;

  const facets = useBoardFacets(userId, board, filters, { enabled: ready });
  /* ONE READ, TWO READERS. The leaderboard block renders these rows and the
     filter panel states their count; react-query serves both from the same key,
     so the count in the panel can never disagree with the rows on the page. */
  const page = useBoardPage(userId, board, filters, { limit: PAGE_FETCH, enabled: ready });

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
    setFilters({ ...DEFAULT_FILTERS });
  }, []);

  return useMemo(
    () => ({
      ready,
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
    }),
    [ready, board, filters, courseBoard, facets, page, panelOpen, changeBoard, changeFilters, changeCourseBoard, resetFilters],
  );
}

export type AmateurBoardState = ReturnType<typeof useAmateurBoardState>;
