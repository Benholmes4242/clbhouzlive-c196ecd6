/**
 * feedLaneRoles — PR-B role rotation over feed physical lanes.
 *
 * ── Invariants ──────────────────────────────────────────────────────
 *   • ONE element = ONE hls = ONE PHYSICAL lane, for life. Elements never
 *     migrate between physical lanes; hls instances are never recreated.
 *   • ROLES ('active' | 'next' | 'prev') rotate OVER the three feed physical
 *     lanes. Rotation is pure bookkeeping — it re-points a role pointer at a
 *     different physical lane. No load(), no seek(), no attachMedia() is
 *     invoked during rotation.
 *   • A borrowed physical lane is FROZEN out of rotation (see freeze /
 *     unfreeze). Rotation degrades to a 2-lane window while frozen. On
 *     unfreeze the returning lane rejoins at role 'prev' — the safest slot
 *     because it will be naturally recycled on the next opposite-direction
 *     rotation without disturbing the current active card.
 *   • The demote path (borrow released while fullscreen stays open) uses the
 *     same unfreeze + 'prev'-rejoin rule.
 *
 * ── Borrow ↔ rotation interaction ───────────────────────────────────
 * openWithOrigin resolves `laneForRole('active')` at tap time — whichever
 * physical lane currently holds the active role. That physical lane is
 * frozen for the duration of the borrow. All rotations while frozen skip
 * the frozen lane; the window contracts to whichever two lanes remain.
 * Rejoin rule (unfreeze): role 'prev'. If 'prev' is already held by another
 * physical lane at unfreeze time, that lane is swapped into whatever role
 * the returning lane previously occupied.
 */

import type { LaneId } from './lanePolicy';

export type FeedRole = 'active' | 'next' | 'prev';

const FEED_PHYSICAL_LANES: LaneId[] = ['feed-active', 'feed-next', 'feed-prev'];

type Listener = () => void;

class FeedLaneRolesImpl {
  /** role → physical lane id */
  private map: Record<FeedRole, LaneId> = {
    active: 'feed-active',
    next: 'feed-next',
    prev: 'feed-prev',
  };
  private frozen = new Set<LaneId>();
  private listeners = new Set<Listener>();

  /** Physical lane currently bound to `role`. */
  laneForRole(role: FeedRole): LaneId {
    return this.map[role];
  }

  /** Role currently held by physical lane `lane`, or null when the lane is
   *  not currently bound to any role (should not happen for the 3 feed
   *  lanes, all of which are always bound). */
  roleForLane(lane: LaneId): FeedRole | null {
    for (const r of ['active', 'next', 'prev'] as FeedRole[]) {
      if (this.map[r] === lane) return r;
    }
    return null;
  }

  /** Is `lane` a feed physical lane (i.e. participates in role rotation)? */
  isFeedLane(lane: LaneId): boolean {
    return FEED_PHYSICAL_LANES.includes(lane);
  }

  /** Whole role snapshot — useful for logging / debugging. */
  snapshot(): { active: LaneId; next: LaneId; prev: LaneId; frozen: LaneId[] } {
    return { ...this.map, frozen: Array.from(this.frozen) };
  }

  /**
   * Rotate roles over physical lanes.
   *   down: next → active, active → prev, prev → recycled(new next)
   *   up:   prev → active, active → next, next → recycled(new prev)
   *
   * If the incoming-active lane (the one that would become active) is
   * FROZEN, rotation is a no-op and returns null — the borrow is holding
   * the window static.
   *
   * If the recycling lane is FROZEN, we degrade to two-lane rotation:
   * swap active↔incoming and leave the other role bound to its current
   * physical lane. Returns the physical lane id the caller should load
   * the upcoming card into (may be the newly-vacated ex-active in the
   * degraded case).
   */
  rotate(direction: 'down' | 'up'): LaneId | null {
    const a = this.map.active;
    const n = this.map.next;
    const p = this.map.prev;
    const incoming = direction === 'down' ? n : p;
    const trailing = direction === 'down' ? p : n;
    // Incoming-active frozen → cannot rotate.
    if (this.frozen.has(incoming)) return null;
    let recycled: LaneId;
    if (this.frozen.has(trailing)) {
      // Two-lane degraded rotation. Swap active↔incoming; trailing stays.
      if (direction === 'down') {
        this.map = { active: n, next: a, prev: p };
      } else {
        this.map = { active: p, next: n, prev: a };
      }
      recycled = a; // ex-active is what the caller loads into for the new incoming direction
    } else {
      if (direction === 'down') {
        this.map = { active: n, next: p, prev: a };
      } else {
        this.map = { active: p, next: a, prev: n };
      }
      recycled = trailing;
    }
    this.emit();
    return recycled;
  }

  /** Freeze a physical lane out of rotation (called on borrow). */
  freeze(lane: LaneId): void {
    if (!this.isFeedLane(lane)) return;
    this.frozen.add(lane);
    this.emit();
  }

  /** Unfreeze a physical lane. Rejoin rule: the returning lane takes
   *  role 'prev' (rejoinRole overrideable for edge cases). */
  unfreeze(lane: LaneId, rejoinRole: FeedRole = 'prev'): void {
    if (!this.frozen.has(lane)) return;
    this.frozen.delete(lane);
    const currentAtTarget = this.map[rejoinRole];
    if (currentAtTarget !== lane) {
      const laneRole = this.roleForLane(lane);
      if (laneRole && laneRole !== rejoinRole) {
        // Swap: displaced lane takes lane's previous role.
        this.map[laneRole] = currentAtTarget;
        this.map[rejoinRole] = lane;
      }
    }
    this.emit();
  }

  isFrozen(lane: LaneId): boolean {
    return this.frozen.has(lane);
  }

  /**
   * Re-assert `lane` as the 'active' role by SWAPPING role bindings with
   * whichever physical lane currently holds 'active'. Pure bookkeeping — no
   * load / seek / attach, and elements never migrate.
   *
   * Additive API used ONLY by the profile (posts-tab) feed after a borrow
   * returns: on a profile the member comes back to the very card they tapped,
   * so the returned lane — which still holds that card's element, painted and
   * paused at its true position — must hold 'active' for it to resume. The
   * default rejoin rule ('prev') is untouched, so the Clubhouse borrow path
   * is byte-identical.
   */
  promoteToActive(lane: LaneId): boolean {
    if (!this.isFeedLane(lane)) return false;
    if (this.frozen.has(lane)) return false;
    const role = this.roleForLane(lane);
    if (!role || role === 'active') return false;
    const currentActive = this.map.active;
    this.map[role] = currentActive;
    this.map.active = lane;
    this.emit();
    return true;
  }

  /** React subscription — fires on any role map or freeze-set change. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    this.listeners.forEach((fn) => {
      try { fn(); } catch { /* noop */ }
    });
  }
}

export const feedLaneRoles = new FeedLaneRolesImpl();
