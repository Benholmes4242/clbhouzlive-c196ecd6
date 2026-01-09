import React, { memo } from 'react';
import { ExploreContentItem } from './types';

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
  isPortrait?: boolean;
  autoplayManager?: {
    registerVideo: (videoId: string, element: HTMLElement, index: number) => void;
    unregisterVideo: (videoId: string) => void;
    shouldVideoAutoplay: (index: number) => boolean;
    isVideoAutoplaying: (videoId: string) => boolean;
  };
  videoIndex?: number;
  stage?: 'grid' | 'fullscreen' | 'vertical-feed';
  isAboveTheFold?: boolean;
}

const MediaCard: React.FC<MediaCardProps> = ({ item, onLike, onFollow, isFeatured, isPortrait, autoplayManager, videoIndex, stage = 'grid', isAboveTheFold = false, ...props }) => {
  const {
    currentMediaIndex,
    isHovered,
    isLoading,
    isMobile,
    autoplayRef,
    swipeRef,
    cardRef,
    mediaItems,
    currentMedia,
    hasMultipleMedia,
    shouldAutoplay,
    handlePrevMedia,
    handleNextMedia,
    handleCardMouseEnter,
    handleCardMouseLeave,
    handleLike,
    handlePointerDown,
    handleMediaClick,
    handleImageError,
    handleImageLoad,
  } = useMediaCard({ 
    item, 
    onLike, 
    onMediaClick: props.onMediaClick,
    isFeatured,
    isPortrait,
    autoplayManager,
    videoIndex
  });

  if (item.type === 'cta') return null;

  return (
    <div 
      ref={(el) => {
        if (autoplayRef.current !== el) autoplayRef.current = el;
        if (swipeRef.current !== el) swipeRef.current = el;
        if (cardRef.current !== el) cardRef.current = el;
      }}
      className="relative group bg-background overflow-hidden h-full cursor-pointer border-0"
      style={{ borderRadius: '0px' }}
      onPointerDown={handlePointerDown}
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
        loop={true}
        stage={stage}
        isAboveTheFold={isAboveTheFold}
        studioEdits={currentMedia.studio_edits}
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
        mediaType={currentMedia.media_type}
      />
    </div>
  );
};

export default memo(MediaCard);
