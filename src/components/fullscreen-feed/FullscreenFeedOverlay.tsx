import React, { useEffect, useLayoutEffect, useCallback, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

import { AnimatePresence, motion } from 'framer-motion';
import { toast } from '@/lib/toast';
import { MoreOptionsDrawer } from '@/components/clubhouse/MoreOptionsDrawer';

import { useNavigate } from 'react-router-dom';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';

import { SnapFeed } from '@/components/feed/SnapFeed';
import { ClubhouseSkeletonShimmer } from '@/components/clubhouse/ClubhouseSkeletonShimmer';
import { track as trackImpression } from '@/lib/impressions/impressionTracker';

// NOTE: intentionally NOT using the shared bodyScrollLock. It freezes body at
// position:fixed; top:-scrollY. On iOS/WKWebView that offsets fixed descendants,
// so opening after page scroll leaves only a top strip of the fullscreen media
// visible. We instead toggle overflow/overscroll/touchAction on <html>+<body>
// which prevents page scroll without disturbing the fixed overlay's viewport.
function lockFullscreenViewportScroll(): () => void {
  if (typeof document === 'undefined') return () => {};
  const { body, documentElement: html } = document;
  const prev = {
    bodyOverflow: body.style.overflow,
    bodyOverscrollBehavior: body.style.overscrollBehavior,
    bodyTouchAction: body.style.touchAction,
    htmlOverflow: html.style.overflow,
    htmlOverscrollBehavior: html.style.overscrollBehavior,
    htmlTouchAction: html.style.touchAction,
  };
  body.style.overflow = 'hidden';
  body.style.overscrollBehavior = 'none';
  body.style.touchAction = 'none';
  html.style.overflow = 'hidden';
  html.style.overscrollBehavior = 'none';
  html.style.touchAction = 'none';
  return () => {
    body.style.overflow = prev.bodyOverflow;
    body.style.overscrollBehavior = prev.bodyOverscrollBehavior;
    body.style.touchAction = prev.bodyTouchAction;
    html.style.overflow = prev.htmlOverflow;
    html.style.overscrollBehavior = prev.htmlOverscrollBehavior;
    html.style.touchAction = prev.htmlTouchAction;
  };
}


import { ImmersiveFullscreenChrome } from '@/components/fullscreen-feed/ImmersiveFullscreenChrome';
import { FullscreenScrubber } from '@/components/fullscreen-feed/FullscreenScrubber';
import { CommentsSheetV2 } from '@/features/comments-v2/CommentsSheetV2';
import { useReviewSheetStore } from '@/stores/reviewSheetStore';
import { buildReviewSheetPayload } from '@/components/posts/buildReviewSheetPayload';
import { useReviewerStats } from '@/hooks/useReviewerStats';
import { useClubhouseLikes } from '@/components/clubhouse/hooks/useClubhouseLikes';
import { useClubhouseFollows } from '@/components/clubhouse/hooks/useClubhouseFollows';
import { useClubhouseComments } from '@/components/clubhouse/hooks/useClubhouseComments';
import { useClubhouseShare } from '@/components/clubhouse/hooks/useClubhouseShare';
import { useActivePostDerived } from '@/components/clubhouse/hooks/useActivePostDerived';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useManageableBusinessIds } from '@/hooks/useManageableBusinessIds';
import { canManagePost } from '@/lib/canManagePost';
import { getActorRouteByType } from '@/types/actor';


import { isPerfEnabled } from '@/perf/navTiming';
import { coldOpenRevealSample, coldOpenIsActive } from '@/perf/coldOpen';
import { VideoEngine } from '@/video/VideoEngine';
import { useSessionAudio } from '@/audio/sessionAudioStore';
import { TapForSoundPill } from '@/audio/MuteButton';
import { feedLaneRoles } from '@/video/feedLaneRoles';
import { RailLanePool } from '@/video/railLanePool';
import { originHostRegistry } from '@/video/originHostRegistry';
import type { BorrowDescriptor } from '@/store/fullscreenFeedStore';
import { setStatusBarStyleColor } from '@/hooks/useMedianStatusBar';
import { applyRouteChrome } from '@/lib/routeChrome';
import { useSetChromeSuppressed } from '@/features/chrome-v2/leftOverride';
import { resolveRestingRect, getCurrentViewport, readRawViewportSnapshot } from '@/lib/media/resolveRestingRect';
import { FS_TRANSITION_MODE, FS_CUT_FADE_MS } from '@/lib/media/transitionMode';
import { FS_OVERLAY_Z } from '@/lib/zLayers';
import { trace as perfTrace } from '@/perf/trace';
import { vperfCloseMotionMark } from '@/perf/vperf';



const fsTimeStart = (_label: string) => {};
const fsTimeEnd = (_label: string, _note?: string) => {};
const fsEvent = (_label: string, _data?: unknown) => {};

const BORROW_DBG = (evt: string, payload: Record<string, unknown> = {}) => {
  const flag =
    typeof window !== 'undefined' && (window as any).__VIDEO_ENGINE_DBG__;
  if (!flag && !isPerfEnabled()) return;
  // eslint-disable-next-line no-console
  console.info('[BORROW]', evt, payload);
};

/**
 * Return / demote a live borrow. Called from three sites:
 *  - vertical swipe away from the opening slide (demote — one-shot borrow)
 *  - explicit close (return: FLIP-back into origin tile if registered, else park)
 *  - overlay unmount w/o close (route change edge)
 * All paths unmount from the current wrapper, re-mount into the destination
 * host (or the hidden host as fallback), re-mute (rails are always muted),
 * unpin the pool, and clear the store's borrow descriptor.
 */
