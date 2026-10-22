/**
 * fullscreenVerticalWarm — CB53. The next POST in the fullscreen viewer's
 * vertical swipe direction is decoded ahead on ONE lent feed physical lane,
 * so a settle onto it is a swapLanes('fullscreen', lent) rather than a cold
 * re-point of 'fullscreen'. Mirrors the horizontal pager's 'fullscreen-next'
 * + swapLanes, without adding a decoder: the lent lane is an existing feed
 * element, idle while the viewer is open (feed cards unbind while open).
 *
 * Rules
 *  - Lend: a feed lane that is not borrowed, not frozen, not the borrow's
 *    lane and not role 'active'. Role 'next' is preferred, then 'prev'
 *    ('prev' is where a returning borrow rejoins). The element is parked in
 *    the hidden host and its policy forced 'always-muted' — never the speaker.
 *  - Warm only a neighbour whose FIRST media is a video with a real HLS url,
 *    owner `${postId}:0`, never under save-data.
 *  - Settle: swap only when the lent lane holds exactly the settled post's
 *    owner and is loaded; otherwise (or if swapLanes refuses) today's cold
 *    path runs untouched. swapLanes keeps each id's policy, so 'fullscreen'
 *    keeps 'session' and the lent id keeps 'always-muted'.
 *  - Return (viewer close, synchronously on the store flip, before feed cards
 *    rebind): release the lent lane so no card can show another post's
 *    video, restore its policy and host, then notify feeds so they re-warm
 *    the role that lane now holds (CardFeed / LightCardFeed subscribe).
 */
import { VideoEngine, type LaneId, type LaneAudioPolicy } from './VideoEngine';
import { feedLaneRoles } from './feedLaneRoles';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import type { FeedPost } from '@/components/media-system/types/media';

interface Lent {
  laneId: LaneId;
  prevPolicy: LaneAudioPolicy;
  savedHost: HTMLElement | null;
  ownerKey: string | null;
}

let lent: Lent | null = null;
let lastSettle: { postId: string; warmed: boolean } | null = null;
const returnListeners = new Set<(laneId: LaneId) => void>();

export type VerticalWarmOutcome =
  | 'issued'
  | 'already'
  | 'noop:no-post'
  | 'noop:save-data'
  | 'noop:not-video'
  | 'noop:no-hls-url'
  | 'noop:no-lane'
  | 'failed:engine';

/** The feed lane that may be lent right now, or null. */
export function pickLendableLane(): LaneId | null {
  const borrowLane = useFullscreenFeedStore.getState().borrow?.laneId ?? null;
  const active = feedLaneRoles.laneForRole('active');
  for (const role of ['next', 'prev'] as const) {
    const id = feedLaneRoles.laneForRole(role);
    if (id === active || id === borrowLane) continue;
    if (feedLaneRoles.isFrozen(id) || VideoEngine.isBorrowed(id)) continue;
    return id;
  }
  return null;
}

export function getLentLane(): LaneId | null {
  return lent?.laneId ?? null;
}

/** Preload `post`'s first media on the lent lane (lending one if needed). */
export function warmVerticalNeighbour(post: FeedPost | undefined | null): VerticalWarmOutcome {
  if (!post) return 'noop:no-post';
  try {
    if (VideoEngine.isSaveDataGated()) return 'noop:save-data';
  } catch { return 'failed:engine'; }
  const m = post.mediaItems?.[0] as (FeedPost['mediaItems'][number] & { hlsUrl?: string }) | undefined;
  if (!m || m.type !== 'video') return 'noop:not-video';
  const hlsUrl = m.hlsUrl;
  if (!hlsUrl || hlsUrl.startsWith('blob:')) return 'noop:no-hls-url';
  const ownerKey = `${post.id}:0`;
  try {
    if (!lent) {
      const id = pickLendableLane();
      if (!id) return 'noop:no-lane';
      const prevPolicy = VideoEngine.getAudioPolicy(id);
      const savedHost = VideoEngine.mountedHostOf(id);
      VideoEngine.setAudioPolicy(id, 'always-muted');
      VideoEngine.unmountLane(id);
      lent = { laneId: id, prevPolicy, savedHost, ownerKey: null };
    }
    if (lent.ownerKey === ownerKey) return 'already';
    VideoEngine.preload(lent.laneId, {
      hlsUrl,
      posterUrl: m.thumbnailUrl ?? null,
      postId: ownerKey,
    });
    lent.ownerKey = ownerKey;
    return 'issued';
  } catch {
    return 'failed:engine';
  }
}

/**
 * Call BEFORE the viewer's activeIndex moves to `post`. Swaps the warmed lane
 * in when it holds this post; returns whether it did. Records the result for
 * the swipe.vertical span (`wasVerticalSettleWarmed`).
 */
export function settleVertical(post: FeedPost | undefined | null): boolean {
  let warmed = false;
  if (post && lent && lent.ownerKey === `${post.id}:0`) {
    try {
      const snap = VideoEngine.snapshot(lent.laneId);
      const loaded = snap.postId === lent.ownerKey && snap.state !== 'idle' && snap.state !== 'error';
      if (loaded) warmed = VideoEngine.swapLanes('fullscreen', lent.laneId);
    } catch { warmed = false; }
    // Swapped or not, the lent lane no longer holds a trusted warm.
    lent.ownerKey = null;
  }
  if (post) lastSettle = { postId: post.id, warmed };
  return warmed;
}

/** Whether the most recent settle onto `postId` swapped a warmed lane in. */
export function wasVerticalSettleWarmed(postId: string): boolean {
  return !!lastSettle && lastSettle.postId === postId && lastSettle.warmed;
}

/** Hand the lent lane back to the feed. Idempotent. */
export function returnLentLane(): void {
  const l = lent;
  if (!l) return;
  lent = null;
  try {
    VideoEngine.release(l.laneId);
    VideoEngine.setAudioPolicy(l.laneId, l.prevPolicy);
    if (l.savedHost && l.savedHost.isConnected) VideoEngine.mountLane(l.laneId, l.savedHost);
  } catch { /* engine not booted */ }
  returnListeners.forEach((fn) => { try { fn(l.laneId); } catch { /* listener */ } });
}

/** Feeds subscribe to re-warm the role the returned lane now holds. */
export function onLentLaneReturned(fn: (laneId: LaneId) => void): () => void {
  returnListeners.add(fn);
  return () => { returnListeners.delete(fn); };
}

/** Test-only. */
export function __resetVerticalWarmForTests(): void {
  lent = null;
  lastSettle = null;
  returnListeners.clear();
}

// Return synchronously on the close flip, before any feed card rebinds.
let installed = false;
export function installVerticalWarmReturn(): void {
  if (installed) return;
  installed = true;
  let wasOpen = useFullscreenFeedStore.getState().isOpen;
  useFullscreenFeedStore.subscribe((s) => {
    if (wasOpen && !s.isOpen) returnLentLane();
    wasOpen = s.isOpen;
  });
}
