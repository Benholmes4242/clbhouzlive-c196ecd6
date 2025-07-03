
import React, { useState } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useVideoAutoplay } from '@/hooks/useVideoAutoplay';
import { StandardVideoPreviewProps } from './types';
import VideoControls from './VideoControls';

const StandardVideoPreview = ({ 
  src, 
  poster, 
  className = "", 
  videoId 
}: StandardVideoPreviewProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const { ref: containerRef, isInView } = useIntersectionObserver({
    threshold: 0.5,
    rootMargin: '0px'
  });

  const { videoRef, isPlaying, isLoading } = useVideoAutoplay({
    isInView,
    isHovered,
    videoId,
    isGridContext: false
  });

  // Removed console.log for performance

  const handleVideoClick = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(console.log);
    } else {
      video.pause();
    }
  };

  // Fallback if video autoplay is not available
  if (!videoRef) {
    return (
      <div 
        className={`relative group ${className}`}
        onClick={handleVideoClick}
      >
        <video
          src={src}
          poster={poster}
          className="w-full h-full object-cover cursor-pointer"
          muted
          loop
          playsInline
          preload="none"
        />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleVideoClick}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-cover cursor-pointer"
        muted
        loop
        playsInline
        preload="none"
      />

      <VideoControls
        isPlaying={isPlaying}
        isLoading={isLoading}
        isHovered={isHovered}
        onPlayPause={handleVideoClick}
      />
    </div>
  );
};

export default StandardVideoPreview;
