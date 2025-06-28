
import React, { useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { useVideoAutoplay } from '@/hooks/useVideoAutoplay';
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
  const [hasError, setHasError] = useState(false);
  const isMobile = useIsMobile();
  const { elementRef, isInView } = useIntersectionObserver({ threshold: 0.6 });
  
  // Detect iOS Safari
  const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  
  // Enhanced logging for video preview
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
  
  // Disable autoplay completely on iOS Safari for grid thumbnails to prevent NotSupportedError
  const shouldAutoplay = isGridThumbnail && !isIOSSafari;
  
  const { videoRef, isPlaying, isLoading } = useVideoAutoplay({
    isInView: shouldAutoplay && isMobile ? isInView : false,
    isHovered: shouldAutoplay && !isMobile ? isHovered : false,
    videoId,
    isGridContext: isGridThumbnail
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
      // In grid view, clicking should open fullscreen or play/pause
      onFullscreen?.();
      return;
    }
    
    // Allow manual control on click in non-grid contexts
    if (videoRef.current && !hasError) {
      try {
        if (videoRef.current.paused) {
          videoRef.current.play().catch(error => {
            console.log('Video play failed (expected on iOS):', error);
            setHasError(true);
          });
        } else {
          videoRef.current.pause();
        }
      } catch (error) {
        console.log('Video control error (expected on iOS):', error);
        setHasError(true);
      }
    }
  };

  const handleVideoError = (event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const error = (event.target as HTMLVideoElement).error;
    console.log('Video error details:', {
      videoId,
      src,
      errorCode: error?.code,
      errorMessage: error?.message,
      isIOSSafari,
      isGridThumbnail
    });
    setHasError(true);
  };

  // Check for invalid video src
  if (!src || src.trim() === '' || typeof src !== 'string') {
    console.log('Invalid video src:', { videoId, src, type: typeof src });
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
        <div className="text-gray-500 text-sm">Invalid video source</div>
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
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-cover"
        muted
        loop
        playsInline
        onClick={handleClick}
        onError={handleVideoError}
        preload="metadata"
        // Add iOS-specific attributes
        webkit-playsinline="true"
        controls={isIOSSafari && isGridThumbnail ? false : undefined}
      />

      {/* Show poster image overlay on iOS Safari for grid thumbnails */}
      {isIOSSafari && isGridThumbnail && poster && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${poster})` }}
        />
      )}

      {/* Error state for videos */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <div className="text-gray-500 text-sm text-center">
            <div>Video Error</div>
            {isIOSSafari && <div className="text-xs mt-1">iOS Safari</div>}
          </div>
        </div>
      )}

      {/* Loading indicator - only show in non-grid contexts */}
      {!isGridThumbnail && isLoading && !hasError && (
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
        </div>
      )}

      {/* Controls overlay - only show enlarge button on hover and not in grid thumbnails */}
      {!isGridThumbnail && (isHovered || isPlaying) && !hasError && (
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
      {!isGridThumbnail && (isHovered || isPlaying) && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}
    </div>
  );
};

export default VideoPreview;
