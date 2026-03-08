import { useEffect, useRef, useState, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { Loader2 } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';
import { FriendsCard } from './FriendsCard';
import { FriendsFeedSkeleton } from './FriendsFeedSkeleton';

async function prewarmVideo(hlsUrl: string) {
  try {
    const masterText = await fetch(hlsUrl, { mode: 'cors', credentials: 'omit' }).then(r => r.text());
    const masterLines = masterText.split('\n');
    const streamIdx = masterLines.findIndex(l => l.startsWith('#EXT-X-STREAM-INF'));
    const levelRelUrl = streamIdx >= 0 ? masterLines[streamIdx + 1]?.trim() : null;
    if (!levelRelUrl || levelRelUrl.startsWith('#')) return;
    const masterBase = hlsUrl.substring(0, hlsUrl.lastIndexOf('/') + 1);
    const levelUrl = levelRelUrl.startsWith('http') ? levelRelUrl : new URL(levelRelUrl, masterBase).href;

    const levelText = await fetch(levelUrl, { mode: 'cors', credentials: 'omit' }).then(r => r.text());
    const lines = levelText.split('\n');
    const base = levelUrl.substring(0, levelUrl.lastIndexOf('/') + 1);

    const mapLine = lines.find(l => l.startsWith('#EXT-X-MAP:URI="'));
    if (mapLine) {
      const mapUri = mapLine.match(/#EXT-X-MAP:URI="([^"]+)"/)?.[1];
      if (mapUri) {
        const initUrl = mapUri.startsWith('http') ? mapUri : new URL(mapUri, base).href;
        fetch(initUrl, { mode: 'cors', credentials: 'omit' }).catch(() => {});
      }
    }

    const segLine = lines.find(l => l.trim() && !l.startsWith('#'));
    if (segLine) {
      const segUrl = segLine.trim().startsWith('http') ? segLine.trim() : new URL(segLine.trim(), base).href;
      fetch(segUrl, { mode: 'cors', credentials: 'omit' }).catch(() => {});
    }
  } catch {
    // silent
  }
}

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
  const [centerIndex, setCenterIndex] = useState(0);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const prewarmedSetRef = useRef<Set<number>>(new Set());
  const centerObserverRef = useRef<IntersectionObserver | null>(null);

  const { ref: sentinelRef, inView } = useInView({
    rootMargin: '400px',
  });

  const setCardRef = useCallback((index: number) => (el: HTMLDivElement | null) => {
    if (el) {
      cardRefs.current.set(index, el);
    } else {
      cardRefs.current.delete(index);
    }
  }, []);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !fetchGuard.current) {
      fetchGuard.current = true;
      fetchNextPage();
      setTimeout(() => { fetchGuard.current = false; }, 200);
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

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

  // Pre-warm upcoming videos when centerIndex changes
  useEffect(() => {
    if (!posts || posts.length === 0) return;

    for (let i = centerIndex + 1; i <= centerIndex + 3; i++) {
      if (i >= posts.length) break;
      if (prewarmedSetRef.current.has(i)) continue;
      const hlsUrl = posts[i]?.mediaItems?.[0]?.hlsUrl;
      if (!hlsUrl) continue;
      prewarmedSetRef.current.add(i);
      prewarmVideo(hlsUrl);
    }
  }, [centerIndex, posts]);

  // Loading state
  if (isLoading && posts.length === 0) {
    return <FriendsFeedSkeleton />;
  }

  // Error state
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

  // Empty state
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
    <div className="flex flex-col pb-4 pt-2">
      {posts.map((post, i) => (
        <div key={post.id} ref={setCardRef(i)} data-card-index={i}>
          <FriendsCard post={post} isAutoplayEligible={Math.abs(i - centerIndex) <= 2} userId={userId} cardIndex={i} />
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
