/**
 * RailLanePool — LRU-managed rental pool over the `rail-0/1/2` lanes.
 *
 * Rails run ALL over the Watch surface: multiple tiles per rail, multiple
 * rails per screen. We do NOT get one lane per rail (decoder ceiling on
 * mobile). Instead, a shared budget of RAIL_LANE_BUDGET lanes is rented
 * to whichever tile is currently the "active" one in its rail. When the
 * pool is full and a 4th tile activates, the least-recently-used owner
 * is evicted (its lane recycled) and the evicted tile drops back to its
 * poster.
 *
 * Rails are ALWAYS muted. The fullscreen viewer + feed-active own the
 * ONE_UNMUTED_LANE budget; rails must never contend.
 *
 * Stage-7 PR-1 additions:
 *   pin(laneId) / unpin(laneId)  — mark a lane as borrowed by fullscreen.
 *     pickLruOwner() skips pinned lanes; if all owners are pinned and the
 *     pool is full, acquire() returns null (caller keeps its poster).
 *   release(ownerKey) on a pinned lane defers the actual VideoEngine.release
 *     until unpin() fires (or is coalesced with a fresh acquire on unpin).
 *   laneFor(ownerKey) — read-only lane lookup for openWithOrigin's borrow
 *     decision at tap time.
 */

import { RAIL_LANE_IDS, type LaneId } from './lanePolicy';
import { VideoEngine } from './VideoEngine';
import { isPerfEnabled } from '@/perf/navTiming';

type OwnerKey = string;
type OwnerListener = (laneId: LaneId | null) => void;

interface OwnerRecord {
  laneId: LaneId;
  lastUsed: number;
  /** Set when release() is called while lane is pinned; consumed on unpin. */
  pendingRelease?: boolean;
}

const owners = new Map<OwnerKey, OwnerRecord>();
const laneOwner = new Map<LaneId, OwnerKey>();
const subs = new Map<OwnerKey, Set<OwnerListener>>();
const pinnedByBorrow = new Set<LaneId>();
/**
 * Lanes that are mid flip-return to their origin tile. Marked at
 * `beginCloseAnim('borrow')` and cleared once `returnBorrow` completes.
 * A returning lane is UNAVAILABLE — laneFor() reports null, and acquire()
 * refuses to hand it out (free-pick + LRU eviction skip it). This prevents
 * a new open from contending with an in-flight close animation on the same
 * lane (the 6s flip-return race).
 */
const returningLanes = new Set<LaneId>();
let clock = 0;

const DBG = (evt: string, payload: Record<string, unknown> = {}) => {
  const flag =
    typeof window !== 'undefined' && (window as any).__VIDEO_ENGINE_DBG__;
  if (!flag && !isPerfEnabled()) return;
  // eslint-disable-next-line no-console
  console.info('[RAIL]', evt, payload);
};

const POOL_DBG = (evt: string, payload: Record<string, unknown> = {}) => {
  const flag =
    typeof window !== 'undefined' && (window as any).__VIDEO_ENGINE_DBG__;
  if (!flag && !isPerfEnabled()) return;
  // eslint-disable-next-line no-console
  console.info('[POOL]', evt, payload);
};


function notify(ownerKey: OwnerKey, laneId: LaneId | null) {
  const set = subs.get(ownerKey);
  if (!set) return;
  for (const fn of set) {
    try { fn(laneId); } catch { /* noop */ }
  }
}

function pickFreeLane(): LaneId | null {
  for (const id of RAIL_LANE_IDS) {
    if (laneOwner.has(id)) continue;
    if (returningLanes.has(id)) continue; // mid flip-return — unavailable
    return id;
  }
  return null;
}

function pickLruOwner(): OwnerKey | null {
  let lru: OwnerKey | null = null;
  let lruTime = Infinity;
  for (const [k, v] of owners) {
    if (pinnedByBorrow.has(v.laneId)) continue; // skip pinned
    if (returningLanes.has(v.laneId)) continue; // skip mid flip-return
    if (v.lastUsed < lruTime) {
      lruTime = v.lastUsed;
      lru = k;
    }
  }
  return lru;
}

