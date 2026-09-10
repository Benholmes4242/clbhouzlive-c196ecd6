/**
 * BRIEF_SHEET_BACK_BEHAVIOUR §2 — THE SHEET STACK.
 *
 * One history entry per open sheet, owned by the BottomSheet primitive.
 *
 * REGISTRATION IS AUTOMATIC AND UNCONDITIONAL. BottomSheet already receives
 * `open` and `onClose`, which is everything this needs, so no sheet author is
 * asked to opt in and therefore no sheet author can forget. There is no escape
 * hatch: the `urlOwnsHistoryEntry` opt-out was removed in
 * BRIEF_SHEET_BACK_BEHAVIOUR_02 §1 having never had a consumer. A sheet whose
 * open state also lives in a query parameter therefore closes its sheet entry
 * first and clears the parameter on the next back.

 *
 * WHY A STACK: sheets stack (the round scorecard opens from inside another
 * sheet), so back must close the top one only, then the one beneath, and only
 * then leave the route.
 *
 * WHAT ACTUALLY HAPPENS ON A GUARDED SHEET (corrected in
 * BRIEF_SHEET_BACK_BEHAVIOUR_04 §3; the previous wording here was wrong and is
 * the reason this needed tracing twice). The browser pops the entry BEFORE the
 * popstate listener runs, so by the time a draft-holding sheet shows its
 * "discard / keep editing" question its marker is already spent. Choosing KEEP
 * EDITING therefore leaves the sheet open with NO entry beneath it, and the
 * next back is taken by whatever sits below — for a route-hosted composer, the
 * router. The sheet stays open while the route leaves.
 *
 * THIS IS NOT FIXED BY RE-PUSHING INSIDE popstate. That cannot be made
 * reliable on iOS edge-swipe, and a guard that works at the desk but not in the
 * hand is worse than none because it gets trusted. The ruling (_04 §3) is that
 * the fix is PERSISTENCE, not history: the review composer now keeps a 24h
 * sessionStorage draft in both create and edit mode, so a back that takes the
 * route no longer takes the work. What remains is a navigation oddity, not a
 * data-loss path.
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
