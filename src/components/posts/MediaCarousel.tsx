
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CarouselSlide from './CarouselSlide';
import { haptic } from '@/utils/haptics';
import { StudioEdits } from '@/types/studio';
import { BlurredMediaBackground } from '@/components/media/BlurredMediaBackground';

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  previewUrl?: string;
  url?: string;
  file?: File;
  thumbnailUrl?: string;
  alt?: string;
  studioEdits?: StudioEdits;
  /** Original width for aspect ratio calculations */
  width?: number;
  /** Original height for aspect ratio calculations */
  height?: number;
}

interface MediaCarouselProps {
  items: MediaItem[];
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  onSetCover?: (index: number) => void;
  coverIndex?: number;
  enableSwipe?: boolean;
  loop?: boolean;
  className?: string;
  /** Force all videos to be muted (e.g., when music track is active) */
  forceVideoMuted?: boolean;
  /** Callback when user attempts to unmute while music is active */
  onMuteBlocked?: () => void;
  /** Hide video overlays (VIDEO badge and center play icon) */
  hideVideoOverlays?: boolean;
  /** View mode: 'edit' shows full media, 'feed' shows how it will appear in feed */
  viewMode?: 'edit' | 'feed';
}

export interface MediaCarouselRef {
  scrollToIndex: (index: number) => void;
}

