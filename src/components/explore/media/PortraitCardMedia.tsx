import React, { memo, useRef } from 'react';
import { MdOutlinePlayCircle } from 'react-icons/md';
import { useVideoVisibility } from '@/hooks/useVideoVisibility';
import { useGlobalAudio } from '@/hooks/useGlobalAudio';
import FeedVideoPlayer from '@/components/feed/FeedVideoPlayer';
import HighQualityImage from '@/components/ui/high-quality-image';
import { CardMediaProps } from './CardMediaTypes';

/**
 * Portrait Card Media Component
 * 
 * Rules:
 * - Content type: Videos only
 * - Behavior: Autoplay on load, muted by default, looping continuously
 * - Respect user device/bandwidth settings (pause autoplay on Low Data Mode)
 * - Videos should preload only enough to start smooth playback, then stream
 * - Fallback: If video missing, use static placeholder image
 */
const PortraitCardMedia: React.FC<CardMediaProps> = memo(({
  media,
  shouldAutoplay = true,
  onMediaClick,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isGloballyMuted } = useGlobalAudio();
  
  // Use video visibility hook for autoplay management
  const { containerRef, isVisible } = useVideoVisibility({
    threshold: 0.7, // 70% visibility required for autoplay
    videoRef,
    shouldAutoplay,
    globallyMuted: true // Always start muted for portrait cards
  });

  // If not a video, show fallback image
  if (media.media_type !== 'video') {
    return (
      <div 
        ref={containerRef}
        className={`relative w-full h-full overflow-hidden cursor-pointer ${className}`}
        onClick={onMediaClick}
      >
        <HighQualityImage
          src={media.media_url}
          alt="Media content"
          className="w-full h-full object-cover"
        />
        
        {/* Play icon for non-video fallback images */}
        <div className="absolute bottom-3 right-3 z-20">
          <MdOutlinePlayCircle className="w-6 h-6 text-white drop-shadow-lg" />
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden cursor-pointer ${className}`}
      onClick={onMediaClick}
    >
      <FeedVideoPlayer
        ref={videoRef}
        src={media.media_url}
        className="w-full h-full object-cover"
        muted={true}
        loop={true}
        playsInline={true}
        preload="metadata"
      />
      
      {/* Subtle loading indicator */}
      {!isVisible && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      
      {/* Video play icon for autoplaying videos */}
      <div className="absolute bottom-3 right-3 z-20">
        <MdOutlinePlayCircle className="w-6 h-6 text-white drop-shadow-lg" />
      </div>
    </div>
  );
});

PortraitCardMedia.displayName = 'PortraitCardMedia';

export default PortraitCardMedia;