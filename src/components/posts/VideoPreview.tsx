
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
  const isMobile = useIsMobile();
  const { elementRef, isInView } = useIntersectionObserver({ threshold: 0.6 });
  
  // For grid thumbnails: hover autoplay on desktop, random autoplay on mobile
  const { videoRef, isPlaying, isLoading } = useVideoAutoplay({
    isInView: isGridThumbnail && isMobile ? isInView : false,
    isHovered: isGridThumbnail && !isMobile ? isHovered : false,
    videoId
  });

  const handleMouseEnter = () => {
    if (!isMobile && isGridThumbnail) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile && isGridThumbnail) {
      setIsHovered(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isGridThumbnail) {
      // In grid view, clicking should open fullscreen or toggle play
      if (onFullscreen) {
        onFullscreen();
      } else if (videoRef.current) {
        if (videoRef.current.paused) {
          videoRef.current.play().catch(console.error);
        } else {
          videoRef.current.pause();
        }
      }
      return;
    }
    
    // Non-grid context behavior
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(console.error);
      } else {
        videoRef.current.pause();
      }
    }
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
        preload="metadata"
      />

      {/* Loading indicator - only show for non-grid thumbnails */}
      {!isGridThumbnail && isLoading && (
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
        </div>
      )}

      {/* Fullscreen button - only for non-grid contexts */}
      {!isGridThumbnail && (isHovered || isPlaying) && onFullscreen && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFullscreen();
            }}
            className="bg-black/70 text-white p-2 rounded-full hover:bg-black/80 transition-colors shadow-lg"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoPreview;
