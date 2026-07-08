/**
 * handoverResume — one-shot playhead handoff for the early-motion swap.
 *
 * The early-motion window plays a card on the `feed-next` lane BEFORE it
 * centres. On promotion, `feed-next` is unmounted and `feed-active` mounts
 * for the same card. `useVideoLane('feed-active', { startPosition })`
 * normally reads startPosition from `VideoEngine.getLastPos(ownerKey)`,
 * which is written on the `timeupdate` handler and throttled ~250ms — so
 * the value is up to a quarter-second stale at the exact swap moment. The
 * eye catches that as a small forward/backward playhead JUMP.
 *
 * At the unmount moment we sample `feedNextEl.currentTime` (fresh, exact)
 * and stash it here keyed by ownerKey. The next `startPosition` computation
 * for that owner consumes the stash instead of the throttled ladder. Every
 * other resume path (tab return, borrow return, cold mount) is unchanged —
 * only the promoted card, only once, only within a short window.
 */

const __handoverStash = new Map<string, { t: number; setAt: number }>();
const TTL_MS = 2000;

/** Stash an exact playhead for the given ownerKey. Overwrites any stale entry. */
export function setHandoverResume(ownerKey: string | null | undefined, t: number): void {
  if (!ownerKey || !isFinite(t) || t <= 0) return;
  __handoverStash.set(ownerKey, { t, setAt: performance.now() });
}

/**
 * Consume the stashed playhead. Clears the entry asynchronously so React
 * strict-mode double-invocation of the same render's `useMemo` reads the
 * same value both times. Returns null if nothing is stashed or the stash
 * is older than TTL_MS (a card that never got promoted after all).
 */
export function consumeHandoverResume(ownerKey: string | null | undefined): number | null {
  if (!ownerKey) return null;
  const entry = __handoverStash.get(ownerKey);
  if (!entry) return null;
  if (performance.now() - entry.setAt > TTL_MS) {
    __handoverStash.delete(ownerKey);
    return null;
  }
  // Delete after the current render task; safe under strict-mode double-invoke.
  queueMicrotask(() => {
    const cur = __handoverStash.get(ownerKey);
    if (cur && cur.setAt === entry.setAt) __handoverStash.delete(ownerKey);
  });
  return entry.t;
}
