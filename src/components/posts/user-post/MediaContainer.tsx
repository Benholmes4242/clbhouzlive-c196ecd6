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
  const [touchStartTime, setTouchStartTime] = React.useState(0);
  const [touchStartPos, setTouchStartPos] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);

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

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStartTime(Date.now());
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.y);
    
    // If movement is more than 10px, consider it a drag/scroll
    if (deltaX > 10 || deltaY > 10) {
      setIsDragging(true);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchDuration = Date.now() - touchStartTime;
    
    // Only trigger tap if it was a quick touch without dragging
    if (!isDragging && touchDuration < 300) {
      onMediaClick(currentMedia.media_url, currentMedia.media_type);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // For desktop clicks, always allow
    onMediaClick(currentMedia.media_url, currentMedia.media_type);
  };

  const currentMedia = media[currentIndex];
  if (!currentMedia) return null;

  return (
    <div 
      {...swipeHandlers}
      className="relative w-full aspect-square cursor-pointer" 
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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