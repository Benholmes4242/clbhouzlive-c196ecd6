import React, { useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import LazyImage from '@/components/ui/lazy-image';
import ProcessingIndicator from '@/components/ui/processing-indicator';

import { MediaItem, ProcessingStatus } from '@/types/media';

interface LocalMediaItem {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  processing_status?: ProcessingStatus;
}

interface MediaContainerProps {
  media: LocalMediaItem[];
  currentIndex: number;
  isHovered: boolean;
  onMediaClick: (mediaUrl: string, mediaType: 'image' | 'video', currentIndex?: number) => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  children?: React.ReactNode;
  videoRefCallback?: (el: HTMLVideoElement | null) => void;
}

export const MediaContainer: React.FC<MediaContainerProps> = ({
  media,
  currentIndex,
  isHovered,
  onMediaClick,
  onSwipeLeft,
  onSwipeRight,
  children,
  videoRefCallback
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
      className="relative w-full h-full group"
      style={{ touchAction: 'pan-y' }} // Only allow vertical scrolling
    >
      {/* Processing indicator for media with pending edits */}
      <ProcessingIndicator status={currentMedia.processing_status} />
      {currentMedia.media_type === 'video' ? (
        <EnhancedVideoPlayer
          ref={videoRefCallback}
          src={currentMedia.media_url}
          autoplay={isHovered}
          muted={true}
          loop={true}
          className="w-full h-full object-cover pointer-events-none"
          enableHLS={true}
        />
      ) : (
        <LazyImage
          src={currentMedia.media_url}
          alt="Post content"
          className="w-full h-full object-cover object-center pointer-events-none" // Disable image interactions
          width={640}
          height={800}
          priority={isHovered}
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
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
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
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
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