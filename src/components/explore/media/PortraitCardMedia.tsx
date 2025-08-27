import React, { memo, useRef } from 'react';
import { IoPlayOutline } from 'react-icons/io5';
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
          <div className="rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 w-6 h-6 md:w-8 md:h-8 flex items-center justify-center">
            <IoPlayOutline className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
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
      {/* Only render video if we have a valid URL */}
      {media.media_url && (media.media_url.startsWith('http') || media.media_url.startsWith('/')) ? (
        <FeedVideoPlayer
          ref={videoRef}
          src={media.media_url}
          className="w-full h-full object-cover"
          muted={true}
          loop={true}
          playsInline={true}
          preload="metadata"
        />
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Invalid video source</span>
        </div>
      )}
      
      
      {/* Video play icon for autoplaying videos */}
      <div className="absolute bottom-3 right-3 z-20">
        <div className="rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 w-6 h-6 md:w-8 md:h-8 flex items-center justify-center">
          <IoPlayOutline className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </div>
      </div>
      
      {/* Mute/Unmute Button - Top Right */}
      <div className="absolute top-3 right-3 z-20">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            // Add mute toggle functionality here
          }}
          className="p-2 bg-white/10 backdrop-blur-sm rounded-full transition-all duration-200 hover:bg-white/20"
        >
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        </button>
      </div>
    </div>
  );
});

PortraitCardMedia.displayName = 'PortraitCardMedia';

export default PortraitCardMedia;