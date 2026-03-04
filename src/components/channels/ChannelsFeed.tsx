import React from 'react';
import { useChannelsFeed } from '@/hooks/channels/useChannelsFeed';
import { ChannelVideoCard } from './ChannelVideoCard';
import { useDiscoverQuery } from '@/utils/useDiscoverQuery';
import { useInView } from 'react-intersection-observer';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
// REMOVED: useUnifiedFullscreen — Phase 5 fullscreen system deleted

export const ChannelsFeed: React.FC = () => {
  const { sub } = useDiscoverQuery();
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useChannelsFeed({ 
    subFilter: sub || 'all' 
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

  // TODO: Wire to new media player
  const openFullscreen = (...args: any[]) => console.log('[Fullscreen] TODO: Wire to new media player', args);

  const allVideos = data?.pages.flatMap(page => page.items) || [];

  const handleVideoPlay = (video: any) => {
    // Convert channel videos to ExploreContentItem-compatible format for shared fullscreen viewer
    const items = allVideos.map(v => ({
      id: v.id,
      src: v.post_media[0]?.media_url || '',
      type: 'video' as const,
      thumbnailSrc: v.post_media[0]?.poster_url || v.post_media[0]?.media_url || '',
      title: v.content || '',
      user: {
        id: v.user_id,
        name: v.user_profiles?.display_name || v.user_profiles?.username || 'Unknown',
        username: v.user_profiles?.username || '',
        avatar: v.user_profiles?.profile_photo_url || '',
      },
      media: v.post_media.map((m: any) => ({
        id: m.id,
        media_type: m.media_type,
        media_url: m.media_url,
        poster_url: m.poster_url,
        stream_id: m.stream_id,
      })),
      likes: 0,
      comments: 0,
      durationSeconds: v.post_media[0]?.duration_seconds,
    }));

    const startIndex = items.findIndex(i => i.id === video.id);
    openFullscreen(items, startIndex >= 0 ? startIndex : 0);
  };

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
          <ChannelVideoCard 
            key={video.id} 
            video={video}
            onPlay={handleVideoPlay}
          />
        ))}
      </div>

      {/* Load more trigger */}
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
