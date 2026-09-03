/**
 * THE LANDING COMBINATION ROTATES (BRIEF_DISCOVER_BOARD_ROTATION).
 *
 * Discover used to open on gross / 14 days for everyone, every time. It now
 * opens on a combination drawn from public.get_board_rotation, which returns
 * one row per (board, window) that holds at least p_min_rows, with the viewer's
 * own position on it.
 *
 * THE PICK IS A SESSION-LEVEL FACT, NOT A RENDER-LEVEL ONE (R1). It is stored
 * in sessionStorage and read back on entry, because refetchOnMount is on
 * app-wide: a member who taps a row into the scorecard sheet and comes back
 * must be handed the board they were reading, not a fresh draw.
 *
 * THE PICK IS A DEFAULT, NOT A LOCK (R1.5). The first thing a member changes in
 * the drawer wins for the rest of the session.
 */

import type { BoardKey, ScopeKey, WindowKey } from './boardFilters';
import { BOARD_KEYS, DEFAULT_FILTERS } from './boardFilters';

/** One row of public.get_board_rotation. */
export interface RotationRow {
  board: string;
  win: string;
  n: number;
  /** NULL when the member does not appear on that combination at all. */
  viewer_pos: number | null;
}

export interface BoardPick {
  board: BoardKey;
  window: WindowKey;
  /**
   * BRIEF_DISCOVER_RECENT_FIRST_DEFAULT S3.6 — the scope the session ACTUALLY
   * landed on, recorded so a remount never re-evaluates the thin-circle
   * fallback. Absent on the rotated/handicap picks, which always carry
   * DEFAULT_FILTERS.scope.
   */
  scope?: ScopeKey;
}


/** R3.1 — the silent fallback. No error state, no empty board, no retry. */
export const FALLBACK_PICK: BoardPick = {
  board: 'gross',
  window: DEFAULT_FILTERS.window,
};

/** R1.3 — ONE key, this session's chosen combination. */
export const ROTATION_SESSION_KEY = 'clbhouz.discover.rotation.pick.v1';
/** R2.4 / F2.6 — outlives the session, so the next one can exclude it. */
export const ROTATION_LAST_KEY = 'clbhouz.discover.rotation.last.v1';
/**
 * F1.4 — the last calendar day Discover was entered, as a LOCAL YYYY-MM-DD
 * string.
 *
 * DEPRECATED (BRIEF_DISCOVER_RECENT_FIRST_DEFAULT S1.1). The landing sequence is
 * three deep per calendar day, so a yes/no "was this the first session today" is
 * no longer enough; DAY_SESSIONS_KEY answers "which session today is this".
 * Exported unused for one release so nothing else breaks.
 */
export const LAST_SEEN_DATE_KEY = 'clbhouz.discover.lastSeenDate.v1';

/**
 * S1.1 — THE DAY'S SESSION COUNTER, in localStorage as
 * { date: 'YYYY-MM-DD', n: 2 }. The date is the member's OWN local calendar
 * date (S1.4), so the daily reset cannot drift.
 */
export const DAY_SESSIONS_KEY = 'clbhouz.discover.daySessions.v1';


