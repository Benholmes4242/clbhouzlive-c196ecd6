import React, { useRef, useEffect, useState } from 'react';
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
  const handleScroll = () => {
    if (containerRef.current && !isDragging) {
      const container = containerRef.current;
      const scrollLeft = container.scrollLeft;
      const itemWidth = container.offsetWidth;
      const newIndex = Math.round(scrollLeft / itemWidth);
      
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < media.length) {
        onIndexChange(newIndex);
      }
    }
  };

  // Desktop drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (media.length <= 1) return;
    setIsDragging(true);
    setDragStart(e.clientX);
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || media.length <= 1) return;
    
    const container = containerRef.current;
    if (!container) return;

    const diff = dragStart - e.clientX;
    container.scrollLeft += diff;
    setDragStart(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setIsHovering(false);
  };

  // Arrow navigation
  const navigateToIndex = (index: number) => {
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
        className="flex w-full h-full overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
        style={{ 
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch'
        }}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {media.map((mediaItem, index) => (
          <div
            key={mediaItem.id}
            className="flex-shrink-0 w-full h-full"
            style={{ scrollSnapAlign: 'start' }}
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