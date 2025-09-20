import React, { useEffect, useState } from 'react';
import { useDiscoverQuery } from '@/utils/useDiscoverQuery';
import ExploreGrid from '@/components/explore/ExploreGrid';
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
  const [contentWithHighlights, setContentWithHighlights] = useState<(ExploreContentItem | 'highlight-shelf' | 'highlight-tile')[] | null>(null);
  
  // Get the filter type based on main pill
  const filterType = getFilterTypeFromPills(main, sub);
  
  // Use existing hook to fetch content
  const { 
    content, 
    loading, 
    hasMore, 
    loadMore 
  } = useInfiniteExploreContent(filterType === FILTER_TYPES.TRENDING ? FILTER_TYPES.FRIENDS : filterType);

  // Apply sub-filtering, search filtering, and tag filtering whenever content or pills change
  useEffect(() => {
    if (content) {
      let filtered = applySubFilter(content, main, sub);
      
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
  }, [content, main, sub, searchQuery, selectedTags]);

  // Inject creator highlights into content stream
  useEffect(() => {
    if (!currentContent) {
      setContentWithHighlights(null);
      return;
    }

    const isMobile = window.innerWidth < 768;
    const result: (ExploreContentItem | 'highlight-shelf' | 'highlight-tile')[] = [];
    
    currentContent.forEach((item, index) => {
      result.push(item);
      
      if (isMobile) {
        // Mobile: inject highlight tile every 12 posts
        if ((index + 1) % 12 === 0 && index < currentContent.length - 1) {
          result.push('highlight-tile');
        }
      } else {
        // Desktop: inject highlight shelf after first 8 posts (after first two sections)
        if (index === 7) {
          result.push('highlight-shelf');
        }
      }
    });

    setContentWithHighlights(result);
  }, [currentContent]);

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

  // If no content with highlights, show regular grid
  if (!contentWithHighlights) {
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

  // Render content with injected highlights
  const contentItems = contentWithHighlights.filter(item => typeof item !== 'string') as ExploreContentItem[];

  return (
    <>
      {contentWithHighlights.map((item, index) => {
        if (item === 'highlight-shelf') {
          return (
            <CreatorHighlightShelf
              key={`highlight-shelf-${index}`}
              onCreatorClick={handleCreatorClick}
              className="my-8"
            />
          );
        }
        
        if (item === 'highlight-tile') {
          return (
            <CreatorHighlightTile
              key={`highlight-tile-${index}`}
              creator={{
                id: 'featured-creator',
                name: 'Golf Pro Highlights',
                avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
                heroImage: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=250&fit=crop',
                followerGrowth: 25.3,
                followerCount: 45000,
                verified: false,
                specialties: ['Tips', 'Tutorials']
              }}
              onCreatorClick={handleCreatorClick}
              className="my-6"
            />
          );
        }

        // Regular content item - collect all content items and pass them to ExploreGrid
        return null;
      })}
      
      <ExploreGrid 
        content={contentItems}
        onLike={onLike}
        onFollow={onFollow}
        onMediaClick={onMediaClick}
        isLoading={loading}
        hasMore={hasMore}
        onLoadMore={loadMore}
        activeFilter={filterType}
        isDiscoverPage={true}
      />
    </>
  );
}