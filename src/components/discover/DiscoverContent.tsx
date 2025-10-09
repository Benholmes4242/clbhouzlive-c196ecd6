import React, { useEffect, useState } from 'react';
import { useDiscoverQuery } from '@/utils/useDiscoverQuery';
import ExploreGrid from '@/components/explore/ExploreGrid';
import VideosGrid from '@/components/discover/VideosGrid';
import { useInfiniteExploreContent } from '@/hooks/useInfiniteExploreContent';
import { FILTER_TYPES } from '@/components/explore/types';
import type { ExploreContentItem } from '@/components/explore/types';
import CreatorHighlightShelf from '@/components/discover/CreatorHighlightShelf';
import CreatorHighlightTile from '@/components/discover/CreatorHighlightTile';
import { CreatorHighlight } from '@/hooks/useCreatorHighlights';

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
    'shorts': FILTER_TYPES.SHORTS,
    'channels': FILTER_TYPES.CHANNELS,
    'videos': FILTER_TYPES.VIDEOS,
    'photos': FILTER_TYPES.PHOTOS,
    'friends': FILTER_TYPES.FRIENDS,
    'verified-pros': FILTER_TYPES.VERIFIED_PROS,
    'hack-shack': FILTER_TYPES.HACK_SHACK,
  };
  
  return mainToFilter[main] || FILTER_TYPES.SHORTS;
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
  const { main, sub } = useDiscoverQuery();
  const [currentContent, setCurrentContent] = useState<ExploreContentItem[] | null>(null);
  
  // Get the filter type based on main pill
  const filterType = getFilterTypeFromPills(main);
  
  // Use existing hook to fetch content - pass sub for Shorts subfiltering
  const { 
    content, 
    loading, 
    hasMore, 
    loadMore 
  } = useInfiniteExploreContent(filterType, sub);

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

  // Use VideosGrid for Videos tab, ExploreGrid for everything else
  if (main === 'videos') {
    return (
      <VideosGrid
        content={currentContent || []}
        onMediaClick={onMediaClick}
        isLoading={loading}
        hasMore={hasMore}
        onLoadMore={loadMore}
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