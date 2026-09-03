import { useEffect, useMemo, useState } from 'react';

import type { BoardKey, ScopeKey } from '../boardFilters';
import { DEFAULT_FILTERS } from '../boardFilters';
import type { BoardPick } from '../boardRotation';
import { bumpDaySessions, persistPick, readSessionPick } from '../boardRotation';
import { useBoardPage } from './useBoardPage';
import { useBoardRotation } from './useBoardRotation';
import { useHandicapDefaultBoard } from './useHandicapDefaultBoard';

/**
 * WHICH BOARD DISCOVER OPENS ON
 * (BRIEF_DISCOVER_RECENT_FIRST_DEFAULT, superseding BRIEF_..._FIRST_VISIT_DEFAULT F1).
 *
 * THE LANDING SEQUENCE IS THREE DEEP, PER CALENDAR DAY:
 *   session 1 of the day  -> MOST RECENT, scope YOUR CIRCLE ("what just happened")
 *   session 2 of the day  -> the member's handicap default board (unchanged)
 *   session 3 and after   -> the rotated draw (unchanged)
 * and the next local calendar day starts again at session 1.
 *
 * S2.2 — the decision, made ONCE synchronously on mount, in this order:
 *   a. a pick already in sessionStorage wins outright and nothing else is read.
 *      THIS IS THE WHOLE REMOUNT GUARD: a scorecard sheet, a filter change or a
 *      tab switch is not a new visit. Only a new browser session is.
 *   b. else bumpDaySessions(): 1 -> recent, 2 -> first, 3+ -> rotate.
 *
 * S2.3 — bumpDaySessions runs inside the SAME useState initialiser that reads the
 * session pick, and only when there is no session pick. React 18 strict mode
 * double-invokes the initialiser, so the FIRST call's result is memoised in a
 * module-level per-session latch (see sessionDecision) and reused: a remount, a
 * double-invoked initialiser or a second mounted copy of Discover cannot burn a
 * session.
 */
type EntryMode = 'session' | 'recent' | 'first' | 'rotate';

interface Entry {
  mode: EntryMode;
  pick: BoardPick | null;
}

/** S2.3 — one decision per browser session (module lifetime), strict-mode safe. */
let sessionDecision: Entry | null = null;

function decideEntry(): Entry {
  if (sessionDecision) return sessionDecision;
  const sessionPick = readSessionPick();
  if (sessionPick) {
    sessionDecision = { mode: 'session', pick: sessionPick };
    return sessionDecision;
  }
  const n = bumpDaySessions();
  const mode: EntryMode = n <= 1 ? 'recent' : n === 2 ? 'first' : 'rotate';
  sessionDecision = { mode, pick: null };
  return sessionDecision;
}

/** S3.3 — three rows is not a leaderboard. FOUR is the benchmark. */
export const CIRCLE_ROW_FLOOR = 4;
/** S3.2 — the probe reads the same board and window the entry would render. */
const RECENT_PROBE_LIMIT = 10;

export function useDiscoverEntryBoard(userId: string | undefined) {
  const [entry] = useState<Entry>(decideEntry);

  /* F3 / F5.1 — the handicap default, off the profile query already in context. */
  const fallback = useHandicapDefaultBoard(userId);
  const fallbackPick: BoardPick = { board: fallback.board, window: DEFAULT_FILTERS.window };

  /* F2.3 — the rotation needs the default board before it can exclude it, so it
     stays parked until the index resolves. */
  const rotation = useBoardRotation(userId, {
    enabled: entry.mode === 'rotate' && fallback.resolved,
    excludeBoard: fallback.resolved ? fallback.board : null,
    fallback: fallbackPick,
  });

  /* S3 — THE THIN-CIRCLE PROBE. The recent entry's own page query, scoped to the
     member's circle: fewer than four ranked rows and the entry resolves to
     everyone instead. S3.4 — it HOLDS behind the skeleton; the circle board is
     never rendered and then swapped. */
  const isRecent = entry.mode === 'recent';
  const circleFilters = useMemo(
    () => ({ ...DEFAULT_FILTERS, scope: 'circle' as ScopeKey, window: DEFAULT_FILTERS.window }),
    [],
  );
  const circleProbe = useBoardPage(userId, 'recent', circleFilters, {
    limit: RECENT_PROBE_LIMIT,
    enabled: isRecent,
  });
  const probeSettled = circleProbe.isSuccess || circleProbe.isError;
  /* A failed probe is a silent fallback to everyone, never an error state. */
  const recentScope: ScopeKey | null = !isRecent
    ? null
    : !probeSettled
      ? null
      : circleProbe.isSuccess && (circleProbe.data?.total ?? 0) >= CIRCLE_ROW_FLOOR
        ? 'circle'
        : 'everyone';

  let board: BoardKey | null = null;
  let window: BoardPick['window'] = DEFAULT_FILTERS.window;
  let scope: ScopeKey = DEFAULT_FILTERS.scope;

  if (entry.mode === 'session' && entry.pick) {
    board = entry.pick.board;
    window = entry.pick.window;
    /* S3.6 — the scope the session actually used, not a re-evaluation. */
    scope = entry.pick.scope ?? DEFAULT_FILTERS.scope;
  } else if (isRecent) {
    if (recentScope) {
      board = 'recent';
      window = DEFAULT_FILTERS.window;
      scope = recentScope;
    }
  } else if (entry.mode === 'first') {
    if (fallback.resolved) board = fallback.board;
  } else if (rotation.pick) {
    board = rotation.pick.board;
    window = rotation.pick.window;
  }

  /* S2.5 / F1.1b — every mode that makes its own pick persists it, so a
     scorecard round trip returns the member to the same board AND scope. The
     rotated draw persists inside its own query function. */
  const persistKey = board && entry.mode !== 'session' && entry.mode !== 'rotate'
    ? `${board}:${window}:${scope}`
    : null;
  useEffect(() => {
    if (!persistKey) return;
    const [b, w, s] = persistKey.split(':');
    persistPick({ board: b as BoardKey, window: w as BoardPick['window'], scope: s as ScopeKey });
  }, [persistKey]);

  return { board, window, scope, resolved: board !== null };
}
