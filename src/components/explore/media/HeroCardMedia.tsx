import React, { memo, useRef, useEffect, useState, useCallback } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { useVideoVisibility } from '@/hooks/useVideoVisibility';
import { useExclusiveVideoAudio } from '@/hooks/useExclusiveVideoAudio';
import { HLSPlayer, HLSPlayerRef } from '@/media';
import HighQualityImage from '@/components/ui/high-quality-image';
import SoundToggle from '@/components/ui/sound-toggle';
import { CardMediaProps } from './CardMediaTypes';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { getCloudflareStreamHLS, getCloudflareStreamPoster } from '@/utils/cloudflareStreamAPI';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { cn } from '@/lib/utils';

interface ExtendedCardMediaProps extends CardMediaProps {
  isVideoReady?: boolean;
  onReady?: (id: string) => void;
}

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
const HeroCardMedia: React.FC<ExtendedCardMediaProps> = memo(({
  media,
  shouldAutoplay = true,
  onMediaClick,
  className = '',
  showFeaturedBadge = true,
  isVideoReady = false,
  onReady,
}) => {
  const playerRef = useRef<HLSPlayerRef>(null);
  const hasReportedReadyRef = useRef(false);
  const { isMuted: videoIsMuted, toggleMute: toggleVideoMute } = useExclusiveVideoAudio(`hero-${media.media_url}`);
  
  // State for API-fetched URLs
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);
  const [poster, setPoster] = useState<string | undefined>(undefined);
  
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
    setPoster(fallbackPoster);
    
    // Fetch real URLs from Cloudflare API in the background
    const fetchRealUrls = async () => {
      try {
        const [realHlsUrl, realPoster] = await Promise.all([
          getCloudflareStreamHLS(uid),
          getCloudflareStreamPoster(uid, { height: 600 })
        ]);
        
        if (realHlsUrl) setHlsUrl(realHlsUrl);
        if (realPoster) setPoster(realPoster);
      } catch (error) {
        console.warn('Failed to fetch real Cloudflare URLs, using fallback:', error);
      }
    };
    
    fetchRealUrls();
  }, [uid]);
  
  // Use video visibility hook for autoplay management with near/play pattern
  const { containerRef, isVisible, isNear } = useVideoVisibility({
    threshold: 0.5,
    rootMargin: '300px 0px 300px 0px',
    videoRef: { current: playerRef.current?.getElement() ?? null } as React.RefObject<HTMLVideoElement>,
    shouldAutoplay: false,
    globallyMuted: true
  });

  // Mobile check for responsive behavior
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 1024px)').matches;

  const shouldAttach = isNear; // Attach on both desktop and mobile
  const shouldAutoPlay = isMobile && isVisible; // Play only on mobile

  // Handle canplaythrough callback
  const handleCanPlayThrough = useCallback(() => {
    if (!hasReportedReadyRef.current && media.media_type === 'video') {
      hasReportedReadyRef.current = true;
      onReady?.(media.id);
    }
  }, [media.id, media.media_type, onReady]);

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
      {/* HLSPlayer - always mounted, opacity controlled by isVideoReady */}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-200",
        isVideoReady ? "opacity-100" : "opacity-0"
      )}>
        {hlsUrl ? (
          <HLSPlayer
            ref={playerRef}
            src={hlsUrl}
            posterUrl={poster}
            muted
            loop
            autoplay={shouldAutoPlay}
            showMuteButton={false}
            showPlayButton={false}
            objectFit="cover"
            mediaId={uid || media.id}
            className="w-full h-full"
            onCanPlayThrough={handleCanPlayThrough}
          />
        ) : null}
      </div>
      
      {/* Skeleton until video is ready */}
      {!isVideoReady && (
        <div className="absolute inset-0 bg-zinc-800 animate-pulse flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
        </div>
      )}
      
      {/* Text overlays from studio_edits */}
      {(media as any).studio_edits?.textOverlays?.length > 0 && (
        <TextOverlayRenderer
          textOverlays={(media as any).studio_edits.textOverlays}
          isEditable={false}
        />
      )}
      
      {/* Hero overlay gradient for visual appeal */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      
      {/* Video play icon for hero videos */}
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
      
      {/* Hero badge indicator — matches Explore "Featured" pill (angled, dark blur) */}
      {showFeaturedBadge && (
        <div className="absolute top-3 left-3 z-20">
          <span
            style={{
              display: 'inline-block',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#FFFFFF',
              background: 'rgba(0, 0, 0, 0.28)',
              backdropFilter: 'blur(22px) saturate(180%)',
              WebkitBackdropFilter: 'blur(22px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
              padding: '4px 10px',
              borderRadius: 4,
              transform: 'rotate(-6deg)',
              transformOrigin: 'left center',
            }}
          >
            Featured
          </span>
        </div>
      )}
    </div>
  );
});

HeroCardMedia.displayName = 'HeroCardMedia';

export default HeroCardMedia;