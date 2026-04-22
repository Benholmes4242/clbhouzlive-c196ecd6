import React, { useEffect, useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { SnapFeed } from '@/components/feed/SnapFeed';
import { ClubhouseSkeletonShimmer } from '@/components/clubhouse/ClubhouseSkeletonShimmer';
import { pauseAllAudio } from '@/utils/globalVideoMute';

import { FeedOverlayLayer } from '@/components/feed/FeedOverlayLayer';
import { FullscreenCarouselOverlay } from '@/components/media/FullscreenCarouselOverlay';
import CommentsSheet from '@/components/comments/CommentsSheet';
import { ReviewBottomSheet } from '@/components/posts/ReviewBottomSheet';
import { useClubhouseLikes } from '@/components/clubhouse/hooks/useClubhouseLikes';
import { useClubhouseFollows } from '@/components/clubhouse/hooks/useClubhouseFollows';
import { useClubhouseComments } from '@/components/clubhouse/hooks/useClubhouseComments';
import { useClubhouseShare } from '@/components/clubhouse/hooks/useClubhouseShare';
import { useActivePostDerived } from '@/components/clubhouse/hooks/useActivePostDerived';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { getProfilePathById } from '@/lib/profileRoutes';

export function FullscreenFeedOverlay() {
  const navigate = useNavigate();
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;
  const { isOpen, posts, startIndex, activeIndex, close, setActiveIndex, openCommentsInitially, consumeOpenCommentsInitially } = useFullscreenFeedStore();

  const activeActor = { type: "personal" as const, id: userId ?? "" };
  const { handleLike, getActiveLikeState } = useClubhouseLikes({ userId, activeActor });
  const { followOverrides, handleFollowChange, getFollowState } = useClubhouseFollows({ userId });
  const { commentsOpen, overlayVisible, openComments, closeComments, getCommentCount } = useClubhouseComments();
  const { handleShare } = useClubhouseShare(userId);
  const { activePost, golfCourse, activeReview, isActiveReview } = useActivePostDerived(posts, activeIndex);
  const isOwnPost = !!(userId && activePost?.userId === userId);
  const [reviewSheetOpen, setReviewSheetOpen] = useState(false);

  // Watch-progress tracking lives inside SnapFeed (the actual video host),
  // which the overlay renders below. Mounting it here as well would
  // cross-target the inline Clubhouse SnapFeed's DOM via the global selector.

  // Listen for "continue-watching:seek" events dispatched by the
  // ContinueWatching rail. Seeks the active video to the saved position
  // once the matching slide mounts.
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { postId: string; seconds: number };
      if (!detail?.postId || !detail.seconds) return;
      // Poll until the matching video element is mounted (virtualized feed).
      let attempts = 0;
      const trySeek = () => {
        attempts += 1;
        const idx = useFullscreenFeedStore.getState().posts.findIndex(p => p.id === detail.postId);
        if (idx < 0) return;
        const video = document.querySelector(
          `[data-snap-feed] [data-index="${idx}"] video`,
        ) as HTMLVideoElement | null;
        if (video && isFinite(video.duration) && video.duration > 0) {
          try { video.currentTime = Math.min(detail.seconds, video.duration - 1); } catch {}
          return;
        }
        if (attempts < 20) window.setTimeout(trySeek, 150);
      };
      window.setTimeout(trySeek, 200);
    };
    window.addEventListener('continue-watching:seek', handler as EventListener);
    return () => window.removeEventListener('continue-watching:seek', handler as EventListener);
  }, [isOpen]);

  const handleViewProfile = useCallback(() => {
    if (!activePost) return;
    close();
    navigate(getProfilePathById(activePost.userId));
  }, [activePost, close, navigate]);

  const handleReviewTap = useCallback(() => {
    if (!activeReview) return;
    setReviewSheetOpen(true);
  }, [activeReview]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, close]);

  // Deep-link entry: open comments sheet on mount when requested by the opener
  // (e.g. PostDeepLinkPage routing in from a notification tap).
  useEffect(() => {
    if (!isOpen) return;
    if (!openCommentsInitially) return;
    if (posts.length === 0) return;
    openComments();
    consumeOpenCommentsInitially();
  }, [isOpen, openCommentsInitially, posts.length, openComments, consumeOpenCommentsInitially]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      pauseAllAudio();
      document.body.style.overflow = "hidden";

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
        document.body.style.overflow = "";
        document.body.classList.remove('route-fullscreen-overlay');
        if (shield) shield.style.backgroundColor = '#F8FAFC';
        document.documentElement.style.backgroundColor = 'transparent';
        document.body.style.backgroundColor = 'transparent';
      };
    }
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
            <button
              onClick={close}
              aria-label="Close"
              className="absolute left-4 z-[9030] flex items-center justify-center active:scale-95 transition-all"
              style={{
                top: "calc(max(env(safe-area-inset-top, 0px), 47px) + 12px)",
                width: 34,
                height: 34,
                borderRadius: 12,
                background: 'rgba(0, 0, 0, 0.50)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: '1px solid rgba(255, 255, 255, 0.10)',
              }}
            >
              <X className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />
            </button>

            {posts.length === 0 ? (
              <ClubhouseSkeletonShimmer isVisible={true} isStatic={false} />
            ) : (
              <>
                <SnapFeed
                  posts={posts}
                  activeTab="foryou"
                  onNearEnd={() => {}}
                  onRefresh={async () => {}}
                  isRefreshing={false}
                  hasNextPage={false}
                  followOverrides={followOverrides}
                  onFollowChange={handleFollowChange}
                  startIndex={startIndex}
                  onActiveIndexChange={setActiveIndex}
                  activeIndexOverride={activeIndex}
                  isFullscreen
                />

                <FeedOverlayLayer
                  posts={posts}
                  activeIndexOverride={activeIndex}
                  onLike={handleLike}
                  onComment={openComments}
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
                />

                <FullscreenCarouselOverlay
                  activePost={activePost}
                  activeIndex={activeIndex}
                />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <CommentsSheet
        isOpen={commentsOpen}
        onClose={closeComments}
        postId={activePost?.id ?? ""}
        currentUserId={userId}
        creatorUserId={activePost?.userId}
        creatorName={activePost?.displayName}
        creatorAvatar={activePost?.avatarUrl}
        caption={activePost?.caption}
        theme="dark"
        likesCount={getActiveLikeState(activePost!)?.count ?? null}
      />

      <ReviewBottomSheet
        isOpen={reviewSheetOpen}
        onClose={() => setReviewSheetOpen(false)}
        user={{
          id: activePost?.userId ?? '',
          name: activePost?.displayName ?? '',
          username: activePost?.username,
          avatar: activePost?.avatarUrl,
        }}
        courseId={activeReview?.courseId ?? ''}
        courseName={activeReview?.courseName ?? ''}
        rating={activeReview?.rating ?? 0}
        reviewId={activeReview?.reviewId}
        courseCountry={activeReview?.courseCountry}
        courseRegion={activeReview?.courseRegion}
        courseSubCountry={activeReview?.courseSubCountry}
        reviewText={activeReview?.reviewText}
      />
    </>
  );
}
