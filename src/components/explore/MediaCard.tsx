
import React, { memo } from 'react';
import { ExploreContentItem } from './types';

import PostViewerModal from '@/components/posts/PostViewerModal';
import MediaDisplay from './MediaDisplay';
import MediaControls from './MediaControls';
import MediaOverlays from './MediaOverlays';
import { useMediaCard } from '@/hooks/useMediaCard';

interface MediaCardProps {
  item: ExploreContentItem;
  onLike: (contentId: string) => void;
  onFollow: (contentId: string) => void;
  onMediaClick?: (item: ExploreContentItem) => void;
  isFeatured?: boolean;
  shouldAutoplay?: boolean;
}

const MediaCard: React.FC<MediaCardProps> = ({ item, onLike, onFollow, isFeatured, shouldAutoplay: shouldAutoplayProp, ...props }) => {
  // Get media array first to check current media type
  const mediaItems = item.media && item.media.length > 0 ? item.media : [{
    id: `${item.id}-single`,
    media_type: item.type as 'video' | 'image',
    media_url: item.src
  }];
  
  const currentMedia = mediaItems[0]; // Use first media for autoplay determination
  
  const {
    isPostViewerOpen,
    setIsPostViewerOpen,
    currentMediaIndex,
    isHovered,
    isLoading,
    isMobile,
    autoplayRef,
    swipeRef,
    mediaItems: mediaItemsFromHook,
    currentMedia: currentMediaFromHook,
    hasMultipleMedia,
    shouldAutoplay: shouldAutoplayEnabled,
    transformedPost,
    handlePrevMedia,
    handleNextMedia,
    handleCardMouseEnter,
    handleCardMouseLeave,
    handleLike,
    handleMediaClick,
    handleImageError,
    handleImageLoad,
  } = useMediaCard({ 
    item, 
    onLike, 
    onMediaClick: props.onMediaClick,
    shouldAutoplay: shouldAutoplayProp && currentMedia?.media_type === 'video'
  });

  if (item.type === 'cta') return null;

  return (
    <>
      <div 
        ref={(el) => {
          if (autoplayRef.current !== el) autoplayRef.current = el;
          if (swipeRef.current !== el) swipeRef.current = el;
        }}
        className="relative group bg-background overflow-hidden h-full cursor-pointer border-0"
        onClick={handleMediaClick}
        onMouseEnter={handleCardMouseEnter}
        onMouseLeave={handleCardMouseLeave}
      >
        <MediaDisplay
          media={currentMediaFromHook}
          itemTitle={item.title}
          shouldAutoplay={shouldAutoplayEnabled}
          isLoading={isLoading}
          onImageError={handleImageError}
          onImageLoad={handleImageLoad}
          itemId={item.id}
          currentIndex={currentMediaIndex}
        />

        <MediaControls
          hasMultipleMedia={hasMultipleMedia}
          mediaCount={mediaItemsFromHook.length}
          currentIndex={currentMediaIndex}
          isHovered={isHovered}
          isMobile={isMobile}
          onPrevMedia={handlePrevMedia}
          onNextMedia={handleNextMedia}
        />

        <MediaOverlays
          user={item.user}
          likes={item.likes}
          isFeatured={isFeatured}
          onLike={handleLike}
          onMaximize={handleMediaClick}
          mediaType={currentMediaFromHook.media_type}
        />
      </div>

      <PostViewerModal
        isOpen={isPostViewerOpen}
        onClose={() => setIsPostViewerOpen(false)}
        initialPost={transformedPost}
        allUserPosts={[transformedPost]}
      />
    </>
  );
};

export default memo(MediaCard);
