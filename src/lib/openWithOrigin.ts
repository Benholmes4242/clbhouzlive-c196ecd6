/**
 * Phase 3 shared-element expand transition helper.
 *
 * A single entry point tile openers call at tap time. It synchronously:
 *   1) Snapshots the origin element geometry (rect, radius, aspect, poster).
 *   2) Locks body scroll (ref-counted so it composes with CommentsSheet).
 *   3) Flips the WebView status bar to viewer chrome.
 *   4) Hands off the tile's HLS instance to the pool (so the viewer inherits
 *      the buffered segments and lands playing instantly).
 *   5) Opens the fullscreen feed store with the captured origin so the
 *      overlay can drive the FLIP clone.
 *
 * Deep-link / notification openers that have no source tile continue calling
 * `useFullscreenFeedStore.open(...)` directly — omitting the `origin` option
 * falls back to today's plain opacity fade.
 */
import type { FeedPost } from '@/components/media-system/types/media';
import { useFullscreenFeedStore, type OpenOrigin, type BorrowDescriptor } from '@/store/fullscreenFeedStore';
import { VideoEngine } from '@/video/VideoEngine';
import { RailLanePool } from '@/video/railLanePool';

import { isPerfEnabled } from '@/perf/navTiming';
import { vperfStart, vperfMark, vperfArmLane, vperfNextId, vperfSetBudget, vperfMeta, vperfMotionTrace } from '@/perf/vperf';


const BORROW_DBG = (evt: string, payload: Record<string, unknown> = {}) => {
  const flag =
    typeof window !== 'undefined' && (window as any).__VIDEO_ENGINE_DBG__;
  if (!flag && !isPerfEnabled()) return;
  // eslint-disable-next-line no-console
  console.info('[BORROW]', evt, payload);
};


function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function snapshotOrigin(
  el: HTMLElement | null | undefined,
  posterUrl: string | null | undefined,
): OpenOrigin | null {
  if (!el) return null;
  if (prefersReducedMotion()) return null;
  const rect = el.getBoundingClientRect();
  if (rect.width < 4 || rect.height < 4) return null;
  let borderRadius = '0px';
  try {
    borderRadius = getComputedStyle(el).borderRadius || '0px';
  } catch {}
  const aspectRatio = rect.height > 0 ? rect.width / rect.height : 1;
  return {
    rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
    posterUrl: posterUrl ?? null,
    borderRadius,
    aspectRatio,
  };
}

interface OpenWithOriginArgs {
  posts: FeedPost[];
  index: number;
  originEl: HTMLElement | null | undefined;
  posterUrl: string | null | undefined;
  /**
   * Watch tiles rent a `rail-*` lane via `RailLanePool`. Passing the tile's
   * owner key lets us resume fullscreen at that lane's live playhead — so
   * tapping a tile playing at 8s opens fullscreen at 8s, not 0.
   */
  railOwnerKey?: string | null;
  /** Which media within the opening post to render on the opening slide.
   *  Positional fallback — `mediaId` (below) is authoritative because grouping
   *  reorders / dedupes mediaItems. Default 0 → identical behavior for
   *  existing callers. */
  mediaIndex?: number;
  /** Stable media item id — resolved against the grouped post's mediaItems on
   *  the opening slide. Preferred over the positional `mediaIndex`. */
  mediaId?: string | null;
  /** REQUIRED surface tag. See fullscreenFeedStore's `useIsViewerOwnedBy`. */
  openedFrom: string;

  options?: {
    openCommentsInitially?: boolean;
    initialCommentId?: string | null;
    onClose?: () => void;
    hasNextPage?: boolean;
    fetchNextPage?: () => void;
    isFetchingNextPage?: boolean;
    readOnly?: boolean;
  };
}

