/**
 * Phase 3 shared-element expand transition helper.
 *
 * A single entry point tile openers call at tap time. It synchronously:
 *   1) Snapshots the origin element geometry (rect, radius, aspect, poster).
 *   2) Locks body scroll (ref-counted so it composes with CommentsSheetV2).
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
import { feedLaneRoles } from '@/video/feedLaneRoles';
import { RailLanePool } from '@/video/railLanePool';
import { PrefetchController } from '@/video/PrefetchController';

import { isPerfEnabled } from '@/perf/navTiming';
import { vperfStart, vperfMark, vperfArmLane, vperfNextId, vperfSetBudget, vperfMeta, vperfMotionTrace, vperfEnd } from '@/perf/vperf';
import { coldOpenRoute } from '@/perf/coldOpen';
import { trace, traceGenId, traceRegisterOpen, elIdOf } from '@/perf/trace';
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
  // [BASELINE] tally the decision outcome per event for the scorecard.
  try {
    const outcome = String((payload as any).outcome ?? (payload as any).deniedBy ?? evt);
    import('@/perf/vperf').then((m) => m.vperfDecideTally(evt, outcome)).catch(() => {});
  } catch {}
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
  mediaType?: 'video' | 'image' | null,
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
    mediaType: mediaType ?? undefined,
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
  /** Deliberate gallery opens start at frame zero instead of inheriting a prior session playhead. */
  forceStartAtZero?: boolean;

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
  forceStartAtZero = false,
  options,
}: OpenWithOriginArgs): void {

  // [TRACE] correlation id — one openId per open, threaded through every
  // downstream layer via traceLookup on ownerKey/postId. Gated on
  // isPerfEnabled inside trace().
  const openId = traceGenId();
  const originElForTap: any = originEl ?? null;
  // Register the open BEFORE any layer runs so early load() traces can find it.
  const openingPostForTap: any = posts[index];
  const postIdEarly: string | null = openingPostForTap?.id ?? null;
  traceRegisterOpen({
    openId,
    surface: openedFrom,
    ownerKey: railOwnerKey ?? (postIdEarly ? `${postIdEarly}:${mediaIndex ?? 0}` : null),
    postId: postIdEarly,
    startedAt: performance.now(),
  });
  trace('tap', {
    openId,
    surface: openedFrom,
    postId: postIdEarly,
    ownerKeyPassed: null,
    railOwnerKeyPassed: railOwnerKey ?? null,
    hasOriginEl: !!originElForTap,
    originElId: elIdOf(originElForTap),
    mediaIndex: mediaIndex ?? 0,
    mediaId: mediaId ?? null,
  });

  // Resolve the tapped media's intrinsic dims from the post's mediaItems so
  // the FLIP clone can grow into the correct resting rect on GRID surfaces
  // (course media / explore / watch), where the tile aspect is uniform and
  // cover-crops the media — origin.aspectRatio would otherwise mis-shape the
  // clone. Prefer mediaId (grouping-safe); fall back to mediaIndex.
  const openingPost = posts[index] as any;
  let mediaDims: { w: number; h: number } | null = null;
  let mediaKind: 'video' | 'image' | null = null;
  try {
    const items = openingPost?.mediaItems as Array<{ id?: string; width?: number; height?: number; type?: 'video' | 'image' }> | undefined;
    if (items && items.length) {
      let item: { id?: string; width?: number; height?: number; type?: 'video' | 'image' } | undefined;
      if (mediaId) item = items.find((m) => m?.id === mediaId);
      if (!item) item = items[mediaIndex ?? 0];
      const w = Number(item?.width) || 0;
      const h = Number(item?.height) || 0;
      if (w > 0 && h > 0) mediaDims = { w, h };
      if (item?.type === 'video' || item?.type === 'image') mediaKind = item.type;
    }
  } catch {}

  const origin = snapshotOrigin(originEl, posterUrl ?? null, mediaDims, mediaKind);
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
      // Readiness gate: a rail lane is borrow-eligible only when its element
      // is genuinely playable. `firstFrame` alone can be a phantom (fires on
      // timeupdate at ct=0 / readyState=0 on iOS HLS) — borrowing such a lane
      // stalls the fullscreen open ~1.4s waiting for real decode. A prefetched
      // cold open on this same tile is ~100ms, so a not-ready lane must fall
      // through to the cold path.
      let readySnap: ReturnType<typeof VideoEngine.snapshot> | null = null;
      let ready = false;
      let notReadyBy: 'readyState' | 'ct' | 'state' | null = null;
      if (liveLane) {
        readySnap = VideoEngine.snapshot(liveLane);
        const rsGate = readySnap.readyState >= 2; // HAVE_CURRENT_DATA
        const ctGate = readySnap.currentTime > 0;
        const stateGate = readySnap.state === 'playing' || readySnap.state === 'ready';
        ready = rsGate && ctGate && stateGate;
        notReadyBy = !rsGate ? 'readyState' : !ctGate ? 'ct' : !stateGate ? 'state' : null;
      }
      DECIDE('borrow.rail', {
        ownerKey: railOwnerKey,
        poolLane: liveLane ?? null,
        readyState: readySnap?.readyState ?? null,
        currentTime: readySnap ? +readySnap.currentTime.toFixed(3) : null,
        snapState: readySnap?.state ?? null,
        outcome: !liveLane ? 'no-lane' : ready ? 'borrow' : 'not-ready',
        notReadyBy,
      });
      if (liveLane && ready) {
        // BIND-TIME RE-VALIDATION: read the element LIVE one more time right
        // before commit. Catches post-decision drops (Safari/HLS rebind reset,
        // level switch, source swap racing the tap) that snap-time reads miss.
        // If the lane dropped, ABANDON the borrow — cold path (~100ms) beats
        // waiting multiple seconds on a lane that just went not-ready.
        const live = VideoEngine.isLivePlayable(liveLane);
        DECIDE('borrow.rail.bindCheck', {
          ownerKey: railOwnerKey,
          laneId: liveLane,
          readyState: live.readyState,
          currentTime: +live.currentTime.toFixed(3),
          paused: live.paused,
          outcome: live.playable ? 'commit' : 'abandon',
        });
        if (!live.playable) {
          // Fall through to cold path; do NOT pin/mark.
        } else {
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
      }
    } catch {
      /* pool not ready — no borrow */
    }
  }

  // ── Stage-7 PR-2 (PR-B role-aware): feed active-role borrow decision ──
  // Resolve the physical lane currently holding role='active' at TAP time
  // (rotation may have re-pointed it to any of the three feed lanes). If
  // that lane is actively playing this post's media, borrow its element
  // and FREEZE the physical lane out of role rotation for the duration
  // of the borrow — a rotation over a lane whose element is now in the
  // fullscreen viewer would violate the "no content in-use" invariant.
  if (!borrow && postId) {
    try {
      const activeLaneId = feedLaneRoles.laneForRole('active');
      const snap = VideoEngine.snapshot(activeLaneId);
      const tappedIdx = mediaIndex ?? 0;
      const tappedOwnerKey = `${postId}:${tappedIdx}`;
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
        activeLaneId,
        activeRole: feedLaneRoles.roleForLane(activeLaneId),
        outcome: owns && isLive ? 'borrow' : 'denied',
        deniedBy,
      });
      if (owns && isLive) {
        // BIND-TIME RE-VALIDATION (see rail branch above for rationale).
        const live = VideoEngine.isLivePlayable(activeLaneId);
        DECIDE('borrow.feed.bindCheck', {
          postId,
          laneId: activeLaneId,
          readyState: live.readyState,
          currentTime: +live.currentTime.toFixed(3),
          paused: live.paused,
          outcome: live.playable ? 'commit' : 'abandon',
        });
        if (live.playable) {
          borrow = {
            laneId: activeLaneId,
            ownerKey: snap.postId ?? tappedOwnerKey,
            postId,
            posterUrl: posterUrl ?? null,
            viewportW: typeof window !== 'undefined' ? window.innerWidth : 0,
            viewportH: typeof window !== 'undefined' ? window.innerHeight : 0,
          };

          VideoEngine.markBorrowed(activeLaneId);
          feedLaneRoles.freeze(activeLaneId);
          BORROW_DBG('mount', {
            source: 'feed-active-role',
            activeLaneId,
            ownerKey: borrow.ownerKey,
            postId,
          });
        }
      }
    } catch {
      /* engine may not be booted yet on deep-link openers */
    }
  }

  // [TRACE] decision — one line per open, always emitted, records whether
  // borrow was taken, denied, or unavailable.
  trace('decision', {
    openId,
    borrowAttempted: !!(railOwnerKey && postId),
    borrowResult: borrow ? 'borrow' : (railOwnerKey ? 'skip' : 'no-lane'),
    railOwnerKeyPassed: railOwnerKey ?? null,
    ownerKeyResolved: borrow?.ownerKey ?? (railOwnerKey ?? (postId ? `${postId}:${mediaIndex ?? 0}` : null)),
    willColdLoad: !borrow,
    hasOriginEl: !!originEl,
    surface: openedFrom,
  });

  if (!borrow) {
    DECIDE('borrow.skip', {
      hasOriginEl: !!originEl,
      railOwnerKey: railOwnerKey ?? null,
      postId,
      mediaId: mediaId ?? null,
      surface: openedFrom,
    });

    // [COLDOPEN] — non-borrow watch open with a rail owner key means the
    // tapped tile was NOT holding a live rail lane (or the pool no longer
    // has one). Fullscreen must cold-load. Start the cold trace so the
    // engine/overlay hooks can attach.
    if (railOwnerKey && postId) {
      try {
        const items = openingPost?.mediaItems as Array<{ hlsUrl?: string }> | undefined;
        const item = items?.[mediaIndex ?? 0];
        const hlsUrl = item?.hlsUrl;
        if (hlsUrl) {
          coldOpenRoute({
            ownerKey: railOwnerKey,
            hlsUrl,
            prefetched: PrefetchController.wasPrefetched(railOwnerKey),
          });
          trace('cold.route', {
            openId,
            ownerKeyIntoStore: railOwnerKey,
            postIdIntoStore: postId,
            hlsUrl,
          });
        } else {
          // Cold gate skipped because no manifest is available for the tapped
          // media (image row, still-processing video, or missing streamId).
          // Previously silent — surfaced here so device traces can classify
          // the "blank fullscreen" sub-case without ambiguity.
          trace('cold.skip', {
            openId,
            postId,
            surface: openedFrom,
            reason: 'no-hlsUrl',
            mediaIndex: mediaIndex ?? 0,
            hasItems: !!items?.length,
            itemType: (item as { type?: string } | undefined)?.type ?? null,
          });
        }
      } catch {
        /* trace-only */
      }
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
  if (forceStartAtZero) {
    startSource = 'zero';
  } else if (borrow) {
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
        // PR-B: resolve the physical lane currently holding the 'active' role.
        const feedSnap = VideoEngine.snapshot(feedLaneRoles.laneForRole('active'));
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
    if (!borrow && !forceStartAtZero) {
      try {
        const s = VideoEngine.snapshot(feedLaneRoles.laneForRole('active'));
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
  // cleanly with CommentsSheetV2 stacking on top).
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
  // arm the target lane's next 'firstFrame' event to close the span
  // (perceived open = frame painted). 'playing' is recorded as a LATER
  // waypoint for diagnostics; on iOS HLS it fires well after first paint
  // and must not close/extend the span.
  vperfMark(fsOpenSpanId, 'storeOpen');
  const source: 'borrow' | 'lane' = borrow ? 'borrow' : 'lane';
  const isImage = mediaKind === 'image';
  vperfMeta(fsOpenSpanId, { source, type: isImage ? 'image' : 'video' });
  if (isImage) {
    // Image path: 200ms to settled. Image branch has no lane events; settled
    // is marked by the overlay's clone onTransitionEnd (see FullscreenFeedOverlay).
    vperfSetBudget(fsOpenSpanId, 200);
    // Stash spanId globally so the overlay can mark image phases without prop plumbing.
    try { (window as any).__vperfFsOpenSpanId = fsOpenSpanId; } catch {}
  } else {
    vperfSetBudget(fsOpenSpanId, source === 'borrow' ? 150 : 500);
    const targetLaneId: string = borrow ? borrow.laneId : 'fullscreen';
    if (borrow) {
      // Borrow opens reuse an already-decoded, already-playing lane — the
      // engine's 'firstFrame' event only fires on a fresh decode, so arming
      // endOn:'firstFrame' here would never resolve and every borrow span
      // would hit the 15s watchdog (measurement artifact, not a real hang).
      // Perceived open for a borrow is tap → element bound into the fs host,
      // which happens on the next paint after storeOpen. Close the span at
      // that paint via rAF; record 'playing' as a later waypoint only.
      const raf =
        typeof requestAnimationFrame === 'function'
          ? requestAnimationFrame
          : (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16);
      raf(() => {
        vperfMark(fsOpenSpanId, 'borrowBind');
        vperfEnd(fsOpenSpanId, { closedBy: 'borrowBind' });
      });
      vperfArmLane(targetLaneId, { spanId: fsOpenSpanId, endOn: 'playing', phase: 'playing' });
    } else {
      // Cold opens do decode — firstFrame ENDS the span (perceived open).
      // playing is a waypoint AFTER.
      vperfArmLane(targetLaneId, { spanId: fsOpenSpanId, endOn: 'firstFrame' });
      vperfArmLane(targetLaneId, { spanId: fsOpenSpanId, endOn: 'playing', phase: 'playing' });
    }
  }

  // [VPERF] fs.open motion trace — borrow opens only (the reported screen
  // jolt is tile→fullscreen FLIP). originRect is captured pre-mount so it's
  // comparable against frame 0 of the trace; a stale/incorrect origin rect
  // is a prime suspect for the jump.
  if (borrow) {
    vperfMotionTrace(fsOpenSpanId, { originRect: origin?.rect ?? null });
  }
}



