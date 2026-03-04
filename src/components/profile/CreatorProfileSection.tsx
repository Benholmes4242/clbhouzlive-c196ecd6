import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FeaturedVideoSlot } from './FeaturedVideoSlot';
import { PinnedPostsSection } from './PinnedPostsSection';
import { CreatorBadge } from './CreatorBadge';
import { CreatorAnalyticsCard } from './CreatorAnalyticsCard';
import { useCreatorFeatures } from '@/hooks/useCreatorFeatures';
import { PostPickerSheet } from './PostPickerSheet';
// REMOVED: useUnifiedFullscreen — Phase 5 fullscreen system deleted

interface CreatorProfileSectionProps {
  userId: string;
  isOwnProfile: boolean;
  className?: string;
}

/**
 * Phase 3.2: Creator Profile Section
 * 
 * Renders creator-specific features above the content grid:
 * - Creator badge
 * - Featured video slot (with playback, change, remove)
 * - Pinned posts (with unpin confirmation)
 * - Creator analytics (owner only, real data)
 */
export function CreatorProfileSection({ 
  userId, 
  isOwnProfile,
  className 
}: CreatorProfileSectionProps) {
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<'featured' | 'pin'>('featured');
  
  const {
    isCreator,
    featuredPost,
    pinnedPosts,
    isLoading,
    setFeaturedPost,
    pinPost,
    unpinPost,
    canPin,
  } = useCreatorFeatures(userId);

  // TODO: Wire to new media player
  const openFullscreen = (...args: any[]) => console.log('[Fullscreen] TODO: Wire to new media player', args);

  // Don't render for non-creators
  if (!isCreator || isLoading) {
    return null;
  }

  const handleEditFeatured = () => {
    setPickerMode('featured');
    setPickerOpen(true);
  };

  const handleRemoveFeatured = () => {
    setFeaturedPost(null);
  };

  const handlePlayFeatured = () => {
    if (!featuredPost) return;
    // Open in fullscreen viewer by constructing a minimal media item
    const mediaItem = {
      id: featuredPost.id,
      post_media: [{
        id: featuredPost.id,
        media_type: 'video' as const,
        media_url: featuredPost.videoUrl || '',
        poster_url: featuredPost.thumbnailUrl,
      }],
      user: {
        id: userId,
        display_name: (featuredPost as any).creatorName || 'Creator',
        username: (featuredPost as any).creatorUsername,
        profile_photo_url: (featuredPost as any).creatorAvatar,
      },
      content: (featuredPost as any).title || '',
    };
    openFullscreen([mediaItem], 0);
  };

  const handleAddPinned = () => {
    setPickerMode('pin');
    setPickerOpen(true);
  };

  const handlePostSelect = (postId: string) => {
    if (pickerMode === 'featured') {
      setFeaturedPost(postId);
    } else {
      pinPost(postId);
    }
    setPickerOpen(false);
  };

  const handlePostClick = (postId: string) => {
    // Navigate to post deep link
    navigate(`/post/${postId}`);
  };

  return (
    <div className={className}>
      {/* Creator badge - subtle indicator */}
      <div className="flex items-center justify-center mb-4">
        <CreatorBadge />
      </div>

      {/* Featured Video Slot */}
      <FeaturedVideoSlot
        videoUrl={featuredPost?.videoUrl}
        posterUrl={featuredPost?.thumbnailUrl}
        durationSeconds={featuredPost?.durationSeconds}
        isOwner={isOwnProfile}
        isLoading={isLoading}
        onEditClick={handleEditFeatured}
        onRemoveClick={handleRemoveFeatured}
        onPlayClick={handlePlayFeatured}
        className="mb-4"
      />

      {/* Pinned Posts Section */}
      <PinnedPostsSection
        posts={pinnedPosts}
        isOwner={isOwnProfile}
        onPostClick={handlePostClick}
        onUnpinClick={unpinPost}
        className="mb-4"
      />

      {/* Add pin button for owners with room for more pins */}
      {isOwnProfile && (
        pinnedPosts.length < 3 ? (
          <button
            onClick={handleAddPinned}
            className="mb-4 w-full min-h-[44px] py-2 flex items-center justify-center gap-2 text-sm text-primary font-medium rounded-xl border border-primary/40 bg-primary/5 active:scale-[0.98] transition-transform"
          >
            + Pin another post ({3 - pinnedPosts.length} remaining)
          </button>
        ) : (
          <div className="mb-4 w-full min-h-[44px] py-2 flex items-center justify-center gap-2 text-sm text-muted-foreground font-medium rounded-xl border border-border bg-muted/30">
            3 of 3 posts pinned
          </div>
        )
      )}

      {/* Creator Analytics - owner only */}
      {isOwnProfile && (
        <CreatorAnalyticsCard userId={userId} className="mb-4" />
      )}

      {/* Post Picker Sheet */}
      <PostPickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        userId={userId}
        onPostSelect={handlePostSelect}
        mode={pickerMode}
        excludePostIds={[
          ...(featuredPost?.id ? [featuredPost.id] : []),
          ...pinnedPosts.map(p => p.id),
        ]}
      />
    </div>
  );
}

export default CreatorProfileSection;
