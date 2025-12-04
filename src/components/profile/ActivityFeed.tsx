import React, { useState, useCallback, useMemo } from 'react';
import { IoFilter } from 'react-icons/io5';
import ClbhouzAchievementsModal from '@/components/achievements/ClbhouzAchievementsModal';
import { useActivityPosts } from './hooks/useActivityPosts';
import ActivityGrid, { ActivityGridItem } from './ActivityGrid';
import ActivityFiltersSheet, { ActivityFilters, ActivityFilterType } from './ActivityFiltersSheet';
import FullscreenMediaModal from '@/components/ui/fullscreen-media-modal';

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
  const { posts, loading } = useActivityPosts(userId);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStartIndex, setModalStartIndex] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<ActivityFilters>({ type: 'all' });
  const [achievementsModalOpen, setAchievementsModalOpen] = useState(false);

  // Filter posts based on active filter (with null-safety)
  const filteredPosts = useMemo(() => {
    switch (filters.type) {
      case 'videos':
        return posts.filter(post => {
          const media = post.post_media ?? [];
          return media.some(m => m.media_type === 'video');
        });
      case 'photos':
        return posts.filter(post => {
          const media = post.post_media ?? [];
          return media.some(m => m.media_type === 'image');
        });
      case 'courses':
        return posts.filter(post => {
          const tags = post.post_tags ?? [];
          return tags.some(tag => tag.entity_type === 'golf_club');
        });
      case 'swings':
        return posts.filter(post => {
          const tags = post.post_tags ?? [];
          return tags.some(tag => tag.name?.toLowerCase().includes('swing'));
        });
      case 'milestones':
        return posts.filter(post => {
          const tags = post.post_tags ?? [];
          return post.content?.toLowerCase().includes('milestone') ||
            tags.some(tag => tag.name?.toLowerCase().includes('achievement'));
        });
      default:
        return posts;
    }
  }, [posts, filters.type]);

  // Convert to grid items - only posts with media (with null-safety)
  const gridItems: ActivityGridItem[] = useMemo(() => 
    filteredPosts
      .filter(post => (post.post_media?.length ?? 0) > 0)
      .map(post => {
        const media = post.post_media!;
        const tags = post.post_tags ?? [];
        const golfCourseTag = tags.find(tag => tag.entity_type === 'golf_club');
        return {
          id: post.id,
          type: media[0].media_type === 'video' ? 'video' : 'image',
          thumbnailUrl: media[0].media_url,
          previewUrl: media[0].media_url,
          courseName: golfCourseTag?.name,
          roundDate: post.created_at,
        };
      }), [filteredPosts]);

  // For lightbox
  const allMediaUrls = useMemo(() => gridItems.map(item => item.thumbnailUrl), [gridItems]);
  const allMediaTypes = useMemo(() => gridItems.map(item => item.type), [gridItems]);

  const handleItemClick = useCallback((item: ActivityGridItem, index: number) => {
    setModalStartIndex(index);
    setModalOpen(true);
  }, []);

  if (loading) {
    return (
      <div className="px-4 py-8">
        <div className="grid grid-cols-3 gap-[2px]">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-[18px] bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Filter button row */}
      <div className="px-4 mt-0 mb-2">
        <div className="flex justify-end">
          <button 
            onClick={() => setFiltersOpen(true)}
            className="p-2 hover:bg-muted/50 transition-colors rounded-md"
          >
            <IoFilter className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Empty states */}
      {posts.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="text-4xl mb-4">📷</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No posts yet</h3>
          <p className="text-muted-foreground text-sm">
            {isOwnProfile ? 'Share your golf moments to see them here' : 'No posts to show'}
          </p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-16 px-4">
          <p className="text-muted-foreground">No posts found for this filter</p>
        </div>
      ) : (
        /* Activity Grid - 3 col, 2px gaps, rounded squares */
        <ActivityGrid
          items={gridItems}
          onItemClick={handleItemClick}
        />
      )}

      {/* Filter Sheet */}
      <ActivityFiltersSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        value={filters}
        onChange={setFilters}
      />

      {/* Fullscreen Media Modal */}
      <FullscreenMediaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mediaUrl={allMediaUrls}
        mediaType={allMediaTypes}
        initialIndex={modalStartIndex}
      />

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
    </>
  );
};

export default ActivityFeed;
