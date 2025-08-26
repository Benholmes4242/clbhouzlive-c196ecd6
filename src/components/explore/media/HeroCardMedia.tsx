import React, { memo, useRef } from 'react';
import { useVideoVisibility } from '@/hooks/useVideoVisibility';
import { useGlobalAudio } from '@/hooks/useGlobalAudio';
import FeedVideoPlayer from '@/components/feed/FeedVideoPlayer';
import HighQualityImage from '@/components/ui/high-quality-image';
import { CardMediaProps } from './CardMediaTypes';

/**
 * Hero Card Media Component (4×4 large features, special highlight slots) - mobile view only
 * 
 * Rules:
 * - Content type: Videos only
 * - Behavior: Autoplay on load, muted, looping
 * - Should feel "live" and cinematic—this is a showcase element
 * - Use highest available resolution appropriate for viewport
 * - Fallback: If no video provided, pull in large static image but maintain sizing/aspect ratio
 */
const HeroCardMedia: React.FC<CardMediaProps> = memo(({
  media,
  shouldAutoplay = true,
  onMediaClick,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isGloballyMuted } = useGlobalAudio();
  
  // Use video visibility hook for autoplay management
  const { containerRef, isVisible } = useVideoVisibility({
    threshold: 0.5, // 50% visibility for hero cards (less strict than portrait)
    videoRef,
    shouldAutoplay,
    globallyMuted: true // Always start muted for hero cards
  });

  // If not a video, show fallback image with same sizing
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
        
        {/* Hero overlay gradient for visual appeal */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
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
        preload="auto" // Higher preload for hero cards
      />
      
      {/* Hero overlay gradient for visual appeal */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      
      {/* Cinematic loading indicator */}
      {!isVisible && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted/80 to-muted animate-pulse" />
      )}
      
      {/* Hero badge indicator */}
      <div className="absolute top-3 right-3 bg-primary/20 backdrop-blur-sm px-2 py-1 rounded-full">
        <span className="text-xs font-medium text-primary-foreground">Featured</span>
      </div>
    </div>
  );
});

HeroCardMedia.displayName = 'HeroCardMedia';

export default HeroCardMedia;