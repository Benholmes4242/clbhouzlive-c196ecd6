/**
 * BRIEF_SHEET_BACK_BEHAVIOUR §2 — THE SHEET STACK.
 *
 * One history entry per open sheet, owned by the BottomSheet primitive.
 *
 * REGISTRATION IS AUTOMATIC. BottomSheet already receives `open` and
 * `onClose`, which is everything this needs, so no sheet author is asked to
 * opt in and therefore no sheet author can forget. The only escape hatch is
 * the explicit `urlOwnsHistoryEntry` prop, for the handful of sheets that are
 * addressed by a query parameter and so already own a history entry of their
 * own — without it those would need two backs to close.
 *
 * WHY A STACK: sheets stack (the round scorecard opens from inside another
 * sheet), so back must close the top one only, then the one beneath, and only
 * then leave the route.
 *
 * WHY `close()` AND NOT A LOCAL DISMISS: the entry closes through the sheet's
 * own `onClose` — the same function backdrop tap and escape already call. Back
 * therefore inherits whatever confirmation a draft-holding sheet already does
 * on those two paths instead of inventing a fourth behaviour (§3).
 */

interface SheetEntry {
  id: number;
  close: () => void;
}

const stack: SheetEntry[] = [];
let seq = 0;

/**
 * Number of popstate events we caused ourselves (by unwinding an entry when a
 * sheet was closed through its own UI). Those must not be read as a member
 * pressing back, or closing one sheet with the X would also close its parent.
 */
let selfInflictedPops = 0;
let listening = false;

function ensureListener() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  window.addEventListener('popstate', () => {
    if (selfInflictedPops > 0) {
      selfInflictedPops -= 1;
      return;
    }
    const top = stack.pop();
    if (top) top.close();
  });
}

export function pushSheetEntry(close: () => void): SheetEntry | null {
  if (typeof window === 'undefined') return null;
  ensureListener();
  const entry: SheetEntry = { id: ++seq, close };
  stack.push(entry);
  // No URL change: the entry is a marker, not an address. A refresh or a
  // shared link therefore resolves to the underlying route, never to a URL
  // that 404s (§4).
  window.history.pushState({ ...(window.history.state ?? {}), __sheet: entry.id }, '');
  return entry;
}

export function releaseSheetEntry(entry: SheetEntry | null): void {
  if (!entry || typeof window === 'undefined') return;
  const i = stack.indexOf(entry);
  if (i === -1) {
    // Back already consumed this entry — nothing left to unwind.
    return;
  }
  stack.splice(i, 1);
  selfInflictedPops += 1;
  window.history.back();
}

/** Test/diagnostic only. */
export function sheetStackDepth(): number {
  return stack.length;
}
