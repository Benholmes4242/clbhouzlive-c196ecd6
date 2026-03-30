import React, { useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { SnapFeed } from '@/components/feed/SnapFeed';
import { pauseAllAudio } from '@/utils/globalVideoMute';
import { FeedOverlayLayer } from '@/components/feed/FeedOverlayLayer';
import CommentsSheet from '@/components/comments/CommentsSheet';
import { useClubhouseLikes } from '@/components/clubhouse/hooks/useClubhouseLikes';
import { useClubhouseFollows } from '@/components/clubhouse/hooks/useClubhouseFollows';
import { useClubhouseComments } from '@/components/clubhouse/hooks/useClubhouseComments';
import { useClubhouseShare } from '@/components/clubhouse/hooks/useClubhouseShare';
import { useActivePostDerived } from '@/components/clubhouse/hooks/useActivePostDerived';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { getProfilePathById } from '@/utils/profile-utils';

export function FullscreenFeedOverlay() {
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;
  const { isOpen, posts, startIndex, activeIndex, close, setActiveIndex } = useFullscreenFeedStore();

  const activeActor = { type: "personal" as const, id: userId ?? "" };
  const { handleLike, getActiveLikeState } = useClubhouseLikes({ userId, activeActor });
  const { followOverrides, handleFollowChange, getFollowState } = useClubhouseFollows({ userId });
  const { commentsOpen, overlayVisible, openComments, closeComments, getCommentCount } = useClubhouseComments();
  const { handleShare } = useClubhouseShare(userId);
  const { activePost, golfCourse, activeReview, isActiveReview } = useActivePostDerived(posts, activeIndex);
  const isOwnPost = !!(userId && activePost?.userId === userId);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, close]);

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
        if (shield) shield.style.backgroundColor = 'transparent';
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
              className="absolute left-4 z-[210] rounded-full flex items-center justify-center"
              style={{
                top: "calc(max(env(safe-area-inset-top, 0px), 47px) + 12px)",
                width: 44,
                height: 44,
                background: 'rgba(0, 0, 0, 0.35)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.10)',
              }}
            >
              <X className="w-5 h-5 text-white" />
            </button>

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
              onViewProfile={close}
              onReviewTap={close}
              onBeforeNavigate={close}
              overlayVisible={true}
              isOwnPost={isOwnPost}
              golfCourse={golfCourse}
            />
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
    </>
  );
}
