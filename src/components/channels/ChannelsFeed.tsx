import React, { useEffect } from 'react';
import { useChannelsFeed } from '@/hooks/channels/useChannelsFeed';
import { ChannelVideoCard } from './ChannelVideoCard';
import { useDiscoverQuery } from '@/utils/useDiscoverQuery';
import { useInView } from 'react-intersection-observer';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import type { FeedPost } from '@/components/media-system/types/media';

export const ChannelsFeed: React.FC = () => {
  const { sub } = useDiscoverQuery();
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useChannelsFeed({
    subFilter: sub || 'all',
  });

  const { ref: loadMoreRef } = useInView({
    onChange: (inView) => {
      if (!inView) return;
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    threshold: 0.5,
  });

  const allVideos = data?.pages.flatMap((page) => page.items) || [];

  // Shared mapper — open() and appendPosts() must produce identical shapes.
  const toFeedPost = (v: any): FeedPost =>
    ({
      id: v.id,
      userId: v.user_id,
      actorType: 'personal',
      actorId: v.user_id,
      username: v.user_profiles?.username ?? '',
      displayName: v.user_profiles?.display_name ?? v.user_profiles?.username ?? '',
      avatarUrl: v.user_profiles?.profile_photo_url ?? '',
      isVerified: !!v.user_profiles?.is_verified,
      creatorRelation: 'none',
      caption: v.content ?? '',
      mediaItems: (v.post_media ?? []).map((m: any) => ({
        id: m.id,
        type: m.media_type === 'video' ? 'video' : 'image',
        hlsUrl: m.media_type === 'video' ? m.media_url : undefined,
        imageUrl: m.media_type === 'video' ? undefined : m.media_url,
        thumbnailUrl: m.poster_url ?? undefined,
        width: m.width ?? 0,
        height: m.height ?? 0,
      })),
      createdAt: v.created_at,
      likeCount: v.likes_count ?? 0,
      commentCount: v.comments_count ?? 0,
      shareCount: 0,
      review: null,
      isReview: false,
      isLikedByMe: false, // TODO: hydrate from query if useChannelsFeed adds it
      isFollowedByMe: false,
    }) as FeedPost;

  const handleVideoPlay = (video: any) => {
    const posts = allVideos.map(toFeedPost);
    const startIndex = Math.max(0, posts.findIndex((p) => p.id === video.id));
    useFullscreenFeedStore.getState().open(posts, startIndex, {
      // social ON — no readOnly
      hasNextPage,
      fetchNextPage: hasNextPage ? () => fetchNextPage() : undefined,
      isFetchingNextPage,
    });
  };

  // Keep the overlay's post list in sync as more pages load.
  useEffect(() => {
    const store = useFullscreenFeedStore.getState();
    if (!store.isOpen) return;
    store.appendPosts(allVideos.map(toFeedPost));
    store.setPaginationState({ hasNextPage, isFetchingNextPage });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allVideos.length, hasNextPage, isFetchingNextPage]);

  if (isLoading && allVideos.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <InlineSpinner size="lg" />
      </div>
    );
  }

  if (allVideos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="text-6xl mb-4">📺</div>
        <h3 className="text-xl font-semibold mb-2">No videos found</h3>
        <p className="text-muted-foreground mb-4">
          Try switching to "All" or "Popular" to discover more content
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-2 md:px-4 py-4">
      <div className="space-y-2">
        {allVideos.map((video) => (
          <ChannelVideoCard key={video.id} video={video} onPlay={handleVideoPlay} />
        ))}
      </div>

      {hasNextPage && (
        <div ref={loadMoreRef} className="py-8 flex justify-center">
          {isFetchingNextPage && (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          )}
        </div>
      )}
    </div>
  );
};
