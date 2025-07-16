
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
  cardIndex?: number;
}

const MediaCard: React.FC<MediaCardProps> = ({ item, onLike, onFollow, isFeatured, cardIndex, ...props }) => {
  const {
    isPostViewerOpen,
    setIsPostViewerOpen,
    currentMediaIndex,
    isHovered,
    isLoading,
    isMobile,
    autoplayRef,
    swipeRef,
    mediaItems,
    currentMedia,
    hasMultipleMedia,
    shouldAutoplay,
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
    cardIndex 
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
          media={currentMedia}
          itemTitle={item.title}
          shouldAutoplay={shouldAutoplay}
          isLoading={isLoading}
          onImageError={handleImageError}
          onImageLoad={handleImageLoad}
          itemId={item.id}
          currentIndex={currentMediaIndex}
        />

        <MediaControls
          hasMultipleMedia={hasMultipleMedia}
          mediaCount={mediaItems.length}
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
