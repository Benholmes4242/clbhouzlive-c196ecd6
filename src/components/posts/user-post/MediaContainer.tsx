import React from 'react';
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
  const swipeHandlers = useSwipeable({
    onSwipedLeft: (eventData) => {
      if (media.length > 1) {
        eventData.event.preventDefault();
        eventData.event.stopPropagation();
        onSwipeLeft();
      }
    },
    onSwipedRight: (eventData) => {
      if (media.length > 1) {
        eventData.event.preventDefault();
        eventData.event.stopPropagation();
        onSwipeRight();
      }
    },
    onSwiping: (eventData) => {
      if (media.length > 1) {
        eventData.event.preventDefault();
        eventData.event.stopPropagation();
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: false,
    trackTouch: true,
    delta: 50,
    touchEventOptions: { passive: false }
  });

  const currentMedia = media[currentIndex];
  if (!currentMedia) return null;

  return (
    <div 
      {...swipeHandlers}
      className="relative w-full aspect-square cursor-pointer" 
      onClick={() => onMediaClick(currentMedia.media_url, currentMedia.media_type)}
    >
      {currentMedia.media_type === 'video' ? (
        <VideoPlayer
          src={currentMedia.media_url}
          autoplay={isHovered}
          loop={true}
          className="w-full h-full object-cover"
          showVideoIcon={false}
          showOverlayControls={false}
          videoId={`index-${currentMedia.id}`}
          isInFeed={true}
        />
      ) : (
        <LazyImage
          src={currentMedia.media_url}
          alt="Post content"
          className="w-full h-full object-cover object-center"
        />
      )}
      
      {children}
    </div>
  );
};