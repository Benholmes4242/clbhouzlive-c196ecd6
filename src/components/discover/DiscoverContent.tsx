import React, { useEffect, useState } from 'react';
import { useDiscoverQuery } from '@/utils/useDiscoverQuery';
import ExploreGrid from '@/components/explore/ExploreGrid';
import VideosGrid from '@/components/discover/VideosGrid';
import PhotosGrid from '@/components/discover/PhotosGrid';
import ShortsGrid from '@/components/discover/ShortsGrid';
import SlidingPanels from '@/components/ui/SlidingPanels';
import { useInfiniteExploreContent } from '@/hooks/useInfiniteExploreContent';
import { FILTER_TYPES } from '@/components/explore/types';
import type { ExploreContentItem } from '@/components/explore/types';
import CreatorHighlightShelf from '@/components/discover/CreatorHighlightShelf';
import CreatorHighlightTile from '@/components/discover/CreatorHighlightTile';
import { CreatorHighlight } from '@/hooks/useCreatorHighlights';
import ShortsSuggestedProfiles from '@/components/shorts/ShortsSuggestedProfiles';
import { getDurationFilter } from '@/constants/videoFilters';
import type { LengthKey } from '@/components/videos/VideoChipRail';
import { useChannelSuggestions } from '@/hooks/useChannelSuggestions';
import { buildInterleavedFeed, FeedItem } from '@/utils/interleaveFeed';
import { ChannelSuggestionCard } from '@/components/discover/ChannelSuggestionCard';
import { analyticsEvents } from '@/utils/analyticsEvents';
import VideoExploreCard from '@/components/discover/VideoExploreCard';

interface DiscoverContentProps {
  onLike: (contentId: string) => void;
  onFollow: (contentId: string) => void;
  onMediaClick: (item: any) => void;
  searchQuery?: string;
  selectedTags?: string[];
}

// Map main pill to filter types for API calls
function getFilterTypeFromPills(main: string): string {
  // Map main pill to base filter type
  const mainToFilter: Record<string, string> = {
    'videos': FILTER_TYPES.VIDEOS,
    'channels': FILTER_TYPES.CHANNELS,
    'following': FILTER_TYPES.FOLLOWING,
    'friends': FILTER_TYPES.FOLLOWING, // Back-compat
    'verified-pros': FILTER_TYPES.VERIFIED_PROS,
    'hack-shack': FILTER_TYPES.HACK_SHACK,
  };
  
  return mainToFilter[main] || FILTER_TYPES.VIDEOS;
}


// Apply tag filtering to content
function applyTagFilter(content: ExploreContentItem[], selectedTags: string[]): ExploreContentItem[] {
  if (!selectedTags.length) return content;
  
  return content.filter(item => {
    const title = item.title?.toLowerCase() || '';
    const description = item.ctaDescription?.toLowerCase() || '';
    
    // Check if any of the selected tags appear in title or description
    return selectedTags.some(tag => 
      title.includes(tag.toLowerCase()) || 
      description.includes(tag.toLowerCase()) ||
      title.includes(`#${tag.toLowerCase()}`) ||
      description.includes(`#${tag.toLowerCase()}`)
    );
  });
}

