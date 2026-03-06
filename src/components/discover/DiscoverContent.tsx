import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDiscoverQuery } from '@/utils/useDiscoverQuery';
import ExploreGrid from '@/components/explore/ExploreGrid';

import { useInfiniteExploreContent } from '@/hooks/useInfiniteExploreContent';
import { FILTER_TYPES } from '@/components/explore/types';
import type { ExploreContentItem } from '@/components/explore/types';
import { getDurationFilter } from '@/constants/videoFilters';

import { toast } from 'sonner';
import { MOMENT_CATEGORIES } from '@/components/post/create-moment/categoryDefinitions';

interface DiscoverContentProps {
  onLike: (contentId: string) => void;
  onFollow: (contentId: string) => void;
  /** 
   * Click handler for media items
   * @param item - The clicked item
   * @param index - Position in the items array
   * @param items - Optional: The source data array (for fullscreen playlist)
   */
  onMediaClick: (item: any, index?: number, items?: any[]) => void;
  searchQuery?: string;
  selectedTags?: string[];
}

// Map main pill to filter types for API calls
function getFilterTypeFromPills(main: string): string {
  const mainToFilter: Record<string, string> = {
    'videos': FILTER_TYPES.VIDEOS,
    'channels': FILTER_TYPES.CHANNELS,
    'following': FILTER_TYPES.FOLLOWING,
    'friends': FILTER_TYPES.FOLLOWING,
    'verified-pros': FILTER_TYPES.VERIFIED_PROS,
    'hack-shack': FILTER_TYPES.HACK_SHACK,
  };
  
  return mainToFilter[main] || FILTER_TYPES.VIDEOS;
}

// Apply tag filtering to content using posts.categories array
function applyTagFilter(content: ExploreContentItem[], selectedTags: string[]): ExploreContentItem[] {
  if (!selectedTags.length) return content;
  
  return content.filter(item => {
    if (item.categories && item.categories.length > 0) {
      return selectedTags.some(tag => 
        item.categories!.some(cat => 
          cat.toLowerCase() === tag.toLowerCase()
        )
      );
    }
    
    const title = item.title?.toLowerCase() || '';
    const description = item.ctaDescription?.toLowerCase() || '';
    
    return selectedTags.some(tag => 
      title.includes(tag.toLowerCase()) || 
      description.includes(tag.toLowerCase())
    );
  });
}

export default function DiscoverContent({ onLike, onFollow, onMediaClick, searchQuery: externalSearchQuery, selectedTags = [] }: DiscoverContentProps) {
  const navigate = useNavigate();
  const { main, sub, duration } = useDiscoverQuery();
  const [currentContent, setCurrentContent] = useState<ExploreContentItem[] | null>(null);
  const [likedItems, setLikedItems] = useState<Record<string, boolean>>({});
  
  const searchQuery = externalSearchQuery || '';
  
  // Get the filter type based on main pill
  const filterType = getFilterTypeFromPills(main);
  
  // Prepare duration filter for Videos/Shorts
  const durationFilter = React.useMemo(() => {
    if (main !== 'videos') return undefined;
    return getDurationFilter(duration);
  }, [main, duration]);
  
  // Use existing hook to fetch content with filters and sort
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
      
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(item => 
          item.title?.toLowerCase().includes(query) ||
          item.ctaDescription?.toLowerCase().includes(query) ||
          item.user?.name?.toLowerCase().includes(query) ||
          item.user?.username?.toLowerCase().includes(query)
        );
      }

      if (selectedTags.length > 0) {
        filtered = applyTagFilter(filtered, selectedTags);
      }
      
      const unique = filtered.filter((item, index, self) => 
        index === self.findIndex(t => t.src === item.src)
      ).map(item => ({
        ...item,
        isLiked: likedItems[item.id] ?? false
      }));
      
      setCurrentContent(unique);
    } else {
      setCurrentContent(null);
    }
  }, [content, main, searchQuery, selectedTags, likedItems]);

  // Handle like toggle with optimistic updates
  const handleLikeToggle = useCallback((itemId: string) => {
    const item = content?.find(i => i.id === itemId) || currentContent?.find(i => i.id === itemId);
    if (!item) return;

    const currentlyLiked = likedItems[itemId] ?? false;
    const newLikedState = !currentlyLiked;

    setLikedItems(prev => ({ ...prev, [itemId]: newLikedState }));
    
    setCurrentContent(prev => 
      prev?.map(i =>
        i.id === itemId
          ? {
              ...i,
              isLiked: newLikedState,
              likes: newLikedState ? (i.likes ?? 0) + 1 : Math.max(0, (i.likes ?? 0) - 1)
            }
          : i
      ) ?? null
    );

    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    onLike?.(itemId);

    // TODO: Replace with actual API call
    setTimeout(() => {
      const success = Math.random() > 0.05;
      
      if (!success) {
        setLikedItems(prev => ({ ...prev, [itemId]: currentlyLiked }));
        setCurrentContent(prev =>
          prev?.map(i =>
            i.id === itemId
              ? {
                  ...i,
                  isLiked: currentlyLiked,
                  likes: currentlyLiked ? (i.likes ?? 0) + 1 : Math.max(0, (i.likes ?? 0) - 1)
                }
              : i
          ) ?? null
        );
        toast.error('Failed to update like. Please try again.');
      }
    }, 300);
  }, [content, currentContent, likedItems, onLike]);

  // Handle profile navigation
  const handleAuthorClick = useCallback((authorId: string) => {
    if (!authorId) return;
    navigate(`/u/${authorId}`);
  }, [navigate]);

  // Videos tab is now handled by NewVideosTab in Discover.tsx SlidingPanels
  if (main === 'videos') {
    return null;
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

  // Render content directly
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