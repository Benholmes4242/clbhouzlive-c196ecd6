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

  // Use unified fullscreen player for activity items
  const { openFullscreen } = useUnifiedFullscreen('unified', {
    allowLandscape: true,
    onLike: (itemId) => {
      console.log('Like from profile fullscreen:', itemId);
      // TODO: Add actual like mutation
    },
    onComment: (itemId) => {
      console.log('Comment from profile fullscreen:', itemId);
    },
    onShare: (itemId) => {
      console.log('Share from profile fullscreen:', itemId);
    },
    onLoadMore: hasMore ? fetchNextPage : undefined,
    hasMore,
    isLoadingMore: isFetchingNextPage,
  });

  // Handle item click - open unified fullscreen player
  const handleItemClick = useCallback((item: UnifiedMediaItem, index: number) => {
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