/** F1.3 — the member's OWN local calendar date. Never UTC, never rolling. */
export function localDateKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, '0');
  const d = `${now.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Windows shortest-first: R2.1 keeps the shortest of a tied group. */
const WINDOW_ORDER: WindowKey[] = ['14', '30', '90', 'year', 'all'];

const isBoardKey = (v: string): v is BoardKey => (BOARD_KEYS as string[]).includes(v);
const isWindowKey = (v: string): v is WindowKey => (WINDOW_ORDER as string[]).includes(v);

const comboId = (p: BoardPick) => `${p.board}:${p.window}`;

function parsePick(raw: string | null): BoardPick | null {
  if (!raw) return null;
  const [board, window] = raw.split(':');
  if (!board || !window || !isBoardKey(board) || !isWindowKey(window)) return null;
  return { board, window };
}

/* Storage is wrapped because private-mode Safari throws on access. A member
   whose storage is unavailable simply re-picks; nothing else breaks. */
function safeGet(store: 'session' | 'local', key: string): string | null {
  try {
    return (store === 'session' ? sessionStorage : localStorage).getItem(key);
  } catch {
    return null;
  }
}

function safeSet(store: 'session' | 'local', key: string, value: string) {
  try {
    (store === 'session' ? sessionStorage : localStorage).setItem(key, value);
  } catch {
    /* no-op */
  }
}

/** R1.3 — read on entry; a present pick is used and never re-picked. */
export const readSessionPick = (): BoardPick | null =>
  parsePick(safeGet('session', ROTATION_SESSION_KEY));

export const readLastPick = (): BoardPick | null =>
  parsePick(safeGet('local', ROTATION_LAST_KEY));

/** F1.1b — null (or a throwing store, F1.5) reads as "the day's first session". */
export const readLastSeenDate = (): string | null => safeGet('local', LAST_SEEN_DATE_KEY);

export const writeLastSeenDate = (date: string = localDateKey()) =>
  safeSet('local', LAST_SEEN_DATE_KEY, date);

/** R1.3 / R2.4 — written ONCE, at the moment a pick is made. */
export function persistPick(pick: BoardPick) {
  safeSet('session', ROTATION_SESSION_KEY, comboId(pick));
  safeSet('local', ROTATION_LAST_KEY, comboId(pick));
}

/**
 * R2 — THE PICK.
 *
 * R2.1 collapse duplicate windows within a board (same n means the window
 * stopped biting, and an unchanged board reads as a broken rotation).
 * R2.2 pick the BOARD uniformly, THEN the window uniformly within it, so
 * Most recent's 3,412 rows do not drown twenty-one-row rankings.
 * R2.3 a board the member renders on (viewer_pos 1..10) gets DOUBLE weight at
 * the board step. Two visits in three, not a mirror.
 * R2.4 never the immediately previous session's combination.
 *
 * F2.3 the member's HANDICAP DEFAULT BOARD is excluded outright — rotating onto
 * the board they would have landed on anyway is not a rotation. The BOARD is
 * excluded, not the combination: net at 90 days is still net.
 * F2.7 anything left empty falls back SILENTLY to `opts.fallback` (the handicap
 * default) rather than to an empty board or an error.
 */
export function pickRotation(
  rows: RotationRow[] | null | undefined,
  opts?: {
    last?: BoardPick | null;
    random?: () => number;
    excludeBoard?: BoardKey | null;
    fallback?: BoardPick;
  },
): BoardPick {
  const random = opts?.random ?? Math.random;
  const last = opts?.last ?? null;
  const lastId = last ? comboId(last) : null;
  const excludeBoard = opts?.excludeBoard ?? null;
  const fallbackPick = opts?.fallback ?? FALLBACK_PICK;

  /* Only combinations this client can actually express are candidates. */
  const clean = (rows ?? []).filter(
    (r) =>
      isBoardKey(r.board) &&
      isWindowKey(r.win) &&
      Number(r.n) > 0 &&
      r.board !== excludeBoard,
  );
  if (clean.length === 0) return fallbackPick;

  const byBoard = new Map<BoardKey, RotationRow[]>();
  for (const row of clean) {
    const board = row.board as BoardKey;
    const list = byBoard.get(board);
    if (list) list.push(row);
    else byBoard.set(board, [row]);
  }

  interface Candidate {
    board: BoardKey;
    windows: WindowKey[];
    /** R2.3 — does any surviving window put the member in the visible ten. */
    visible: boolean;
  }

  const buildCandidates = (excludeId: string | null): Candidate[] => {
    const out: Candidate[] = [];
    for (const [board, list] of byBoard) {
      /* R2.1 — one survivor per distinct n, the shortest window of the group. */
      const shortestByCount = new Map<number, RotationRow>();
      for (const row of list) {
        const held = shortestByCount.get(row.n);
        const rank = WINDOW_ORDER.indexOf(row.win as WindowKey);
        if (!held || rank < WINDOW_ORDER.indexOf(held.win as WindowKey)) {
          shortestByCount.set(row.n, row);
        }
      }
      const survivors = [...shortestByCount.values()].filter(
        (row) => comboId({ board, window: row.win as WindowKey }) !== excludeId,
      );
      if (survivors.length === 0) continue;
      out.push({
        board,
        windows: survivors.map((row) => row.win as WindowKey),
        visible: survivors.some(
          (row) => row.viewer_pos != null && row.viewer_pos >= 1 && row.viewer_pos <= 10,
        ),
      });
    }
    return out;
  };

  /* R2.4 — if excluding last session's pick empties the set, ignore the rule
     rather than showing an empty board. */
  let candidates = buildCandidates(lastId);
  if (candidates.length === 0) candidates = buildCandidates(null);
  if (candidates.length === 0) return fallbackPick;

  /* R2.2 + R2.3 — weight is per BOARD: 1, doubled where the member renders. */
  const weights = candidates.map((c) => (c.visible ? 2 : 1));
  const total = weights.reduce((a, b) => a + b, 0);
  let ticket = random() * total;
  let chosen = candidates[candidates.length - 1];
  for (let i = 0; i < candidates.length; i += 1) {
    ticket -= weights[i];
    if (ticket < 0) {
      chosen = candidates[i];
      break;
    }
  }

  const window = chosen.windows[Math.min(
    chosen.windows.length - 1,
    Math.floor(random() * chosen.windows.length),
  )];

  return { board: chosen.board, window };
}
