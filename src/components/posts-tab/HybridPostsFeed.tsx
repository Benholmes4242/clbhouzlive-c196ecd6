import React, { useMemo, useEffect, useRef, useState } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import { LongFormCard } from './LongFormCard';
import { ReviewCard } from './ReviewCard';
import { CompactGridRow } from './CompactGridRow';
import { PostsFeedSkeleton } from './PostsFeedSkeleton';
import { Loader2, Film } from 'lucide-react';
import { usePostDeletion } from '@/hooks/usePostDeletion';
import { useClubhouseLikes } from '@/components/clubhouse/hooks/useClubhouseLikes';
import { useActiveActor } from '@/context/ActiveActorContext';
import CommentsSheet from '@/components/comments/CommentsSheet';

type PostKind = 'longform' | 'review' | 'compact';

type FeedSegment =
  | { kind: 'longform'; post: FeedPost }
  | { kind: 'review'; post: FeedPost }
  | { kind: 'compact-group'; posts: FeedPost[]; startIndex: number; globalIndices: number[] };

function classifyPost(post: FeedPost): PostKind {
  // Reviews always render full-width
  if (post.isReview && post.review) return 'review';

  const firstMedia = post.mediaItems[0];
  if (!firstMedia) return 'compact';

  // Long videos (> 3 min) render full-width
  if (firstMedia.type === 'video' && (firstMedia.duration ?? 0) > 180) {
    return 'longform';
  }

  // Landscape images render full-width
  // Only treat as landscape if width and height are explicitly stored
  // and clearly wider than tall (ratio > 1.2 avoids near-square posts)
  const w = firstMedia.width ?? 0;
  const h = firstMedia.height ?? 0;
  if (firstMedia.type === 'image' && w > 0 && h > 0 && w / h > 1.2) {
    return 'longform';
  }

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
  const { deletePost } = usePostDeletion();
  const { activeActor } = useActiveActor();
  const { handleLike, getActiveLikeState } = useClubhouseLikes({ userId, activeActor });

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

  // Build segments — track global indices for compact posts
  const segments = useMemo(() => {
    const fullWidthPosts: { post: FeedPost; globalIndex: number }[] = [];
    const compactPosts: { post: FeedPost; globalIndex: number }[] = [];

    for (let gi = 0; gi < posts.length; gi++) {
      const post = posts[gi];
      const kind = classifyPost(post);
      if (kind === 'compact') {
        compactPosts.push({ post, globalIndex: gi });
      } else {
        fullWidthPosts.push({ post, globalIndex: gi });
      }
    }

    const result: FeedSegment[] = [];
    let fwIndex = 0;
    let compactIndex = 0;

    while (fwIndex < fullWidthPosts.length || compactIndex < compactPosts.length) {
      if (fwIndex < fullWidthPosts.length) {
        const { post } = fullWidthPosts[fwIndex++];
        const kind = classifyPost(post);
        result.push({ kind: kind as 'longform' | 'review', post });
      }

      if (compactIndex < compactPosts.length) {
        const chunk = compactPosts.slice(compactIndex, compactIndex + 2);
        result.push({
          kind: 'compact-group',
          posts: chunk.map((c) => c.post),
          startIndex: chunk[0].globalIndex,
          globalIndices: chunk.map((c) => c.globalIndex),
        });
        compactIndex += chunk.length;
      }
    }

    return result;
  }, [posts]);

  const handleDelete = (postId: string, postUserId?: string) => {
    const post = posts.find(p => p.id === postId);
    deletePost(
      postId,
      (post?.actorType as 'personal' | 'business') ?? 'personal',
      post?.actorId ?? postUserId ?? userId,
      userId
    );
  };

  if (isLoading) {
    return <PostsFeedSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 px-6 text-center">
        <p className="text-sm text-muted-foreground">
          Couldn't load posts
        </p>
        <p className="text-xs text-muted-foreground">
          Please check your connection and try again.
        </p>
        <button
          onClick={() => refetch()}
          className="h-11 px-5 rounded-full text-sm font-semibold bg-foreground text-background hover:bg-foreground/90 active:scale-[0.97] transition-all"
        >
          Try again
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
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
    <div ref={gridRef} className="flex flex-col gap-3.5 px-3 pt-2 pb-6">
      {segments.map((segment, i) => {
        if (segment.kind === 'longform') {
          const idx = posts.indexOf(segment.post);
          return (
            <LongFormCard
              key={segment.post.id}
              post={segment.post}
              allPosts={posts}
              postIndex={idx >= 0 ? idx : undefined}
              isOwnPost={isOwnProfile}
              onDelete={() => handleDelete(segment.post.id, segment.post.userId)}
              likeState={getActiveLikeState(segment.post)}
              onLike={() => handleLike(segment.post)}
              onComment={() => openComments(segment.post)}
            />
          );
        }
        if (segment.kind === 'review') {
          const idx = posts.indexOf(segment.post);
          return (
            <ReviewCard
              key={segment.post.id}
              post={segment.post}
              allPosts={posts}
              postIndex={idx >= 0 ? idx : undefined}
              isOwnPost={isOwnProfile}
              onDelete={() => handleDelete(segment.post.id, segment.post.userId)}
              likeState={getActiveLikeState(segment.post)}
              onLike={() => handleLike(segment.post)}
              onComment={() => openComments(segment.post)}
            />
          );
        }

        // compact-group
        if (segment.posts.length >= 2) {
          // Determine label based on media composition
          const allVideo = segment.posts.every(
            (p) => p.mediaItems[0]?.type === 'video'
          );
          const label = allVideo ? 'Clips' : 'Photos';
          return (
            <div key={`compact-${i}`} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between px-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {label} · {segment.posts.length}
                </span>
              </div>
              <CompactGridRow
                posts={segment.posts}
                startIndex={segment.startIndex}
                globalIndices={segment.globalIndices}
                allPosts={posts}
                isOwnProfile={isOwnProfile}
                onDeletePost={(postId) => handleDelete(postId)}
              />
            </div>
          );
        }

        return (
          <CompactGridRow
            key={`compact-${i}`}
            posts={segment.posts}
            startIndex={segment.startIndex}
            globalIndices={segment.globalIndices}
            allPosts={posts}
            isOwnProfile={isOwnProfile}
            onDeletePost={(postId) => handleDelete(postId)}
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