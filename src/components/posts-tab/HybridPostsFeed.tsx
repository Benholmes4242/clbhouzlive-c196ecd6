import React, { useMemo, useEffect, useRef } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import { LongFormCard } from './LongFormCard';
import { ReviewCard } from './ReviewCard';
import { CompactGridRow } from './CompactGridRow';
import { PostsFeedSkeleton } from './PostsFeedSkeleton';
import { Loader2, RefreshCw } from 'lucide-react';

type PostKind = 'longform' | 'review' | 'compact';

type FeedSegment =
  | { kind: 'longform'; post: FeedPost }
  | { kind: 'review'; post: FeedPost }
  | { kind: 'compact-group'; posts: FeedPost[]; startIndex: number };

function classifyPost(post: FeedPost): PostKind {
  if (post.isReview && post.review) return 'review';
  const firstVideo = post.mediaItems.find(m => m.type === 'video');
  if (firstVideo && (firstVideo.duration ?? 0) > 180) return 'longform';
  return 'compact';
}

interface HybridPostsFeedProps {
  posts: FeedPost[];
  userId: string | undefined;
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
  isOwnProfile: boolean;
  actorName?: string;
  gridRef: React.RefObject<HTMLDivElement>;
}

export const HybridPostsFeed: React.FC<HybridPostsFeedProps> = ({
  posts,
  userId,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  refetch,
  isOwnProfile,
  actorName,
  gridRef,
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Build segments
  const segments = useMemo(() => {
    const fullWidthPosts: FeedPost[] = [];
    const compactPosts: FeedPost[] = [];

    for (const post of posts) {
      const kind = classifyPost(post);
      if (kind === 'compact') {
        compactPosts.push(post);
      } else {
        fullWidthPosts.push(post);
      }
    }

    const result: FeedSegment[] = [];
    let fwIndex = 0;
    let compactIndex = 0;

    while (fwIndex < fullWidthPosts.length || compactIndex < compactPosts.length) {
      if (fwIndex < fullWidthPosts.length) {
        const post = fullWidthPosts[fwIndex++];
        const kind = classifyPost(post);
        result.push({ kind: kind as 'longform' | 'review', post });
      }

      if (compactIndex < compactPosts.length) {
        const chunk = compactPosts.slice(compactIndex, compactIndex + 3);
        result.push({ kind: 'compact-group', posts: chunk, startIndex: compactIndex });
        compactIndex += chunk.length;
      }
    }

    return result;
  }, [posts]);

  if (isLoading) {
    return <PostsFeedSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <p className="text-sm text-muted-foreground">Something went wrong</p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2 px-6 text-center">
        <p className="text-sm font-medium text-foreground">No posts yet</p>
        {isOwnProfile && (
          <p className="text-xs text-muted-foreground">Share your first moment on the course</p>
        )}
      </div>
    );
  }

  return (
    <div ref={gridRef} className="flex flex-col gap-3 pb-6">
      {segments.map((segment, i) => {
        if (segment.kind === 'longform') {
          return <LongFormCard key={segment.post.id} post={segment.post} />;
        }
        if (segment.kind === 'review') {
          return <ReviewCard key={segment.post.id} post={segment.post} />;
        }
        return (
          <CompactGridRow
            key={`compact-${i}`}
            posts={segment.posts}
            startIndex={segment.startIndex}
          />
        );
      })}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
};
