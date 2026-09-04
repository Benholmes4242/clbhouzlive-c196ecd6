import { useEffect, useMemo, useState } from 'react';

import type { BoardKey, ScopeKey, WindowKey } from '../boardFilters';
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

/** S3.4 — three rows is not a leaderboard. FOUR RANKED ROWS is the benchmark. */
export const CIRCLE_ROW_FLOOR = 4;
/** S3.2 — each rung reads the same board the entry would render. */
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

  /* S3 — THE FALLBACK LADDER. Three rungs, tried in order; the first that returns
     four or more RANKED ROWS wins and the rungs below it are never evaluated.
       rung 1  Most recent / Your circle / 14 days
       rung 2  Most recent / Everyone    / 14 days
       rung 3  Most recent / Everyone    / 90 days   TERMINAL, never tested (S3.3)
     Rung 3 needs no query of its own: whatever it returns is what renders, so
     there is nothing to threshold. S3.7 — the ladder HOLDS behind the skeleton;
     no rung is ever rendered and then swapped. S3.8 — it is silent.
     S3.9 — it runs ONLY for the session-1 recent entry. */
  const isRecent = entry.mode === 'recent';

  const rung1Filters = useMemo(
    () => ({ ...DEFAULT_FILTERS, scope: 'circle' as ScopeKey, window: '14' as WindowKey }),
    [],
  );
  const rung2Filters = useMemo(
    () => ({ ...DEFAULT_FILTERS, scope: 'everyone' as ScopeKey, window: '14' as WindowKey }),
    [],
  );

  const rung1 = useBoardPage(userId, 'recent', rung1Filters, {
    limit: RECENT_PROBE_LIMIT,
    enabled: isRecent,
  });
  const rung1Settled = rung1.isSuccess || rung1.isError;
  /* S3.4 — the rows the board would render. A failed rung is a silent step down,
     never an error state. */
  const rung1Ok = rung1.isSuccess && (rung1.data?.rows.length ?? 0) >= CIRCLE_ROW_FLOOR;

  const rung2 = useBoardPage(userId, 'recent', rung2Filters, {
    limit: RECENT_PROBE_LIMIT,
    enabled: isRecent && rung1Settled && !rung1Ok,
  });
  const rung2Settled = rung2.isSuccess || rung2.isError;
  const rung2Ok = rung2.isSuccess && (rung2.data?.rows.length ?? 0) >= CIRCLE_ROW_FLOOR;

  /* The resolved recent pick, or null while the ladder is still climbing. */
  let recentPick: { scope: ScopeKey; window: WindowKey } | null = null;
  if (isRecent) {
    if (!rung1Settled) recentPick = null;
    else if (rung1Ok) recentPick = { scope: 'circle', window: '14' };
    else if (!rung2Settled) recentPick = null;
    else if (rung2Ok) recentPick = { scope: 'everyone', window: '14' };
    /* S3.3 / S3.6 — rung 3 is terminal: 90 days, not all time. */
    else recentPick = { scope: 'everyone', window: '90' };
  }

  let board: BoardKey | null = null;
  let window: BoardPick['window'] = DEFAULT_FILTERS.window;
  let scope: ScopeKey = DEFAULT_FILTERS.scope;

  if (entry.mode === 'session' && entry.pick) {
    board = entry.pick.board;
    window = entry.pick.window;
    /* S3.6 — the scope the session actually used, not a re-evaluation. */
    scope = entry.pick.scope ?? DEFAULT_FILTERS.scope;
  } else if (isRecent) {
    if (recentPick) {
      board = 'recent';
      window = recentPick.window;
      scope = recentPick.scope;
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
