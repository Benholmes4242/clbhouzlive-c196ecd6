import React, { useEffect, useRef, useState } from 'react';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useInView } from 'react-intersection-observer';
import { Loader2, Film } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';
import { LoopCard } from '@/components/loop-tab/LoopCard';
import { ReviewCard } from './ReviewCard';
import { PostsFeedSkeleton } from './PostsFeedSkeleton';
import { usePostDeletion } from '@/hooks/usePostDeletion';
import { useClubhouseLikes } from '@/components/clubhouse/hooks/useClubhouseLikes';
import { useActiveActor } from '@/context/ActiveActorContext';
import CommentsSheet from '@/components/comments/CommentsSheet';

interface ProfilePostsFeedProps {
  posts: FeedPost[];
  userId: string | undefined;
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
  isOwnProfile: boolean;
}

/**
 * Unified profile posts feed. Reuses the Loop tab card pattern (`LoopCard`) for
 * standard posts and the editorial `ReviewCard` for reviews.
 *
 * Comment-sheet ownership: this component owns the CommentsSheet ONLY for the
 * `ReviewCard` branch (which doesn't render its own). `LoopCard` renders its
 * own internal CommentsSheet — we don't wire `onComment` for that branch to
 * avoid double-mount.
 */
export const ProfilePostsFeed: React.FC<ProfilePostsFeedProps> = ({
  posts,
  userId,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  refetch,
  isOwnProfile,
}) => {
  const feedContainerRef = useRef<HTMLDivElement>(null);
  const fetchGuard = useRef(false);
  const { deletePost } = usePostDeletion();
  const { activeActor } = useActiveActor();
  const { handleLike, getActiveLikeState } = useClubhouseLikes({ userId, activeActor });

  const { ref: sentinelRef, inView } = useInView({ rootMargin: '400px' });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !fetchGuard.current) {
      fetchGuard.current = true;
      fetchNextPage();
      setTimeout(() => { fetchGuard.current = false; }, 200);
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Sync new posts into fullscreen overlay
  const { isOpen: isFullscreenOpen, appendPosts } = useFullscreenFeedStore();
  useEffect(() => {
    if (!isFullscreenOpen) return;
    if (posts.length > 0) appendPosts(posts);
  }, [posts.length, isFullscreenOpen, appendPosts]);

  // Comments sheet — review branch only
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [commentsCreatorId, setCommentsCreatorId] = useState<string | undefined>(undefined);
  const [commentsCreatorName, setCommentsCreatorName] = useState<string | undefined>(undefined);
  const [commentsCaption, setCommentsCaption] = useState<string | null>(null);

  const openComments = (post: FeedPost) => {
    setCommentsPostId(post.id);
    setCommentsCreatorId(post.userId);
    setCommentsCreatorName(post.displayName);
    setCommentsCaption(post.caption ?? null);
  };
  const closeComments = () => setCommentsPostId(null);

  const handleDelete = (postId: string, postUserId?: string) => {
    const post = posts.find(p => p.id === postId);
    deletePost(
      postId,
      (post?.actorType as 'personal' | 'business') ?? 'personal',
      post?.actorId ?? postUserId ?? userId,
      userId
    );
  };

  if (isLoading && posts.length === 0) {
    return <PostsFeedSkeleton />;
  }

  if (isError && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 px-6 text-center">
        <p className="text-sm text-muted-foreground">Couldn't load posts</p>
        <p className="text-xs text-muted-foreground">Please check your connection and try again.</p>
        <button
          onClick={() => refetch()}
          className="h-11 px-5 rounded-full text-sm font-semibold bg-foreground text-background hover:bg-foreground/90 active:scale-[0.97] transition-all"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!isLoading && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 px-6 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <Film className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">No posts match this filter</p>
        {isOwnProfile && (
          <p className="text-xs text-muted-foreground">Share your first moment on the course</p>
        )}
      </div>
    );
  }

  return (
    <div ref={feedContainerRef} className="flex flex-col gap-3 pb-4 pt-2">
      {posts.map((post, i) => {
        const isOwnPost = isOwnProfile && post.userId === userId;

        if (post.isReview && post.review) {
          return (
            <div key={post.id} data-card-index={i}>
              <ReviewCard
                post={post}
                allPosts={posts}
                postIndex={i}
                isOwnPost={isOwnPost}
                onDelete={() => handleDelete(post.id, post.userId)}
                likeState={getActiveLikeState(post)}
                onLike={() => handleLike(post)}
                onComment={() => openComments(post)}
              />
            </div>
          );
        }

        return (
          <div key={post.id} data-card-index={i}>
            <LoopCard
              post={post}
              userId={userId}
              cardIndex={i}
              allPosts={posts}
              fetchNextPage={fetchNextPage}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              isOwnPost={isOwnPost}
              onDelete={() => handleDelete(post.id, post.userId)}
              showActivitySignals={!isOwnProfile}
              // Do NOT wire onComment — LoopCard owns its own CommentsSheet.
            />
          </div>
        );
      })}

      <div ref={sentinelRef} className="h-1" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!hasNextPage && posts.length > 0 && !isFetchingNextPage && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span className="text-2xl mb-2">✅</span>
          <p className="text-sm text-muted-foreground">You're all caught up</p>
        </div>
      )}

      {/* Review-branch CommentsSheet (LoopCard owns its own internally) */}
      <CommentsSheet
        isOpen={!!commentsPostId}
        onClose={closeComments}
        postId={commentsPostId ?? ''}
        currentUserId={userId}
        creatorUserId={commentsCreatorId}
        creatorName={commentsCreatorName}
        caption={commentsCaption ?? undefined}
        theme="light"
      />
    </div>
  );
};
