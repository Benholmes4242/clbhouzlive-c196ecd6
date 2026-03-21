import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { SnapFeed } from '@/components/feed/SnapFeed';
import { FeedOverlayLayer } from '@/components/feed/FeedOverlayLayer';
import CommentsSheet from '@/components/comments/CommentsSheet';
import { useClubhouseLikes } from '@/components/clubhouse/hooks/useClubhouseLikes';
import { useClubhouseFollows } from '@/components/clubhouse/hooks/useClubhouseFollows';
import { useClubhouseComments } from '@/components/clubhouse/hooks/useClubhouseComments';
import { useClubhouseShare } from '@/components/clubhouse/hooks/useClubhouseShare';
import { useActivePostDerived } from '@/components/clubhouse/hooks/useActivePostDerived';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export function FullscreenFeedOverlay() {
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;
  const { isOpen, posts, startIndex, activeIndex, close, setActiveIndex } = useFullscreenFeedStore();

  // Sync clubhouseStore activeIndex -> fullscreenFeedStore
  const clubhouseActiveIndex = useClubhouseStore(s => s.activeIndex);
  useEffect(() => {
    if (isOpen) setActiveIndex(clubhouseActiveIndex);
  }, [clubhouseActiveIndex, isOpen, setActiveIndex]);

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
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
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
              className="absolute left-4 z-[210] w-11 h-11 rounded-full bg-black/50 flex items-center justify-center"
              style={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
            >
              <X className="w-6 h-6 text-white" />
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
            />

            <FeedOverlayLayer
              posts={posts}
              onLike={handleLike}
              onComment={openComments}
              onShare={handleShare}
              onMore={() => {}}
              getLikeState={getActiveLikeState}
              getCommentCount={getCommentCount}
              getFollowState={getFollowState}
              onFollow={(post) => handleFollowChange(post.userId, !getFollowState(post))}
              onViewProfile={() => {}}
              onReviewTap={() => {}}
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
      />
    </>
  );
}
