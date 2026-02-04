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

// Grid config for Profile Activity - TikTok-level optimizations
const PROFILE_GRID_CONFIG: UnifiedGridConfig = {
  showCreator: false,
  showLikes: true,
  infiniteScroll: true,
  pageSize: 24,
  autoplayEnabled: true,
  maxAutoplay: 2,
  playThreshold: 0.5,      // TikTok hysteresis: Play when 50% visible
  pauseThreshold: 0.1,     // TikTok hysteresis: Pause when 10% visible
  surface: 'profile-activity', // Profile surface - tap opens Post Viewer
};

/**
 * ActivityMediaGrid - Profile Activity grid wrapper
 * Uses UnifiedMediaGrid with TikTok-level performance optimizations:
 * - 50%/10% hysteresis autoplay thresholds
 * - Memory-aware virtualization
 * - Source stability and HLS pool promotion via UnifiedVideoPlayer
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
