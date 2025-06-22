
import React, { useState } from 'react';
import { Play, Maximize2 } from 'lucide-react';
import { useVideoAutoplay } from '@/hooks/useVideoAutoplay';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useIsMobile } from '@/hooks/use-mobile';

interface VideoPreviewProps {
  src: string;
  poster?: string;
  className?: string;
  onFullscreen?: () => void;
  videoId: string;
}

const VideoPreview = ({ src, poster, className = "", onFullscreen, videoId }: VideoPreviewProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const isMobile = useIsMobile();
  const { elementRef, isInView } = useIntersectionObserver({ threshold: 0.6 });
  
  const { videoRef, isPlaying, isLoading } = useVideoAutoplay({
    isInView: isMobile ? isInView : false,
    isHovered: !isMobile ? isHovered : false,
    videoId
  });

  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsHovered(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Allow manual control on click
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(console.error);
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFullscreen?.();
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

      {/* Play button overlay - shows when not playing */}
      {!isPlaying && !isLoading && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity">
          <div className="bg-white/90 rounded-full p-3 group-hover:scale-110 transition-transform shadow-lg">
            <Play className="h-6 w-6 text-green-600 fill-current ml-0.5" />
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
        </div>
      )}

      {/* Controls overlay */}
      {(isHovered || isPlaying) && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleFullscreen}
            className="bg-black/70 text-white p-2 rounded-full hover:bg-black/80 transition-colors shadow-lg"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Gradient overlay for better button visibility */}
      {(isHovered || isPlaying) && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}
    </div>
  );
};

export default VideoPreview;
