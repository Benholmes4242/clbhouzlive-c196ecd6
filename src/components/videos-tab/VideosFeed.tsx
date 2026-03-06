import { useEffect, useRef, useState, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { Loader2 } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';
import { VideoCard } from './VideoCard';
import { VideosFeedSkeleton } from './VideosFeedSkeleton';

interface VideosFeedProps {
  posts: FeedPost[];
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
}

export function VideosFeed({
  posts,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  refetch,
}: VideosFeedProps) {
  const fetchGuard = useRef(false);

  const { ref: sentinelRef, inView } = useInView({
    rootMargin: '400px',
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !fetchGuard.current) {
      fetchGuard.current = true;
      fetchNextPage();
      // Reset guard after a tick
      setTimeout(() => { fetchGuard.current = false; }, 200);
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Loading state
  if (isLoading && posts.length === 0) {
    return <VideosFeedSkeleton />;
  }

  // Error state
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

  // Empty state
  if (!isLoading && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <span className="text-4xl mb-3">📹</span>
        <p className="text-base font-medium text-foreground mb-1">No long-form videos yet</p>
        <p className="text-sm text-muted-foreground">Videos over 4 minutes will appear here.</p>
      </div>
    );
  }

  // --- Center index tracking for mount-gating autoplay ---
  const [centerIndex, setCenterIndex] = useState(0);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const centerObserverRef = useRef<IntersectionObserver | null>(null);

  const setCardRef = useCallback((index: number) => (el: HTMLDivElement | null) => {
    if (el) {
      cardRefs.current.set(index, el);
    } else {
      cardRefs.current.delete(index);
    }
  }, []);

  useEffect(() => {
    centerObserverRef.current?.disconnect();

    const ratios = new Map<number, number>();

    centerObserverRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const idx = Number(entry.target.getAttribute('data-card-index'));
          if (!isNaN(idx)) {
            ratios.set(idx, entry.intersectionRatio);
          }
        }
        let bestIdx = 0;
        let bestRatio = 0;
        for (const [idx, ratio] of ratios) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestIdx = idx;
          }
        }
        setCenterIndex(bestIdx);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    for (const [, el] of cardRefs.current) {
      centerObserverRef.current.observe(el);
    }

    return () => {
      centerObserverRef.current?.disconnect();
    };
  }, [posts.length]);

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      {posts.map((post, i) => (
        <div key={post.id} ref={setCardRef(i)} data-card-index={i}>
          <VideoCard post={post} isAutoplayEligible={Math.abs(i - centerIndex) <= 2} />
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
