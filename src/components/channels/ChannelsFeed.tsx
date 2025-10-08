import React from 'react';
import { useChannelsFeed } from '@/hooks/channels/useChannelsFeed';
import { ChannelVideoCard } from './ChannelVideoCard';
import { useDiscoverQuery } from '@/utils/useDiscoverQuery';
import { useInView } from 'react-intersection-observer';
import ClbhouzPageSpinner from '@/components/ui/ClbhouzPageSpinner';
import { useVerticalMediaFeed } from '@/hooks/useVerticalMediaFeed';

export const ChannelsFeed: React.FC = () => {
  const { sub } = useDiscoverQuery();
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useChannelsFeed({ 
    subFilter: sub || 'all' 
  });

  const { ref: loadMoreRef } = useInView({
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    threshold: 0.5,
  });

  const { openFeed, setPosts } = useVerticalMediaFeed();

  const allVideos = data?.pages.flatMap(page => page.items) || [];

  const handleVideoPlay = (video: any) => {
    // Convert to format expected by vertical feed
    const posts = allVideos.map(v => ({
      id: v.id,
      user_id: v.user_id,
      content: v.content,
      created_at: v.created_at,
      src: v.post_media[0]?.media_url || '',
      type: 'video' as const,
      title: v.content || '',
      username: v.user_profiles?.username || '',
      userAvatar: v.user_profiles?.profile_photo_url || '',
      likes: 0,
      comments: 0,
      shares: 0,
      media: v.post_media.map((m: any) => ({
        id: m.id,
        media_type: m.media_type,
        media_url: m.media_url,
        poster_url: m.poster_url,
        stream_id: m.stream_id,
      })),
    }));

    setPosts(posts);
    openFeed(posts.find(p => p.id === video.id)!);
  };

  if (isLoading && allVideos.length === 0) {
    return <ClbhouzPageSpinner label="Loading channels..." />;
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
