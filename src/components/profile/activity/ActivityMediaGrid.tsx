import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UnifiedMediaGrid, UnifiedGridConfig, activityPostsToUnified, UnifiedMediaItem } from '@/components/shared/grid';
import { ActivityPost } from './types';

interface ActivityMediaGridProps {
  posts: ActivityPost[];
  isLoading?: boolean;
  onPostPress?: (postId: string) => void;
  viewMode?: 'compact' | 'immersive';
  hasMore?: boolean;
  onLoadMore?: () => void;
}

// Grid config for Profile Activity
const PROFILE_GRID_CONFIG: UnifiedGridConfig = {
  showCreator: false,
  showLikes: true,
  infiniteScroll: true,
  pageSize: 24,
  autoplayEnabled: true,
  maxAutoplay: 2,
  visibilityThreshold: 0.6,
  surface: 'profile-activity', // Profile surface - tap opens Post Viewer
};

/**
 * ActivityMediaGrid - Profile Activity grid wrapper
 * Uses UnifiedMediaGrid with Profile-specific config
 * 
 * Tap behavior: Opens standard Post Viewer (not Shorts Player)
 * This is because Activity is "your content library", not a Shorts feed
 */
const ActivityMediaGrid: React.FC<ActivityMediaGridProps> = ({
  posts,
  isLoading = false,
  onPostPress,
  viewMode = 'compact',
  hasMore = false,
  onLoadMore,
}) => {
  const navigate = useNavigate();
  
  // Convert posts to unified format
  const unifiedItems = useMemo(() => {
    return activityPostsToUnified(posts);
  }, [posts]);

  // Handle item click - opens Post Viewer
  const handleItemClick = useCallback((item: UnifiedMediaItem, index: number) => {
    onPostPress?.(item.postId);
  }, [onPostPress]);

  // Handle author click
  const handleAuthorClick = useCallback((authorId: string) => {
    navigate(`/u/${authorId}`);
  }, [navigate]);

  return (
    <div className="px-0 pb-16">
      <UnifiedMediaGrid
        items={unifiedItems}
        config={PROFILE_GRID_CONFIG}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
        onItemClick={handleItemClick}
        onAuthorClick={handleAuthorClick}
      />
    </div>
  );
};

export default ActivityMediaGrid;
