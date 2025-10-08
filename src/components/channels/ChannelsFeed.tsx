import React from 'react';
import { useChannelsFeed } from '@/hooks/channels/useChannelsFeed';
import { ChannelVideoCard } from './ChannelVideoCard';
import { useDiscoverQuery } from '@/utils/useDiscoverQuery';
import { useInView } from 'react-intersection-observer';
import ClbhouzPageSpinner from '@/components/ui/ClbhouzPageSpinner';
import { useVerticalMediaFeed } from '@/hooks/useVerticalMediaFeed';
import { isMockEnabled, getMockChannels } from '@/mocks/channels.mock';

export const ChannelsFeed: React.FC = () => {
  const { sub } = useDiscoverQuery();
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useChannelsFeed({ 
    subFilter: sub || 'all' 
  });

  const [mockItems, setMockItems] = React.useState<any[]>([]);
  const [mockPage, setMockPage] = React.useState(0);
  const mockMode = isMockEnabled();

  const { ref: loadMoreRef } = useInView({
    onChange: (inView) => {
      if (!inView) return;
      
      if (!mockMode && !isEmptyReal) {
        // Real data pagination
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      } else {
        // Mock pagination - load 1-2 pages then stop
        if (mockPage < 1) {
          setMockPage(p => p + 1);
        }
      }
    },
    threshold: 0.5,
  });

  const { openFeed, setPosts } = useVerticalMediaFeed();

  const allVideos = data?.pages.flatMap(page => page.items) || [];
  const isEmptyReal = !allVideos || allVideos.length === 0;

  // Load mock data when needed
  React.useEffect(() => {
    if (!mockMode && !isEmptyReal) return; // use real data
    
    const items = getMockChannels(mockPage, 15, sub || 'all');
    if (mockPage === 0) {
      setMockItems(items);
    } else {
      setMockItems(prev => [...prev, ...items]);
    }
  }, [mockMode, isEmptyReal, mockPage, sub]);

  const itemsToRender = (!mockMode && !isEmptyReal) ? allVideos : mockItems;

  const handleVideoPlay = (video: any) => {
    // Don't process mock videos - card handles it with dialog
    if ((video as any).mock) return;

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

  if (isLoading && itemsToRender.length === 0) {
    return <ClbhouzPageSpinner label="Loading channels..." />;
  }

  if (itemsToRender.length === 0) {
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
        {itemsToRender.map((video) => (
          <ChannelVideoCard 
            key={video.id} 
            video={video}
            onPlay={handleVideoPlay}
          />
        ))}
      </div>

      {/* Load more trigger */}
      {((!mockMode && !isEmptyReal && hasNextPage) || (mockMode || isEmptyReal) && mockPage < 1) && (
        <div ref={loadMoreRef} className="py-8 flex justify-center">
          {isFetchingNextPage && (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          )}
        </div>
      )}
    </div>
  );
};