export default function DiscoverContent({ onLike, onFollow, onMediaClick, searchQuery, selectedTags = [] }: DiscoverContentProps) {
  const { main, sub, duration } = useDiscoverQuery();
  const [currentContent, setCurrentContent] = useState<ExploreContentItem[] | null>(null);
  const [renderedVideoCount, setRenderedVideoCount] = useState(0);
  const scrollSentinelRef = React.useRef<HTMLDivElement>(null);
  
  // Channel suggestions hook for "All" tab interleaving
  const { next: nextSuggestion } = useChannelSuggestions();
  
  // Detect Shorts mode for compact view
  const isShorts = duration === 'shorts';
  
  // Get the filter type based on main pill
  const filterType = getFilterTypeFromPills(main);
  
  // Prepare duration filter for Videos
  const durationFilter = React.useMemo(() => {
    if (main !== 'videos') return undefined;
    return getDurationFilter(duration);
  }, [main, duration]);
  
  // Use existing hook to fetch content with filters
  const { 
    content, 
    loading, 
    hasMore, 
    loadMore 
  } = useInfiniteExploreContent(filterType, sub, durationFilter);

  // Apply search filtering and tag filtering whenever content changes
  useEffect(() => {
    if (content) {
      let filtered = content;
      
      // Apply search filter if query exists
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(item => 
          item.title?.toLowerCase().includes(query) ||
          item.ctaDescription?.toLowerCase().includes(query) ||
          item.user?.name?.toLowerCase().includes(query) ||
          item.user?.username?.toLowerCase().includes(query)
        );
      }

      // Apply tag filter if tags are selected
      if (selectedTags.length > 0) {
        filtered = applyTagFilter(filtered, selectedTags);
      }
      
      // Remove duplicates
      const unique = filtered.filter((item, index, self) => 
        index === self.findIndex(t => t.src === item.src)
      );
      setCurrentContent(unique);
    } else {
      setCurrentContent(null);
    }
  }, [content, main, searchQuery, selectedTags]);


  const handleCreatorClick = (creator: CreatorHighlight) => {
    console.log('Navigate to creator profile:', creator);
    // TODO: Implement navigation to creator profile or highlight detail
  };

  // Chip order for slide animation
  const CHIP_ORDER = ['all', 'shorts', 'under4', '4to20', 'over20'] as const;

  // Build interleaved feed for "All" tab
  const interleavedFeed = React.useMemo(() => {
    if (main === 'videos' && duration === 'all' && currentContent) {
      const feed = buildInterleavedFeed(currentContent, nextSuggestion, 0);
      console.debug('[Interleave] items:', currentContent?.length, 'offset:', 0, 'sampleKinds:', feed?.slice(0, 12).map(i => i.kind));
      return feed;
    }
    return null;
  }, [main, duration, currentContent, nextSuggestion]);

  // Reset rendered video count when switching tabs
  useEffect(() => {
    setRenderedVideoCount(0);
  }, [main, duration]);

  // Infinite scroll observer for "All" tab
  useEffect(() => {
    if (main !== 'videos' || duration !== 'all' || !scrollSentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(scrollSentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [main, duration, hasMore, loading, loadMore]);

  // Use VideosGrid for Videos tab, PhotosGrid for Photos tab, ExploreGrid for everything else
  if (main === 'videos') {
    return (
      <SlidingPanels
        activeKey={duration as LengthKey}
        order={CHIP_ORDER}
      >
        {(key: LengthKey) => {
          const itemsForKey = currentContent || [];
          
          // Shorts view
          if (key === 'shorts') {
            return (
              <ShortsGrid 
                items={itemsForKey} 
                onOpen={onMediaClick}
                isLoading={loading}
                hasMore={hasMore}
                onLoadMore={loadMore}
              />
            );
          }
          
          // "All" tab with interleaved channel suggestions
          if (key === 'all' && interleavedFeed) {
            return (
              <>
                <div className="grid grid-cols-2 gap-2 px-2">
                  {interleavedFeed.map((item: FeedItem) => 
                    item.kind === 'video' ? (
                      <VideoExploreCard
                        key={`v_${item.id}`}
                        item={item.data}
                        onMediaClick={onMediaClick}
                      />
                    ) : (
                      <ChannelSuggestionCard
                        key={item.id}
                        suggestion={item.data}
                        onImpression={() => analyticsEvents.track('channel_suggestion_impression', { id: item.data.id })}
                        onClick={() => analyticsEvents.track('channel_suggestion_click', { id: item.data.id })}
                        className="col-span-2 my-1"
                      />
                    )
                  )}
                </div>
                
                {/* Load more sentinel */}
                <div ref={scrollSentinelRef} className="h-4 mt-4">
                  {loading && hasMore && (
                    <div className="flex justify-center py-4">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              </>
            );
          }
          
          // Other duration filters (under4, 4to20, over20)
          return (
            <VideosGrid
              content={itemsForKey}
              onMediaClick={onMediaClick}
              isLoading={currentContent === null || loading}
              hasMore={hasMore}
              onLoadMore={loadMore}
              isShorts={false}
              activeTab={duration}
            />
          );
        }}
      </SlidingPanels>
    );
  }



  // Show loading while content is null for other tabs
  if (currentContent === null) {
    return (
      <ExploreGrid 
        content={[]}
        onLike={onLike}
        onFollow={onFollow}
        onMediaClick={onMediaClick}
        isLoading={true}
        hasMore={false}
        onLoadMore={loadMore}
        activeFilter={filterType}
        isDiscoverPage={true}
      />
    );
  }

  // Render content directly without Creator Spotlight injection
  return (
    <ExploreGrid 
      content={currentContent || []}
      onLike={onLike}
      onFollow={onFollow}
      onMediaClick={onMediaClick}
      isLoading={loading}
      hasMore={hasMore}
      onLoadMore={loadMore}
      activeFilter={filterType}
      isDiscoverPage={true}
    />
  );
}