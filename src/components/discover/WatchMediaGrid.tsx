import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UnifiedMediaGrid, UnifiedGridConfig, exploreItemsToUnified, UnifiedMediaItem } from '@/components/shared/grid';
import { ExploreContentItem } from '@/components/explore/types';

interface WatchMediaGridProps {
  items: ExploreContentItem[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onItemClick?: (item: ExploreContentItem, index: number) => void;
  onLike?: (itemId: string) => void;
  onAuthorClick?: (authorId: string) => void;
}

// Grid config for Watch page - IDENTICAL to Profile Activity
const WATCH_GRID_CONFIG: UnifiedGridConfig = {
  showCreator: false, // Hidden per requirement, matches Profile
  showLikes: true,
  infiniteScroll: true,
  pageSize: 24,
  autoplayEnabled: true,
  maxAutoplay: 2,
  playThreshold: 0.4,      // Play when 40% visible
  pauseThreshold: 0.6,     // Pause when 60% out of view
  surface: 'profile-activity', // Use profile-activity surface so tap opens Post Viewer
};

/**
 * WatchMediaGrid - Watch page grid wrapper
 * Uses UnifiedMediaGrid with Profile-identical config
 * 
 * Tap behavior: Opens standard Post Viewer (same as Profile Activity)
 * This matches the Profile page exactly as requested
 */
const WatchMediaGrid: React.FC<WatchMediaGridProps> = ({
  items,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onItemClick,
  onLike,
  onAuthorClick,
}) => {
  const navigate = useNavigate();
  
  // Keep reference to original items for lookup
  const itemsRef = React.useRef(items);
  itemsRef.current = items;
  
  // Convert items to unified format
  const unifiedItems = useMemo(() => {
    return exploreItemsToUnified(items);
  }, [items]);

  // Handle item click - passes back original ExploreContentItem
  const handleItemClick = useCallback((unifiedItem: UnifiedMediaItem, index: number) => {
    const originalItem = itemsRef.current.find(item => item.id === unifiedItem.id);
    if (originalItem && onItemClick) {
      onItemClick(originalItem, index);
    }
  }, [onItemClick]);

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

  return (
    <div className="px-0 pb-16">
      <UnifiedMediaGrid
        items={unifiedItems}
        config={WATCH_GRID_CONFIG}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
        onItemClick={handleItemClick}
        onLike={handleLike}
        onAuthorClick={handleAuthorClick}
      />
    </div>
  );
};

export default WatchMediaGrid;
