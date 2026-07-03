import React, { useEffect, useCallback, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { useNavigate } from 'react-router-dom';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { SnapFeed } from '@/components/feed/SnapFeed';
import { ClubhouseSkeletonShimmer } from '@/components/clubhouse/ClubhouseSkeletonShimmer';
import { pauseAllAudio } from '@/utils/globalVideoMute';
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
import FullscreenDebugPanel from '@/components/FullscreenDebugPanel';
import { fsTimeStart, fsTimeEnd, fsEvent } from '@/media/mobileVideoDebug';

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
    close();
    navigate(getActorRouteByType(activePost.actorType, activePost.actorId));
  }, [activePost, close, navigate]);

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
      close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, close]);

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

  // Body scroll lock + #root scroll preservation
  useEffect(() => {
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
      pauseAllAudio();
      lockBodyScroll();

      // ── Safe area bleed (mirrors Clubhouse) ──
      document.body.classList.add('route-fullscreen-overlay');
      const shield = document.getElementById('safe-area-shield');
      if (shield) shield.style.backgroundColor = 'transparent';
      document.documentElement.style.backgroundColor = '#000000';
      document.body.style.backgroundColor = '#000000';
      try {
        (window as any).median?.statusbar?.set({ style: 'dark', color: '00000000', overlay: true, blur: false });
      } catch {}

      return () => {
        unlockBodyScroll();
        document.body.classList.remove('route-fullscreen-overlay');
        // Restore shield to transparent (NOT #F8FAFC) so the dark feed background
        // shows through — matches the prior CourseMediaViewer behaviour and
        // App.tsx's dark route baseline. #F8FAFC was a light slate that flashed
        // over the dark feed on return.
        if (shield) shield.style.backgroundColor = 'transparent';
        document.documentElement.style.backgroundColor = '';
        document.body.style.backgroundColor = '';

        // FLIP handoff return — capture the LIVE fullscreen playhead from the
        // active <video> BEFORE emitting close (SnapVideoPlayer registers the
        // active element in useClubhouseStore). Feed tile then consumes this
        // return entry on re-attach and resumes autoplay if in its active slot.
        try {
          const activeVideo = useClubhouseStore.getState().activeVideoElement;
          const fsState = useFullscreenFeedStore.getState();
          const currentPost: any = fsState.posts?.[fsState.activeIndex];
          const url = currentPost?.mediaItems?.[0]?.hlsUrl;
          if (activeVideo && url && Number.isFinite(activeVideo.currentTime)) {
            flipContinuity.setReturn(url, { t: Math.max(0, activeVideo.currentTime) });
            fsEvent('🎯 FS_CAPTURE_RETURN', { url, t: activeVideo.currentTime });
          }
        } catch {}
        setTimeout(() => flipContinuity.emitClose(), 0);

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
  useEffect(() => {
    if (isOpen && origin) {
      setCloneVisible(true);
      setCloneExpanded(false);
      setFirstFrameReady(false);
      // Force layout with the initial rect, then expand on next frame.
      let raf2: number | undefined;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setCloneExpanded(true));
      });
      // Watchdog: release the clone if the first-frame signal never arrives.
      watchdogRef.current = setTimeout(() => setFirstFrameReady(true), 400);
      return () => {
        cancelAnimationFrame(raf1);
        if (raf2 != null) cancelAnimationFrame(raf2);
        if (watchdogRef.current) clearTimeout(watchdogRef.current);
      };
    } else if (!isOpen) {
      setCloneVisible(false);
      setCloneExpanded(false);
      setFirstFrameReady(false);
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
    }
  }, [isOpen, origin]);

  const handleSnapFeedFirstFrame = useCallback(() => {
    if (watchdogRef.current) clearTimeout(watchdogRef.current);
    setFirstFrameReady(true);
  }, []);

  // Retire the clone shortly after the crossfade completes.
  useEffect(() => {
    if (!firstFrameReady || !cloneVisible) return;
    const t = setTimeout(() => setCloneVisible(false), 180);
    return () => clearTimeout(t);
  }, [firstFrameReady, cloneVisible]);

  // Target rect for the FLIP expand: viewport-sized on phone; on iPad the
  // viewer is centred so we honour the same layout as the overlay chrome.
  const targetRect = React.useMemo(() => {
    if (typeof window === 'undefined') return null;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return { top: 0, left: 0, width: vw, height: vh };
  }, [isOpen]);


  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[200] bg-black flex flex-col"
          >
            {/* Close button is now part of the FeedOverlayLayer top action bar (left chevron). */}


            {posts.length === 0 ? (
              <ClubhouseSkeletonShimmer isVisible={true} isStatic={false} />
            ) : (
              <>
                <div
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
                    onNearEnd={() => {
                      if (hasNextPage && fetchNextPage && !isFetchingNextPage) {
                        fetchNextPage();
                      }
                    }}
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
                    onBeforeNavigate={close}
                    overlayVisible={true}
                    isOwnPost={isOwnPost}
                    golfCourse={golfCourse}
                    activeReview={activeReview}
                    isActiveReview={isActiveReview}
                    bottomOffset={0}
                    topActionBar
                    onClose={close}
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
