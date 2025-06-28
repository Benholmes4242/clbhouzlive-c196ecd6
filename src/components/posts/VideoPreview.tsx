
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

  const handleVideoError = () => {
    console.log('Video error for:', videoId);
    setHasError(true);
  };

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
