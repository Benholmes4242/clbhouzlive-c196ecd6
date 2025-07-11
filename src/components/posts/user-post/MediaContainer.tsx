import React, { useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  const isMobile = useIsMobile();
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const hasMoved = useRef(false);
  const swipeHandlers = useSwipeable({
    onSwipedLeft: (eventData) => {
      console.log('📱 Swipe left detected in MediaContainer');
      if (media.length > 1) {
        onSwipeLeft();
      }
    },
    onSwipedRight: (eventData) => {
      console.log('📱 Swipe right detected in MediaContainer');
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
      className="relative w-full aspect-square group"
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
      
      {/* Desktop Navigation Arrows - Only show if multiple media and not mobile */}
      {!isMobile && media.length > 1 && (
        <>
          {/* Left Arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSwipeRight(); // Swipe right shows previous media
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100"
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          {/* Right Arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSwipeLeft(); // Swipe left shows next media
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100"
            disabled={currentIndex === media.length - 1}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
      
      {children}
    </div>
  );
};