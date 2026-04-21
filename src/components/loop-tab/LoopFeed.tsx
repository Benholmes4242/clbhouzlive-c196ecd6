import React, { useEffect, useMemo, useRef } from 'react';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useInView } from 'react-intersection-observer';
import { Loader2 } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';
import { LoopCard } from './LoopCard';
import { FriendsFeedSkeleton } from '@/components/friends-tab/FriendsFeedSkeleton';
import { FriendsAutoplay } from '@/components/friends-tab/FriendsAutoplay';
import { NetworkReviewShelf } from './NetworkReviewShelf';
import { useFriendCourseActivity } from '@/hooks/useFriendCourseActivity';

const SHELF_INTERVAL = 3;

interface LoopFeedProps {
  posts: FeedPost[];
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
  userId?: string;
}

export function LoopFeed({
  posts,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  refetch,
  userId,
}: LoopFeedProps) {
  const fetchGuard = useRef(false);
  const feedContainerRef = useRef<HTMLDivElement>(null);

  const { ref: sentinelRef, inView } = useInView({
    rootMargin: '400px',
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !fetchGuard.current) {
      fetchGuard.current = true;
      fetchNextPage();
      setTimeout(() => {
        fetchGuard.current = false;
      }, 200);
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Sync new posts into fullscreen overlay
  const { isOpen: isFullscreenOpen, appendPosts } = useFullscreenFeedStore();

  useEffect(() => {
    if (!isFullscreenOpen) return;
    if (posts.length > 0) {
      appendPosts(posts);
    }
  }, [posts.length, isFullscreenOpen, appendPosts]);

  // Batch-fetch friend-course activity for unique course IDs in the page
  const courseIds = useMemo(() => {
    const ids = new Set<string>();
    for (const p of posts) {
      const cid = p.review?.courseId;
      if (cid) ids.add(cid);
    }
    return Array.from(ids);
  }, [posts]);

  const { data: activityMap } = useFriendCourseActivity(userId, courseIds);

  // Throttle review nudge to max 1 per page (first eligible card wins)
  const nudgePostId = useMemo(() => {
    if (!activityMap) return null;
    for (const p of posts) {
      const cid = p.review?.courseId;
      if (!cid) continue;
      const a = activityMap[cid];
      if (a && a.self_has_played && !a.self_has_reviewed && !a.nudge_dismissed_recently) {
        return p.id;
      }
    }
    return null;
  }, [posts, activityMap]);

  if (isLoading && posts.length === 0) {
    return <FriendsFeedSkeleton />;
  }

  if (isError && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <span className="text-4xl mb-3">📡</span>
        <p className="text-base font-medium text-foreground mb-1">Something went wrong</p>
        <p className="text-sm text-muted-foreground mb-4">
          We couldn't load your friends' posts right now.
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-full"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!isLoading && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <span className="text-4xl mb-3">🔁</span>
        <p className="text-base font-medium text-foreground mb-1">The Loop is quiet</p>
        <p className="text-sm text-muted-foreground">
          Posts from friends and people you follow will appear here.
        </p>
      </div>
    );
  }

  return (
    <div ref={feedContainerRef} className="flex flex-col gap-3 pb-4 pt-2">
      <FriendsAutoplay posts={posts} feedRef={feedContainerRef} />
      {posts.map((post, i) => (
        <div key={post.id}>
          <div data-card-index={i}>
            <LoopCard
              post={post}
              userId={userId}
              cardIndex={i}
              allPosts={posts}
              fetchNextPage={fetchNextPage}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
            />
          </div>
          {(i + 1) % SHELF_INTERVAL === 0 && <NetworkReviewShelf userId={userId} />}
        </div>
      ))}
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
    </div>
  );
}
