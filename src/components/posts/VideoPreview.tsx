
import React, { useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useIsMobile } from '@/hooks/use-mobile';

interface VideoPreviewProps {
  src: string;
  poster?: string;
  className?: string;
  onFullscreen?: () => void;
  videoId: string;
  isGridThumbnail?: boolean;
}

const VideoPreview = ({ 
  src, 
  poster, 
  className = "", 
  onFullscreen, 
  videoId, 
  isGridThumbnail = false 
}: VideoPreviewProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);
  const isMobile = useIsMobile();
  const { elementRef } = useIntersectionObserver({ threshold: 0.6 });
  
  // Detect iOS Safari
  const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  
  console.log('VideoPreview rendering:', {
    videoId,
    src,
    poster,
    isGridThumbnail,
    isIOSSafari,
    isMobile,
    hasValidSrc: !!src && src.length > 0,
    srcType: typeof src
  });

  const handleMouseEnter = () => {
    if (!isMobile && isGridThumbnail && !isIOSSafari) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile && isGridThumbnail && !isIOSSafari) {
      setIsHovered(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isGridThumbnail) {
      // In grid view, clicking should open fullscreen
      onFullscreen?.();
      return;
    }
  };

  const handleVideoError = () => {
    console.log('Video error for:', videoId);
    setHasVideoError(true);
  };

  // Check for invalid video src
  if (!src || src.trim() === '' || typeof src !== 'string') {
    console.log('Invalid video src:', { videoId, src, type: typeof src });
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
        <div className="text-gray-500 text-sm">No video</div>
      </div>
    );
  }

  // For iOS Safari in grid thumbnails or when video has error, show a placeholder image
  if ((isIOSSafari && isGridThumbnail) || hasVideoError) {
    const fallbackImage = poster || 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=400&fit=crop&crop=center';
    
    return (
      <div
        ref={elementRef}
        className={`relative cursor-pointer group overflow-hidden bg-gray-200 ${className}`}
        onClick={handleClick}
      >
        <img
          src={fallbackImage}
          alt="Video thumbnail"
          className="w-full h-full object-cover"
          onError={(e) => {
            // If even the fallback image fails, show a simple placeholder
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        
        {/* Video play indicator */}
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
          <div className="w-12 h-12 bg-white bg-opacity-80 rounded-full flex items-center justify-center">
            <div className="w-0 h-0 border-l-4 border-l-gray-800 border-t-2 border-b-2 border-t-transparent border-b-transparent ml-1"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={elementRef}
      className={`relative cursor-pointer group overflow-hidden ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <video
        src={src}
        poster={poster}
        className="w-full h-full object-cover"
        muted
        loop
        playsInline
        onClick={handleClick}
        onError={handleVideoError}
        preload="metadata"
        controls={false}
      />

      {/* Controls overlay - only show enlarge button on hover and not in grid thumbnails */}
      {!isGridThumbnail && isHovered && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFullscreen?.();
            }}
            className="bg-black/70 text-white p-2 rounded-full hover:bg-black/80 transition-colors shadow-lg"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Gradient overlay for better button visibility - only in non-grid contexts */}
      {!isGridThumbnail && isHovered && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}
    </div>
  );
};

export default VideoPreview;
