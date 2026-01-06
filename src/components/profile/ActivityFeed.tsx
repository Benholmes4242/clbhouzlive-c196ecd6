import React, { useState, useCallback, useMemo } from 'react';
import ClbhouzAchievementsModal from '@/components/achievements/ClbhouzAchievementsModal';
import { useRealtimePersonalPosts } from '@/hooks/useRealtimePersonalPosts';
import { ActivityGridV2, useActivityPostsV2 } from './activity/v2';
import ActivityFiltersSheet, { ActivityFilters } from './ActivityFiltersSheet';
import ActivityFilterToolbar from './activity/ActivityFilterToolbar';
import FullscreenMediaModal from '@/components/ui/fullscreen-media-modal';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { UnifiedMediaItem } from '@/components/shared/grid/types';
import { CreatorProfileSection } from './CreatorProfileSection';

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
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStartIndex, setModalStartIndex] = useState(0);
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

  // For lightbox - extract all media URLs, types, and filter IDs
  const allMediaData = useMemo(() => {
    const urls: string[] = [];
    const types: ('image' | 'video')[] = [];
    const filterIds: (string | null)[] = [];
    const studioEdits: (any | null)[] = [];
    
    filteredItems.forEach(item => {
      urls.push(item.url);
      types.push(item.type);
      filterIds.push(item.filterId ?? null);
      studioEdits.push(item.studioEdits ?? null);
    });
    
    return { urls, types, filterIds, studioEdits };
  }, [filteredItems]);

  // Handle item click - open fullscreen modal
  const handleItemClick = useCallback((item: UnifiedMediaItem, index: number) => {
    setModalStartIndex(index);
    setModalOpen(true);
  }, []);

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

      {/* Fullscreen Media Modal - only mount when open */}
      {modalOpen && (
        <FullscreenMediaModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          mediaUrl={allMediaData.urls}
          mediaType={allMediaData.types}
          filterIds={allMediaData.filterIds}
          studioEdits={allMediaData.studioEdits}
          initialIndex={modalStartIndex}
        />
      )}

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
