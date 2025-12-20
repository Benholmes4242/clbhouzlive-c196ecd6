import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExploreContentItem } from '@/components/explore/types';
import { UnifiedMediaGrid, UnifiedGridConfig, exploreItemsToUnified, UnifiedMediaItem } from '@/components/shared/grid';

interface ShortsGridProps {
  items: ExploreContentItem[];
  onOpen: (item: ExploreContentItem) => void;
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
  visibilityThreshold: 0.6,
};

/**
 * ShortsGrid - Watch page grid wrapper
 * Uses UnifiedMediaGrid with Watch-specific config
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
  
  // Convert items to unified format
  const unifiedItems = React.useMemo(() => {
    return exploreItemsToUnified(items);
  }, [items]);

  // Handle item click - convert back to ExploreContentItem
  const handleItemClick = useCallback((unifiedItem: UnifiedMediaItem) => {
    const originalItem = items.find(item => item.id === unifiedItem.id);
    if (originalItem) {
      onOpen(originalItem);
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
