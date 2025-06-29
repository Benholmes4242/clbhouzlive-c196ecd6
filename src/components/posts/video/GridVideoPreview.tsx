
import React from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useVideoAutoplay } from '@/hooks/useVideoAutoplay';
import { Play } from 'lucide-react';
import { GridVideoPreviewProps } from './types';

const GridVideoPreview = ({ 
  src, 
  poster, 
  className = "", 
  videoId 
}: GridVideoPreviewProps) => {
  const { ref: containerRef, isInView } = useIntersectionObserver({
    threshold: 0.5,
    rootMargin: '0px'
  });

  const { videoRef, isPlaying, isLoading, shouldShowPlayIcon } = useVideoAutoplay({
    isInView,
    isHovered: false,
    videoId,
    isGridContext: true
  });

  console.log('GridVideoPreview rendering:', {
    videoId,
    src,
    isInView,
    isPlaying,
    isLoading,
    shouldShowPlayIcon
  });

  return (
    <div 
      ref={containerRef} 
      className={`relative ${className}`}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-cover"
        muted
        loop
        playsInline
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
    </div>
  );
};

export default GridVideoPreview;
