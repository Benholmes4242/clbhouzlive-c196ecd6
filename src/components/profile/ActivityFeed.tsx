import React, { useState, useCallback, useMemo } from 'react';
import ClbhouzAchievementsModal from '@/components/achievements/ClbhouzAchievementsModal';
import { useRealtimePersonalPosts } from '@/hooks/useRealtimePersonalPosts';
import { ActivityGridV2, useActivityPostsV2 } from './activity/v2';
import ActivityFiltersSheet, { ActivityFilters } from './ActivityFiltersSheet';
import ActivityFilterToolbar from './activity/ActivityFilterToolbar';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { UnifiedMediaItem } from '@/components/shared/grid/types';
import { CreatorProfileSection } from './CreatorProfileSection';
import { useUnifiedFullscreen } from '@/hooks/useUnifiedFullscreen';
import { usePostEngagement } from '@/hooks/usePostEngagement';
import { useCreatorEngagement } from '@/hooks/useCreatorEngagement';
import { toast } from 'sonner';

interface ActivityFeedProps {
  userId: string;
  isOwnProfile: boolean;
  profileDisplayName?: string;
  userHandicap?: number;
  userProfilePhotoUrl?: string;
  onAchievementsClick?: () => void;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  userId,
  isOwnProfile,
  profileDisplayName,
  userHandicap,
  userProfilePhotoUrl,
  onAchievementsClick
}) => {
  // V2: Cursor-based infinite query
  const { 
    items, 
    isLoading, 
    isFetchingNextPage, 
    hasMore, 
    fetchNextPage 
  } = useActivityPostsV2(userId);
  
  // Realtime subscription for post_media inserts - secondary safety net
  useRealtimePersonalPosts(userId);
  
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<ActivityFilters>({ type: 'all' });
  const [achievementsModalOpen, setAchievementsModalOpen] = useState(false);
  
  // Track current fullscreen post and creator
  const [currentFullscreenPostId, setCurrentFullscreenPostId] = useState<string | null>(null);
  const [currentCreatorId, setCurrentCreatorId] = useState<string | null>(null);

  // Filter items based on active filter
  const filteredItems = useMemo(() => {
    switch (filters.type) {
      case 'videos':
        return items.filter(item => item.type === 'video');
      case 'photos':
        return items.filter(item => item.type === 'image');
      case 'courses':
        return items.filter(item => !!item.golfCourseId);
      default:
        return items;
    }
  }, [items, filters.type]);

  // Engagement hooks for fullscreen
  const { toggleLike } = usePostEngagement(currentFullscreenPostId);
  const { toggleFollow } = useCreatorEngagement(currentCreatorId);

  // Share handler
  const handleSharePost = useCallback((postId: string) => {
    const shareUrl = `${window.location.origin}/post/${postId}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Check out this post',
        url: shareUrl,
      }).catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      });
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast.success('Link copied to clipboard!');
      }).catch(() => {
        toast.error('Failed to copy link');
      });
    }
  }, []);

  // Use unified fullscreen player for activity items
  const { openFullscreen } = useUnifiedFullscreen('unified', {
    allowLandscape: true,
    
    // Track current post and creator when user swipes
    onIndexChange: (index) => {
      const currentItem = filteredItems[index];
      setCurrentFullscreenPostId(currentItem?.postId || currentItem?.id || null);
      setCurrentCreatorId(currentItem?.creator?.id || null);
    },
    
    // Like handler
    onLike: (itemId) => {
      toggleLike();
    },
    
    // Follow handler
    onFollow: (creatorId) => {
      toggleFollow(creatorId);
    },
    
    // Comment handler
    onComment: (itemId) => {
      // CommentsPage opens automatically
    },
    
    // Share handler
    onShare: (itemId) => {
      handleSharePost(itemId);
    },
    
    // Close handler
    onClose: () => {
      setCurrentFullscreenPostId(null);
      setCurrentCreatorId(null);
    },
    
    // Infinite scroll
    onLoadMore: hasMore ? fetchNextPage : undefined,
    hasMore,
    isLoadingMore: isFetchingNextPage,
  });

  // Handle item click - open unified fullscreen player
  const handleItemClick = useCallback((item: UnifiedMediaItem, index: number) => {
    setCurrentFullscreenPostId(item.postId || item.id || null);
    setCurrentCreatorId(item.creator?.id || null);
    openFullscreen(filteredItems, index);
  }, [filteredItems, openFullscreen]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  return (
    <>
      {/* Creator Profile Section - shows only for creators */}
      <CreatorProfileSection
        userId={userId}
        isOwnProfile={isOwnProfile}
        className="mb-4"
      />

      {/* Activity Filter Toolbar - dedicated row for filter controls */}
      <ActivityFilterToolbar
        activeFilter={filters.type}
        onOpenFilters={() => setFiltersOpen(true)}
      />

      {/* Activity Grid V2 - PP → L layout with cursor pagination */}
      <div className="px-0 pb-16">
        <ActivityGridV2
          items={filteredItems}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onItemClick={handleItemClick}
        />
      </div>

      {/* Filter Sheet */}
      <ActivityFiltersSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        value={filters}
        onChange={setFilters}
      />

      {/* Unified Fullscreen Player - rendered via context provider in App.tsx */}

      {/* Achievements Modal */}
      <ClbhouzAchievementsModal
        isOpen={achievementsModalOpen}
        onClose={() => setAchievementsModalOpen(false)}
        userId={userId}
        userDisplayName={profileDisplayName}
        userHandicap={userHandicap}
        userProfilePhotoUrl={userProfilePhotoUrl}
        isCurrentUser={isOwnProfile}
      />

      {/* Scroll to top FAB */}
      <ScrollToTopGlass />
    </>
  );
};

export default ActivityFeed;
