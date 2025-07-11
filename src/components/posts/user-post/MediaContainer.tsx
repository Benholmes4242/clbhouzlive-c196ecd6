import React, { useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
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
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  children?: React.ReactNode;
}

export const MediaContainer: React.FC<MediaContainerProps> = ({
  media,
  currentIndex,
  isHovered,
  onMediaClick,
  onSwipeLeft,
  onSwipeRight,
  children
}) => {
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const hasMoved = useRef(false);
  const swipeHandlers = useSwipeable({
    onSwipedLeft: (eventData) => {
      if (media.length > 1) {
        onSwipeLeft();
      }
    },
    onSwipedRight: (eventData) => {
      if (media.length > 1) {
        onSwipeRight();
      }
    },
    preventScrollOnSwipe: false, // Allow vertical scrolling
    trackMouse: false,
    trackTouch: true,
    delta: 50,
    touchEventOptions: { passive: true } // Don't interfere with native scroll
  });

  const currentMedia = media[currentIndex];
  if (!currentMedia) return null;

  return (
    <div 
      {...swipeHandlers}
      className="relative w-full aspect-square"
      style={{ touchAction: 'pan-y' }} // Only allow vertical scrolling
    >
      {currentMedia.media_type === 'video' ? (
        <VideoPlayer
          src={currentMedia.media_url}
          autoplay={isHovered}
          muted={true}
          loop={true}
          className="w-full h-full object-cover pointer-events-none" // Disable all video interactions
          showVideoIcon={false}
          showOverlayControls={false}
          videoId={`index-${currentMedia.id}`}
          isInFeed={true}
        />
      ) : (
        <LazyImage
          src={currentMedia.media_url}
          alt="Post content"
          className="w-full h-full object-cover object-center pointer-events-none" // Disable image interactions
        />
      )}
      
      {children}
    </div>
  );
};