export const RailLanePool = {
  /**
   * Acquire (or re-touch) a lane for `ownerKey`. If the owner already holds
   * a lane, its LRU timestamp is refreshed and its lane returned unchanged.
   * If the pool is full AND every candidate is pinned by fullscreen borrow,
   * returns null (caller should stay on its poster; retry on next eligibility
   * change — typically borrow unpin + next active-tile handoff).
   */
  acquire(ownerKey: OwnerKey): LaneId | null {
    VideoEngine.boot();
    const existing = owners.get(ownerKey);
    if (existing) {
      // Coalesce a still-pending deferred release: same owner is re-acquiring
      // the same lane while it's pinned by fullscreen. Clear the flag so the
      // eventual unpin doesn't tear down the source we're about to reuse.
      if (existing.pendingRelease) {
        existing.pendingRelease = false;
        existing.lastUsed = ++clock;
        POOL_DBG('acquire.coalesced', { ownerKey, laneId: existing.laneId });
        return existing.laneId;
      }
      existing.lastUsed = ++clock;
      DBG('touch', { ownerKey, laneId: existing.laneId });
      return existing.laneId;
    }
    let lane = pickFreeLane();
    // If free lane is pinned (shouldn't be — pinned lanes always have an
    // owner — but defense in depth), skip and try eviction.
    if (lane && pinnedByBorrow.has(lane)) lane = null;
    if (!lane) {
      const evictKey = pickLruOwner();
      if (!evictKey) {
        POOL_DBG('acquire.skipPinned', {
          candidateOwner: ownerKey,
          pinnedLanes: Array.from(pinnedByBorrow),
        });
        return null;
      }
      const evictRec = owners.get(evictKey)!;
      lane = evictRec.laneId;
      DBG('evict', { evictedOwner: evictKey, laneId: lane, newOwner: ownerKey });
      owners.delete(evictKey);
      laneOwner.delete(lane);
      // Release source on the recycled lane so the incoming owner starts clean.
      VideoEngine.release(lane);
      notify(evictKey, null);
    }
    laneOwner.set(lane, ownerKey);
    owners.set(ownerKey, { laneId: lane, lastUsed: ++clock });
    DBG('acquire', { ownerKey, laneId: lane, poolSize: owners.size });
    return lane;
  },

  /** Release `ownerKey`'s lane (if any). Defers if the lane is pinned. */
  release(ownerKey: OwnerKey): void {
    const rec = owners.get(ownerKey);
    if (!rec) return;
    if (pinnedByBorrow.has(rec.laneId)) {
      rec.pendingRelease = true;
      POOL_DBG('release.deferred', { ownerKey, laneId: rec.laneId });
      return;
    }
    DBG('release', { ownerKey, laneId: rec.laneId });
    owners.delete(ownerKey);
    laneOwner.delete(rec.laneId);
    VideoEngine.release(rec.laneId);
    notify(ownerKey, null);
  },

  /** Pin a lane so LRU eviction + release() ignore it until unpin(). */
  pin(laneId: LaneId): void {
    pinnedByBorrow.add(laneId);
  },

  /**
   * Unpin a lane. Behavior split by `executeDeferred`:
   *  - `true`  (default; used by fallback/demote returns): if a release() was
   *    deferred while pinned, execute it now — release source + notify owner.
   *  - `false` (used by live-tile animate return): CLEAR any pendingRelease
   *    without releasing. The owner record + lane source stay intact so the
   *    tile re-acquires via `acquire.coalesced` when the autoplay gate lifts,
   *    with zero reload flash.
   * Returns true if a deferred release was present (informational).
   */
  unpin(laneId: LaneId, opts: { executeDeferred?: boolean } = {}): boolean {
    const executeDeferred = opts.executeDeferred ?? true;
    pinnedByBorrow.delete(laneId);
    // Find the owner (if any) and consume its pendingRelease flag.
    for (const [ownerKey, rec] of owners) {
      if (rec.laneId !== laneId) continue;
      if (rec.pendingRelease) {
        if (executeDeferred) {
          DBG('release.deferredExec', { ownerKey, laneId });
          owners.delete(ownerKey);
          laneOwner.delete(laneId);
          VideoEngine.release(laneId);
          notify(ownerKey, null);
          return true;
        }
        // Coalesce path: clear the flag, keep the owner record + source.
        rec.pendingRelease = false;
        rec.lastUsed = ++clock;
        POOL_DBG('release.deferredCleared', { ownerKey, laneId });
        return true;
      }
      break;
    }
    return false;
  },

  /**
   * Which lane (if any) does this owner currently hold? Null = none.
   * A lane that is mid flip-return is reported as null so a new open falls
   * through to the cold path instead of racing the return animation.
   */
  laneFor(ownerKey: OwnerKey | null | undefined): LaneId | null {
    if (!ownerKey) return null;
    const laneId = owners.get(ownerKey)?.laneId ?? null;
    if (!laneId) return null;
    if (returningLanes.has(laneId)) return null;
    return laneId;
  },

  /**
   * Mark a lane as mid flip-return. Called at `beginCloseAnim('borrow')`
   * — from that moment until `clearReturning`, the lane is unavailable to
   * new opens (borrow or fresh acquire). Idempotent.
   */
  markReturning(laneId: LaneId): void {
    returningLanes.add(laneId);
    POOL_DBG('return.mark', { laneId });
  },

  /** Clear the returning mark once `returnBorrow` has completed. Idempotent. */
  clearReturning(laneId: LaneId): void {
    if (!returningLanes.has(laneId)) return;
    returningLanes.delete(laneId);
    POOL_DBG('return.clear', { laneId });
  },

  /** Read-only: is this lane currently mid flip-return? */
  isReturning(laneId: LaneId): boolean {
    return returningLanes.has(laneId);
  },

  /** Subscribe to lane-change events for a given owner (eviction → null). */
  subscribe(ownerKey: OwnerKey, fn: OwnerListener): () => void {
    let set = subs.get(ownerKey);
    if (!set) {
      set = new Set();
      subs.set(ownerKey, set);
    }
    set.add(fn);
    return () => {
      const s = subs.get(ownerKey);
      if (!s) return;
      s.delete(fn);
      if (s.size === 0) subs.delete(ownerKey);
    };
  },

  /**
   * Current playhead (seconds) of the lane currently rented to `ownerKey`,
   * or 0 if the owner holds no lane. Used by tap-to-fullscreen to resume at
   * the frame the tile was showing.
   */
  getCurrentTime(ownerKey: OwnerKey | null | undefined): number {
    if (!ownerKey) return 0;
    const rec = owners.get(ownerKey);
    if (!rec) return 0;
    try {
      const snap = VideoEngine.snapshot(rec.laneId);
      return snap.currentTime || 0;
    } catch {
      return 0;
    }
  },

  /** Test helper — current owner → lane map. */
  _debugState() {
    return {
      owners: Array.from(owners.entries()).map(([k, v]) => ({ ownerKey: k, ...v })),
      lanes: Array.from(laneOwner.entries()),
      pinned: Array.from(pinnedByBorrow),
    };
  },

};
