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
  logObserverSetup,
  logObserverCallback,
  logScrollPosition,
  logObserverDisconnect,
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
  const loadingRef = useRef(isLoading);
  const onLoadMoreRef = useRef(onLoadMore);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Keep refs in sync with props - this avoids stale closures
  useEffect(() => {
    hasMoreRef.current = hasMore;
    loadingRef.current = isLoading;
    onLoadMoreRef.current = onLoadMore;
  }, [hasMore, isLoading, onLoadMore]);

  // Intersection observer for infinite scroll - stable observer, uses refs
  useEffect(() => {
    const sentinel = sentinelRef.current;
    
    // Debug: Log observer setup
    logObserverSetup({
      rootMargin: '400px 0px',
      threshold: 0,
      hasSentinel: !!sentinel,
      sentinelRect: sentinel?.getBoundingClientRect(),
    });
    
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const willTrigger = entry.isIntersecting && hasMoreRef.current && !loadingRef.current;
        
        // Debug: Log observer callback
        logObserverCallback({
          isIntersecting: entry.isIntersecting,
          intersectionRatio: entry.intersectionRatio,
          boundingClientRect: entry.boundingClientRect,
          hasMore: hasMoreRef.current,
          isLoading: loadingRef.current,
          willTrigger,
        });
        
        // Use refs to always get current values, not stale closure values
        if (willTrigger) {
          onLoadMoreRef.current();
        }
      },
      { 
        root: null,
        rootMargin: '400px 0px', // Trigger 400px BEFORE reaching bottom
        threshold: 0,
      }
    );

    observer.observe(sentinel);

    return () => {
      logObserverDisconnect();
      observer.disconnect();
    };
  }, []); // Empty deps - observer created once, uses refs for current values

  // Debug: Scroll position tracking for infinite scroll debugging
  useEffect(() => {
    const handleScroll = () => {
      const sentinel = sentinelRef.current;
      if (!sentinel) return;

      const sentinelRect = sentinel.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const distanceFromBottom = sentinelRect.top - viewportHeight;

      logScrollPosition({
        sentinelTop: sentinelRect.top,
        viewportHeight,
        distanceFromBottom,
        scrollY: window.scrollY,
      });
    };

    // Throttle scroll events
    let timeoutId: ReturnType<typeof setTimeout>;
    const throttledScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 200);
    };

    window.addEventListener('scroll', throttledScroll);
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      clearTimeout(timeoutId);
    };
  }, []);

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
        // Landscape cards layout - full width edge to edge with lazy loading
        <div className="flex flex-col gap-3 pb-4">
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

      {/* Infinite scroll sentinel */}
      <div 
        ref={sentinelRef}
        className="h-20 w-full mt-8"
      >
        {isLoading && hasMore && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      
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
