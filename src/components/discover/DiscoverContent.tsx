import React, { useEffect, useState } from 'react';
import { useDiscoverQuery } from '@/utils/useDiscoverQuery';
import ExploreGrid from '@/components/explore/ExploreGrid';
import { useInfiniteExploreContent } from '@/hooks/useInfiniteExploreContent';
import { FILTER_TYPES } from '@/components/explore/types';
import type { ExploreContentItem } from '@/components/explore/types';

interface DiscoverContentProps {
  onLike: (contentId: string) => void;
  onFollow: (contentId: string) => void;
  onMediaClick: (item: any) => void;
}

// Map main+sub combinations to filter types for API calls
function getFilterTypeFromPills(main: string, sub: string): string {
  // Map main pill to base filter type
  const mainToFilter: Record<string, string> = {
    'friends': FILTER_TYPES.FRIENDS,
    'videos': FILTER_TYPES.VIDEOS,
    'photos': FILTER_TYPES.PHOTOS,
    'trending': FILTER_TYPES.TRENDING,
    'verified-pros': FILTER_TYPES.VERIFIED_PROS,
    'channels': FILTER_TYPES.CHANNELS,
    'hack-shack': FILTER_TYPES.HACK_SHACK,
  };
  
  // For now, use main filter type - in future, sub could modify the query
  return mainToFilter[main] || FILTER_TYPES.VIDEOS;
}

// Apply client-side sub-filtering 
function applySubFilter(content: ExploreContentItem[], main: string, sub: string): ExploreContentItem[] {
  // For now, return all content - in future this could filter by subpill
  // Example logic could be:
  // if (sub === 'Shorts') return content.filter(item => item.duration && parseInt(item.duration) < 60);
  // if (sub === 'Chipping') return content.filter(item => item.title?.toLowerCase().includes('chip'));
  
  return content;
}

export default function DiscoverContent({ onLike, onFollow, onMediaClick }: DiscoverContentProps) {
  const { main, sub } = useDiscoverQuery();
  const [currentContent, setCurrentContent] = useState<ExploreContentItem[] | null>(null);
  
  // Get the filter type based on main pill
  const filterType = getFilterTypeFromPills(main, sub);
  
  // Use existing hook to fetch content
  const { 
    content, 
    loading, 
    hasMore, 
    loadMore 
  } = useInfiniteExploreContent(filterType === FILTER_TYPES.TRENDING ? FILTER_TYPES.FRIENDS : filterType);

  // Apply sub-filtering whenever content or pills change
  useEffect(() => {
    if (content) {
      const filtered = applySubFilter(content, main, sub);
      // Remove duplicates
      const unique = filtered.filter((item, index, self) => 
        index === self.findIndex(t => t.src === item.src)
      );
      setCurrentContent(unique);
    } else {
      setCurrentContent(null);
    }
  }, [content, main, sub]);

  // Show loading while content is null
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

  return (
    <ExploreGrid 
      content={currentContent}
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