export function openWithOrigin({
  posts,
  index,
  originEl,
  posterUrl,
  railOwnerKey,
  mediaIndex,
  mediaId,
  openedFrom,
  options,
}: OpenWithOriginArgs): void {

  const origin = snapshotOrigin(originEl, posterUrl ?? null);
  const postId = (posts[index] as any)?.id ?? null;

  // [VPERF] S1 fs.open — captured at tap. Kind budget picked once source is
  // known (borrow vs lane). Phases: storeOpen → slotMount → firstFrame → playing.
  const fsOpenSpanId = vperfNextId(`fs.open:${postId ?? 'unknown'}`);
  vperfStart(fsOpenSpanId, 'fs.open', {
    surface: openedFrom,
    postId,
    // budgetMs set below once borrow decision is known.
  });



  // ── Stage-7 PR-1: borrow decision ──
  // If the tapped tile is currently holding a live rail-pool lane for THIS
  // post, borrow the element: pin the lane in the pool, hand a descriptor to
  // the store, and skip the startPosition ladder entirely (the element keeps
  // playing — no seek required). Non-borrow openers (deep links, image
  // posts, cold tiles) fall through to today's ladder.
  let borrow: BorrowDescriptor | null = null;
  if (railOwnerKey && postId) {
    try {
      const liveLane = RailLanePool.laneFor(railOwnerKey);
      if (liveLane) {
        borrow = {
          laneId: liveLane,
          ownerKey: railOwnerKey,
          postId,
          posterUrl: posterUrl ?? null,
          viewportW: typeof window !== 'undefined' ? window.innerWidth : 0,
          viewportH: typeof window !== 'undefined' ? window.innerHeight : 0,
        };
        RailLanePool.pin(liveLane);
        VideoEngine.markBorrowed(liveLane);
        BORROW_DBG('pin', { ownerKey: railOwnerKey, laneId: liveLane, postId });
      }
    } catch {
      /* pool not ready — no borrow */
    }
  }

  // ── Stage-7 PR-2: feed-active borrow decision ──
  // If no rail borrow was taken and the singleton `feed-active` lane is
  // currently playing this post's media, borrow that element instead of
  // opening a fresh `fullscreen` lane. No pool interaction — feed-active is
  // not a pool lane. Cold/parked feed lanes fall through to the ladder.
  if (!borrow && postId) {
    try {
      const snap = VideoEngine.snapshot('feed-active');
      const candidateOwnerKey = `${postId}:${mediaIndex ?? 0}`;
      const owns =
        snap.postId != null &&
        (snap.postId === candidateOwnerKey ||
          snap.postId === postId ||
          snap.postId.startsWith(postId + ':'));
      const isLive =
        (snap.state === 'playing' || snap.state === 'ready') && snap.currentTime > 0;
      if (owns && isLive) {
        borrow = {
          laneId: 'feed-active',
          ownerKey: snap.postId ?? candidateOwnerKey,
          postId,
          posterUrl: posterUrl ?? null,
          viewportW: typeof window !== 'undefined' ? window.innerWidth : 0,
          viewportH: typeof window !== 'undefined' ? window.innerHeight : 0,
          wasMuted: snap.muted,
        };
        VideoEngine.markBorrowed('feed-active');
        BORROW_DBG('mount', {
          source: 'feed-active',
          ownerKey: borrow.ownerKey,
          postId,
          wasMuted: snap.muted,
        });
      }
    } catch {
      /* engine may not be booted yet on deep-link openers */
    }
  }

  // Two-way resume: prefer the tile's live rail-lane playhead (Watch tap),
  // then the feed-active lane (Clubhouse tap), then the engine's session
  // lastPos map. Skipped entirely for borrow opens (element carries state).
  let startPosition = 0;
  let startSource: 'railLane' | 'feedSnap' | 'lastPos' | 'zero' | 'borrow' = 'zero';
  let railLaneCT = -1;
  let feedSnapCT = -1;
  let lastPosCT = -1;
  if (borrow) {
    startSource = 'borrow';
  } else {
    try {
      if (railOwnerKey) {
        railLaneCT = RailLanePool.getCurrentTime(railOwnerKey);
        if (railLaneCT > 0.1) {
          startPosition = railLaneCT;
          startSource = 'railLane';
        }
      }
      if (startSource === 'zero') {
        const feedSnap = VideoEngine.snapshot('feed-active');
        feedSnapCT = feedSnap.currentTime;
        // Ownership gate: only inherit the feed-active playhead when that
        // lane is currently loaded for THIS post. lane.postId is written raw
        // (either bare postId or `${postId}:${mediaIndex}` ownerKey depending
        // on which entry point wrote last) — match exact OR `${postId}:` prefix.
        const owns =
          feedSnap.postId != null &&
          postId != null &&
          (feedSnap.postId === postId || feedSnap.postId.startsWith(postId + ':'));
        if (owns && feedSnap.currentTime > 0) {
          startPosition = feedSnap.currentTime;
          startSource = 'feedSnap';
        } else if (postId) {
          lastPosCT = VideoEngine.getLastPos(postId);
          startPosition = lastPosCT;
          startSource = 'lastPos';
        }
      }
    } catch {
      /* engine may not be booted yet on deep-link openers */
    }
  }

  // Chrome flip at TAP time (not effect time) to kill the strobe. Scroll
  // lock is owned by the overlay's isOpen effect (ref-counted so it composes
  // cleanly with CommentsSheet stacking on top).
  try {
    (window as any).median?.statusbar?.set({
      style: 'dark',
      color: '00000000',
      overlay: true,
      blur: false,
    });
  } catch {}

  useFullscreenFeedStore.getState().open(posts, index, {
    ...(options ?? {}),
    origin,
    startPosition,
    mediaIndex: mediaIndex ?? 0,
    mediaId: mediaId ?? null,
    openedFrom,
    borrow,
  });

  // [VPERF] end of the synchronous open() call — mark storeOpen phase and
  // arm the target lane's next 'playing' event to close the span.
  vperfMark(fsOpenSpanId, 'storeOpen');
  const source: 'borrow' | 'lane' = borrow ? 'borrow' : 'lane';
  vperfMeta(fsOpenSpanId, { source });
  vperfSetBudget(fsOpenSpanId, source === 'borrow' ? 150 : 500);
  const targetLaneId: string = borrow ? borrow.laneId : 'fullscreen';
  vperfArmLane(targetLaneId, { spanId: fsOpenSpanId, endOn: 'firstFrame', phase: 'firstFrame' });
  vperfArmLane(targetLaneId, { spanId: fsOpenSpanId, endOn: 'playing' });

  // [VPERF] fs.open motion trace — borrow opens only (the reported screen
  // jolt is tile→fullscreen FLIP). originRect is captured pre-mount so it's
  // comparable against frame 0 of the trace; a stale/incorrect origin rect
  // is a prime suspect for the jump.
  if (borrow) {
    vperfMotionTrace(fsOpenSpanId, { originRect: origin?.rect ?? null });
  }
}



