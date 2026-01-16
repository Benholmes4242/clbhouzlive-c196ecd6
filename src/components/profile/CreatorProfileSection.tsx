import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FeaturedVideoSlot } from './FeaturedVideoSlot';
import { PinnedPostsSection } from './PinnedPostsSection';
import { CreatorBadge } from './CreatorBadge';
import { CreatorAnalyticsCard } from './CreatorAnalyticsCard';
import { useCreatorFeatures } from '@/hooks/useCreatorFeatures';
import { PostPickerSheet } from './PostPickerSheet';
import { Film } from 'lucide-react';

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
 * - Featured video slot
 * - Pinned posts
 * - Creator analytics (owner only)
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

  // Don't render for non-creators
  if (!isCreator || isLoading) {
    return null;
  }

  const handleEditFeatured = () => {
    setPickerMode('featured');
    setPickerOpen(true);
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
    // Navigate to post viewer - placeholder for now
    console.log('Open post:', postId);
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

      {/* View videos CTA */}
      <button
        onClick={() => navigate(`/profile/${userId}`)}
        className="mb-4 w-full py-3 flex items-center justify-center gap-2 text-sm font-medium rounded-xl transition-colors bg-primary/10 hover:bg-primary/15 text-primary border border-primary/20"
      >
        <Film className="w-4 h-4" />
        View videos
      </button>

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
