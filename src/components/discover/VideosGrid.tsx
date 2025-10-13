import React, { useEffect } from 'react';
import VideoExploreCard from './VideoExploreCard';
import CinematicVideoCard from './CinematicVideoCard';
import { ExploreContentItem } from '@/components/explore/types';
import { InterleavedItem } from '@/utils/interleaveFeed';
import { ChannelSuggestionCard } from './ChannelSuggestionCard';
import { ChannelSuggestion } from '@/hooks/useChannelSuggestions';

interface VideosGridProps {
  content: ExploreContentItem[];
  onMediaClick?: (item: ExploreContentItem) => void;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  isShorts?: boolean;
  activeTab?: string; // For namespacing keys
  interleavedFeed?: InterleavedItem[] | null; // Optional interleaved feed with suggestions
}

const VideosGrid: React.FC<VideosGridProps> = ({
  content,
  onMediaClick,
  isLoading,
  hasMore,
  onLoadMore,
  isShorts = false,
  activeTab = 'all',
  interleavedFeed = null
}) => {
  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.3 }
    );

    const sentinel = document.getElementById('videos-scroll-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [hasMore, isLoading, onLoadMore]);

  // Use interleaved feed if provided, otherwise filter videos
  const itemsToRender = interleavedFeed 
    ? interleavedFeed 
    : content.filter(item => item.type === 'video').map(video => ({
        kind: 'video' as const,
        id: video.id,
        data: video
      }));

  if (itemsToRender.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-4xl mb-4">🎥</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No videos found</h3>
        <p className="text-muted-foreground max-w-md">
          No videos match these filters. Try a different duration or topic.
        </p>
      </div>
    );
  }

  // Check if we're in "All" tab (no duration filter or "all" duration)
  const isCinematicMode = activeTab === 'all' || activeTab === '';

  return (
    <>
      {isCinematicMode ? (
        // Cinematic single-column edge-to-edge layout for "All" tab
        <div className="flex flex-col">
          {itemsToRender.map((item) => {
            if (item.kind === 'channel_suggestion') {
              return (
                <ChannelSuggestionCard
                  key={item.id}
                  suggestion={item.data as ChannelSuggestion}
                  className="w-full my-2"
                />
              );
            }
            
            return (
              <CinematicVideoCard
                key={`${activeTab}-${item.id}`}
                item={item.data as ExploreContentItem}
                onMediaClick={onMediaClick}
              />
            );
          })}
        </div>
      ) : (
        // Original grid layout for other tabs (Shorts, Under 4 mins, etc.)
        <div className="grid grid-cols-2 md:grid-cols-3" style={{ rowGap: '18px', columnGap: '2px' }}>
          {itemsToRender.map((item) => {
            if (item.kind === 'channel_suggestion') {
              return (
                <ChannelSuggestionCard
                  key={item.id}
                  suggestion={item.data as ChannelSuggestion}
                  className="col-span-2 md:col-span-3 my-2"
                />
              );
            }
            
            return (
              <VideoExploreCard
                key={`${activeTab}-${item.id}`}
                item={item.data as ExploreContentItem}
                onMediaClick={onMediaClick}
                compact={isShorts}
              />
            );
          })}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div id="videos-scroll-sentinel" className="h-4 mt-8">
        {isLoading && hasMore && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </>
  );
};

export default VideosGrid;
