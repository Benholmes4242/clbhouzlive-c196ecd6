import React, { memo, useRef, useEffect, useState, useCallback } from 'react';
import { Play } from 'lucide-react';
import { useVideoVisibility } from '@/hooks/useVideoVisibility';
import { useExclusiveVideoAudio } from '@/hooks/useExclusiveVideoAudio';
import { HLSPlayer, HLSPlayerRef } from '@/media';
import HighQualityImage from '@/components/ui/high-quality-image';
import SoundToggle from '@/components/ui/sound-toggle';
import { CardMediaProps } from './CardMediaTypes';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { getCloudflareStreamHLS, getCloudflareStreamPoster } from '@/utils/cloudflareStreamAPI';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { cn } from '@/lib/utils';

interface ExtendedCardMediaProps extends CardMediaProps {
  isVideoReady?: boolean;
  onReady?: (id: string) => void;
}

/**
 * Portrait Card Media Component
 * 
 * Rules:
 * - Content type: Videos only
 * - Behavior: Autoplay on load, muted by default, looping continuously
 * - Respect user device/bandwidth settings (pause autoplay on Low Data Mode)
 * - Videos should preload only enough to start smooth playback, then stream
 * - Fallback: If video missing, use static placeholder image
 * 
 * GATING: Uses isVideoReady prop from parent to control visibility.
 * When isVideoReady=false, shows static thumbnail (no spinner).
 * Parent components should gate visibility via ready queue system.
 */
const PortraitCardMedia: React.FC<ExtendedCardMediaProps> = memo(({
  media,
  onMediaClick,
  className = '',
  isVideoReady = true, // Default to true for backward compat
  onReady,
}) => {
  const playerRef = useRef<HLSPlayerRef>(null);
  const hasReportedReadyRef = useRef(false);
  const { isMuted: videoIsMuted, toggleMute: toggleVideoMute } = useExclusiveVideoAudio(`portrait-${media.media_url}`);
  
  // State for API-fetched URLs
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | undefined>(undefined);
  
  // Generate initial URLs (fallback) and fetch real ones from API
  const uid = uidFromNode(media);
  
  // Reset ready state on media change
  useEffect(() => {
    hasReportedReadyRef.current = false;
  }, [media.id]);
  
  useEffect(() => {
    if (!uid) return;
    
    // Set fallback URLs immediately using centralized config
    const fallbackHlsUrl = generateStreamHlsUrl(uid);
    const fallbackPoster = generateStreamThumbnailUrl(uid, { height: 600 });
    
    setHlsUrl(fallbackHlsUrl);
    setPosterUrl(fallbackPoster);
    
    // Fetch real URLs from Cloudflare API in the background
    const fetchRealUrls = async () => {
      try {
        const [realHlsUrl, realPoster] = await Promise.all([
          getCloudflareStreamHLS(uid),
          getCloudflareStreamPoster(uid, { height: 600 })
        ]);
        
        if (realHlsUrl) setHlsUrl(realHlsUrl);
        if (realPoster) setPosterUrl(realPoster);
      } catch (error) {
        console.warn('Failed to fetch real Cloudflare URLs, using fallback:', error);
      }
    };
    
    fetchRealUrls();
  }, [uid]);
  
  // Use video visibility hook for autoplay management with near/play pattern
  const { containerRef, isVisible } = useVideoVisibility({
    threshold: 0.5,
    rootMargin: '300px 0px 300px 0px',
    videoRef: { current: playerRef.current?.getElement() ?? null } as React.RefObject<HTMLVideoElement>,
    shouldAutoplay: false,
    globallyMuted: true
  });

  // Always allow portrait autoplay on desktop + mobile
  const shouldAutoPlay = isVisible;

  // Handle canplaythrough callback
  const handleCanPlayThrough = useCallback(() => {
    if (!hasReportedReadyRef.current && media.media_type === 'video') {
      hasReportedReadyRef.current = true;
      onReady?.(media.id);
    }
  }, [media.id, media.media_type, onReady]);

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
          <div className="rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 w-5 h-5 md:w-7 md:h-7 flex items-center justify-center">
            <Play className="w-3 h-3 md:w-4 md:h-4 text-white ml-0.5" fill="currentColor" />
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
      {/* HLSPlayer - always mounted, opacity controlled by isVideoReady */}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-200",
        isVideoReady ? "opacity-100" : "opacity-0"
      )}>
        {hlsUrl ? (
          <HLSPlayer
            ref={playerRef}
            src={hlsUrl}
            muted
            loop
            autoplay={shouldAutoPlay}
            showMuteButton={false}
            showPlayButton={false}
            objectFit="cover"
            mediaId={uid || media.id}
            className="w-full h-full"
            onCanPlayThrough={handleCanPlayThrough}
            managedByMediaRuntime={true} // Suppress internal spinner
          />
        ) : null}
      </div>
      
      {/* Static thumbnail when not ready - NO SPINNER */}
      {/* Parent components gate visibility via ready queue */}
      {!isVideoReady && posterUrl && (
        <div className="absolute inset-0">
          <HighQualityImage
            src={posterUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {/* Video play icon for autoplaying videos */}
      <div className="absolute bottom-3 right-3 z-20">
        <div className="rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 w-5 h-5 md:w-7 md:h-7 flex items-center justify-center">
          <Play className="w-3 h-3 md:w-4 md:h-4 text-white ml-0.5" fill="currentColor" />
        </div>
      </div>
      
      {/* Mute/Unmute Button - Top Right */}
      <div className="absolute top-3 right-3 z-20">
        <SoundToggle
          isMuted={videoIsMuted}
          onToggle={toggleVideoMute}
          size="sm"
        />
      </div>
    </div>
  );
});

PortraitCardMedia.displayName = 'PortraitCardMedia';

export default PortraitCardMedia;