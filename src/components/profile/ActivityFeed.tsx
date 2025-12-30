import React, { useState, useCallback, useMemo } from 'react';
import { IoFilter } from 'react-icons/io5';
import ClbhouzAchievementsModal from '@/components/achievements/ClbhouzAchievementsModal';
import { useActivityPosts } from './hooks/useActivityPosts';
import { useRealtimePersonalPosts } from '@/hooks/useRealtimePersonalPosts';
import { ActivityMediaGrid } from './activity';
import ActivityFiltersSheet, { ActivityFilters, ActivityFilterType } from './ActivityFiltersSheet';
import FullscreenMediaModal from '@/components/ui/fullscreen-media-modal';
import { ActivityPost as LocalActivityPost } from './types/ActivityTypes';
import { ActivityPost } from './activity/types';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { CreatorProfileSection } from './CreatorProfileSection';
interface ActivityFeedProps {
  userId: string;
  isOwnProfile: boolean;
  profileDisplayName?: string;
  userHandicap?: number;
  userProfilePhotoUrl?: string;
  onAchievementsClick?: () => void;
}

/**
 * Convert local activity post type to the new grid type
 */
function convertToGridPost(post: LocalActivityPost): ActivityPost {
  return {
    id: post.id,
    type: post.type,
    content: post.content,
    image: post.image,
    likes: post.likes,
    comments: post.comments,
    shares: post.shares,
    timeAgo: post.timeAgo,
    created_at: post.created_at,
    post_media: post.post_media,
    post_tags: post.post_tags.map(tag => ({
      id: tag.id,
      entity_type: tag.entity_type,
      entity_id: tag.entity_id,
      name: tag.name,
      username: tag.username,
      tagged_entity: tag.tagged_entity
    })),
    user: post.user
  };
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
  
  // Realtime subscription for post_media inserts - secondary safety net
  useRealtimePersonalPosts(userId);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ActivityPost | null>(null);
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

  // Posts with media only, converted to new type
  const postsWithMedia = useMemo(() => 
    filteredPosts
      .filter(post => (post.post_media?.length ?? 0) > 0)
      .map(convertToGridPost),
    [filteredPosts]
  );

  // Handle post click - store selected post for modal
  const handlePostPress = useCallback((postId: string) => {
    const post = postsWithMedia.find(p => p.id === postId);
    if (post) {
      setSelectedPost(post);
      setModalOpen(true);
    }
  }, [postsWithMedia]);

  // Extract modal data from selected post only (not flattened across all posts)
  const selectedPostMediaData = useMemo(() => {
    if (!selectedPost) return null;
    return {
      urls: selectedPost.post_media.map(m => m.media_url),
      types: selectedPost.post_media.map(m => m.media_type as 'image' | 'video'),
      filterIds: selectedPost.post_media.map(m => m.filter_id ?? null),
      studioEdits: selectedPost.post_media.map(m => m.studio_edits ?? null),
    };
  }, [selectedPost]);

  return (
    <>
      {/* Creator Profile Section - shows only for creators */}
      <CreatorProfileSection
        userId={userId}
        isOwnProfile={isOwnProfile}
        className="mb-6"
      />

      {/* Filter button row */}
      <div>
        <div className="flex justify-end">
          <button 
            onClick={() => setFiltersOpen(true)}
            className="p-2 hover:bg-muted/50 transition-colors rounded-sq-sm"
          >
            <IoFilter className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Empty states */}
      {posts.length === 0 && !loading ? (
        <div className="text-center py-16 px-4">
          <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No posts yet</h3>
          <p className="text-muted-foreground text-sm">
            {isOwnProfile ? 'Share your golf moments to see them here' : 'No posts to show'}
          </p>
        </div>
      ) : postsWithMedia.length === 0 && !loading ? (
        <div className="text-center py-16 px-4">
          <p className="text-muted-foreground">No posts found for this filter</p>
        </div>
      ) : (
        /* Premium Activity Media Grid - full-bleed, no margins needed since parent has no padding */
        <ActivityMediaGrid
          posts={postsWithMedia}
          isLoading={loading}
          onPostPress={handlePostPress}
          viewMode="compact"
        />
      )}

      {/* Filter Sheet */}
      <ActivityFiltersSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        value={filters}
        onChange={setFilters}
      />

      {/* Fullscreen Media Modal - only mount when open and we have a selected post */}
      {modalOpen && selectedPostMediaData && (
        <FullscreenMediaModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedPost(null);
          }}
          mediaUrl={selectedPostMediaData.urls}
          mediaType={selectedPostMediaData.types}
          filterIds={selectedPostMediaData.filterIds}
          studioEdits={selectedPostMediaData.studioEdits}
          initialIndex={0}
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
