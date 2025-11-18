import React, { memo, useRef, useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { useVideoVisibility } from '@/hooks/useVideoVisibility';
import { useExclusiveVideoAudio } from '@/hooks/useExclusiveVideoAudio';
import HLSVideoCard from '@/components/ui/HLSVideoCard';
import HighQualityImage from '@/components/ui/high-quality-image';
import SoundToggle from '@/components/ui/sound-toggle';
import { CardMediaProps } from './CardMediaTypes';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { getCloudflareStreamHLS, getCloudflareStreamPoster } from '@/utils/cloudflareStreamAPI';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isMuted: videoIsMuted, toggleMute: toggleVideoMute } = useExclusiveVideoAudio(`hero-${media.media_url}`);
  
  // State for API-fetched URLs
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);
  const [poster, setPoster] = useState<string | undefined>(undefined);
  
  // Generate initial URLs (fallback) and fetch real ones from API
  const uid = uidFromNode(media);
  
  useEffect(() => {
    if (!uid) return;
    
    // Set fallback URLs immediately
    const fallbackHlsUrl = `https://videodelivery.net/${uid}/manifest/video.m3u8`;
    const fallbackPoster = `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg?height=600`;
    
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
        // Keep fallback URLs if API fails
      }
    };
    
    fetchRealUrls();
  }, [uid]);
  
  // Use video visibility hook for autoplay management with near/play pattern
  const { containerRef, isVisible, isNear } = useVideoVisibility({
    threshold: 0.5, // Play when ≥50% visible
    rootMargin: '300px 0px 300px 0px', // Prebuffer when near
    videoRef,
    shouldAutoplay: false, // We'll handle autoplay logic ourselves
    globallyMuted: true
  });

  // Mobile check for responsive behavior
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 1024px)').matches;

  const shouldAttach = isNear; // Attach on both desktop and mobile
  const shouldAutoPlay = isMobile && isVisible; // Play only on mobile

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
      {/* Only render video if we have a valid HLS URL */}
      {hlsUrl ? (
        <HLSVideoCard
          ref={videoRef}
          hlsUrl={hlsUrl}
          poster={poster}
          className="w-full h-full"
          aspectRatio="auto"
          muted={true}
          loop={true}
          shouldAttach={shouldAttach}
          autoplay={shouldAutoPlay}
          showMuteButton={false}
          externallyManaged={true}
          fit="cover"
        />
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Invalid video source</span>
        </div>
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