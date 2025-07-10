import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { useIsMobile } from '@/hooks/use-mobile';
import VideoPlayer from '@/components/ui/video-player';
import LazyImage from '@/components/ui/lazy-image';

interface MediaItem {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
}

interface MediaContainerProps {
  media: MediaItem[];
  currentIndex: number;
  isHovered: boolean;
  onMediaClick: (mediaUrl: string, mediaType: 'image' | 'video') => void;
  onIndexChange: (index: number) => void;
  children?: React.ReactNode;
}

export const MediaContainer: React.FC<MediaContainerProps> = ({
  media,
  currentIndex,
  isHovered,
  onMediaClick,
  onIndexChange,
  children
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const isMobile = useIsMobile();

  // Mobile swipe navigation
  const handleSwipeLeft = () => {
    if (media.length > 1 && currentIndex < media.length - 1) {
      onIndexChange(currentIndex + 1);
    }
  };

  const handleSwipeRight = () => {
    if (media.length > 1 && currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  };

  // Swipe handlers for mobile only
  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleSwipeLeft,
    onSwipedRight: handleSwipeRight,
    preventScrollOnSwipe: true,
    trackMouse: false, // Only track touch, not mouse
    trackTouch: true,
    delta: 50,
    touchEventOptions: { passive: false }
  });

  // Arrow navigation for desktop
  const navigateToIndex = (index: number) => {
    if (index >= 0 && index < media.length) {
      onIndexChange(index);
    }
  };

  const handleMediaItemClick = (mediaItem: MediaItem) => {
    onMediaClick(mediaItem.media_url, mediaItem.media_type);
  };

  if (!media || media.length === 0) return null;

  const currentMedia = media[currentIndex];
  if (!currentMedia) return null;

  return (
    <div 
      className="relative w-full aspect-square group"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Single Media Display with Mobile Swipe Support */}
      <div
        {...(isMobile && media.length > 1 ? swipeHandlers : {})}
        className="w-full h-full cursor-pointer"
        onClick={() => handleMediaItemClick(currentMedia)}
      >
        {currentMedia.media_type === 'video' ? (
          <VideoPlayer
            src={currentMedia.media_url}
            autoplay={isHovered}
            loop={true}
            className="w-full h-full object-cover"
            showVideoIcon={false}
            showOverlayControls={false}
            videoId={`carousel-${currentMedia.id}`}
            isInFeed={true}
          />
        ) : (
          <LazyImage
            src={currentMedia.media_url}
            alt="Post content"
            className="w-full h-full object-cover object-center"
          />
        )}
      </div>

      {/* Navigation Arrows (Desktop Only) */}
      {!isMobile && media.length > 1 && isHovering && (
        <>
          {currentIndex > 0 && (
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                navigateToIndex(currentIndex - 1);
              }}
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          
          {currentIndex < media.length - 1 && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                navigateToIndex(currentIndex + 1);
              }}
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </>
      )}
      
      {children}
    </div>
  );
};