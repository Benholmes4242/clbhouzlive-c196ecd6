import { useEffect, useState } from 'react';

import type { BoardKey } from '../boardFilters';
import { DEFAULT_FILTERS } from '../boardFilters';
import type { BoardPick } from '../boardRotation';
import {
  localDateKey,
  persistPick,
  readLastSeenDate,
  readSessionPick,
  writeLastSeenDate,
} from '../boardRotation';
import { useBoardRotation } from './useBoardRotation';
import { useHandicapDefaultBoard } from './useHandicapDefaultBoard';

/**
 * WHICH BOARD DISCOVER OPENS ON (BRIEF_DISCOVER_FIRST_VISIT_DEFAULT F1).
 *
 * THE FIRST SESSION OF EACH CALENDAR DAY lands on the member's handicap
 * default, so "am I still fourth?" has an answer. EVERY LATER SESSION that day
 * rotates, because a member coming back is already engaged and is the one who
 * benefits from variety.
 *
 * F1.1 — the three checks, in this order, decided ONCE on mount:
 *   a. a pick already in sessionStorage wins outright and nothing else is read;
 *   b. else a last-seen date that is not today's LOCAL date = the day's first
 *      session -> handicap default;
 *   c. else -> rotated draw.
 *
 * F1.2 — (a) is the WHOLE remount guard: a scorecard sheet, a filter change or
 * a tab switch is not a second visit. Only a new browser session is.
 * F1.5 — storage throwing is treated as the day's first session, because the
 * handicap default is the safe failure.
 */
type EntryMode = 'session' | 'first' | 'rotate';

export function useDiscoverEntryBoard(userId: string | undefined) {
  /* Decided once, synchronously, on mount — never derived during render. */
  const [entry] = useState<{ mode: EntryMode; pick: BoardPick | null }>(() => {
    const sessionPick = readSessionPick();
    if (sessionPick) return { mode: 'session', pick: sessionPick };
    const lastSeen = readLastSeenDate();
    return { mode: lastSeen === localDateKey() ? 'rotate' : 'first', pick: null };
  });

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

  /* F1.1b — the day's first session records the date and persists its pick, so
     the next session today rotates. */
  const isFirstOfDay = entry.mode === 'first' && fallback.resolved;
  useEffect(() => {
    if (!isFirstOfDay) return;
    writeLastSeenDate();
    persistPick(fallbackPick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFirstOfDay, fallbackPick.board, fallbackPick.window]);

  let board: BoardKey | null = null;
  let window: BoardPick['window'] = DEFAULT_FILTERS.window;
  if (entry.mode === 'session' && entry.pick) {
    board = entry.pick.board;
    window = entry.pick.window;
  } else if (entry.mode === 'first') {
    if (fallback.resolved) board = fallback.board;
  } else if (rotation.pick) {
    board = rotation.pick.board;
    window = rotation.pick.window;
  }

  return { board, window, resolved: board !== null };
}
