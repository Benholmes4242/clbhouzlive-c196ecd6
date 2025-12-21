import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExploreContentItem } from '@/components/explore/types';
import { UnifiedMediaGrid, UnifiedGridConfig, exploreItemsToUnified, UnifiedMediaItem } from '@/components/shared/grid';

interface ShortsGridProps {
  items: ExploreContentItem[];
  onOpen: (item: ExploreContentItem, index: number) => void;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onLike?: (itemId: string) => void;
  onAuthorClick?: (authorId: string) => void;
  currentUserId?: string;
}

// Grid config for Watch page - ALIGNED WITH BUSINESS ACTIVITY
const WATCH_GRID_CONFIG: UnifiedGridConfig = {
  showCreator: true,
  showLikes: true,
  infiniteScroll: true,
  pageSize: 24,
  autoplayEnabled: true,
  maxAutoplay: 1, // Match Business Activity
  visibilityThreshold: 0.6, // Match Business Activity
  surface: 'watch', // Watch surface - tap opens Shorts Player
};

/**
 * ShortsGrid - Watch page grid wrapper
 * Uses UnifiedMediaGrid with Watch-specific config
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
  
  // Convert items to unified format
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
