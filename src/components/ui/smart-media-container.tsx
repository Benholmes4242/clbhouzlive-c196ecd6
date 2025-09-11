import React, { useState, useRef, useEffect, memo } from 'react';
import { OptimizedImage } from './optimized-image';
import EnhancedVideoPlayer from './enhanced-video-player';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';

import { MediaItem as BaseMediaItem } from '@/types/media';

interface MediaItem extends BaseMediaItem {
  poster?: string;
  aspectRatio?: number;
}

interface SmartMediaContainerProps {
  media: MediaItem[];
  className?: string;
  autoplay?: boolean;
  priority?: boolean;
  enableCarousel?: boolean;
  onMediaChange?: (index: number) => void;
  onMediaClick?: (media: MediaItem, index: number) => void;
  lazyThreshold?: number;
  quality?: number;
}

const SmartMediaContainer: React.FC<SmartMediaContainerProps> = ({
  media,
  className = '',
  autoplay = false,
  priority = false,
  enableCarousel = true,
  onMediaChange,
  onMediaClick,
  lazyThreshold = 100,
  quality = 80
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedMedia, setLoadedMedia] = useState<Set<number>>(new Set([0]));
  const containerRef = useRef<HTMLDivElement>(null);
  const { isMobile, isSlowNetwork, getBatchSize } = useMobileOptimizations();
  
  const { ref: intersectionRef, isInView } = useIntersectionObserver({
    threshold: 0.01, // 1% visibility to show content
    rootMargin: `${lazyThreshold}px`
  });

  // Preload adjacent media when current media loads
  useEffect(() => {
    if (isInView && !isSlowNetwork) {
      const batchSize = getBatchSize();
      const indicesToLoad = new Set<number>();
      
      // Always load current
      indicesToLoad.add(currentIndex);
      
      // Load adjacent based on batch size
      for (let i = 1; i <= Math.floor(batchSize / 2); i++) {
        if (currentIndex - i >= 0) indicesToLoad.add(currentIndex - i);
        if (currentIndex + i < media.length) indicesToLoad.add(currentIndex + i);
      }
      
      setLoadedMedia(prev => new Set([...prev, ...indicesToLoad]));
    }
  }, [currentIndex, isInView, media.length, isSlowNetwork, getBatchSize]);

  const handleMediaChange = (index: number) => {
    setCurrentIndex(index);
    onMediaChange?.(index);
    
    // Preload next media
    if (index + 1 < media.length) {
      setLoadedMedia(prev => new Set([...prev, index + 1]));
    }
  };

  const handleMediaClick = (mediaItem: MediaItem, index: number) => {
    onMediaClick?.(mediaItem, index);
  };

  const currentMedia = media[currentIndex];
  if (!currentMedia) return null;

  return (
    <div 
      ref={intersectionRef}
      className={`relative overflow-hidden ${className}`}
    >
      <div 
        ref={containerRef}
        className="relative w-full h-full"
        style={currentMedia.aspectRatio ? { aspectRatio: currentMedia.aspectRatio } : undefined}
      >
        {/* Main media display */}
        {currentMedia.type === 'video' ? (
          loadedMedia.has(currentIndex) ? (
            <EnhancedVideoPlayer
              src={currentMedia.url}
              poster={currentMedia.poster}
              autoplay={autoplay && isInView}
              muted={true}
              loop={true}
              className="w-full h-full"
              enableHLS={currentMedia.url.includes('.m3u8')}
              adaptiveBitrate={!isSlowNetwork}
              preloadLevel={isSlowNetwork ? 'none' : 'metadata'}
              quality={isSlowNetwork ? '480p' : 'auto'}
              onClick={() => handleMediaClick(currentMedia, currentIndex)}
            />
          ) : (
            <div className="w-full h-full bg-media-loading animate-pulse flex items-center justify-center">
              <div className="w-12 h-12 border-2 border-muted-foreground/30 border-t-muted-foreground/70 rounded-full animate-spin" />
            </div>
          )
        ) : (
          loadedMedia.has(currentIndex) ? (
            <OptimizedImage
              src={currentMedia.url}
              alt={currentMedia.alt || `Media ${currentIndex + 1}`}
              className="w-full h-full object-cover"
              priority={priority && currentIndex === 0}
              loading={priority && currentIndex === 0 ? 'eager' : 'lazy'}
              quality={isSlowNetwork ? 60 : quality}
              format="auto"
              placeholder={isSlowNetwork ? 'none' : 'blur'}
              aspectRatio={currentMedia.aspectRatio}
              sizes={isMobile ? '100vw' : '(max-width: 768px) 100vw, 50vw'}
              onClick={() => handleMediaClick(currentMedia, currentIndex)}
            />
          ) : (
            <div className="w-full h-full bg-media-loading animate-pulse" />
          )
        )}

        {/* Media indicators */}
        {enableCarousel && media.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
            {media.map((_, index) => (
              <button
                key={index}
                onClick={() => handleMediaChange(index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentIndex
                    ? 'bg-white shadow-lg'
                    : 'bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`View media ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Swipe navigation for mobile */}
        {enableCarousel && media.length > 1 && isMobile && (
          <>
            {currentIndex > 0 && (
              <button
                onClick={() => handleMediaChange(currentIndex - 1)}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white rounded-full p-2 z-10"
                aria-label="Previous media"
              >
                ←
              </button>
            )}
            {currentIndex < media.length - 1 && (
              <button
                onClick={() => handleMediaChange(currentIndex + 1)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white rounded-full p-2 z-10"
                aria-label="Next media"
              >
                →
              </button>
            )}
          </>
        )}

        {/* Loading indicator */}
        {!loadedMedia.has(currentIndex) && (
          <div className="absolute inset-0 bg-media-loading/50 flex items-center justify-center z-20">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white/70 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Preload adjacent media invisibly */}
      <div className="sr-only">
        {media.map((mediaItem, index) => {
          if (!loadedMedia.has(index) || index === currentIndex) return null;
          
          return mediaItem.type === 'image' ? (
            <OptimizedImage
              key={`preload-${index}`}
              src={mediaItem.url}
              alt={mediaItem.alt || ''}
              width={200}
              height={200}
              priority={false}
              loading="lazy"
              quality={50}
            />
          ) : null;
        })}
      </div>
    </div>
  );
};

export default memo(SmartMediaContainer);