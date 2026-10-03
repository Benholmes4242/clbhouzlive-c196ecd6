import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  DEFAULT_FILTERS,
  normalizeFilters,
  type BoardFilters,
  type BoardKey,
  type CourseBoardKey,
  sameFilters,
} from '@/components/explore-tab-new/courseled/boardFilters';
import { useBoardFacets } from '@/components/explore-tab-new/courseled/hooks/useBoardFacets';
import { useBoardPage } from '@/components/explore-tab-new/courseled/hooks/useBoardPage';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { useViewerHomeClubId } from '@/components/explore-tab-new/courseled/hooks/useGolfThisWeek';
import { CIRCLE_ROW_FLOOR } from '@/components/explore-tab-new/courseled/hooks/useDiscoverEntryBoard';
import type { ScopeKey } from '@/components/explore-tab-new/courseled/boardFilters';

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
 *
 * PHASE B (BRIEF_EXPLORE_MAGAZINE P1, Sep 2026) — LIVE AGAIN. ExploreMagazine's
 * Scores view consumes this hook: the ranked stream is the default and a board
 * renders only once the member picks one. `active` gates BOTH board reads, so
 * All, Courses, Watch and an untouched Scores view issue nothing.
 */
/** One read serves the visible cut, the pinned own row and the panel's count. */
const PAGE_FETCH = 200;

/** §1 — the one entry board, always. */
export const ENTRY_BOARD: BoardKey = 'recent';

/** SCORES LANDING SCOPE (amendment to §3). Tried in order; the first rung whose
 *  board returns at least CIRCLE_ROW_FLOOR rows wins. Everyone is terminal and
 *  never tested. Reorder here, nowhere else. */
export const LANDING_SCOPES: ScopeKey[] = ['circle', 'club', 'everyone'];

/** Everything EXCEPT scope. Scope arrives from the LANDING_SCOPES ladder. */
export const ENTRY_FILTERS: Omit<BoardFilters, 'scope'> = (() => {
  const { scope: _scope, ...rest } = normalizeFilters({ ...DEFAULT_FILTERS, window: '14', courses: 'any' });
  return rest;
})();

export function entryFiltersFor(scope: ScopeKey): BoardFilters {
  return normalizeFilters({ ...ENTRY_FILTERS, scope });
}

/** Pre-resolution placeholder only; never rendered (the block holds until the ladder settles). */
const UNRESOLVED_FILTERS: BoardFilters = entryFiltersFor('everyone');

/** §6 — SHEET-ONLY AXES that differ from the default. Scope and board are
 *  stated on the page and are deliberately NOT counted. Max 5. */
export function sheetOnlyDiffCount(f: BoardFilters, d: BoardFilters): number {
  let n = 0;
  if (f.window !== d.window) n += 1;
  if (f.regionKind !== d.regionKind || f.regionValue !== d.regionValue) n += 1;
  if (f.courses !== d.courses || f.courseId !== d.courseId) n += 1;
  if (f.band !== d.band) n += 1;
  if (f.competition !== d.competition) n += 1;
  return n;
}

