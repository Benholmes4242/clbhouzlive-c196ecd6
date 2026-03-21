import { useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { Loader2 } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';
import { FriendsCard } from './FriendsCard';
import { FriendsFeedSkeleton } from './FriendsFeedSkeleton';
import { FriendsAutoplay } from './FriendsAutoplay';

interface FriendsFeedProps {
  posts: FeedPost[];
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
  userId?: string;
}

export function FriendsFeed({
  posts,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  refetch,
  userId,
}: FriendsFeedProps) {
  const fetchGuard = useRef(false);
  const feedContainerRef = useRef<HTMLDivElement>(null);

  const { ref: sentinelRef, inView } = useInView({
    rootMargin: '400px',
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !fetchGuard.current) {
      fetchGuard.current = true;
      fetchNextPage();
      setTimeout(() => { fetchGuard.current = false; }, 200);
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Sync new posts into fullscreen overlay
  const isFullscreenOpen = false; // TODO Brief 3
  const fullscreenPostCount = 0; // TODO Brief 3

  useEffect(() => {
    if (!isFullscreenOpen) return;
    if (posts.length > fullscreenPostCount) {
      const newPosts = posts.slice(fullscreenPostCount);
      // TODO Brief 3: appendPosts(newPosts);
    }
  }, [posts.length, isFullscreenOpen, fullscreenPostCount]);

  if (isLoading && posts.length === 0) {
    return <FriendsFeedSkeleton />;
  }

  if (isError && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <span className="text-4xl mb-3">📡</span>
        <p className="text-base font-medium text-foreground mb-1">Something went wrong</p>
        <p className="text-sm text-muted-foreground mb-4">We couldn't load your friends' posts right now.</p>
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
        <span className="text-4xl mb-3">👥</span>
        <p className="text-base font-medium text-foreground mb-1">Nothing from friends yet</p>
        <p className="text-sm text-muted-foreground">Posts from friends and people you follow will appear here.</p>
      </div>
    );
  }

  return (
    <div ref={feedContainerRef} className="flex flex-col gap-3 pb-4 pt-2">
      <FriendsAutoplay posts={posts} feedRef={feedContainerRef} />
      {posts.map((post, i) => (
        <div key={post.id} data-card-index={i}>
          <FriendsCard
            post={post}
            userId={userId}
            cardIndex={i}
            allPosts={posts}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
          />
        </div>
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {/* Bottom loading spinner */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* End of feed */}
      {!hasNextPage && posts.length > 0 && !isFetchingNextPage && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span className="text-2xl mb-2">✅</span>
          <p className="text-sm text-muted-foreground">You're all caught up</p>
        </div>
      )}
    </div>
  );
}
