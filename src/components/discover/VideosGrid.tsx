import React, { useEffect, useState, useMemo, useRef } from 'react';
import VideoExploreCard from './VideoExploreCard';
import ShortCardWithObserver from '@/components/shorts/ShortCardWithObserver';
import { ExploreContentItem } from '@/components/explore/types';
import { InterleavedItem } from '@/utils/interleaveFeed';
import { ChannelSuggestionCard } from './ChannelSuggestionCard';
import { ChannelSuggestion } from '@/hooks/useChannelSuggestions';
import ShortsInlineBlock from './ShortsInlineBlock';
import ShortsViewer from '@/components/shorts/ShortsViewer';
import { useLazyTiles } from '@/components/shared/grid/useLazyTiles';
import {
  logGridMount,
  logVideosArrayUpdate,
  logLazyTilesState,
  logRenderedCards,
} from '@/utils/debugWatchPage';
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
  // Debug: Log component mount
  useEffect(() => {
    logGridMount();
  }, []);

  // State for ShortsViewer
  const [shortsViewerOpen, setShortsViewerOpen] = useState(false);
  const [shortsViewerItems, setShortsViewerItems] = useState<ExploreContentItem[]>([]);
  const [shortsViewerIndex, setShortsViewerIndex] = useState(0);

  const handleShortClick = (short: ExploreContentItem, allShorts: ExploreContentItem[], index: number) => {
    setShortsViewerItems(allShorts);
    setShortsViewerIndex(index);
    setShortsViewerOpen(true);
  };

  // Use interleaved feed if provided, otherwise filter videos
  const itemsToRender = useMemo(() => {
    return interleavedFeed 
      ? interleavedFeed 
      : content.filter(item => item.type === 'video').map(video => ({
          kind: 'video' as const,
          id: video.id,
          data: video
        }));
  }, [interleavedFeed, content]);

  // Debug: Log videos array updates
  useEffect(() => {
    logVideosArrayUpdate(itemsToRender, 'VideosGrid.itemsToRender');
    logRenderedCards();
  }, [itemsToRender.length]);
  
  // Lazy loading - only mount items near viewport
  const { visibleIndices, registerTile } = useLazyTiles({
    totalItems: itemsToRender.length,
    initialVisible: 12, // First 12 videos visible for better initial viewport fill
    preloadViewports: 2,
    estimatedRowHeight: 300,
  });

  // Debug: Log lazy tiles state
  useEffect(() => {
    logLazyTilesState({
      initialVisible: 12,
      totalItems: itemsToRender.length,
      visibleCount: visibleIndices.size,
      visibleIndices: Array.from(visibleIndices),
    });
  }, [visibleIndices, itemsToRender.length]);

  // Refs to avoid stale closure in IntersectionObserver callback
  const hasMoreRef = useRef(hasMore);
  const loadingRef = useRef(false);
  const isFetchingRef = useRef(false);
  const onLoadMoreRef = useRef(onLoadMore);
  const gridRef = useRef<HTMLDivElement>(null);

  // Keep refs in sync with props - this avoids stale closures
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
  useEffect(() => { isFetchingRef.current = isLoading; }, [isLoading]);
  useEffect(() => { onLoadMoreRef.current = onLoadMore; }, [onLoadMore]);

  // Infinite scroll using Intersection Observer - setup after items load
  useEffect(() => {
    // Don't set up until we have items and the grid has rendered
    if (itemsToRender.length === 0 || !hasMore || !onLoadMore) {
      return;
    }
    
    let observer: IntersectionObserver | null = null;
    let sentinel: HTMLDivElement | null = null;
    
    // Wait for next tick to ensure grid is in DOM
    const timeoutId = setTimeout(() => {
      const gridContainer = gridRef.current;
      if (!gridContainer) return;
      
      // Create sentinel element
      sentinel = document.createElement('div');
      sentinel.style.height = '1px';
      sentinel.style.width = '100%';
      sentinel.dataset.infiniteScrollSentinel = 'true';
      gridContainer.appendChild(sentinel);
      
      // Observe when sentinel comes into view
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry.isIntersecting && hasMoreRef.current && !loadingRef.current && !isFetchingRef.current) {
            loadingRef.current = true;
            onLoadMoreRef.current?.();
            setTimeout(() => {
              loadingRef.current = false;
            }, 1000);
          }
        },
        {
          rootMargin: '800px',
          threshold: 0
        }
      );
      
      observer.observe(sentinel);
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      observer?.disconnect();
      sentinel?.remove();
    };
  }, [itemsToRender.length, hasMore, onLoadMore]);

  if (itemsToRender.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="text-3xl mb-3">🎥</div>
        <h3 className="text-base font-semibold text-foreground mb-0.5">No videos found</h3>
        <p className="text-sm text-muted-foreground max-w-md">
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
        // Landscape cards layout - full width edge to edge with lazy loading
        <div ref={gridRef} className="flex flex-col gap-3 pb-4">
          {itemsToRender.map((item, index) => {
            // Channel suggestions and shorts blocks always render (non-video content)
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
                  onShortClick={(short, idx) => handleShortClick(short, item.data as ExploreContentItem[], idx)}
                />
              );
            }
            
            // Video items use lazy loading
            return (
              <div
                key={`${activeTab}-${item.id}`}
                ref={(el) => registerTile(index, el)}
                data-lazy-index={index}
              >
                {visibleIndices.has(index) ? (
                  <ShortCardWithObserver
                    item={item.data as ExploreContentItem}
                    onClick={() => onMediaClick?.(item.data as ExploreContentItem)}
                    variant="landscape"
                    gridPosition={index}
                  />
                ) : (
                  <div className="w-full aspect-video bg-muted animate-pulse rounded-lg" />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // Original grid layout for other tabs with lazy loading
        <div className="grid grid-cols-2 md:grid-cols-3" style={{ rowGap: '18px', columnGap: '2px' }}>
          {itemsToRender.map((item, index) => {
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
                    onShortClick={(short, idx) => handleShortClick(short, item.data as ExploreContentItem[], idx)}
                  />
                </div>
              );
            }
            
            return (
              <div
                key={`${activeTab}-${item.id}`}
                ref={(el) => registerTile(index, el)}
                data-lazy-index={index}
              >
                {visibleIndices.has(index) ? (
                  <VideoExploreCard
                    item={item.data as ExploreContentItem}
                    onMediaClick={onMediaClick}
                    compact={isShorts}
                  />
                ) : (
                  <div className="aspect-[9/16] bg-muted animate-pulse rounded-lg" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && hasMore && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* All caught up message */}
      {!hasMore && itemsToRender.length > 0 && !isLoading && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">You're all caught up</p>
        </div>
      )}

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
