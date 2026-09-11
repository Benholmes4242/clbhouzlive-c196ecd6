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
 * BRIEF_CHOOSE_A_COURSE §A — HISTORY WRITES ARE SERIALISED, AND A BACK IS NEVER
 * ISSUED AGAINST A ROUTE.
 *
 * Two faults lived here, both of them the same shape: `history.pushState` is
 * SYNCHRONOUS and `history.back()` is ASYNCHRONOUS, so a back issued in one tick
 * lands after anything pushed in the same tick and eats it.
 *
 *  1. SHEET SWAP (the CHOOSE A COURSE symptom). Opening a second sheet closes
 *     the first in the same commit: release queued a back, the new sheet pushed
 *     its marker, the back ate that push, and the browser stack was left one
 *     entry out of step with our marker stack. The next release then spent its
 *     back on a REAL route entry, which returned the member to the page they
 *     started on.
 *  2. CLOSE-THEN-NAVIGATE (the RATE IT symptom). A handler that pushed a route
 *     and then let the sheet close had its route eaten the same way.
 *
 * FIX, ONCE, HERE — not per sheet and not with a delay:
 *
 *  • ALL history writes go through one queue, pumped on a microtask, and a back
 *    is only issued once the previous one has landed. Ordering, not timing.
 *  • A queued back followed by a push in the same tick CANCEL each other. The
 *    marker is a count, not an address, so the pair is a no-op and neither is
 *    issued — the swap case never touches history at all.
 *  • A back is issued only while the top browser entry is one of OUR markers
 *    (`history.state.__sheet`). If a route was pushed over it, the marker is
 *    buried and the back is dropped rather than spent on the route. The cost is
 *    one stale marker entry below the new route — one extra back press in the
 *    worst case, never a member yanked off the page they asked for.
 */
let selfInflictedPops = 0;
let listening = false;

type HistoryOp = 'push' | 'back';
const ops: HistoryOp[] = [];
/** True while a back has been issued and its popstate has not landed yet. */
let awaitingPop = false;
let pumpScheduled = false;

function topEntryIsOurMarker(): boolean {
  const state = window.history.state as { __sheet?: number } | null;
  return !!(state && state.__sheet);
}

function schedulePump() {
  if (pumpScheduled) return;
  pumpScheduled = true;
  queueMicrotask(() => {
    pumpScheduled = false;
    pump();
  });
}

function pump() {
  if (awaitingPop) return;
  while (ops.length) {
    const op = ops.shift() as HistoryOp;
    if (op === 'push') {
      window.history.pushState({ ...(window.history.state ?? {}), __sheet: ++seq }, '');
      continue;
    }
    if (!topEntryIsOurMarker()) {
      // A route sits on top of our marker: spending a back here would navigate
      // the member away. Drop the unwind instead.
      continue;
    }
    awaitingPop = true;
    selfInflictedPops += 1;
    window.history.back();
    return;
  }
  drainSettleQueue();
}

function enqueue(op: HistoryOp) {
  if (op === 'push' && ops.length && ops[ops.length - 1] === 'back') {
    // Cancel the pair: closing one sheet and opening another leaves the depth
    // unchanged, so neither write is issued.
    ops.pop();
    schedulePump();
    return;
  }
  ops.push(op);
  schedulePump();
}

function ensureListener() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  window.addEventListener('popstate', () => {
    if (selfInflictedPops > 0) {
      selfInflictedPops -= 1;
      awaitingPop = false;
      // The stack is settled once the last unwind we caused has landed: that is
      // the moment a handler waiting to navigate away may safely push its route.
      pump();
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
  enqueue('push');
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
  enqueue('back');
}

/**
 * BRIEF_POST_SHEET_RATE_IT — NAVIGATING OUT OF A SHEET.
 *
 * releaseSheetEntry unwinds its marker with history.back(), which the browser
 * resolves ASYNCHRONOUSLY. A handler that closes its sheet and then navigates
 * therefore pushes its route BEFORE the back lands, and the back eats the push:
 * the member arrives exactly where they started. That was the RATE IT symptom.
 *
 * This runs `fn` once every self-inflicted pop we are still waiting on has
 * actually landed, so the navigation happens on a settled stack. It is ordering,
 * NOT a delay — with nothing outstanding it runs on the next microtask.
 */
const settleQueue: Array<() => void> = [];

function drainSettleQueue() {
  while (settleQueue.length) settleQueue.shift()?.();
}

export function afterSheetHistorySettled(fn: () => void): void {
  if (typeof window === 'undefined' || (!awaitingPop && ops.length === 0)) {
    queueMicrotask(fn);
    return;
  }
  ensureListener();
  settleQueue.push(fn);
  schedulePump();
}

/** Test/diagnostic only. */
export function sheetStackDepth(): number {
  return stack.length;
}
