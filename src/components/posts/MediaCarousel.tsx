
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CarouselSlide from './CarouselSlide';
import { haptic } from '@/utils/haptics';

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  previewUrl?: string;
  url?: string;
  file?: File;
  alt?: string;
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
}

const MediaCarousel = ({ 
  items, 
  initialIndex = 0, 
  onIndexChange,
  onSetCover,
  coverIndex = 0,
  enableSwipe = true,
  loop = false,
  className = '' 
}: MediaCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  const hasMultipleItems = items.length > 1;

  // Preload adjacent slides
  useEffect(() => {
    if (!items?.length) return;
    
    const next = (activeIndex + 1) % items.length;
    const prev = (activeIndex - 1 + items.length) % items.length;

    [prev, next].forEach(i => {
      const item = items[i];
      if (!item) return;
      
      if (item.type === 'image') {
        const img = new Image();
        img.src = item.previewUrl || item.url || (item.file ? URL.createObjectURL(item.file) : '');
      } else if (item.type === 'video') {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = item.previewUrl || item.url || (item.file ? URL.createObjectURL(item.file) : '');
      }
    });
  }, [activeIndex, items]);

  // Pause videos when slide changes
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
      className={`relative w-full aspect-video overflow-hidden ${className}`}
      style={{ touchAction: 'pan-y' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      role="region"
      aria-label="Post media carousel"
      tabIndex={0}
    >
      {/* Safe area top padding */}
      <div className="absolute inset-0 pt-[calc(env(safe-area-inset-top,0px))]">
        <CarouselSlide
          item={items[activeIndex]}
          index={activeIndex}
          isActive={true}
          onVideoRef={registerVideoRef(activeIndex)}
          onSetCover={onSetCover}
          coverIndex={coverIndex}
        />
      </div>

      {/* Navigation arrows */}
      {hasMultipleItems && (
        <>
          <button
            onClick={handlePrevious}
            disabled={!loop && activeIndex === 0}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 
                     h-8 w-8 rounded-full bg-white/55 backdrop-blur-[10px] 
                     border border-white/70 shadow-[0_4px_16px_rgba(0,0,0,0.12)]
                     flex items-center justify-center hover:bg-white/65 hover:shadow-[0_6px_18px_rgba(0,0,0,0.16)]
                     active:scale-[0.98] transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous media"
          >
            <ChevronLeft className="h-3.5 w-3.5 text-[rgba(25,25,28,0.85)]" />
          </button>

          <button
            onClick={handleNext}
            disabled={!loop && activeIndex === items.length - 1}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 
                     h-8 w-8 rounded-full bg-white/55 backdrop-blur-[10px] 
                     border border-white/70 shadow-[0_4px_16px_rgba(0,0,0,0.12)]
                     flex items-center justify-center hover:bg-white/65 hover:shadow-[0_6px_18px_rgba(0,0,0,0.16)]
                     active:scale-[0.98] transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next media"
          >
            <ChevronRight className="h-3.5 w-3.5 text-[rgba(25,25,28,0.85)]" />
          </button>
        </>
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
};

export default MediaCarousel;
