
import React, { useState } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useVideoAutoplay } from '@/hooks/useVideoAutoplay';
import { useThumbnailGenerator } from './ThumbnailGenerator';
import { Play } from 'lucide-react';
import { GridVideoPreviewProps } from './types';

const GridVideoPreview = ({ 
  src, 
  poster, 
  className = "", 
  videoId 
}: GridVideoPreviewProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  
  const { ref: containerRef, isInView } = useIntersectionObserver({
    threshold: 0.5,
    rootMargin: '0px'
  });

  const { videoRef, isPlaying, isLoading, shouldShowPlayIcon } = useVideoAutoplay({
    isInView,
    isHovered,
    videoId,
    isGridContext: true
  });

  const { thumbnailSrc, thumbnailReady } = useThumbnailGenerator(src, videoId, poster);

  console.log('GridVideoPreview rendering:', {
    videoId,
    src,
    isInView,
    isHovered,
    isPlaying,
    isLoading,
    shouldShowPlayIcon,
    thumbnailReady,
    thumbnailSrc: thumbnailSrc ? 'available' : 'none'
  });

  // Fallback if video autoplay is not available
  if (!videoRef) {
    console.log('VideoRef not available, showing static video');
    return (
      <div className={`relative ${className}`}>
        <video
          src={src}
          poster={poster || thumbnailSrc}
          className="w-full h-full object-cover"
          muted
          loop
          playsInline
          onError={() => setThumbnailError(true)}
        />
        <div className="absolute bottom-2 right-2">
          <div className="w-8 h-8 bg-black/60 rounded-full flex items-center justify-center">
            <Play className="h-4 w-4 text-white ml-0.5" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster || thumbnailSrc}
        className="w-full h-full object-cover"
        muted
        loop
        playsInline
        onError={() => setThumbnailError(true)}
      />

      {/* Play icon overlay - positioned in bottom right corner */}
      {shouldShowPlayIcon && (
        <div className="absolute bottom-2 right-2">
          <div className="w-8 h-8 bg-black/60 rounded-full flex items-center justify-center">
            <Play className="h-4 w-4 text-white ml-0.5" />
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error fallback */}
      {thumbnailError && !isPlaying && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-400">
          <Play className="w-6 h-6 mb-1" />
          <span className="text-xs">Video</span>
        </div>
      )}
    </div>
  );
};

export default GridVideoPreview;
