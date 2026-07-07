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
import { setStatusBarStyleColor } from '@/hooks/useMedianStatusBar';


const BORROW_DBG = (evt: string, payload: Record<string, unknown> = {}) => {
  const flag =
    typeof window !== 'undefined' && (window as any).__VIDEO_ENGINE_DBG__;
  if (!flag && !isPerfEnabled()) return;
  // eslint-disable-next-line no-console
  console.info('[BORROW]', evt, payload);
};

// [DECIDE] instrumentation — borrow-decision + resume-ladder tracing.
// Emits on EVERY outcome (success AND deny), isPerfEnabled-gated, one line
// each. No behaviour changes — logging only.
const DECIDE = (evt: string, payload: Record<string, unknown> = {}) => {
  if (!isPerfEnabled()) return;
  // eslint-disable-next-line no-console
  console.info('[DECIDE]', evt, payload);
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
  mediaDims?: { w: number; h: number } | null,
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
  const mw = mediaDims && mediaDims.w > 0 ? mediaDims.w : 0;
  const mh = mediaDims && mediaDims.h > 0 ? mediaDims.h : 0;
  return {
    rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
    posterUrl: posterUrl ?? null,
    borderRadius,
    aspectRatio,
    originMediaW: mw,
    originMediaH: mh,
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

  // Resolve the tapped media's intrinsic dims from the post's mediaItems so
  // the FLIP clone can grow into the correct resting rect on GRID surfaces
  // (course media / explore / watch), where the tile aspect is uniform and
  // cover-crops the media — origin.aspectRatio would otherwise mis-shape the
  // clone. Prefer mediaId (grouping-safe); fall back to mediaIndex.
  const openingPost = posts[index] as any;
  let mediaDims: { w: number; h: number } | null = null;
  try {
    const items = openingPost?.mediaItems as Array<{ id?: string; width?: number; height?: number }> | undefined;
    if (items && items.length) {
      let item: { id?: string; width?: number; height?: number } | undefined;
      if (mediaId) item = items.find((m) => m?.id === mediaId);
      if (!item) item = items[mediaIndex ?? 0];
      const w = Number(item?.width) || 0;
      const h = Number(item?.height) || 0;
      if (w > 0 && h > 0) mediaDims = { w, h };
    }
  } catch {}

  const origin = snapshotOrigin(originEl, posterUrl ?? null, mediaDims);
  const postId = openingPost?.id ?? null;

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
      DECIDE('borrow.rail', {
        ownerKey: railOwnerKey,
        poolLane: liveLane ?? null,
        outcome: liveLane ? 'borrow' : 'no-lane',
      });
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
      const tappedIdx = mediaIndex ?? 0;
      const tappedOwnerKey = `${postId}:${tappedIdx}`;
      // Exact-slide gate: borrow only when the lane's ownerKey matches the
      // tapped slide's ownerKey exactly, OR when the lane wrote a bare postId
      // (single-media convention) AND the tap targets slide 0. Prevents a
      // playing slide 5 from being borrowed by a tap on slide 2 of the same
      // post — that's a lane open on the tapped media, not a borrow.
      const owns =
        snap.postId != null &&
        (snap.postId === tappedOwnerKey ||
          (snap.postId === postId && tappedIdx === 0));
      const ctGate = snap.currentTime > 0;
      const stateGate = snap.state === 'playing' || snap.state === 'ready';
      const isLive = stateGate && ctGate;
      const deniedBy: 'owns' | 'state' | 'ct' | 'no-snap' | null = !snap.postId
        ? 'no-snap'
        : !owns
          ? 'owns'
          : !stateGate
            ? 'state'
            : !ctGate
              ? 'ct'
              : null;
      DECIDE('borrow.feed', {
        postId,
        ownerKey: tappedOwnerKey,
        tappedOwnerKey,
        snapPostId: snap.postId,
        snapState: snap.state,
        snapCt: +snap.currentTime.toFixed(3),
        snapUrl: !!(snap as any).hlsUrl,
        owns,
        ctGate,
        stateGate,
        outcome: owns && isLive ? 'borrow' : 'denied',
        deniedBy,
      });
      if (owns && isLive) {
        borrow = {
          laneId: 'feed-active',
          ownerKey: snap.postId ?? tappedOwnerKey,
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

  if (!borrow) {
    DECIDE('borrow.skip', {
      hasOriginEl: !!originEl,
      railOwnerKey: railOwnerKey ?? null,
      postId,
      mediaId: mediaId ?? null,
      surface: openedFrom,
    });
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

  // [DECIDE] resume ladder — one line, every open. Records what each rung
  // reported and which one won (or 'zero'/'borrow' for the borrow branch).
  {
    let feedSnapPostId: string | null = null;
    let feedSnapOwns = false;
    if (!borrow) {
      try {
        const s = VideoEngine.snapshot('feed-active');
        feedSnapPostId = s.postId;
        feedSnapOwns =
          s.postId != null &&
          postId != null &&
          (s.postId === postId || s.postId.startsWith(postId + ':'));
      } catch {}
    }
    DECIDE('resume.ladder', {
      postId,
      ownerKey: railOwnerKey ?? null,
      rungs: {
        borrow: borrow ? 'taken' : 'skipped',
        railLane: {
          available: !!railOwnerKey,
          ct: railLaneCT >= 0 ? +railLaneCT.toFixed(3) : null,
        },
        feedSnap: {
          snapPostId: feedSnapPostId,
          owns: feedSnapOwns,
          ct: feedSnapCT >= 0 ? +feedSnapCT.toFixed(3) : null,
          used: startSource === 'feedSnap',
        },
        lastPos: {
          key: postId,
          hit: lastPosCT > 0,
          ct: lastPosCT >= 0 ? +lastPosCT.toFixed(3) : null,
          fallbackKeyTried: false,
        },
      },
      chosen: startSource,
      startPosition: +startPosition.toFixed(3),
    });
  }

  // Chrome flip at TAP time (not effect time) to kill the strobe. Scroll
  // lock is owned by the overlay's isOpen effect (ref-counted so it composes
  // cleanly with CommentsSheet stacking on top).
  //
  // NOTE: overlay flag is boot-locked (see ensureStatusBarOverlayBooted in
  // useMedianStatusBar.ts). We only push style + color here to avoid the
  // async WebView viewport resize that caused the fs.open jolt.
  try {
    setStatusBarStyleColor('dark', '00000000');
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



