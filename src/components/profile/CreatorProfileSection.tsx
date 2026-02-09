import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FeaturedVideoSlot } from './FeaturedVideoSlot';
import { PinnedPostsSection } from './PinnedPostsSection';
import { CreatorBadge } from './CreatorBadge';
import { CreatorAnalyticsCard } from './CreatorAnalyticsCard';
import { useCreatorFeatures } from '@/hooks/useCreatorFeatures';
import { PostPickerSheet } from './PostPickerSheet';
import { useUnifiedFullscreen } from '@/hooks/useUnifiedFullscreen';

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

  const { openFullscreen } = useUnifiedFullscreen('profile', {});

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
      type: 'video' as const,
      url: featuredPost.videoUrl || '',
      posterUrl: featuredPost.thumbnailUrl,
      creator: { id: userId },
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
        isOwner={isOwnProfile}
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
      {isOwnProfile && canPin && pinnedPosts.length < 3 && (
        <button
          onClick={handleAddPinned}
          className="mb-4 w-full py-2 flex items-center justify-center gap-2 text-xs text-[#F7931E] font-medium rounded-sq-sm hover:bg-[#F7931E]/5 transition-colors"
          style={{ border: '1px dashed rgba(247, 147, 30, 0.3)' }}
        >
          + Pin another post ({3 - pinnedPosts.length} remaining)
        </button>
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
