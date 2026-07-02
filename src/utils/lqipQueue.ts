/**
 * Tiny in-flight cap for LQIP fetches so 20 blurred underlays on the
 * Watch grid can't compete with the real thumbnails they're placeholding.
 * Real images always take priority (fetchpriority="auto"|"high"); LQIP
 * requests ride at fetchpriority="low" and wait behind this queue.
 */

const MAX_IN_FLIGHT = 6;
let inFlight = 0;
const waiters: Array<() => void> = [];

function release() {
  inFlight = Math.max(0, inFlight - 1);
  const next = waiters.shift();
  if (next) {
    inFlight += 1;
    next();
  }
}

/**
 * Acquire an LQIP fetch slot. Resolves when the caller may start
 * fetching. Caller MUST invoke the returned release() when done
 * (on load, error, or unmount).
 */
export function acquireLqipSlot(): Promise<() => void> {
  return new Promise((resolve) => {
    const grant = () => resolve(release);
    if (inFlight < MAX_IN_FLIGHT) {
      inFlight += 1;
      grant();
    } else {
      waiters.push(grant);
    }
  });
}

/** Save-Data / Low-Data-Mode detection. LQIP is MORE valuable here. */
export function isSaveDataMode(): boolean {
  if (typeof navigator === 'undefined') return false;
  const conn = (navigator as any).connection;
  return !!conn?.saveData;
}

/**
 * Should this tile get an LQIP underlay?
 *
 * Above-fold / coordinated-reveal-held tiles get NO LQIP: the real
 * image already decodes under the held skeleton, so an LQIP there
 * would fetch bytes no user will ever see.
 *
 * Below-fold and virtualized-offscreen tiles get LQIP.
 *
 * Callers pass their surface-specific fold threshold (rails ~= 3,
 * grids ~= 6). Save-Data mode enables LQIP everywhere — the whole
 * point of Save-Data is to prefer 2KB placeholders over 40KB thumbs.
 */
export function shouldUseLqip(index: number, aboveFoldCount: number): boolean {
  if (isSaveDataMode()) return true;
  return index >= aboveFoldCount;
}
