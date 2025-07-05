
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
  const [thumbnailError, setThumbnailError] = useState(false);
  
  const { ref: containerRef, isInView } = useIntersectionObserver({
    threshold: 0.5,
    rootMargin: '0px'
  });

  const { videoRef, isPlaying, isLoading, shouldShowPlayIcon } = useVideoAutoplay({
    isInView,
    isHovered: true, // Always true to prevent hover issues
    videoId,
    isGridContext: true
  });

  const { thumbnailSrc, thumbnailReady } = useThumbnailGenerator(src, videoId, poster);

  const effectiveThumbnail = thumbnailSrc || poster || 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=400&fit=crop&crop=center';

  return (
    <div 
      ref={containerRef} 
      className={`relative ${className}`}
    >
      {/* Show thumbnail image when not playing */}
      {!isPlaying && (
        <img
          src={effectiveThumbnail}
          alt="Video thumbnail"
          className="w-full h-full object-cover rounded-[inherit]"
          onError={() => setThumbnailError(true)}
        />
      )}

      {/* Show video when playing */}
      {isPlaying && videoRef && (
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-cover rounded-[inherit]"
          muted
          loop
          playsInline
          crossOrigin="anonymous"
          onError={(e) => {
            console.error('Grid video playback error:', e, 'src:', src);
            setThumbnailError(true);
          }}
          onLoadStart={() => console.log('Grid video load started:', src)}
          onCanPlay={() => console.log('Grid video can play:', src)}
          onPlay={() => console.log('Grid video playing:', src)}
        />
      )}

      {/* Hidden video ref for autoplay management */}
      {!isPlaying && videoRef && (
        <video
          ref={videoRef}
          src={src}
          className="hidden"
          muted
          loop
          playsInline
          crossOrigin="anonymous"
          preload="metadata"
          onError={(e) => console.error('Hidden grid video error:', e, 'src:', src)}
          onLoadedMetadata={() => console.log('Grid video metadata loaded:', src)}
        />
      )}

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
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
