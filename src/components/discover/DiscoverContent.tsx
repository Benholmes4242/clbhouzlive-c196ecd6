import React, { useEffect, useState } from 'react';
import { useDiscoverQuery } from '@/utils/useDiscoverQuery';
import ExploreGrid from '@/components/explore/ExploreGrid';
import { useInfiniteExploreContent } from '@/hooks/useInfiniteExploreContent';
import { useOptimisticPostInsert } from '@/hooks/useOptimisticPostInsert';
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
  
  // Get the filter type based on main pill
  const filterType = getFilterTypeFromPills(main, sub);
  
  // Use existing hook to fetch content
  const { 
    content, 
    loading, 
    hasMore, 
    loadMore 
  } = useInfiniteExploreContent(filterType === FILTER_TYPES.TRENDING ? FILTER_TYPES.FRIENDS : filterType);

  // Optimistic post insertion with spotlight
  const {
    mergedContent,
    insertOptimisticPost,
    confirmOptimisticPost,
    removeOptimisticPost,
    shouldShowSpotlight
  } = useOptimisticPostInsert({
    existingContent: content || [],
    onContentUpdate: (newContent) => {
      // This will trigger a re-render with the updated content
      // The useInfiniteExploreContent hook will handle the state updates
    }
  });

  // Listen for post completion events
  useEffect(() => {
    const handlePostCompleted = (event: CustomEvent) => {
      const { optimisticId, realPost } = event.detail;
      
      if (optimisticId && realPost) {
        confirmOptimisticPost(optimisticId, realPost);
      }
    };

    window.addEventListener('postCompleted', handlePostCompleted as EventListener);
    return () => window.removeEventListener('postCompleted', handlePostCompleted as EventListener);
  }, [confirmOptimisticPost]);

  // Listen for new post submissions to insert optimistically
  useEffect(() => {
    const handleNewPost = (event: CustomEvent) => {
      const postData = event.detail;
      insertOptimisticPost(postData);
    };

    window.addEventListener('newPostSubmitted', handleNewPost as EventListener);
    return () => window.removeEventListener('newPostSubmitted', handleNewPost as EventListener);
  }, [insertOptimisticPost]);

  // Apply sub-filtering, search filtering, and tag filtering whenever content or pills change
  useEffect(() => {
    // Use merged content (with optimistic posts) as the base
    const baseContent = mergedContent;
    
    if (baseContent.length > 0) {
      let filtered = applySubFilter(baseContent, main, sub);
      
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
  }, [mergedContent, main, sub, searchQuery, selectedTags]);


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

  // Render content with spotlight support
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
      shouldShowSpotlight={shouldShowSpotlight}
    />
  );
}