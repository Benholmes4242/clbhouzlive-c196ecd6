/**
 * BRIEF_ROUND_SHEET_CUES §2 — THE NUDGE, AS A TIMELINE.
 *
 * The movement that replaces the retired sentence: once the sheet has settled at
 * mid, the page walks left far enough for the NEXT round's preview to show at the
 * right edge, holds, and springs back. It drives the SAME shift and the SAME
 * preview a finger drives, so there is one track and one drawing, not two.
 *
 * Timers and setters are injected so the whole sequence — including a cancel
 * mid-flight, which is what a touch does — is testable with fake timers and no
 * sheet, no finger and no DOM.
 */

/** 64px: enough of the neighbour to be unmistakable, small enough not to read as
 *  a page that failed to commit. */
export const NUDGE_PX = 64;
/** The sheet's detent spring has stopped by here. */
export const NUDGE_SETTLE_MS = 500;
/** Travel out, then the hold at the far end. */
export const NUDGE_TRAVEL_MS = 180;
export const NUDGE_HOLD_MS = 120;
/** Travel back, after which the preview is no longer needed. */
export const NUDGE_BACK_MS = 220;

export interface NudgeIO {
  setShift: (v: { dx: number; animating: boolean } | null) => void;
  setPreview: (v: { side: 'next'; ix: number } | null) => void;
  setTimeout: (fn: () => void, ms: number) => number;
  clearTimeout: (id: number) => void;
}

/**
 * Starts the nudge towards `nextIx` and returns its cancel. Cancelling before it
 * has moved leaves the sheet untouched; cancelling mid-flight puts the page and
 * the preview back exactly as a spring-back does, so the gesture that cancelled
 * it starts from a clean sheet.
 */
export function runNudge(nextIx: number, io: NudgeIO): () => void {
  const timers: number[] = [];
  let moved = false;
  let done = false;
  const at = (ms: number, fn: () => void) => timers.push(io.setTimeout(fn, ms));

  at(NUDGE_SETTLE_MS, () => {
    moved = true;
    io.setPreview({ side: 'next', ix: nextIx });
    io.setShift({ dx: -NUDGE_PX, animating: true });
    at(NUDGE_TRAVEL_MS + NUDGE_HOLD_MS, () => {
      io.setShift({ dx: 0, animating: true });
      at(NUDGE_BACK_MS, () => {
        done = true;
        moved = false;
        io.setShift(null);
        io.setPreview(null);
      });
    });
  });

  return () => {
    timers.forEach((id) => io.clearTimeout(id));
    timers.length = 0;
    if (moved && !done) {
      moved = false;
      io.setShift(null);
      io.setPreview(null);
    }
  };
}
