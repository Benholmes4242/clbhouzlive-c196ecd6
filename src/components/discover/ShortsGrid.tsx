import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExploreContentItem } from '@/components/explore/types';
import { UnifiedMediaGrid, UnifiedGridConfig, exploreItemsToUnified, UnifiedMediaItem } from '@/components/shared/grid';

// Extended type to include clustering metadata
interface ClusteredExploreItem extends ExploreContentItem {
  _clusterHeader?: string;
}

interface ShortsGridProps {
  items: ClusteredExploreItem[];
  onOpen: (item: ExploreContentItem, index: number) => void;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onLike?: (itemId: string) => void;
  onAuthorClick?: (authorId: string) => void;
  currentUserId?: string;
}

// Grid config for Watch page
const WATCH_GRID_CONFIG: UnifiedGridConfig = {
  showCreator: true,
  showLikes: true,
  infiniteScroll: true,
  pageSize: 24,
  autoplayEnabled: true,
  maxAutoplay: 2,
  playThreshold: 0.4,      // Play when 40% visible
  pauseThreshold: 0.6,     // Pause when 60% out of view
  surface: 'watch', // Watch surface - tap opens Shorts Player
};

/**
 * CourseClusterHeader - Simple text header for course-grouped content
 */
function CourseClusterHeader({ courseName }: { courseName: string }) {
  return (
    <div className="col-span-2 px-4 py-3">
      <h3 className="text-sm font-semibold text-foreground">
        Trending at {courseName}
      </h3>
      <p className="text-xs text-muted-foreground">Popular right now</p>
    </div>
  );
}

/**
 * ShortsGrid - Watch page grid wrapper
 * Uses UnifiedMediaGrid with Watch-specific config
 * 
 * Supports course clustering - when items have _clusterHeader,
 * renders a section header before them.
 * 
 * Tap behavior: Opens Shorts Fullscreen Player at tapped index
 */
export default function ShortsGrid({ 
  items, 
  onOpen, 
  isLoading, 
  hasMore, 
  onLoadMore,
  onLike,
  onAuthorClick,
  currentUserId
}: ShortsGridProps) {
  const navigate = useNavigate();
  
  // Extract cluster headers and their positions
  const clusterHeaders = React.useMemo(() => {
    const headers: { index: number; courseName: string }[] = [];
    items.forEach((item, index) => {
      if (item._clusterHeader) {
        headers.push({ index, courseName: item._clusterHeader });
      }
    });
    return headers;
  }, [items]);
  
  // Convert items to unified format (stripping the cluster metadata)
  const unifiedItems = React.useMemo(() => {
    return exploreItemsToUnified(items);
  }, [items]);

  // Handle item click - passes index for Shorts Player entry
  const handleItemClick = useCallback((unifiedItem: UnifiedMediaItem, index: number) => {
    const originalItem = items.find(item => item.id === unifiedItem.id);
    if (originalItem) {
      // Pass the index for proper Shorts Player entry
      onOpen(originalItem, index);
    }
  }, [items, onOpen]);

  // Handle author click
  const handleAuthorClick = useCallback((authorId: string) => {
    if (onAuthorClick) {
      onAuthorClick(authorId);
    } else {
      navigate(`/u/${authorId}`);
    }
  }, [navigate, onAuthorClick]);

  // Handle like
  const handleLike = useCallback((itemId: string) => {
    onLike?.(itemId);
  }, [onLike]);

  // If there are cluster headers, we need custom rendering
  if (clusterHeaders.length > 0) {
    // Build sections: for each cluster header, show header then items until next header
    const sections: React.ReactNode[] = [];
    let lastIndex = 0;
    
    clusterHeaders.forEach((header, headerIdx) => {
      // Items before this header (if any, and not first header)
      if (header.index > lastIndex) {
        const beforeItems = unifiedItems.slice(lastIndex, header.index);
        if (beforeItems.length > 0) {
          sections.push(
            <UnifiedMediaGrid
              key={`section-${lastIndex}`}
              items={beforeItems}
              config={WATCH_GRID_CONFIG}
              isLoading={false}
              hasMore={false}
              onItemClick={handleItemClick}
              onLike={handleLike}
              onAuthorClick={handleAuthorClick}
              currentUserId={currentUserId}
            />
          );
        }
      }
      
      // Add the header
      sections.push(
        <CourseClusterHeader key={`header-${header.index}`} courseName={header.courseName} />
      );
      
      // Determine where this section ends
      const nextHeaderIndex = clusterHeaders[headerIdx + 1]?.index ?? unifiedItems.length;
      const sectionItems = unifiedItems.slice(header.index, nextHeaderIndex);
      
      if (sectionItems.length > 0) {
        sections.push(
          <UnifiedMediaGrid
            key={`section-${header.index}`}
            items={sectionItems}
            config={WATCH_GRID_CONFIG}
            isLoading={headerIdx === clusterHeaders.length - 1 ? isLoading : false}
            hasMore={headerIdx === clusterHeaders.length - 1 ? hasMore : false}
            onLoadMore={headerIdx === clusterHeaders.length - 1 ? onLoadMore : undefined}
            onItemClick={handleItemClick}
            onLike={handleLike}
            onAuthorClick={handleAuthorClick}
            currentUserId={currentUserId}
          />
        );
      }
      
      lastIndex = nextHeaderIndex;
    });
    
    // Any remaining items after the last header
    if (lastIndex < unifiedItems.length) {
      sections.push(
        <UnifiedMediaGrid
          key={`section-final`}
          items={unifiedItems.slice(lastIndex)}
          config={WATCH_GRID_CONFIG}
          isLoading={isLoading}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          onItemClick={handleItemClick}
          onLike={handleLike}
          onAuthorClick={handleAuthorClick}
          currentUserId={currentUserId}
        />
      );
    }
    
    return <>{sections}</>;
  }

  // No clustering - render normally
  return (
    <UnifiedMediaGrid
      items={unifiedItems}
      config={WATCH_GRID_CONFIG}
      isLoading={isLoading}
      hasMore={hasMore}
      onLoadMore={onLoadMore}
      onItemClick={handleItemClick}
      onLike={handleLike}
      onAuthorClick={handleAuthorClick}
      currentUserId={currentUserId}
    />
  );
}
