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
 */

import { RAIL_LANE_IDS, type LaneId } from './lanePolicy';
import { VideoEngine } from './VideoEngine';
import { isPerfEnabled } from '@/perf/navTiming';

type OwnerKey = string;
type OwnerListener = (laneId: LaneId | null) => void;

interface OwnerRecord {
  laneId: LaneId;
  lastUsed: number;
}

const owners = new Map<OwnerKey, OwnerRecord>();
const laneOwner = new Map<LaneId, OwnerKey>();
const subs = new Map<OwnerKey, Set<OwnerListener>>();
let clock = 0;

const DBG = (evt: string, payload: Record<string, unknown> = {}) => {
  const flag =
    typeof window !== 'undefined' && (window as any).__VIDEO_ENGINE_DBG__;
  if (!flag && !isPerfEnabled()) return;
  // eslint-disable-next-line no-console
  console.info('[RAIL]', evt, payload);
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
    if (!laneOwner.has(id)) return id;
  }
  return null;
}

function pickLruOwner(): OwnerKey | null {
  let lru: OwnerKey | null = null;
  let lruTime = Infinity;
  for (const [k, v] of owners) {
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
   * If the pool is full, the LRU owner is evicted and its lane recycled.
   */
  acquire(ownerKey: OwnerKey): LaneId {
    VideoEngine.boot();
    const existing = owners.get(ownerKey);
    if (existing) {
      existing.lastUsed = ++clock;
      DBG('touch', { ownerKey, laneId: existing.laneId });
      return existing.laneId;
    }
    let lane = pickFreeLane();
    if (!lane) {
      const evictKey = pickLruOwner();
      if (!evictKey) throw new Error('RailLanePool: no free lane and no owners to evict');
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

  /** Release `ownerKey`'s lane (if any) and clear its source. */
  release(ownerKey: OwnerKey): void {
    const rec = owners.get(ownerKey);
    if (!rec) return;
    DBG('release', { ownerKey, laneId: rec.laneId });
    owners.delete(ownerKey);
    laneOwner.delete(rec.laneId);
    VideoEngine.release(rec.laneId);
    notify(ownerKey, null);
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
    };
  },

};
