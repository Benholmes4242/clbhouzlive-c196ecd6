
import React, { useState } from 'react';
import { useVideoAutoplay } from '@/hooks/useVideoAutoplay';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useIsMobile } from '@/hooks/use-mobile';
import { useThumbnailGenerator } from './ThumbnailGenerator';
import VideoControls from './VideoControls';
import { VideoPreviewProps } from './types';
import { thumbnailCache } from './thumbnailCache';

const StandardVideoPreview = ({ 
  src, 
  poster, 
  className = "", 
  onFullscreen, 
  videoId 
}: Omit<VideoPreviewProps, 'isGridThumbnail'>) => {
  const [isHovered, setIsHovered] = useState(false);
  const isMobile = useIsMobile();
  const { elementRef, isInView } = useIntersectionObserver({ threshold: 0.8 });
  const { thumbnailSrc, thumbnailReady } = useThumbnailGenerator(src, videoId, poster);
  
  const { videoRef, isPlaying } = useVideoAutoplay({
    isInView,
    isHovered,
    videoId,
    isGridContext: false
  });
  
  // Detect iOS Safari
  const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  const handleMouseEnter = () => {
    if (!isMobile && !isIOSSafari) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile && !isIOSSafari) {
      setIsHovered(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleVideoError = () => {
    console.log('Video error for:', videoId);
  };

  return (
    <div
      ref={elementRef}
      className={`relative cursor-pointer group overflow-hidden ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Base layer - always show something */}
      <div className="w-full h-full bg-gray-900 absolute inset-0">
        {/* Show thumbnail if available */}
        {thumbnailSrc ? (
          <img
            src={thumbnailSrc}
            alt="Video thumbnail"
            className="w-full h-full object-cover"
          />
        ) : poster ? (
          <img
            src={poster}
            alt="Video thumbnail"
            className="w-full h-full object-cover"
          />
        ) : (
          // Fallback - show first frame of video
          <video
            src={src}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
            onLoadedData={(e) => {
              const video = e.target as HTMLVideoElement;
              if (video.videoWidth > 0 && video.videoHeight > 0 && !thumbnailSrc) {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
                  ctx.drawImage(video, 0, 0);
                  const dataURL = canvas.toDataURL('image/jpeg', 0.8);
                  thumbnailCache.set(videoId, dataURL);
                }
              }
            }}
            onError={handleVideoError}
          />
        )}
      </div>

      {/* Video overlay for autoplay */}
      {isPlaying && (
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-cover absolute inset-0 z-10"
          muted
          loop
          playsInline
          onClick={handleClick}
          onError={handleVideoError}
          preload="metadata"
          controls={false}
        />
      )}

      <VideoControls 
        isHovered={isHovered}
        isGridThumbnail={false}
        onFullscreen={onFullscreen}
      />
    </div>
  );
};

export default StandardVideoPreview;