const MediaCarousel = forwardRef<MediaCarouselRef, MediaCarouselProps>(({ 
  items, 
  initialIndex = 0, 
  onIndexChange,
  onSetCover,
  coverIndex = 0,
  enableSwipe = true,
  loop = false,
  className = '',
  forceVideoMuted = false,
  onMuteBlocked,
  hideVideoOverlays = false,
  viewMode = 'edit'
}, ref) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mediaDimensions, setMediaDimensions] = useState<Map<string, { width: number; height: number }>>(new Map());
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  // Expose scrollToIndex to parent via ref
  useImperativeHandle(ref, () => ({
    scrollToIndex: (index: number) => {
      if (index >= 0 && index < items.length) {
        setActiveIndex(index);
      }
    }
  }), [items.length]);

  const hasMultipleItems = items.length > 1;

  // Preload adjacent slides (lightweight thumbnails only)
  useEffect(() => {
    if (!items?.length) return;
    
    const next = (activeIndex + 1) % items.length;
    const prev = (activeIndex - 1 + items.length) % items.length;

    [prev, next].forEach(i => {
      const item = items[i];
      if (!item) return;
      
      // Only preload images, not videos (saves memory)
      if (item.type === 'image') {
        const img = new Image();
        const baseUrl = item.previewUrl || item.url || (item.file ? URL.createObjectURL(item.file) : '');
        if (!baseUrl) return;

        const isStreamThumb =
          /\/thumbnails\/thumbnail\.jpg/i.test(baseUrl) &&
          (baseUrl.includes('videodelivery.net') || baseUrl.includes('cloudflarestream.com'));

        // Preload thumbnail, not full-res
        if (baseUrl.startsWith('blob:') || isStreamThumb) {
          img.src = baseUrl;
        } else {
          const sep = baseUrl.includes('?') ? '&' : '?';
          img.src = `${baseUrl}${sep}width=600&height=600&fit=cover`;
        }
      }
    });
  }, [activeIndex, items]);

  // Cleanup: pause videos when slide changes (cleanup only, not playback control)
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (index !== activeIndex && !video.paused) {
        // Allow pause for cleanup of non-visible slides
        video.pause();
      }
    });
  }, [activeIndex]);

  // Handle index changes with haptic feedback
  const hasMountedRef = useRef(false);
  useEffect(() => {
    onIndexChange?.(activeIndex);
    // Fire haptic only on user-driven changes (not initial mount)
    if (hasMountedRef.current) {
      haptic('light');
    } else {
      hasMountedRef.current = true;
    }
  }, [activeIndex, onIndexChange]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasMultipleItems) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      return () => container.removeEventListener('keydown', handleKeyDown);
    }
  }, [hasMultipleItems, activeIndex, items.length, loop]);

  const handlePrevious = () => {
    if (!hasMultipleItems) return;
    setActiveIndex(prev => {
      if (prev > 0) return prev - 1;
      return loop ? items.length - 1 : 0;
    });
  };

  const handleNext = () => {
    if (!hasMultipleItems) return;
    setActiveIndex(prev => {
      if (prev < items.length - 1) return prev + 1;
      return loop ? 0 : items.length - 1;
    });
  };

  // Touch/drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!enableSwipe || !hasMultipleItems) return;
    
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !enableSwipe) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    // Only prevent default if horizontal movement is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      e.preventDefault();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging || !enableSwipe) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    // Only trigger swipe if horizontal movement is dominant and significant
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      if (deltaX > 0) {
        handlePrevious();
      } else {
        handleNext();
      }
    }
    
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const registerVideoRef = (index: number) => (ref: HTMLVideoElement | null) => {
    if (ref) {
      videoRefs.current.set(index, ref);
    } else {
      videoRefs.current.delete(index);
    }
  };

  // Calculate aspect ratio for current media item
  const currentItem = items[activeIndex];
  const containerAspect = useMemo(() => {
    if (viewMode === 'feed') {
      // Feed preview mode - show how it will appear in feed (4:5 ratio)
      return 4 / 5;
    }
    
    // Edit mode - dynamic aspect ratio based on media
    const item = currentItem;
    if (!item) return 16 / 9;
    
    // Check for explicit dimensions
    if (item.width && item.height) {
      const aspect = item.width / item.height;
      // Clamp to reasonable bounds (9:16 portrait to 21:9 ultrawide)
      return Math.max(9 / 16, Math.min(21 / 9, aspect));
    }
    
    // Check for dimensions from mediaDimensions state
    const dims = mediaDimensions.get(item.id);
    if (dims) {
      const aspect = dims.width / dims.height;
      return Math.max(9 / 16, Math.min(21 / 9, aspect));
    }
    
    // Default to 4:5 (common social aspect ratio)
    return 4 / 5;
  }, [currentItem, viewMode, mediaDimensions]);

  // Get blur background URL
  const blurBackgroundUrl = useMemo(() => {
    if (!currentItem) return '';
    return currentItem.thumbnailUrl || currentItem.previewUrl || currentItem.url || '';
  }, [currentItem]);

  // Handler to receive dimensions from CarouselSlide
  const handleMediaDimensions = (id: string, width: number, height: number) => {
    setMediaDimensions(prev => {
      const newMap = new Map(prev);
      newMap.set(id, { width, height });
      return newMap;
    });
  };

  if (!items?.length) {
    return (
      <div className={`relative bg-black/40 flex items-center justify-center rounded-2xl ${className}`}>
        <span className="text-white/50 text-sm">No media selected</span>
      </div>
    );
  }

  const isFeedMode = viewMode === 'feed';

  return (
    <div 
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-t-2xl ${className}`}
      style={{ 
        aspectRatio: containerAspect,
        touchAction: 'pan-y',
        minHeight: '200px',
        maxHeight: '80vh',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      role="region"
      aria-label="Post media carousel"
      tabIndex={0}
    >
      {/* Blurred background layer - only in edit mode for letterboxing */}
      {!isFeedMode && blurBackgroundUrl && (
        <BlurredMediaBackground 
          src={blurBackgroundUrl}
          isVideo={currentItem?.type === 'video'}
        />
      )}
      
      {/* Carousel content - centered with object-contain in edit mode */}
      <div className="absolute inset-0 z-[1] flex items-center justify-center">
        <CarouselSlide
          item={currentItem}
          index={activeIndex}
          isActive={true}
          onVideoRef={registerVideoRef(activeIndex)}
          onSetCover={onSetCover}
          coverIndex={coverIndex}
          forceVideoMuted={forceVideoMuted}
          onMuteBlocked={onMuteBlocked}
          studioEdits={currentItem.studioEdits}
          hideVideoOverlays={hideVideoOverlays}
          objectFit={isFeedMode ? 'cover' : 'contain'}
          onDimensionsLoaded={handleMediaDimensions}
        />
      </div>

      {/* Navigation arrows - matching pill style */}
      {hasMultipleItems && (
        <>
          <button
            onClick={handlePrevious}
            disabled={!loop && activeIndex === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 
                     px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm
                     flex items-center justify-center hover:bg-black/70
                     active:scale-[0.98] transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous media"
          >
            <ChevronLeft className="w-3 h-3 text-white" />
          </button>

          <button
            onClick={handleNext}
            disabled={!loop && activeIndex === items.length - 1}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 
                     px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm
                     flex items-center justify-center hover:bg-black/70
                     active:scale-[0.98] transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next media"
          >
            <ChevronRight className="w-3 h-3 text-white" />
          </button>
        </>
      )}

      {/* View mode indicator (edit mode only) */}
      {!isFeedMode && (
        <div className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm">
          <span className="text-[10px] text-white/70 font-medium">Edit View</span>
        </div>
      )}

      {/* Screen reader status */}
      <p className="sr-only" aria-live="polite">
        Item {activeIndex + 1} of {items.length}
      </p>

      {/* Gradient overlays */}
      <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-10" />
    </div>
  );
});

MediaCarousel.displayName = 'MediaCarousel';

export default MediaCarousel;
