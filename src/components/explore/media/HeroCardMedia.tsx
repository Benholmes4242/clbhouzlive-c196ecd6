import React, { memo, useRef } from 'react';
import { Play } from 'lucide-react';
import { useVideoVisibility } from '@/hooks/useVideoVisibility';
import { useExclusiveVideoAudio } from '@/hooks/useExclusiveVideoAudio';
import FeedVideoPlayer, { FeedVideoPlayerRef } from '@/components/feed/FeedVideoPlayer';
import HighQualityImage from '@/components/ui/high-quality-image';
import SoundToggle from '@/components/ui/sound-toggle';
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
  className = '',
  showFeaturedBadge = true
}) => {
  const videoRef = useRef<FeedVideoPlayerRef>(null);
  const { isMuted: videoIsMuted, toggleMute: toggleVideoMute } = useExclusiveVideoAudio(`hero-${media.media_url}`);
  
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
      {/* Only render video if we have a valid URL */}
      {media.media_url && (media.media_url.startsWith('http') || media.media_url.startsWith('/')) ? (
        <FeedVideoPlayer
          ref={videoRef}
          src={media.media_url}
          className="w-full h-full object-cover"
          muted={videoIsMuted}
          loop={true}
          playsInline={true}
          preload="auto" // Higher preload for hero cards
        />
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Invalid video source</span>
        </div>
      )}
      
      {/* Hero overlay gradient for visual appeal */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      
      
      
      {/* Mute/Unmute Button - Top Right */}
      <div className="absolute top-3 right-3 z-20">
        <SoundToggle
          isMuted={videoIsMuted}
          onToggle={toggleVideoMute}
          size="sm"
        />
      </div>
      
      {/* Hero badge indicator */}
      {showFeaturedBadge && (
        <div className="absolute top-3 left-3 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
          <span className="text-base font-medium text-white">Featured</span>
        </div>
      )}
    </div>
  );
});

HeroCardMedia.displayName = 'HeroCardMedia';

export default HeroCardMedia;