function returnBorrow(borrow: BorrowDescriptor, reason: 'close' | 'route' | 'demote'): void {
  // Clear the engine-side borrow flag FIRST so the return sequence's pauses /
  // remounts / releases route through the normal owner-guard path again.
  try { VideoEngine.clearBorrowed(borrow.laneId); } catch {}
  // PR-B: if this was a feed physical lane, unfreeze it — it rejoins role
  // rotation at role='prev' (the safe slot, recycled on next opposite-
  // direction rotation without disturbing the current active card).
  // Applies to demote AND close: the demote path releases the lane back to
  // the feed while fullscreen stays open; close returns it fully.
  try {
    if (feedLaneRoles.isFeedLane(borrow.laneId)) {
      feedLaneRoles.unfreeze(borrow.laneId, 'prev');
    }
  } catch {}
  // Stage-7 PR-2: lane-kind switch. Rail lanes (rail-*) are pool-managed and
  // always re-mute on return. Feed-active is a singleton, no pool, and
  // restores the pre-borrow mute state.
  const isRail = borrow.laneId.startsWith('rail-');
  const originHost = reason === 'demote' ? null : originHostRegistry.get(borrow.ownerKey);
  const viewportChanged =
    typeof window !== 'undefined' &&
    (window.innerWidth !== borrow.viewportW || window.innerHeight !== borrow.viewportH);
  // Mute policy: rails force-mute; feed-active follows the current session
  // mute (B2 — unmute in fullscreen now travels back to the feed via the
  // session store rather than being clobbered by a pre-borrow snapshot).
  try {
    const targetMuted = isRail ? true : useSessionAudio.getState().isMuted;
    VideoEngine.setMuted(borrow.laneId, targetMuted);
  } catch {}
  // Reset object-fit to cover for the tile's aspect.
  try { VideoEngine.setObjectFit(borrow.laneId, 'cover'); } catch {}
  if (reason !== 'demote' && originHost && !viewportChanged) {
    try {
      VideoEngine.mountLane(borrow.laneId, originHost);
      try { vperfCloseMotionMark('laneRemounted', { lane: borrow.laneId, op: 'mount-origin' }); } catch {}
      // Live-tile return.
      //  - Rail: DO NOT execute the deferred release — the tile will re-acquire
      //    this exact lane (coalesced) as soon as the autoplay gate lifts, and
      //    tearing the source down would blank + reload the tile.
      //  - Feed-active: no pool interaction at all.
      let hadPendingRelease = false;
      if (isRail) {
        hadPendingRelease = RailLanePool.unpin(borrow.laneId, { executeDeferred: false });
        // Return complete — lane may be re-acquired for new opens again.
        RailLanePool.clearReturning(borrow.laneId);
      }
      BORROW_DBG('return.animate', {
        laneId: borrow.laneId, ownerKey: borrow.ownerKey, postId: borrow.postId,
        hadPendingRelease, kind: isRail ? 'rail' : 'feed',
      });
      return;
    } catch {
      /* fall through to park */
    }
  }
  // Park in hidden host (unmountLane) then unpin (rails only). Any deferred
  // release fires on rails.
  try { VideoEngine.unmountLane(borrow.laneId); } catch {}
  // Pause the parked lane so the hidden host doesn't keep decoding / drifting.
  // clearBorrowed already ran, so this pause routes through the owner-guard path.
  // Applies to demote AND target-gone fallback. Close-later still resumes (element
  // state is preserved; the resume path skips reload and calls play()).
  try { VideoEngine.pause(borrow.laneId, { callerPostId: borrow.ownerKey }); } catch {}
  let hadPendingRelease = false;
  if (isRail) {
    hadPendingRelease = RailLanePool.unpin(borrow.laneId, { executeDeferred: true });
    // Fallback / demote path also completes any pending "returning" state.
    RailLanePool.clearReturning(borrow.laneId);
  }
  BORROW_DBG(reason === 'demote' ? 'unpin' : 'return.fallback', {
    laneId: borrow.laneId, ownerKey: borrow.ownerKey, postId: borrow.postId,
    reason, originAlive: !!originHost, tileHostFound: !!originHost,
    viewportChanged, hadPendingRelease, kind: isRail ? 'rail' : 'feed',
  });
}


