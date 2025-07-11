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

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    hasMoved.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
    
    // If movement is more than 10px in any direction, consider it a scroll
    if (deltaX > 10 || deltaY > 10) {
      hasMoved.current = true;
    }
  };

  const handleTouchEnd = () => {
    // Only trigger media click if there was minimal movement (tap, not scroll)
    if (!hasMoved.current && touchStartPos.current) {
      onMediaClick(currentMedia.media_url, currentMedia.media_type);
    }
    touchStartPos.current = null;
    hasMoved.current = false;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    touchStartPos.current = { x: e.clientX, y: e.clientY };
    hasMoved.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!touchStartPos.current) return;
    
    const deltaX = Math.abs(e.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(e.clientY - touchStartPos.current.y);
    
    // If movement is more than 10px in any direction, consider it a drag
    if (deltaX > 10 || deltaY > 10) {
      hasMoved.current = true;
    }
  };

  const handleMouseUp = () => {
    // Only trigger media click if there was minimal movement (click, not drag)
    if (!hasMoved.current && touchStartPos.current) {
      onMediaClick(currentMedia.media_url, currentMedia.media_type);
    }
    touchStartPos.current = null;
    hasMoved.current = false;
  };

  return (
    <div 
      {...swipeHandlers}
      className="relative w-full aspect-square cursor-pointer"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {currentMedia.media_type === 'video' ? (
        <VideoPlayer
          src={currentMedia.media_url}
          autoplay={isHovered}
          muted={true}
          loop={true}
          className="w-full h-full object-cover"
          showVideoIcon={false}
          showOverlayControls={false}
          videoId={`index-${currentMedia.id}`}
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