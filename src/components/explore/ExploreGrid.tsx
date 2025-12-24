/**
 * ExploreGrid - Explore/Discover page grid
 * 
 * Migrated to use UniversalMediaGrid with mixed-grid layout.
 * Preserves the same API for backwards compatibility.
 */

import React, { memo, useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { ExploreContentItem } from './types';
import { FILTER_TYPES } from './types';
import { 
  UniversalMediaGrid, 
  UniversalGridConfig, 
  UniversalMediaItem,
  exploreItemsToUniversal 
} from '@/components/grid';

interface ExploreGridProps {
  content: ExploreContentItem[];
  onLike: (contentId: string) => void;
  onFollow: (contentId: string) => void;
  onMediaClick?: (item: ExploreContentItem) => void;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  activeFilter?: string;
  isClubhousePage?: boolean;
  isDiscoverPage?: boolean;
  hideBadges?: boolean;
}

// Grid config for Explore page
const getExploreGridConfig = (isMobile: boolean, isFriendsTab: boolean): UniversalGridConfig => ({
  layout: isFriendsTab ? 'portrait-grid' : 'mixed-grid',
  columns: isMobile ? 3 : 4,
  autoplayPattern: 'every-nth',
  autoplayNth: 3,
  maxConcurrent: 3,
  surface: 'discover',
  lazyLoad: true,
  preloadViewports: 2,
  initialVisible: isMobile ? 9 : 12,
  showCreator: true,
  showLikes: false,
  showDuration: true,
  infiniteScroll: true,
  playThreshold: 0.4,
  pauseThreshold: 0.25,
});

const ExploreGrid: React.FC<ExploreGridProps> = memo(({ 
  content, 
  onLike, 
  onFollow, 
  onMediaClick,
  isLoading, 
  hasMore, 
  onLoadMore,
  activeFilter,
  isClubhousePage = false,
  isDiscoverPage = false,
  hideBadges = false
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  
  // Keep reference to original items for lookup
  const contentRef = React.useRef(content);
  contentRef.current = content;
  
  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Check for Friends tab
  const isFriendsTab = isClubhousePage && activeFilter === FILTER_TYPES.FRIENDS;
  
  // Grid configuration
  const gridConfig = useMemo(() => 
    getExploreGridConfig(isMobile, isFriendsTab), 
    [isMobile, isFriendsTab]
  );
  
  // Convert content to UniversalMediaItem format
  const unifiedItems = useMemo(() => {
    return exploreItemsToUniversal(content);
  }, [content]);
  
  // Handle item click - find original item
  const handleItemClick = useCallback((unifiedItem: UniversalMediaItem, index: number) => {
    const originalItem = contentRef.current.find(item => item.id === unifiedItem.id);
    if (originalItem) {
      onMediaClick?.(originalItem);
    }
  }, [onMediaClick]);
  
  // Handle like
  const handleLike = useCallback((itemId: string) => {
    onLike(itemId);
  }, [onLike]);
  
  // Handle author click
  const handleAuthorClick = useCallback((authorId: string) => {
    // Navigate handled internally by UniversalMediaGrid
    console.log('Navigate to author:', authorId);
  }, []);
  
  // Empty state  
  if (content.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-4xl mb-4">🏌️‍♂️</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No content found</h3>
        <p className="text-muted-foreground max-w-md">
          {activeFilter === 'Hack Shack' 
            ? "No hacks yet! Be the first to upload a hilarious golf mishit using #hackshack in your post."
            : "Try adjusting your filters or check back later for new content."}
        </p>
      </div>
    );
  }
  
  // Don't show loading skeleton on initial load
  if (isLoading && content.length === 0) {
    return null;
  }
  
  return (
    <>
      <UniversalMediaGrid
        items={unifiedItems}
        config={gridConfig}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
        onItemClick={handleItemClick}
        onLike={handleLike}
        onAuthorClick={handleAuthorClick}
      />
      
      {/* Infinite scroll sentinels */}
      <div id="preload-sentinel" className="h-20" />
      <div id="scroll-sentinel" className="h-4">
        {isLoading && hasMore && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </div>
    </>
  );
});

ExploreGrid.displayName = 'ExploreGrid';

export default ExploreGrid;
