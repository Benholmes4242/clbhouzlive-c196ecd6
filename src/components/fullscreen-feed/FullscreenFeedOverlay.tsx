import React, { useEffect, useLayoutEffect, useCallback, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { useNavigate } from 'react-router-dom';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';

import { SnapFeed } from '@/components/feed/SnapFeed';
import { ClubhouseSkeletonShimmer } from '@/components/clubhouse/ClubhouseSkeletonShimmer';

import { lockBodyScroll, unlockBodyScroll } from '@/lib/bodyScrollLock';


import { FeedOverlayLayer } from '@/components/feed/FeedOverlayLayer';
import { FullscreenCarouselOverlay } from '@/components/media/FullscreenCarouselOverlay';
import CommentsSheet from '@/components/comments/CommentsSheet';
import { useReviewSheetStore } from '@/stores/reviewSheetStore';
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
import { VideoEngine } from '@/video/VideoEngine';
import { RailLanePool } from '@/video/railLanePool';
import { originHostRegistry } from '@/video/originHostRegistry';
import type { BorrowDescriptor } from '@/store/fullscreenFeedStore';
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
  // Stage-7 PR-2: lane-kind switch. Rail lanes (rail-*) are pool-managed and
  // always re-mute on return. Feed-active is a singleton, no pool, and
  // restores the pre-borrow mute state.
  const isRail = borrow.laneId.startsWith('rail-');
  const originHost = reason === 'demote' ? null : originHostRegistry.get(borrow.ownerKey);
  const viewportChanged =
    typeof window !== 'undefined' &&
    (window.innerWidth !== borrow.viewportW || window.innerHeight !== borrow.viewportH);
  // Mute policy: rails force-mute; feed-active restores pre-borrow mute.
  try {
    const targetMuted = isRail ? true : (borrow.wasMuted ?? true);
    VideoEngine.setMuted(borrow.laneId, targetMuted);
  } catch {}
  // Reset object-fit to cover for the tile's aspect.
  try { VideoEngine.setObjectFit(borrow.laneId, 'cover'); } catch {}
  if (reason !== 'demote' && originHost && !viewportChanged) {
    try {
      VideoEngine.mountLane(borrow.laneId, originHost);
      // Live-tile return.
      //  - Rail: DO NOT execute the deferred release — the tile will re-acquire
      //    this exact lane (coalesced) as soon as the autoplay gate lifts, and
      //    tearing the source down would blank + reload the tile.
      //  - Feed-active: no pool interaction at all.
      let hadPendingRelease = false;
      if (isRail) {
        hadPendingRelease = RailLanePool.unpin(borrow.laneId, { executeDeferred: false });
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
  const hasNextPage = useFullscreenFeedStore(s => s.hasNextPage);
  const fetchNextPage = useFullscreenFeedStore(s => s.fetchNextPage);
  const isFetchingNextPage = useFullscreenFeedStore(s => s.isFetchingNextPage);
  const readOnly = useFullscreenFeedStore(s => s.readOnly);
  const origin = useFullscreenFeedStore(s => s.origin);
  const borrow = useFullscreenFeedStore(s => s.borrow);
  const clearBorrow = useFullscreenFeedStore(s => s.clearBorrow);
  const borrowDemoteRequested = useFullscreenFeedStore(s => s.borrowDemoteRequested);
  const consumeBorrowDemoteRequested = useFullscreenFeedStore(s => s.consumeBorrowDemoteRequested);

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

  // Wrap close so borrow-return runs BEFORE the store clears its fields.
  // All in-overlay callers (ESC, top-action-bar close, deep-link back) should
  // route through this. Route-change navigation that bypasses close still
  // gets handled by the isOpen-effect cleanup below (using borrowRef).
  const handleClose = useCallback(() => {
    const b = borrowRef.current;
    if (b) {
      returnBorrow(b, 'close');
      borrowRef.current = null;
    }
    close();
  }, [close]);




  // ── FLIP clone state ──
  // When origin is present, we mount a transform-only expanding poster clone
  // over the (opacity-0) SnapFeed and crossfade it out on first frame.
  const [cloneVisible, setCloneVisible] = useState(false);
  const [cloneExpanded, setCloneExpanded] = useState(false);
  const [firstFrameReady, setFirstFrameReady] = useState(false);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use the real active actor (personal or business) so users in business
  // mode can like/comment/follow as their business from fullscreen. Falls
  // back to a personal-shaped object during auth loading.
  const { activeActor: ctxActor } = useActiveActor();
  const activeActor = ctxActor ?? { type: "personal" as const, id: userId ?? "" };
  const { handleLike, getActiveLikeState } = useClubhouseLikes({ userId, activeActor });
  const { followOverrides, handleFollowChange, getFollowState } = useClubhouseFollows({ userId });
  const { commentsOpen, overlayVisible, openComments, closeComments, getCommentCount } = useClubhouseComments();
  const safeOpenComments = useCallback(() => { if (!readOnly) openComments(); }, [readOnly, openComments]);
  const { handleShare } = useClubhouseShare(userId);
  const { activePost, golfCourse, activeReview, isActiveReview } = useActivePostDerived(posts, activeIndex);
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

  // Watch-progress tracking lives inside SnapFeed (the actual video host),
  // which the overlay renders below.

  const handleViewProfile = useCallback(() => {
    if (!activePost) return;
    handleClose();
    navigate(getActorRouteByType(activePost.actorType, activePost.actorId), { state: activePost.actorType === 'business' ? { source: 'feed' } : undefined });
  }, [activePost, handleClose, navigate]);

  const handleReviewTap = useCallback(() => {
    if (!activeReview || !activePost) return;
    openReviewSheet({
      user: {
        id: activePost.userId ?? '',
        name: activePost.displayName ?? '',
        username: activePost.username,
        avatar: activePost.avatarUrl,
      },
      courseId: activeReview.courseId ?? '',
      courseName: activeReview.courseName ?? '',
      rating: activeReview.rating ?? 0,
      reviewId: activeReview.reviewId,
      courseCountry: activeReview.courseCountry,
      courseRegion: activeReview.courseRegion,
      courseSubCountry: activeReview.courseSubCountry,
      reviewText: activeReview.reviewText,
      breakdown: (activeReview as any).breakdown ?? null,
      reviewerStats: reviewerStats ?? null,
    });
  }, [activeReview, activePost, openReviewSheet, reviewerStats]);

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
      lockBodyScroll();

      // Same-frame restore: lockBodyScroll fixes the body which can clamp the
      // #root scroller to 0. Reassign immediately so the pre-lock scroll
      // position is what frame 0 composites — no visible jump behind the
      // translucent overlay.
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
        setStatusBarStyleColor('dark', '00000000');
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

        unlockBodyScroll();
        document.body.classList.remove('route-fullscreen-overlay');
        // Restore shield to transparent (NOT #F8FAFC) so the dark feed background
        // shows through — matches the prior CourseMediaViewer behaviour and
        // App.tsx's dark route baseline. #F8FAFC was a light slate that flashed
        // over the dark feed on return.
        if (shield) shield.style.backgroundColor = 'transparent';
        document.documentElement.style.backgroundColor = '';
        document.body.style.backgroundColor = '';

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
    // owns its own live-element expand transition. Fire firstFrameReady so the
    // host opacity gate below flips to 1 immediately.
    if (isOpen && borrow) {
      setCloneVisible(false);
      setFirstFrameReady(true);
      return;
    }
    if (isOpen && origin) {
      setCloneVisible(true);
      setCloneExpanded(false);
      setFirstFrameReady(false);
      setTargetRect(null);
      // Single rAF: after the host mounts (inset:0, opacity:0) + body-class
      // mutations settle, measure the ACTUAL host rect and expand to it.
      const raf = requestAnimationFrame(() => {
        const host = hostRef.current;
        const measured = host
          ? host.getBoundingClientRect()
          : { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight } as DOMRect;
        const rect = {
          top: measured.top,
          left: measured.left,
          width: measured.width,
          height: measured.height,
        };
        setTargetRect(rect);
        setCloneExpanded(true);
      });
      // Watchdog: release the clone if the first-frame signal never arrives.
      watchdogRef.current = setTimeout(() => {
        setFirstFrameReady(true);
      }, 400);
      return () => {
        cancelAnimationFrame(raf);
        if (watchdogRef.current) clearTimeout(watchdogRef.current);
      };
    } else if (!isOpen) {
      setCloneVisible(false);
      setCloneExpanded(false);
      setFirstFrameReady(false);
      setTargetRect(null);
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
    }
  }, [isOpen, origin, borrow]);

  const handleSnapFeedFirstFrame = useCallback(() => {
    if (watchdogRef.current) clearTimeout(watchdogRef.current);
    setFirstFrameReady(true);
  }, []);

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
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            data-vperf="fs-overlay"
            className="fixed inset-0 z-[200] bg-black flex flex-col"
          >
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
                    opacity: origin && !firstFrameReady ? 0 : 1,
                    transition: 'opacity 120ms linear',
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
                    onFollowChange={handleFollowChange}
                    onFirstFrameReady={handleSnapFeedFirstFrame}
                    startIndex={startIndex}
                    onActiveIndexChange={setActiveIndex}
                    activeIndexOverride={activeIndex}
                    isFullscreen
                    surface="fullscreen"
                    readOnly={readOnly}
                  />

                  <FeedOverlayLayer
                    posts={posts}
                    activeIndexOverride={activeIndex}
                    onLike={handleLike}
                    onComment={safeOpenComments}
                    onShare={handleShare}
                    onMore={() => {}}
                    getLikeState={getActiveLikeState}
                    getCommentCount={getCommentCount}
                    getFollowState={getFollowState}
                    onFollow={(post) => handleFollowChange(post.userId, !getFollowState(post))}
                    onViewProfile={handleViewProfile}
                    onReviewTap={handleReviewTap}
                    onBeforeNavigate={handleClose}
                    overlayVisible={true}
                    isOwnPost={isOwnPost}
                    golfCourse={golfCourse}
                    activeReview={activeReview}
                    isActiveReview={isActiveReview}
                    bottomOffset={0}
                    topActionBar
                    onClose={handleClose}
                    readOnly={readOnly}
                  />


                  <FullscreenCarouselOverlay
                    activePost={activePost}
                    activeIndex={activeIndex}
                  />
                </div>

                {/* ── FLIP clone layer (Phase 3 shared-element expand) ── */}
                {origin && cloneVisible && targetRect && (
                  <img
                    src={origin.posterUrl ?? undefined}
                    alt=""
                    aria-hidden
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      width: cloneExpanded ? targetRect.width : origin.rect.width,
                      height: cloneExpanded ? targetRect.height : origin.rect.height,
                      transform: cloneExpanded
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
                      background: '#000',
                    }}
                  />
                )}
              </>
            )}
            {/* <FullscreenDebugPanel /> — hidden; re-enable here when debugging needed */}
          </motion.div>
        )}
      </AnimatePresence>

      {!readOnly && (
        <CommentsSheet
          isOpen={commentsOpen}
          onClose={closeComments}
          postId={activePost?.id ?? ""}
          currentUserId={userId}
          creatorUserId={activePost?.userId}
          creatorActorType={activePost?.actorType === 'business' ? 'business' : 'personal'}
          creatorActorId={activePost?.actorId}
          creatorName={activePost?.displayName}
          creatorAvatar={activePost?.avatarUrl}
          caption={activePost?.caption}
          theme="dark"
          likesCount={getActiveLikeState(activePost!)?.count ?? null}
          initialCommentId={initialCommentId}
        />
      )}

      {/* ReviewBottomSheet now renders via root-level ReviewBottomSheetPortal */}
    </>
  );
}
