import React, { useEffect, useState, useMemo } from 'react';
import VideoExploreCard from './VideoExploreCard';
import CinematicVideoCard from './CinematicVideoCard';
import { ExploreContentItem } from '@/components/explore/types';
import { InterleavedItem } from '@/utils/interleaveFeed';
import { ChannelSuggestionCard } from './ChannelSuggestionCard';
import { ChannelSuggestion } from '@/hooks/useChannelSuggestions';
import ShortsInlineBlock from './ShortsInlineBlock';
import ShortsViewer from '@/components/shorts/ShortsViewer';
import { preloadPosters } from '@/utils/preloadPosters';
import { getStreamPoster } from '@/utils/stream';

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
  // State for ShortsViewer
  const [shortsViewerOpen, setShortsViewerOpen] = useState(false);
  const [shortsViewerItems, setShortsViewerItems] = useState<ExploreContentItem[]>([]);
  const [shortsViewerIndex, setShortsViewerIndex] = useState(0);

  const handleShortClick = (short: ExploreContentItem, allShorts: ExploreContentItem[], index: number) => {
    setShortsViewerItems(allShorts);
    setShortsViewerIndex(index);
    setShortsViewerOpen(true);
  };

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

  // Extract poster URLs for the first screen to preload
  const firstPosterUrls = useMemo(() => {
    return itemsToRender
      .slice(0, 6)
      .filter(item => item.kind === 'video')
      .map((item) => {
        const video = item.data as ExploreContentItem;
        // Try thumbnailSrc first, then extract from src if it's a stream URL
        if (video.thumbnailSrc) return video.thumbnailSrc;
        if (video.src) {
          const poster = getStreamPoster(video.src);
          if (poster) return poster;
        }
        return null;
      })
      .filter(Boolean) as string[];
  }, [itemsToRender]);

  // Preload first two posters for faster initial paint
  useEffect(() => {
    if (firstPosterUrls.length) {
      preloadPosters(firstPosterUrls, 2);
    }
  }, [firstPosterUrls]);

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

  // Cinematic mode for all video duration tabs
  const isCinematicMode = true;

  return (
    <>
      {isCinematicMode ? (
        // Cinematic single-column edge-to-edge layout
        <div className="flex flex-col">
          {itemsToRender.map((item) => {
            if (item.kind === 'channel_suggestion') {
              return (
                <ChannelSuggestionCard
                  key={item.id}
                  suggestion={item.data as ChannelSuggestion}
                  className="w-full mt-[10px] mb-[30px]"
                />
              );
            }
            
            if (item.kind === 'shorts_block' && Array.isArray(item.data)) {
              return (
                <ShortsInlineBlock
                  key={item.id}
                  shorts={item.data}
                  blockId={item.id}
                  onShortClick={(short, index) => handleShortClick(short, item.data as ExploreContentItem[], index)}
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
        // Original grid layout for other tabs
        <div className="grid grid-cols-2 md:grid-cols-3" style={{ rowGap: '18px', columnGap: '2px' }}>
          {itemsToRender.map((item) => {
            if (item.kind === 'channel_suggestion') {
              return (
                <ChannelSuggestionCard
                  key={item.id}
                  suggestion={item.data as ChannelSuggestion}
                  className="col-span-2 md:col-span-3 my-[30px]"
                />
              );
            }
            
            if (item.kind === 'shorts_block' && Array.isArray(item.data)) {
              return (
                <div key={item.id} className="col-span-2 md:col-span-3">
                  <ShortsInlineBlock
                    shorts={item.data}
                    blockId={item.id}
                    onShortClick={(short, index) => handleShortClick(short, item.data as ExploreContentItem[], index)}
                  />
                </div>
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

      {/* ShortsViewer */}
      {shortsViewerOpen && (
        <ShortsViewer
          items={shortsViewerItems}
          initialIndex={shortsViewerIndex}
          isOpen={shortsViewerOpen}
          onClose={() => setShortsViewerOpen(false)}
        />
      )}
    </>
  );
};

export default VideosGrid;
