import React, { useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import VideoCard from './VideoCard';
import VideosFeedSkeleton from './VideosFeedSkeleton';
import type { FeedPost } from '@/components/media-system/types/media';

interface VideosFeedProps {
  posts: FeedPost[];
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
}

const VideosFeed: React.FC<VideosFeedProps> = ({
  posts,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  refetch,
}) => {
  const { ref: sentinelRef, inView } = useInView({ rootMargin: '400px' });
  const fetchGuard = useRef(false);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !fetchGuard.current) {
      fetchGuard.current = true;
      fetchNextPage();
      // Reset guard after a short delay to prevent double-fires
      setTimeout(() => { fetchGuard.current = false; }, 500);
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Loading state
  if (isLoading && posts.length === 0) {
    return <VideosFeedSkeleton />;
  }

  // Error state
  if (isError && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-5xl">📡</span>
        <p className="mt-3 text-base font-semibold text-foreground">Something went wrong</p>
        <p className="mt-1 text-sm text-muted-foreground">Check your connection and try again</p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-5 py-2 rounded-full text-sm font-medium"
          style={{
            background: 'hsl(var(--foreground))',
            color: 'hsl(var(--background))',
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  // Empty state
  if (!isLoading && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-5xl">📹</span>
        <p className="mt-3 text-base font-semibold text-foreground">No long-form videos yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Videos over 4 minutes will appear here</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      {posts.map((post) => (
        <VideoCard key={post.id} post={post} />
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  );
};

export default VideosFeed;