export function FullscreenFeedOverlay() {
  const navigate = useNavigate();
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;
  const { isOpen, posts, startIndex, activeIndex, close, setActiveIndex, openCommentsInitially, consumeOpenCommentsInitially, initialCommentId, consumeInitialCommentId } = useFullscreenFeedStore();

  // Fullscreen viewer owns the whole screen: unmount the chrome island
  // (top-left capsule + top-right cluster) while open. Restores on close/
  // unmount automatically (the hook resets to false on cleanup).
  useSetChromeSuppressed(isOpen);
  const hasNextPage = useFullscreenFeedStore(s => s.hasNextPage);
  const fetchNextPage = useFullscreenFeedStore(s => s.fetchNextPage);
  const isFetchingNextPage = useFullscreenFeedStore(s => s.isFetchingNextPage);
  const readOnly = useFullscreenFeedStore(s => s.readOnly);
  const origin = useFullscreenFeedStore(s => s.origin);
  const borrow = useFullscreenFeedStore(s => s.borrow);
  const clearBorrow = useFullscreenFeedStore(s => s.clearBorrow);
  const borrowDemoteRequested = useFullscreenFeedStore(s => s.borrowDemoteRequested);
  const consumeBorrowDemoteRequested = useFullscreenFeedStore(s => s.consumeBorrowDemoteRequested);
  const closeAnim = useFullscreenFeedStore(s => s.closeAnim);
  const closeAnimDone = useFullscreenFeedStore(s => s.closeAnimDone);
  const beginCloseAnim = useFullscreenFeedStore(s => s.beginCloseAnim);
  const signalCloseAnimDone = useFullscreenFeedStore(s => s.signalCloseAnimDone);

  // Autoplay-blocked → "Tap for sound" pill above the scrubber. Fires when
  // the engine's unmuted play() is rejected on the 'fullscreen' lane (or
  // the borrowed rail lane) and we degrade to muted playback. Any unmute
  // (from this pill, MuteButton, MediaPreviewViewer) clears it.
  const [showSoundPill, setShowSoundPill] = useState(false);
  useEffect(() => {
    if (!isOpen) setShowSoundPill(false);
  }, [isOpen, activeIndex]);
  useEffect(() => {
    const unsub = VideoEngine.onAutoplayBlocked(() => {
      if (isOpen) setShowSoundPill(true);
    });
    return unsub;
  }, [isOpen]);
  useEffect(() => {
    const unsub = useSessionAudio.subscribe((s) => {
      if (!s.isMuted) setShowSoundPill(false);
    });
    return unsub;
  }, []);

  // ── [TRACE] fsLane.at.open + origin.lost ──────────────────────────────
  // fsLane.at.open: on every false→true transition of isOpen, snapshot the
  // 'fullscreen' lane's currently-bound element + snapshot postId. Lets us
  // tell whether v4 is a fresh fall-through mount or stale residue from a
  // prior open (hypothesis #3). origin.lost: log the first non-null→null
  // transition of store.origin during the open — the origin-race check.
  useEffect(() => {
    const trace = perfTrace;

    let currentOpenId: string | null = null;
    let lastIsOpen = false;
    let lastOrigin: unknown = null;
    const unsub = useFullscreenFeedStore.subscribe((s) => {
      // fsLane.at.open on false→true
      if (s.isOpen && !lastIsOpen) {
        currentOpenId = `fs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
        try {
          const snap = VideoEngine.snapshot('fullscreen');
          const el = document.querySelector('video[data-lane-id="fullscreen"]') as HTMLVideoElement | null;
          const boundElId = (el?.dataset as any)?.vid ?? null;
          const vpSnap = readRawViewportSnapshot();
          trace('fsLane.at.open', {
            openId: currentOpenId,
            boundElId,
            snapshotPostId: snap.postId,
            snapshotFirstFrame: snap.firstFrame,
            hlsUrl: !!(el?.src || (el as any)?.currentSrc),
            hasOrigin: s.origin != null,
            hasBorrow: s.borrow != null,
            borrowPostId: s.borrow?.postId ?? null,
            ...vpSnap,
          });
        } catch {}
      }
      if (!s.isOpen && lastIsOpen) currentOpenId = null;
      // origin.lost while open
      if (s.isOpen && lastOrigin != null && s.origin == null) {
        try {
          trace('origin.lost', {
            openId: currentOpenId,
            atMs: Date.now(),
            reason: 'store.origin transitioned non-null → null while isOpen',
          });
        } catch {}
      }
      lastIsOpen = s.isOpen;
      lastOrigin = s.origin;
    });
    return unsub;
  }, []);

  // Snapshot borrow so the isOpen-cleanup path can run the return even after
  // close() has cleared the store's borrow field synchronously.
  const borrowRef = useRef<BorrowDescriptor | null>(null);
  useEffect(() => { borrowRef.current = borrow; }, [borrow]);


  // ── Swipe-away demotion (A1c: borrow is a one-shot property of the tap) ──
  // When the user swipes vertically off the opening slide, unmount the
  // borrowed lane, unpin, and clear the store's borrow so the opening slide
  // (on swipe-back) takes the standard 'fullscreen' lane path via lastPos.
  useEffect(() => {
    if (!isOpen) return;
    if (!borrow) return;
    if (activeIndex === startIndex) return;
    returnBorrow(borrow, 'demote');
    borrowRef.current = null;
    clearBorrow();
  }, [isOpen, borrow, activeIndex, startIndex, clearBorrow]);

  // ── Stage-7 PR-3: carousel-demote (first horizontal swipe on borrow slide)
  // FeedSlide's inner media pager calls demoteBorrow() → sets the flag.
  // Idempotent with the vertical-swipe demote above: the `if (!borrow)` guard
  // makes the second trigger a no-op.
  useEffect(() => {
    if (!borrowDemoteRequested) return;
    const b = borrowRef.current;
    if (b) {
      BORROW_DBG('carousel-demote', {
        ownerKey: b.ownerKey,
        laneId: b.laneId,
        postId: b.postId,
      });
      returnBorrow(b, 'demote');
      borrowRef.current = null;
      clearBorrow();
    }
    consumeBorrowDemoteRequested();
  }, [borrowDemoteRequested, clearBorrow, consumeBorrowDemoteRequested]);

  // ── Reverse-close clone (non-borrow branch) ──
  // Mirrors the open's forward clone: at close intent we mount a poster clone
  // AT the resting rect and animate it back to the origin tile's rect while
  // the blur/scrim backdrop fades OUT and the black overlay wash retreats.
  // Fires signalCloseAnimDone on transitionend (or 500ms watchdog).
  const [reverseClone, setReverseClone] = useState<
    | null
    | { from: { top: number; left: number; width: number; height: number };
        to:   { top: number; left: number; width: number; height: number };
        posterUrl: string; borderRadius: string; }
  >(null);
  const [reverseCollapsed, setReverseCollapsed] = useState(false);
  const closeWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeCompletedRef = useRef(false);

  // Wrap close so borrow-return runs BEFORE the store clears its fields.
  // All in-overlay callers (ESC, top-action-bar close, deep-link back) should
  // route through this. Route-change navigation that bypasses close still
  // gets handled by the isOpen-effect cleanup below (using borrowRef).
  // Carries the close REASON across the animated-close tail, where the actual
  // store close() runs later from the closeAnimDone effect.
  const closeInfoRef = useRef<{ reason?: 'navigating' } | undefined>(undefined);
  const handleClose = useCallback((info?: { reason?: 'navigating' }) => {
    closeInfoRef.current = info;
    if (closeAnim !== 'idle') return; // animation already in flight
    const b = borrowRef.current;
    const o = origin;
    const sameSlide = activeIndex === startIndex;

    // Instant fallback path (matches today's behaviour byte-for-byte):
    //  • demoted slide (activeIndex !== startIndex)
    //  • no origin descriptor (deep-link / notification opens)
    //  • borrow with a missing origin host in the registry (target gone /
    //    tile evicted / viewport rotated).
    const viewportChanged =
      b && typeof window !== 'undefined' &&
      (window.innerWidth !== b.viewportW || window.innerHeight !== b.viewportH);
    const borrowOriginAlive = !!(b && originHostRegistry.get(b.ownerKey) && !viewportChanged);
    // CUT mode: always take the instant handback path. Borrow closes still
    // run returnBorrow('close') → live tile inherits the element; non-borrow
    // closes short-fade the overlay via AnimatePresence exit.
    const canAnimate =
      FS_TRANSITION_MODE === 'expand' &&
      sameSlide && (
        (b && borrowOriginAlive) ||
        (!b && o && !!o.posterUrl)
      );


    if (!canAnimate) {
      if (b) {
        // Handoff audio focus BEFORE close() flips fsOpen. Otherwise the
        // reconciler runs in the non-fullscreen branch, finds no focus, and
        // force-mutes the lane that just returned to the inline feed —
        // producing an audible mute→unmute stutter one tick later when
        // CardFeed's effect re-registers focus. Rails stay silent inline.
        if (!b.laneId.startsWith('rail-')) {
          try { VideoEngine.setAudioFocus(b.laneId, 'fs-close-handoff'); } catch {}
        }
        returnBorrow(b, 'close');
        borrowRef.current = null;
      }
      close(info);
      return;
    }


    // Animated symmetric close.
    if (b) {
      // BorrowedFullscreenSlot handles its own reverse motion when it sees
      // closeAnim === 'borrow'. Overlay just waits for closeAnimDone.
      // Reserve the rail lane for the duration of the flip-return animation:
      // during this window the pool must not hand it to any new open (borrow
      // or fresh acquire) — that's the 6s flip-return-race we hit before.
      // Cleared inside returnBorrow once mount-home completes.
      if (b.laneId.startsWith('rail-')) {
        try { RailLanePool.markReturning(b.laneId); } catch {}
      }
      beginCloseAnim('borrow');
    } else {
      // Non-borrow: mount reverse clone at the resting rect → tile rect.
      const vp = getCurrentViewport();
      const omw = o!.originMediaW ?? 0;
      const omh = o!.originMediaH ?? 0;
      const useMediaDims = omw > 0 && omh > 0;
      const ar = useMediaDims ? omw / omh : (o!.aspectRatio > 0 ? o!.aspectRatio : 0);
      const [mw, mh] = useMediaDims ? [omw, omh] : (ar > 0 ? [ar * 1000, 1000] : [0, 0]);
      const kind: 'video' | 'image' = o!.mediaType ?? 'image';
      const resting = resolveRestingRect(mw, mh, vp, kind);
      setReverseClone({
        from: { top: resting.top, left: resting.left, width: resting.width, height: resting.height },
        to:   { top: o!.rect.top, left: o!.rect.left, width: o!.rect.width, height: o!.rect.height },
        posterUrl: o!.posterUrl ?? '',
        borderRadius: o!.borderRadius,
      });
      setReverseCollapsed(false);
      beginCloseAnim('nonborrow');
      // rAF #2: commit collapsed=true on the frame after mount so the browser
      // interpolates FROM the resting rect (mirrors the forward clone rules).
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setReverseCollapsed(true));
      });
    }

    // Backstop watchdog: never trap the user behind a stalled transition.
    closeWatchdogRef.current = setTimeout(() => {
      signalCloseAnimDone();
    }, 500);
  }, [closeAnim, origin, activeIndex, startIndex, close, beginCloseAnim, signalCloseAnimDone]);

  // Finalize the animated close once the moving surface (borrow slot or the
  // non-borrow reverse clone) has signalled completion.
  useEffect(() => {
    if (!closeAnimDone) return;
    if (closeCompletedRef.current) return;
    closeCompletedRef.current = true;
    if (closeWatchdogRef.current) {
      clearTimeout(closeWatchdogRef.current);
      closeWatchdogRef.current = null;
    }
    const b = borrowRef.current;
    if (b) {
      // Synchronous audio-focus handoff — see comment in the instant-close
      // path above. Prevents the reconciler's non-fullscreen branch from
      // seeing "no audio focus" the instant close() flips fsOpen.
      if (!b.laneId.startsWith('rail-')) {
        try { VideoEngine.setAudioFocus(b.laneId, 'fs-close-handoff'); } catch {}
      }
      returnBorrow(b, 'close');
      borrowRef.current = null;
    }
    close(closeInfoRef.current);
    closeInfoRef.current = undefined;
  }, [closeAnimDone, close]);


  // Reset close-animation local state when the overlay is re-opened.
  useEffect(() => {
    if (isOpen) {
      closeCompletedRef.current = false;
      setReverseClone(null);
      setReverseCollapsed(false);
      // [BASELINE] image fs.open phases — mark blurMount + chromePaint on open.
      try {
        const sid: string | undefined = (window as any).__vperfFsOpenSpanId;
        if (sid) {
          import('@/perf/vperf').then((m) => {
            m.vperfImagePhase(sid, 'blurMount');
            requestAnimationFrame(() => m.vperfImagePhase(sid, 'chromePaint'));
          }).catch(() => {});
        }
      } catch {}
    }
  }, [isOpen]);





  // ── FLIP clone state ──
  // When origin is present, we mount a transform-only expanding poster clone
  // over the (opacity-0) SnapFeed and crossfade it out on first frame.
  const [cloneVisible, setCloneVisible] = useState(false);
  const [cloneExpanded, setCloneExpanded] = useState(false);
  const [firstFrameReady, setFirstFrameReady] = useState(false);
  // Split gates: motion clock (clone transitionend) vs child readiness clock
  // (video engine has painted the real first frame). For VIDEO opens we must
  // wait for both — revealing the host before the video paints exposes
  // FullscreenVideoSlot's poster→video 120ms crossfade as a post-settle flash.
  const [motionComplete, setMotionComplete] = useState(false);
  const [childReady, setChildReady] = useState(false);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use the real active actor (personal or business) so users in business
  // mode can like/comment/follow as their business from fullscreen. Falls
  // back to a personal-shaped object during auth loading.
  const { activeActor: ctxActor } = useActiveActor();
  const activeActor = ctxActor ?? { type: "personal" as const, id: userId ?? "" };
  const { handleLike, getActiveLikeState } = useClubhouseLikes({ userId, activeActor });
  const { followOverrides, handleFollow, handleFollowChange, getFollowState } = useClubhouseFollows({ userId });
  const { commentsOpen, overlayVisible, openComments, closeComments, getCommentCount } = useClubhouseComments();
  const safeOpenComments = useCallback(() => { if (!readOnly) openComments(); }, [readOnly, openComments]);
  const {
    handleShare,
    handleReport,
    handleNotInterested,
    moreOptionsOpen,
    setMoreOptionsOpen,
  } = useClubhouseShare(userId);
  const { activePost, golfCourse } = useActivePostDerived(posts, activeIndex);
  const manageableBusinessIds = useManageableBusinessIds(userId);
  const isOwnPost = canManagePost(
    activePost
      ? {
          userId: activePost.userId,
          actorType: activePost.actorType === 'business' ? 'business' : 'personal',
          actorId: activePost.actorId,
        }
      : null,
    userId,
    manageableBusinessIds,
  );
  const openReviewSheet = useReviewSheetStore((s) => s.open);
  const { data: reviewerStats } = useReviewerStats(activePost?.userId);

  // Phase 0 impression tracker — count each active fullscreen post view.
  useEffect(() => {
    if (!isOpen || !activePost?.id) return;
    trackImpression(activePost.id);
  }, [isOpen, activePost?.id]);

  // Watch-progress tracking lives inside SnapFeed (the actual video host),
  // which the overlay renders below.

  const handleViewProfile = useCallback(() => {
    if (!activePost) return;
    // 'navigating' — the deep-link page must not fire its own back-navigation,
    // otherwise the close and this profile jump fight and the close wins.
    handleClose({ reason: 'navigating' });
    navigate(getActorRouteByType(activePost.actorType, activePost.actorId), { state: activePost.actorType === 'business' ? { source: 'feed' } : undefined });
  }, [activePost, handleClose, navigate]);

  const handleReviewTap = useCallback(() => {
    if (!activePost) return;
    const payload = buildReviewSheetPayload(activePost, reviewerStats ?? null);
    if (!payload) return;
    openReviewSheet(payload);
  }, [activePost, openReviewSheet, reviewerStats]);

  // ESC to close — but defer to the review sheet if it's open on top.
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // If the review sheet is open on top of this overlay, let IT handle ESC first.
      const sheetIsOpen = useReviewSheetStore.getState().isOpen;
      if (sheetIsOpen) return;
      handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, handleClose]);

  // Deep-link entry: open comments sheet on mount when requested by the opener
  // (e.g. PostDeepLinkPage routing in from a notification tap).
  useEffect(() => {
    if (!isOpen) return;
    if (!openCommentsInitially) return;
    if (posts.length === 0) return;
    if (readOnly) { consumeOpenCommentsInitially(); return; }
    openComments();
    consumeOpenCommentsInitially();
    // One-shot clear of the initial comment id so post-swipes don't re-scroll
    // to the original notification target.
    const t = setTimeout(() => consumeInitialCommentId(), 1200);
    return () => clearTimeout(t);
  }, [isOpen, openCommentsInitially, posts.length, openComments, consumeOpenCommentsInitially, consumeInitialCommentId, readOnly]);

  // Body scroll lock + #root scroll preservation.
  //
  // useLayoutEffect (not useEffect) so lockBodyScroll + the #root scrollTop
  // restore + safe-area writes land BEFORE the overlay's first paint. The
  // page behind the (still-translucent) overlay never visibly moves.
  //
  // Open-side restore: rootEl.scrollTop is snapshotted, the body is locked
  // (which may clamp #root to 0), then rootEl.scrollTop is reassigned in the
  // same synchronous block — so frame 0 composites with the correct scroll
  // position. Previously the restore only ran on cleanup, which is why close
  // was clean and open jumped.
  useLayoutEffect(() => {
    if (isOpen) {
      // Snapshot #root scroll before any clamp/reset happens.
      const rootEl = document.getElementById('root');
      const savedScrollTop = rootEl ? rootEl.scrollTop : 0;

      // Clear any stale 'open' span left un-closed from a prior session before
      // starting a fresh one (prevents a leftover span producing a fake duration).
      fsTimeEnd('open', '(stale open span discarded)');
      // Timing: mark fullscreen open (tap→visible span; ends when first slide paints).
      fsTimeStart('open');
      fsEvent('🚀 FULLSCREEN_OPEN', { startIndex });
      // NOTE: no engine-wide pauseAll here — the overlay must never pause a
      // borrowed lane on its own open. Owner-guard + null-caller rules keep
      // playback correct for both borrow and non-borrow entries.
      const unlockViewportScroll = lockFullscreenViewportScroll();

      // With the html+body overflow lock (no position:fixed) the #root scroller
      // is not clamped, but keep the same-frame restore as a defensive no-op in
      // case any ancestor still shifts it before frame 0.
      if (rootEl && rootEl.scrollTop !== savedScrollTop) {
        rootEl.scrollTop = savedScrollTop;
      }

      // ── Safe area bleed (mirrors Clubhouse) ──
      document.body.classList.add('route-fullscreen-overlay');
      const shield = document.getElementById('safe-area-shield');
      if (shield) shield.style.backgroundColor = 'transparent';
      document.documentElement.style.backgroundColor = '#000000';
      document.body.style.backgroundColor = '#000000';
      // overlay flag is boot-locked (ensureStatusBarOverlayBooted). We only
      // push style + color here — no viewport resize during open animation.
      try {
        setStatusBarStyleColor('light', '00000000');
      } catch {}


      return () => {
        // Route-change guard: if the overlay is unmounting without an explicit
        // close() (e.g. navigation) borrowRef still holds the descriptor. Run
        // the return path so the pool is unpinned and the tile inherits its
        // element again.
        const stale = borrowRef.current;
        if (stale) {
          returnBorrow(stale, 'route');
          borrowRef.current = null;
        }

        // Close/route teardown must park the fullscreen singleton and clear
        // firstFrame before the next cold open can synchronously snapshot it.
        try { VideoEngine.unmountLane('fullscreen'); } catch {}
        try { vperfCloseMotionMark('laneRemounted', { lane: 'fullscreen', op: 'unmount' }); } catch {}

        unlockViewportScroll();
        try { vperfCloseMotionMark('scrollUnlocked'); } catch {}

        // Close-transition fix: hold chrome / body-class / overlay-color
        // restores until after the landing (returnAnimEnd already gated us
        // here; add a ~50ms fallback beat so the tile settles into its
        // resting rect before the OS chrome re-appears and any layout math
        // shifts). Scroll-unlock is intentionally NOT deferred — capture
        // showed the shifting rect correlates with chrome/body-class flips,
        // not the overflow unlock.
        const restoreChromeAfterLanding = () => {
          document.body.classList.remove('route-fullscreen-overlay');
          try { vperfCloseMotionMark('bodyClassRemoved'); vperfCloseMotionMark('chromeUnsuppressed'); } catch {}
          // Restore shield to transparent (NOT #F8FAFC) so the dark feed background
          // shows through — matches the prior CourseMediaViewer behaviour and
          // App.tsx's dark route baseline. #F8FAFC was a light slate that flashed
          // over the dark feed on return.
          if (shield) shield.style.backgroundColor = 'transparent';
          document.documentElement.style.backgroundColor = '';
          document.body.style.backgroundColor = '';
          // Overlay open/close is not a route change, so AppRoutes' chrome effect
          // never re-fires. Re-resolve chrome for whatever route we're returning
          // to (Clubhouse -> dark notch/white icons, Watch -> light notch/dark
          // icons). force=true because the overlay mutated chrome behind the
          // idempotency cache's back.
          try { applyRouteChrome(window.location.pathname, true); } catch {}
        };
        window.setTimeout(restoreChromeAfterLanding, 50);

        // Restore #root scroll position on the next frame so the feed's scroll
        // height is settled after the overlay unmounts.
        if (rootEl) {
          requestAnimationFrame(() => {
            rootEl.scrollTop = savedScrollTop;
          });
        }
      };
    }
  }, [isOpen]);

  // ── FLIP clone lifecycle ──
  // On open with origin: mount the clone at the tile's rect, then on the
  // NEXT frame flip cloneExpanded=true to trigger the transform → target rect.
  // Crossfade the clone out either when the active slide fires
  // onFirstFrameReady, or after a 400ms watchdog — whichever first.
  // Measured video-host rect — the actual container the fullscreen SnapFeed
  // renders into (inset:0 inside the overlay). We measure this AFTER the
  // body/statusbar mutations settle, so the clone target matches the video's
  // final on-screen rect exactly. Prevents zoom-out-then-in re-settle.
  const hostRef = useRef<HTMLDivElement>(null);
  const [targetRect, setTargetRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    // Borrow opens skip the poster-clone FLIP entirely — BorrowedFullscreenSlot
    // owns its own live-element expand transition (in 'expand' mode) or mounts
    // pre-settled (in 'cut' mode). Fire firstFrameReady so the host opacity
    // gate below flips to 1 immediately.
    if (isOpen && borrow) {
      setCloneVisible(false);
      setFirstFrameReady(true);
      setMotionComplete(true);
      setChildReady(true);
      return;
    }
    // CUT mode, non-borrow: reveal the settled host immediately. The blurred
    // surround + settled slide poster paint from frame 1; the engine's own
    // poster→video crossfade is the only motion. Reveal-gate is trivially
    // instant here — the host is opacity:1 with no clone on top.
    if (isOpen && origin && FS_TRANSITION_MODE === 'cut') {
      setCloneVisible(false);
      setFirstFrameReady(true);
      setMotionComplete(true);
      setChildReady(true);
      return;
    }

    if (isOpen && origin) {
      // Render A (synchronous commit): clone mounts at origin.rect ("from"
      // state). The render guard below (`origin && cloneVisible`) no longer
      // requires targetRect, so this frame actually paints at tile size —
      // giving the browser a real committed style to interpolate FROM.
      setCloneVisible(true);
      setCloneExpanded(false);
      setFirstFrameReady(false);
      setMotionComplete(false);
      setChildReady(false);
      setTargetRect(null);
      // Double rAF: guarantee the browser has painted render A before we
      // commit the target rect + cloneExpanded (Render B). Without this,
      // React can batch both updates into a single pre-paint commit and
      // the FLIP transition has no "from" style → clone teleports.
      let raf2: number | null = null;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          const vp = getCurrentViewport();
          const omw = origin.originMediaW ?? 0;
          const omh = origin.originMediaH ?? 0;
          const useMediaDims = omw > 0 && omh > 0;
          const ar = useMediaDims ? omw / omh : (origin.aspectRatio > 0 ? origin.aspectRatio : 0);
          const [mw, mh] = useMediaDims ? [omw, omh] : (ar > 0 ? [ar * 1000, 1000] : [0, 0]);
          const kind: 'video' | 'image' = origin.mediaType ?? 'image';
          const resting = resolveRestingRect(mw, mh, vp, kind);
          setTargetRect({
            top: resting.top,
            left: resting.left,
            width: resting.width,
            height: resting.height,
          });
          setCloneExpanded(true);
        });
      });
      // Backstop watchdog only — the primary reveal trigger is the combined
      // motion+childReady gate below. If either clock stalls (slow decode,
      // missed transitionend), release both after 500ms so the user is never
      // trapped behind the clone.
      watchdogRef.current = setTimeout(() => {
        setMotionComplete(true);
        setChildReady(true);
        // [BASELINE] image fs.open — fallback close for the fs.open span in
        // case the clone's transform transitionend never fires (reduced
        // motion, no geometry delta, instant layout, missed event). Without
        // this, the span orphans to the 15s watchdog (measurement artifact).
        try {
          const sid: string | undefined = (window as any).__vperfFsOpenSpanId;
          if (sid && origin?.mediaType === 'image') {
            import('@/perf/vperf').then((m) => {
              m.vperfImagePhase(sid, 'settled');
              m.vperfEnd(sid, { closedBy: 'imageFallback' });
              (window as any).__vperfFsOpenSpanId = null;
            }).catch(() => {});
          }
        } catch {}
      }, 500);
      return () => {
        cancelAnimationFrame(raf1);
        if (raf2 != null) cancelAnimationFrame(raf2);
        if (watchdogRef.current) { clearTimeout(watchdogRef.current); watchdogRef.current = null; }
      };
    } else if (!isOpen) {
      setCloneVisible(false);
      setCloneExpanded(false);
      setFirstFrameReady(false);
      setMotionComplete(false);
      setChildReady(false);
      setTargetRect(null);
      if (watchdogRef.current) { clearTimeout(watchdogRef.current); watchdogRef.current = null; }
      // [BASELINE] fs.open supersede — if the overlay closed before the
      // open span settled (image transitionend / video firstFrame), the
      // open was abandoned mid-load. Supersede instead of orphaning to
      // the 15s watchdog with a SLOW/TIMEOUT verdict.
      try {
        const sid: string | undefined = (window as any).__vperfFsOpenSpanId;
        if (sid) {
          import('@/perf/vperf').then((m) => {
            m.vperfSupersede(sid, { supersededBy: 'overlayClose' });
            (window as any).__vperfFsOpenSpanId = null;
          }).catch(() => {});
        }
      } catch {}
    }

  }, [isOpen, origin, borrow]);

  const handleSnapFeedFirstFrame = useCallback(() => {
    setChildReady(true);
  }, []);

  // [COLDOPEN] reveal.wait sampler — fires only when a cold trace is active
  // (i.e. non-borrow watch open). Samples at open, +500ms, +2000ms so we can
  // see whether the reveal gate is stuck because firstFrame never fires or
  // because the swap logic never reacts.
  useEffect(() => {
    if (!isOpen) return;
    if (borrow) return;
    if (!coldOpenIsActive()) return;
    const isVideoOpen = origin?.mediaType === 'video';
    const sample = () => {
      coldOpenRevealSample({
        needsFirstFrame: !!(isVideoOpen && !firstFrameReady),
        hasFirstFrame: firstFrameReady,
        posterVisible: !!origin?.posterUrl && cloneVisible,
        blurLayerVisible: !!origin?.posterUrl && cloneVisible,
      });
    };
    sample();
    const t1 = setTimeout(sample, 500);
    const t2 = setTimeout(sample, 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
    // Intentionally sample against the state at each timer fire; dependencies
    // limited to open lifecycle so we don't re-arm on every state tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, borrow, origin]);


  // Combined reveal gate: for VIDEO opens require BOTH motion complete AND
  // the child's real first frame painted (kills the post-settle poster→video
  // crossfade flash). For IMAGE opens the settled FeedSlide <img> is the
  // same URL as the clone poster and needs no swap — motion complete alone
  // is sufficient.
  useEffect(() => {
    if (!cloneVisible) return;
    if (firstFrameReady) return;
    if (!motionComplete) return;
    const isVideoOpen = origin?.mediaType === 'video';
    if (isVideoOpen && !childReady) return;
    if (watchdogRef.current) { clearTimeout(watchdogRef.current); watchdogRef.current = null; }
    setFirstFrameReady(true);
  }, [cloneVisible, firstFrameReady, motionComplete, childReady, origin]);

  // Retire the clone shortly after the crossfade completes.
  useEffect(() => {
    if (!firstFrameReady || !cloneVisible) return;
    const t = setTimeout(() => {
      setCloneVisible(false);
    }, 180);
    return () => clearTimeout(t);
  }, [firstFrameReady, cloneVisible]);



  const handleNearEnd = useCallback(() => {
    if (hasNextPage && fetchNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage, isFetchingNextPage]);


  return (
    <>
      {/* PORTAL TO BODY (invariant, see lib/zLayers.ts): a z-index only ranks an
          element against siblings inside its nearest stacking-context ancestor.
          Rendered in place, this overlay was clamped inside whichever ancestor
          established a stacking context (transform / will-change / backdrop-filter
          / -webkit-overflow-scrolling on iOS), so body-portaled BottomSheets
          painted over it regardless of FS_OVERLAY_Z. Portalling to <body> makes
          every value in the registry true. All geometry here is viewport-based
          (position:fixed + getBoundingClientRect), so the FLIP open/close motion
          is unaffected. */}
      {typeof document !== 'undefined' && createPortal(
      <AnimatePresence>

        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              // CUT mode: open ease-in uses FS_CUT_FADE_MS (anti-harshness);
              // close fade stays at 180ms (spec: "or the existing 180ms if
              // that reads better"). EXPAND mode: symmetric 180ms.
              duration:
                FS_TRANSITION_MODE === 'cut'
                  ? (isOpen ? FS_CUT_FADE_MS / 1000 : 0.18)
                  : 0.18,
              ease: 'linear',
            }}

            data-vperf="fs-overlay"
            className="fixed inset-0 flex flex-col"
            style={{ zIndex: FS_OVERLAY_Z }}

          >
            {/* Black wash — solid canvas that fades OUT during the symmetric
                close motion so the underlying page (with the origin tile) is
                revealed as the media shrinks back into it. On open + at rest
                it stays fully opaque (matches prior `bg-black` behaviour). */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                background: '#000',
                opacity: closeAnim !== 'idle' ? 0 : 1,
                transition: closeAnim !== 'idle'
                  ? 'opacity 300ms cubic-bezier(0.32,0.72,0,1)'
                  : 'none',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
            {/* Close button is now part of the FeedOverlayLayer top action bar (left chevron). */}


            {posts.length === 0 ? (
              <ClubhouseSkeletonShimmer isVisible={true} isStatic={false} />
            ) : (
              <>
                <div
                  ref={hostRef}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    // Snap to opaque (no transition) the moment we reveal.
                    // The clone sits on top and fades 1→0 over 120ms; if the
                    // host ALSO crossfaded 0→1 both layers would spend the
                    // midpoint at ~0.5 opacity, dimming the composite over
                    // black to ~0.75× brightness — a visible "flash" dip
                    // even when the pixels are identical.
                    // During the symmetric close (non-borrow) the reverse
                    // clone stands alone — hide the host under it.
                    opacity: (origin && !firstFrameReady && FS_TRANSITION_MODE !== 'cut') || closeAnim === 'nonborrow' ? 0 : 1,
                    pointerEvents: closeAnim !== 'idle' ? 'none' : undefined,
                  }}
                >

                  <SnapFeed
                    posts={posts}
                    activeTab="foryou"
                    onNearEnd={handleNearEnd}
                    onRefresh={async () => {}}
                    isRefreshing={isFetchingNextPage}
                    hasNextPage={hasNextPage}
                    followOverrides={followOverrides}
                    onFollowChange={(targetUserId, nextFollowed) => {
                      const p = posts.find((x) => x.userId === targetUserId);
                      if (p) handleFollow({ ...p, isFollowedByMe: !nextFollowed });
                    }}
                    onFirstFrameReady={handleSnapFeedFirstFrame}
                    startIndex={startIndex}
                    onActiveIndexChange={setActiveIndex}
                    activeIndexOverride={activeIndex}
                    isFullscreen
                    surface="fullscreen"
                    readOnly={readOnly}
                  />

                  <ImmersiveFullscreenChrome
                    posts={posts}
                    activeIndex={activeIndex}
                    onClose={handleClose}
                    onLike={handleLike}
                    onComment={safeOpenComments}
                    onShare={handleShare}
                    onMore={() => setMoreOptionsOpen(true)}


                    getLikeState={getActiveLikeState}
                    getCommentCount={getCommentCount}
                    getFollowState={getFollowState}
                    onFollow={(post, followedNow) => handleFollow({ ...post, isFollowedByMe: followedNow })}
                    onViewProfile={handleViewProfile}
                    onReviewTap={handleReviewTap}
                    isOwnPost={isOwnPost}
                    golfCourse={golfCourse}
                    readOnly={readOnly}
                    onBeforeNavigate={() => handleClose({ reason: 'navigating' })}
                    feedEnded={!hasNextPage && activeIndex >= posts.length}
                  />

                  <FullscreenScrubber
                    activePost={activePost}
                    activeIndex={activeIndex}
                  />

                  {showSoundPill && (
                    <div
                      style={{
                        position: 'fixed',
                        left: '50%',
                        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)',
                        transform: 'translateX(-50%)',
                        zIndex: FS_OVERLAY_Z + 2,
                        pointerEvents: 'auto',
                      }}
                    >
                      <TapForSoundPill
                        onClick={() => {
                          useSessionAudio.getState().unmute();
                          setShowSoundPill(false);
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* ── Blurred self-backdrop (surround) ──
                    Product rule: contained media in the fullscreen viewer is
                    surrounded by a blurred self-backdrop, never solid black.
                    Sourced from origin.posterUrl (the tile thumbnail — ALREADY
                    DECODED because it was visible in the tile), so the blur is
                    present from frame 0 of the clone expand. Styling matches
                    the settled slide's own backdrop exactly, so when the
                    clone retires the handoff is pixel-identical (no flick).
                    The parent `bg-black` provides the base canvas during the
                    fade-in; this layer sits between it and the clone. */}
                {origin && cloneVisible && origin.posterUrl && (
                  <div
                    aria-hidden
                    style={{
                      position: 'fixed',
                      inset: 0,
                      backgroundImage: `url(${origin.posterUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      filter: 'blur(40px) brightness(0.5) saturate(1.2)',
                      transform: 'scale(1.2)',
                      opacity: cloneExpanded ? 1 : 0,
                      transition: 'opacity 300ms cubic-bezier(0.32,0.72,0,1)',
                      pointerEvents: 'none',
                      zIndex: 1,
                    }}
                  />
                )}

                {/* ── FLIP clone layer (Phase 3 shared-element expand) ──
                    Rendered from Render A at origin.rect (targetRect null),
                    so the browser has a real "from" style to interpolate
                    from when Render B commits targetRect + cloneExpanded. */}
                {origin && cloneVisible && (
                  <img
                    src={origin.posterUrl ?? undefined}
                    alt=""
                    aria-hidden
                    onTransitionEnd={(e) => {
                      if (!cloneExpanded) return;
                      if (e.propertyName !== 'transform') return;
                      setMotionComplete(true);
                      // [BASELINE] image fs.open — mark settled + end span.
                      try {
                        const sid: string | undefined = (window as any).__vperfFsOpenSpanId;
                        if (sid && origin?.mediaType === 'image') {
                          import('@/perf/vperf').then((m) => {
                            m.vperfImagePhase(sid, 'settled');
                            m.vperfEnd(sid, { closedBy: 'transitionend' });
                            (window as any).__vperfFsOpenSpanId = null;
                          }).catch(() => {});
                        }
                      } catch {}
                    }}
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      width: cloneExpanded && targetRect ? targetRect.width : origin.rect.width,
                      height: cloneExpanded && targetRect ? targetRect.height : origin.rect.height,
                      transform: cloneExpanded && targetRect
                        ? `translate(${targetRect.left}px, ${targetRect.top}px)`
                        : `translate(${origin.rect.left}px, ${origin.rect.top}px)`,
                      objectFit: 'cover',
                      borderRadius: cloneExpanded ? 0 : origin.borderRadius,
                      willChange: 'transform, width, height, opacity, border-radius',
                      transition:
                        'transform 300ms cubic-bezier(0.32,0.72,0,1),' +
                        ' width 300ms cubic-bezier(0.32,0.72,0,1),' +
                        ' height 300ms cubic-bezier(0.32,0.72,0,1),' +
                        ' border-radius 240ms cubic-bezier(0.32,0.72,0,1),' +
                        ' opacity 120ms linear',
                      opacity: firstFrameReady ? 0 : 1,
                      pointerEvents: 'none',
                      zIndex: 2,
                      // Safety fill INSIDE the media's own geometry so a
                      // partially-decoded poster never shows through to the
                      // blur backdrop mid-expand. Not a surround layer.
                      background: '#000',
                    }}
                  />
                )}

                {/* ── REVERSE clone (non-borrow symmetric close) ──
                    Mirror of the forward clone: mounts AT the resting rect
                    (over the just-hidden host) and animates back to the
                    origin tile rect. Blur backdrop fades OUT concurrently.
                    On transitionend the store signals close-anim-done and
                    the overlay finalises. */}
                {closeAnim === 'nonborrow' && reverseClone && (
                  <>
                    {reverseClone.posterUrl && (
                      <div
                        aria-hidden
                        style={{
                          position: 'fixed',
                          inset: 0,
                          backgroundImage: `url(${reverseClone.posterUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          filter: 'blur(40px) brightness(0.5) saturate(1.2)',
                          transform: 'scale(1.2)',
                          opacity: reverseCollapsed ? 0 : 1,
                          transition: 'opacity 300ms cubic-bezier(0.32,0.72,0,1)',
                          pointerEvents: 'none',
                          zIndex: 1,
                        }}
                      />
                    )}
                    <img
                      src={reverseClone.posterUrl || undefined}
                      alt=""
                      aria-hidden
                      onTransitionEnd={(e) => {
                        if (e.propertyName !== 'transform') return;
                        signalCloseAnimDone();
                      }}
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: reverseCollapsed ? reverseClone.to.width : reverseClone.from.width,
                        height: reverseCollapsed ? reverseClone.to.height : reverseClone.from.height,
                        transform: reverseCollapsed
                          ? `translate(${reverseClone.to.left}px, ${reverseClone.to.top}px)`
                          : `translate(${reverseClone.from.left}px, ${reverseClone.from.top}px)`,
                        objectFit: 'cover',
                        borderRadius: reverseCollapsed ? reverseClone.borderRadius : 0,
                        willChange: 'transform, width, height, border-radius',
                        transition:
                          'transform 300ms cubic-bezier(0.32,0.72,0,1),' +
                          ' width 300ms cubic-bezier(0.32,0.72,0,1),' +
                          ' height 300ms cubic-bezier(0.32,0.72,0,1),' +
                          ' border-radius 240ms cubic-bezier(0.32,0.72,0,1)',
                        pointerEvents: 'none',
                        zIndex: 2,
                        background: '#000',
                      }}
                    />
                  </>
                )}
              </>
            )}
            {/* <FullscreenDebugPanel /> — hidden; re-enable here when debugging needed */}
          </motion.div>

        )}
      </AnimatePresence>,
      document.body,
      )}


      {!readOnly && (
        <CommentsSheetV2
          isOpen={commentsOpen}
          onClose={closeComments}
          targetType="post"
          targetId={activePost?.id ?? ""}
          initialCommentId={initialCommentId}
        />
      )}

      {!readOnly && activePost && (
        <MoreOptionsDrawer
          open={moreOptionsOpen}
          onOpenChange={setMoreOptionsOpen}
          post={activePost}
          currentUserId={userId}
          onReport={() => handleReport(activePost)}
          onNotInterested={() => handleNotInterested(activePost)}
          onCopyLink={() => {
            navigator.clipboard.writeText(`${window.location.origin}/post/${activePost.id}`);
            toast.success('Link copied');
            setMoreOptionsOpen(false);
          }}
          onAfterBlock={handleClose}
        />
      )}


      {/* ReviewBottomSheet now renders via root-level ReviewBottomSheetPortal */}
    </>
  );
}
