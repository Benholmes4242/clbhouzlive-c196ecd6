import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);

  // Scroll to current index when it changes externally
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      const itemWidth = container.offsetWidth;
      container.scrollTo({
        left: currentIndex * itemWidth,
        behavior: 'smooth'
      });
    }
  }, [currentIndex]);

  // Handle scroll events to update current index
  const handleScroll = useCallback(() => {
    if (containerRef.current && !isDragging) {
      const container = containerRef.current;
      const scrollLeft = container.scrollLeft;
      const itemWidth = container.offsetWidth;
      const newIndex = Math.round(scrollLeft / itemWidth);
      
      console.log('📊 Scroll event:', { scrollLeft, itemWidth, newIndex, currentIndex });
      
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < media.length) {
        console.log('🔄 Updating index to:', newIndex);
        onIndexChange(newIndex);
      }
    }
  }, [isDragging, currentIndex, media.length, onIndexChange]);

  // Attach scroll listener - now stable with useCallback
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      console.log('🎯 Attaching scroll listener to container');
      container.addEventListener('scroll', handleScroll);
      return () => {
        console.log('🗑️ Removing scroll listener');
        container.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll]);

  // Desktop drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (media.length <= 1) return;
    console.log('🖱️ Mouse down - starting drag at:', e.clientX);
    setIsDragging(true);
    setDragStart(e.clientX);
    e.preventDefault();
  };

  // Global mouse events for dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || media.length <= 1) return;
      
      const container = containerRef.current;
      if (!container) return;

      const diff = dragStart - e.clientX;
      const beforeScroll = container.scrollLeft;
      container.scrollLeft += diff;
      const afterScroll = container.scrollLeft;
      
      console.log('🔄 Dragging:', { 
        diff, 
        beforeScroll, 
        afterScroll, 
        scrollWidth: container.scrollWidth, 
        clientWidth: container.clientWidth,
        isScrollable: container.scrollWidth > container.clientWidth
      });
      setDragStart(e.clientX);
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        console.log('🔚 Mouse up - ending drag');
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStart, media.length]);

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  // Arrow navigation
  const navigateToIndex = (index: number) => {
    console.log('🏹 Arrow navigation to index:', index, 'current:', currentIndex);
    if (index >= 0 && index < media.length) {
      onIndexChange(index);
    }
  };

  const handleMediaItemClick = (mediaItem: MediaItem) => {
    if (!isDragging) {
      onMediaClick(mediaItem.media_url, mediaItem.media_type);
    }
  };

  if (!media || media.length === 0) return null;

  return (
    <div 
      className="relative w-full aspect-square group"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Carousel Container */}
      <div
        ref={containerRef}
        className="flex overflow-x-auto overflow-y-hidden scrollbar-hide cursor-grab active:cursor-grabbing"
        style={{ 
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          width: '100%',
          height: '100%'
        }}
        onMouseDown={handleMouseDown}
      >
        {media.map((mediaItem, index) => (
          <div
            key={mediaItem.id}
            className="flex-shrink-0 relative"
            style={{ 
              scrollSnapAlign: 'start',
              width: '100%', // Each item takes full viewport width
              height: '100%'
            }}
            onClick={() => handleMediaItemClick(mediaItem)}
          >
            {mediaItem.media_type === 'video' ? (
              <VideoPlayer
                src={mediaItem.media_url}
                autoplay={isHovered && index === currentIndex}
                loop={true}
                className="w-full h-full object-cover"
                showVideoIcon={false}
                showOverlayControls={false}
                videoId={`carousel-${mediaItem.id}`}
                isInFeed={true}
              />
            ) : (
              <LazyImage
                src={mediaItem.media_url}
                alt="Post content"
                className="w-full h-full object-cover object-center"
              />
            )}
          </div>
        ))}
      </div>

      {/* Navigation Arrows (Desktop Only) */}
      {media.length > 1 && isHovering && !isDragging && (
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