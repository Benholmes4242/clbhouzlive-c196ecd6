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
import { useProfileData } from '@/hooks/useProfileData';
import { useWhsConnection } from '@/lib/whs/hooks';
import { resolveDisplayHandicap } from '@/lib/handicap/resolveHandicap';

import { useViewerHomeClubId } from '@/components/explore-tab-new/courseled/hooks/useGolfThisWeek';
import { CIRCLE_ROW_FLOOR } from '@/components/explore-tab-new/courseled/hooks/useDiscoverEntryBoard';
import type { ScopeKey } from '@/components/explore-tab-new/courseled/boardFilters';

import { useCircleSize } from './useCircleSize';

/**
 * THE EXPLORE LEADERBOARD'S STATE (BRIEF_EXPLORE_LEADERBOARD_STATES).
 *
 * §1 THE ENTRY STATE IS RESOLVED, NOT FIXED. Board: entryBoardFor (the
 * viewer's handicap — 5.0 or below opens on gross, everyone else on net).
 * Scope: the LANDING_SCOPES ladder (circle, then club, then everyone).
 * Window and courses: ENTRY_FILTERS (14 days, all courses). No rotation and no
 * remembered selection; this state is page-local, so leaving and returning
 * resets it — and the resolved default therefore RE-APPLIES on the next visit.
 * That is intended: do not "fix" it by persisting the member's last board.
 *
 * TWO INVARIANTS ON HOW IT RESOLVES:
 *   (a) THE LADDER PROBES ON THE MEMBER'S OWN ENTRY BOARD. rungA and rungB read
 *       entryBoard, never a fixed board, so the scope is chosen for the board
 *       the member will actually see. Do not simplify the probes to a constant.
 *   (b) NOTHING RENDERS BEFORE IT HAS RESOLVED. The board reads stay off until
 *       the handicap AND the ladder have both settled (ladderOn depends on
 *       handicapResolved for this reason). Nothing is ever shown on one board
 *       or one scope and then swapped.
 *
 * §2 THERE IS ALWAYS A LIST OF SCORES, and any pool wider than the member's
 * circle is DECLARED — the chips, the count line and a stated sentence all move
 * together. That is the whole difference from the step-down ladder this
 * replaces: the widening is announced, never silent, and the two pools are
 * never mixed in one ranked list.
 *
 * TWO WIDENINGS, BOTH DECLARED:
 *   D  the member follows NOBODY   -> they fail the circle rung and the ladder
 *      resolves their scope: club if their club has rows, otherwise everyone.
 *      Nothing was widened, because there was never a circle, so no sentence
 *      is owed.
 *   C  the member HAS a circle but it is silent for the window -> the list
 *      becomes Everyone and the block says why (`widened`).
 *
 * NOTHING NEW REACHES THE DATABASE — get_board_page / get_board_facets /
 * get_board_courses are untouched.
 *
 * PHASE B (BRIEF_EXPLORE_MAGAZINE P1, Sep 2026) — LIVE AGAIN. ExploreMagazine's
 * Standings view consumes this hook. Standings always opens on a resolved
 * board; the ranked stream below it is kept as a rollback, not a state a member
 * can reach. `active` gates BOTH board reads, so the All and Watch views issue
 * nothing.
 */
/** One read serves the visible cut, the pinned own row and the panel's count. */
const PAGE_FETCH = 200;

/** THE ENTRY BOARD FOLLOWS THE VIEWER'S HANDICAP: entryBoardFor opens a member
 *  at 5.0 or below on gross and everyone else — including a member with no
 *  handicap yet — on net. The unknown case is a DECISION, not a fallback.
 *  'topar' is the live key that labels "Lowest gross"; 'gross' is retired. */
export const GROSS_BAND_MAX = 5.0;
export function entryBoardFor(handicapIndex: number | null | undefined): BoardKey {
  return handicapIndex != null && handicapIndex <= GROSS_BAND_MAX ? 'topar' : 'net';
}

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
  /* THE ENTRY BOARD FOLLOWS THE VIEWER'S HANDICAP, via the display authority
     (never eg_handicap_index directly). Like the scope ladder, nothing reads a
     board until it has resolved — never render on one board and swap. */
  const { profile, loading: profileLoading } = useProfileData();
  const whs = useWhsConnection(userId);
  const handicapResolved = !userId || (!profileLoading && !whs.isLoading);
  const handicap = resolveDisplayHandicap({
    egHandicapIndex: profile?.eg_handicap_index ?? null,
    manualHandicapIndex: profile?.manual_handicap_index ?? null,
    hasWhsConnection: !!whs.data,
  }).value;
  const entryBoard = entryBoardFor(handicap);
  /* null = untouched: the member is on their resolved entry board. Once they
     pick, nothing re-applies the default for the rest of the visit. */
  const [boardPicked, setBoard] = useState<BoardKey | null>(null);
  const board: BoardKey = boardPicked ?? entryBoard;
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
     Club with no primary_club_id is the common case. */
  const rungApplies = (k: ScopeKey) => (k === 'club' ? !!homeClub.clubId : true);
  const ladderOn = !!userId && active && entry === null && homeClub.ready && handicapResolved;

  const rungA = useBoardPage(userId, entryBoard, rungAFilters, {
    limit: PAGE_FETCH,
    enabled: ladderOn && rungApplies(probeScopes[0]),
  });
  const rungASkipped = homeClub.ready && !rungApplies(probeScopes[0]);
  const rungASettled = rungASkipped || rungA.isSuccess || rungA.isError;
  const rungAOk = !rungASkipped && rungA.isSuccess && (rungA.data?.rows.length ?? 0) >= CIRCLE_ROW_FLOOR;

  const rungB = useBoardPage(userId, entryBoard, rungBFilters, {
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

  const resolved = entry !== null && handicapResolved;

  /* Once per Standings entry, after the board resolves. Never the value. */
  const defaultLogged = useRef(false);
  useEffect(() => {
    if (!resolved || !active || defaultLogged.current) return;
    defaultLogged.current = true;
    const band = handicap == null ? 'unknown' : handicap <= GROSS_BAND_MAX ? 'low' : 'high';
    analyticsEvents.track('amateur_board_default', { board: entryBoard, band });
  }, [resolved, active, entryBoard, handicap]);
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

  /* ONE RESET. Board and filters together, one event. Reset clears the
     member's pick so the board returns to their resolved entry board. It must
     not call changeBoard, which would report a board change the member did
     not make. */
  const resetAll = useCallback(() => {
    touched.current = true;
    setWidened(false);
    analyticsEvents.track('amateur_filter_reset', {});
    setFilters({ ...entryFilters });
    setBoard(null);
  }, [entryFilters]);

  /* ONE DEFAULT OBJECT for the Reset button and the Filters badge. */
  const canReset = !sameFilters(filters, entryFilters) || board !== entryBoard;
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
      /** The member's resolved entry board — reset and 'changed' compare against this. */
      entryBoard,
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
    [resolved, clubApplies, sheetFilterCount, changeScope, board, entryBoard, filters, courseBoard, facets, page, hasCircle, widened, panelOpen, changeBoard, changeFilters, changeCourseBoard, resetFilters, resetAll, canReset, seeEveryone],
  );
}

export type AmateurBoardState = ReturnType<typeof useAmateurBoardState>;
