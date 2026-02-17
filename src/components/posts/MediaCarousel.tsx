
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CarouselSlide from './CarouselSlide';
import { haptic } from '@/utils/haptics';
import { StudioEdits } from '@/types/studio';
import { cn } from '@/lib/utils';

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
  /** When true, uses transparent bg for wizard context (fit mode always) */
  isWizardContext?: boolean;
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
  isWizardContext = false,
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
      
      if (item.type === 'image') {
        const img = new Image();
        const baseUrl = item.previewUrl || item.url || (item.file ? URL.createObjectURL(item.file) : '');
        if (!baseUrl) return;

        const isStreamThumb =
          /\/thumbnails\/thumbnail\.jpg/i.test(baseUrl) &&
          (baseUrl.includes('videodelivery.net') || baseUrl.includes('cloudflarestream.com'));

        if (baseUrl.startsWith('blob:') || isStreamThumb) {
          img.src = baseUrl;
        } else {
          const sep = baseUrl.includes('?') ? '&' : '?';
          img.src = `${baseUrl}${sep}width=600&height=600&fit=cover`;
        }
      }
    });
  }, [activeIndex, items]);

  // Cleanup: pause videos when slide changes
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (index !== activeIndex && !video.paused) {
        video.pause();
      }
    });
  }, [activeIndex]);

  // Handle index changes with haptic feedback
  const hasMountedRef = useRef(false);
  useEffect(() => {
    onIndexChange?.(activeIndex);
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
    
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      e.preventDefault();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging || !enableSwipe) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
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

  const currentItem = items[activeIndex];
  
  // Fixed 4:5 aspect ratio for consistent, professional look
  const containerAspect = 4 / 5;

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

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full h-full overflow-hidden",
        "rounded-none",
        className
      )}
      style={{ 
        aspectRatio: containerAspect,
        touchAction: 'pan-y',
        minHeight: '200px',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      role="region"
      aria-label="Post media carousel"
      tabIndex={0}
    >
      {/* Carousel content — always fit mode, transparent background */}
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
          objectFit="contain"
          scrubberVariant={isWizardContext ? 'wizard' : 'default'}
          onDimensionsLoaded={handleMediaDimensions}
        />
      </div>

      {/* Navigation arrows — larger hit target (44px), frosted glass */}
      {hasMultipleItems && (
        <>
          <button
            onClick={handlePrevious}
            disabled={!loop && activeIndex === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 
                     p-3 rounded-full bg-black/40 backdrop-blur-sm
                     flex items-center justify-center hover:bg-black/50
                     active:scale-[0.96] transition-all
                     disabled:opacity-0 disabled:pointer-events-none"
            aria-label="Previous media"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>

          <button
            onClick={handleNext}
            disabled={!loop && activeIndex === items.length - 1}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 
                     p-3 rounded-full bg-black/40 backdrop-blur-sm
                     flex items-center justify-center hover:bg-black/50
                     active:scale-[0.96] transition-all
                     disabled:opacity-0 disabled:pointer-events-none"
            aria-label="Next media"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </>
      )}

      {/* Screen reader status */}
      <p className="sr-only" aria-live="polite">
        Item {activeIndex + 1} of {items.length}
      </p>
    </div>
  );
});

MediaCarousel.displayName = 'MediaCarousel';

export default MediaCarousel;
