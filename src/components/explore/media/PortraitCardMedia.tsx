import React, { memo, useRef, useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { useOptimizedVideoAutoplay } from '@/hooks/useOptimizedVideoAutoplay';
import { useExclusiveVideoAudio } from '@/hooks/useExclusiveVideoAudio';
import HLSVideoCard from '@/components/ui/HLSVideoCard';
import HighQualityImage from '@/components/ui/high-quality-image';
import SoundToggle from '@/components/ui/sound-toggle';
import { CardMediaProps } from './CardMediaTypes';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { getCloudflareStreamHLS, getCloudflareStreamPoster } from '@/utils/cloudflareStreamAPI';

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
  const { isMuted: videoIsMuted, toggleMute: toggleVideoMute } = useExclusiveVideoAudio(`portrait-${media.media_url}`);
  
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
  
  // Use optimized autoplay hook for 50% visibility requirement
  const { containerRef, isInView } = useOptimizedVideoAutoplay({
    threshold: 0.5,
    videoRef,
    enabled: shouldAutoplay,
    loop: true
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
      {/* Only render video if we have a valid HLS URL */}
      {hlsUrl ? (
        <HLSVideoCard
          hlsUrl={hlsUrl}
          poster={poster}
          className="w-full h-full"
          aspectRatio="auto"
          muted={videoIsMuted}
          loop={true}
          autoplay={shouldAutoplay}
          showMuteButton={false}
        />
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Invalid video source</span>
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