export function useAmateurBoardState(userId: string | undefined, active = true) {
  const [filters, setFilters] = useState<BoardFilters>(UNRESOLVED_FILTERS);
  /* The resolved default. null until the ladder has resolved, and the board
     reads stay off until then — never render on one scope and swap. */
  const [entry, setEntry] = useState<BoardFilters | null>(null);
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
  /* LANDING LADDER — the useDiscoverEntryBoard rung pattern. Each rung reads the
     board it would actually render (same board, filters and limit as `page`, so
     the winner's read IS the page's cache entry). Rungs below a winner are never
     enabled. Silent: nothing on screen names a skipped rung. */
  const homeClub = useViewerHomeClubId(userId);
  const [probeScopes] = useState(() => LANDING_SCOPES.filter((k) => k !== 'everyone'));
  const rungAFilters = useMemo(() => entryFiltersFor(probeScopes[0]), [probeScopes]);
  const rungBFilters = useMemo(() => entryFiltersFor(probeScopes[1]), [probeScopes]);
  /* A rung whose scope cannot return rows is skipped outright — no query.
     Club with no primary_club_id is the common case (66 of 107). */
  const rungApplies = (k: ScopeKey) => (k === 'club' ? !!homeClub.clubId : true);
  const ladderOn = !!userId && active && entry === null && homeClub.ready;

  const rungA = useBoardPage(userId, ENTRY_BOARD, rungAFilters, {
    limit: PAGE_FETCH,
    enabled: ladderOn && rungApplies(probeScopes[0]),
  });
  const rungASkipped = homeClub.ready && !rungApplies(probeScopes[0]);
  const rungASettled = rungASkipped || rungA.isSuccess || rungA.isError;
  const rungAOk = !rungASkipped && rungA.isSuccess && (rungA.data?.rows.length ?? 0) >= CIRCLE_ROW_FLOOR;

  const rungB = useBoardPage(userId, ENTRY_BOARD, rungBFilters, {
    limit: PAGE_FETCH,
    enabled: ladderOn && rungASettled && !rungAOk && rungApplies(probeScopes[1]),
  });
  const rungBSkipped = homeClub.ready && !rungApplies(probeScopes[1]);
  const rungBSettled = rungBSkipped || rungB.isSuccess || rungB.isError;
  const rungBOk = !rungBSkipped && rungB.isSuccess && (rungB.data?.rows.length ?? 0) >= CIRCLE_ROW_FLOOR;

  let landing: ScopeKey | null = null;
  if (homeClub.ready && rungASettled) {
    if (rungAOk) landing = probeScopes[0];
    else if (rungBSettled) landing = rungBOk ? probeScopes[1] : 'everyone';
  }

  /* RESOLVES ONCE. Until then the board reads stay off and the block holds. */
  useEffect(() => {
    if (entry !== null || landing === null) return;
    const next = entryFiltersFor(landing);
    setEntry(next);
    if (!touched.current) setFilters(next);
  }, [entry, landing]);

  /* Kept for the head: whether Your club is a real choice for this member. */
  const clubApplies = !!homeClub.clubId;

  const resolved = entry !== null;
  const entryFilters = entry ?? UNRESOLVED_FILTERS;

  const facets = useBoardFacets(userId, board, filters, { enabled: active && resolved });
  /* ONE READ, TWO READERS. The leaderboard block renders these rows and the
     filter panel states their count; react-query serves both from the same key,
     so the count in the panel can never disagree with the rows on the page. */
  const page = useBoardPage(userId, board, filters, { limit: PAGE_FETCH, enabled: active && resolved });

  /* D — a member whose circle is empty simply fails the circle rung's floor. */

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
    setFilters({ ...entryFilters });
  }, [entryFilters]);

  /* §3 B — THE MEMBER WIDENS A THIN CIRCLE THEMSELVES. It writes the same
     filter object the rail reads, so the chips and the count move with it. */
  const seeEveryone = useCallback(() => {
    touched.current = true;
    setWidened(false);
    analyticsEvents.track('amateur_see_everyone_tapped', {});
    setFilters((prev) => normalizeFilters({ ...prev, scope: 'everyone' }));
  }, []);

  /* ONE RESET. Board and filters together, one event. Calling changeBoard
     from a reset reported amateur_board_changed as though the member had
     picked Most recent. */
  const resetAll = useCallback(() => {
    touched.current = true;
    setWidened(false);
    analyticsEvents.track('amateur_filter_reset', {});
    setFilters({ ...entryFilters });
    setBoard(ENTRY_BOARD);
  }, [entryFilters]);

  /* ONE DEFAULT OBJECT for the Reset button and the Filters badge. */
  const canReset = !sameFilters(filters, entryFilters) || board !== ENTRY_BOARD;
  const sheetFilterCount = sheetOnlyDiffCount(filters, entryFilters);

  /* §7 — the page's segmented control writes scope through here. */
  /* The event fires OUTSIDE the updater: StrictMode double-invokes updaters,
     and amateur_scope_changed must stay continuous across the rail retirement. */
  const changeScope = useCallback((next: ScopeKey) => {
    touched.current = true;
    setWidened(false);
    if (filters.scope !== next) {
      analyticsEvents.track('amateur_scope_changed', { view: 'scores', from: filters.scope, to: next });
    }
    setFilters((prev) => normalizeFilters({ ...prev, scope: next }));
  }, [filters.scope]);

  return useMemo(
    () => ({
      ready: resolved,
      clubApplies,
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
      resetAll,
      canReset,
      sheetFilterCount,
      changeScope,
      seeEveryone,
    }),
    [resolved, clubApplies, sheetFilterCount, changeScope, board, filters, courseBoard, facets, page, hasCircle, widened, panelOpen, changeBoard, changeFilters, changeCourseBoard, resetFilters, resetAll, canReset, seeEveryone],
  );
}

export type AmateurBoardState = ReturnType<typeof useAmateurBoardState>;
