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
import { useShortsSuggestions } from '@/hooks/useShortsSuggestions';
import { buildInterleavedFeed, InterleavedItem } from '@/utils/interleaveFeed';
import { usePerfMonitor } from '@/hooks/usePerfMonitor';

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
    'shorts': FILTER_TYPES.VIDEOS,
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
  
  // Performance monitoring
  usePerfMonitor('DiscoverContent', { main, duration });
  
  const [currentContent, setCurrentContent] = useState<ExploreContentItem[] | null>(null);
  const [recentHistory, setRecentHistory] = useState<Set<string>>(new Set());
  
  // Fetch real Shorts data for inline blocks (only when on Videos tab)
  const { content: shortsContent, hasMore: hasMoreShorts, loadMore: loadMoreShorts } = useInfiniteExploreContent(
    FILTER_TYPES.VIDEOS,
    undefined,
    getDurationFilter('shorts')
  );
  
  // Suggestions hooks with real data
  const { next: getNextChannel } = useChannelSuggestions();
  const { next: getNextShort } = useShortsSuggestions(shortsContent || [], {
    hasMore: hasMoreShorts,
    prefetch: () => {
      if (hasMoreShorts) {
        // Fire and forget
        loadMoreShorts();
      }
    }
  });
  
  // Detect Shorts mode for compact view
  const isShorts = main === 'shorts' || duration === 'shorts';
  
  // Get the filter type based on main pill
  const filterType = getFilterTypeFromPills(main);
  
  // Prepare duration filter for Videos/Shorts
  const durationFilter = React.useMemo(() => {
    if (main !== 'videos' && main !== 'shorts') return undefined;
    // If main is 'shorts', use shorts filter regardless of duration param
    if (main === 'shorts') return getDurationFilter('shorts');
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

  // Reset recent history when tab changes
  useEffect(() => {
    setRecentHistory(new Set());
  }, [main, duration]);

  // Chip order for slide animation
  const CHIP_ORDER = ['all', 'shorts', 'under4', '4to20', 'over20'] as const;

  // Handle Shorts tab directly (no sliding panels needed)
  if (main === 'shorts') {
    return (
      <>
        <ShortsSuggestedProfiles />
        <ShortsGrid 
          items={currentContent || []} 
          onOpen={onMediaClick}
          isLoading={loading}
          hasMore={hasMore}
          onLoadMore={loadMore}
        />
      </>
    );
  }

  // Use VideosGrid with SlidingPanels for Videos tab
  if (main === 'videos') {
    return (
      <SlidingPanels
        activeKey={duration as LengthKey}
        order={CHIP_ORDER}
      >
        {(key: LengthKey) => {
          const itemsForKey = currentContent || [];
          
          // Build interleaved feed for "All" tab only
          const interleavedFeed = React.useMemo(() => {
            if (key !== 'all') return null;
            
            const t0 = performance.now();
            const feed = buildInterleavedFeed(
              itemsForKey,
              getNextShort,
              getNextChannel,
              0, // Always start from 0, the function handles global counting internally
              recentHistory
            );
            const duration = performance.now() - t0;
            
            // Debug log with performance data
            if (import.meta.env.DEV) {
              const shortsBlocks = feed.filter(i => i.kind === 'shorts_block').length;
              const channelSuggs = feed.filter(i => i.kind === 'channel_suggestion').length;
              console.debug('[Interleave]', {
                totalVideos: itemsForKey.length,
                shortsBlocks,
                channelSuggs,
                totalItems: feed.length,
                sampleKinds: feed.slice(0, 20).map(i => i.kind)
              });
              // eslint-disable-next-line no-console
              console.debug('[perf] interleave compute', {
                items: itemsForKey.length,
                duration: `${duration.toFixed(2)}ms`
              });
            }
            
            return feed;
          }, [key, itemsForKey.length, shortsContent?.length]);
          
          return (
            <VideosGrid
              content={itemsForKey}
              onMediaClick={onMediaClick}
              isLoading={currentContent === null || loading}
              hasMore={hasMore}
              onLoadMore={loadMore}
              isShorts={false}
              activeTab={duration}
              interleavedFeed={key === 'all' ? interleavedFeed : undefined}
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