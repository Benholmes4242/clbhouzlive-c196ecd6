
import React, { useState } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useVideoAutoplay } from '@/hooks/useVideoAutoplay';
import { useThumbnailGenerator } from './ThumbnailGenerator';
import { StandardVideoPreviewProps } from './types';
import VideoControls from './VideoControls';
import { Play } from 'lucide-react';

const StandardVideoPreview = ({ 
  src, 
  poster, 
  className = "", 
  videoId 
}: StandardVideoPreviewProps) => {
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
    isGridContext: false
  });

  const { thumbnailSrc, thumbnailReady } = useThumbnailGenerator(src, videoId, poster);

  const effectiveThumbnail = thumbnailSrc || poster || 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=400&fit=crop&crop=center';

  const handleVideoClick = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(console.log);
    } else {
      video.pause();
    }
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if ((video as any).webkitRequestFullscreen) {
      (video as any).webkitRequestFullscreen();
    } else if ((video as any).msRequestFullscreen) {
      (video as any).msRequestFullscreen();
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleVideoClick}
    >
      {/* Show thumbnail when not playing */}
      {!isPlaying && (
        <img
          src={effectiveThumbnail}
          alt="Video thumbnail"
          className="w-full h-full object-cover cursor-pointer"
          onError={() => setThumbnailError(true)}
        />
      )}

      {/* Show video when playing */}
      {isPlaying && videoRef && (
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-cover cursor-pointer"
          muted
          loop
          playsInline
          onError={() => setThumbnailError(true)}
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
          preload="none"
        />
      )}

      {/* Play icon overlay */}
      {shouldShowPlayIcon && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors">
            <Play className="h-8 w-8 text-white ml-1" />
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Fullscreen button */}
      {isPlaying && (
        <button
          onClick={handleFullscreen}
          className="absolute top-4 right-4 w-10 h-10 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
          title="Fullscreen"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      )}

      {/* Error fallback */}
      {thumbnailError && !isPlaying && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-400">
          <Play className="w-12 h-12 mb-2" />
          <span className="text-sm">Video</span>
        </div>
      )}
    </div>
  );
};

export default StandardVideoPreview;
