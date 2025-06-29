
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

  console.log('StandardVideoPreview rendering:', {
    videoId,
    src,
    isInView,
    isHovered,
    isPlaying,
    isLoading
  });

  const handleVideoClick = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(console.log);
    } else {
      video.pause();
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
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-cover cursor-pointer"
        muted
        loop
        playsInline
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
