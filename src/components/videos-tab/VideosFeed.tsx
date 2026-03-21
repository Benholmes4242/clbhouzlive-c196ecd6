import { useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { Loader2 } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';
import type { VideosFilter } from './hooks/useVideosFeed';
import { VideoCard } from './VideoCard';
import { VideosFeedSkeleton } from './VideosFeedSkeleton';
import { VideosAutoplay } from './VideosAutoplay';

interface VideosFeedProps {
  posts: FeedPost[];
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
  userId?: string;
  activeFilter?: VideosFilter;
}

export function VideosFeed({
  posts,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  refetch,
  userId,
  activeFilter,
}: VideosFeedProps) {
  const fetchGuard = useRef(false);
  const feedRef = useRef<HTMLDivElement>(null);

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
    return <VideosFeedSkeleton />;
  }

  if (isError && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <span className="text-4xl mb-3">📡</span>
        <p className="text-base font-medium text-foreground mb-1">Something went wrong</p>
        <p className="text-sm text-muted-foreground mb-4">We couldn't load videos right now.</p>
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
        <span className="text-4xl mb-3">📹</span>
        {activeFilter === 'following' ? (
          <>
            <p className="text-base font-medium text-foreground mb-1">Nothing here yet</p>
            <p className="text-sm text-muted-foreground">Follow golfers to see their long-form videos.</p>
          </>
        ) : (
          <>
            <p className="text-base font-medium text-foreground mb-1">No long-form videos yet</p>
            <p className="text-sm text-muted-foreground">Videos over 3 minutes will appear here.</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div ref={feedRef} className="flex flex-col gap-3 pb-4 pt-2">
      <VideosAutoplay posts={posts} feedRef={feedRef} />
      {posts.map((post, i) => (
        <div key={post.id} data-card-index={i}>
          <VideoCard
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
    </div>
  );
}
