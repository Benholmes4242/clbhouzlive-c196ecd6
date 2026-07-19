/**
 * positionContinuity — tiny module-scoped ring for the close→handback→resume
 * position beats surfaced in the AudioDebug HUD. Instrumentation-only.
 *
 * The "jump-back" hypothesis (resume ladder preferring a stale lastPos over
 * the element's live currentTime) needs a numeric delta = resume-time minus
 * close-time. That requires stashing the fullscreen currentTime at close
 * intent so the later resume beat can read it. Flag-gated at each call site
 * (audioDebugEnabled) — this file itself is a passive holder.
 */

export interface CloseSnapshot {
  laneId: string | null;
  ownerKey: string | null;
  fsCurrentTime: number | null;
  fsPaused: boolean | null;
  closeTs: number; // performance.now()
}

let last: CloseSnapshot | null = null;

export function setLastCloseSnapshot(snap: CloseSnapshot): void {
  last = snap;
}

export function getLastCloseSnapshot(): CloseSnapshot | null {
  return last;
}

export function clearLastCloseSnapshot(): void {
  last = null;
}
