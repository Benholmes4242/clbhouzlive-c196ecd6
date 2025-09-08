import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import SmartMediaContainer from '@/components/ui/smart-media-container';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import SoundToggle from '@/components/ui/sound-toggle';
import { Play } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { useExclusiveVideoAudio } from '@/hooks/useExclusiveVideoAudio';
import HighQualityImage from '@/components/ui/high-quality-image';
import SmartCardMedia from './media/SmartCardMedia';
import { CardType } from './media/CardMediaTypes';
import { generateStreamThumbnailUrl } from '@/config/cloudflareStream';

interface MediaItem {
  id: string;
  media_type: 'video' | 'image';
  media_url: string;
}

interface MediaDisplayProps {
  media: MediaItem;
  itemTitle?: string;
  shouldAutoplay: boolean;
  isLoading: boolean;
  onImageError: () => void;
  onImageLoad: () => void;
  itemId: string;
  currentIndex: number;
  loop?: boolean;
  muted?: boolean;
  hidePlayButton?: boolean;
  // New props for smart media handling
  cardType?: CardType;
  useSmartMedia?: boolean;
  onMediaClick?: () => void;
  showFeaturedBadge?: boolean;
}

const MediaDisplay: React.FC<MediaDisplayProps> = ({
  media,
  itemTitle,
  shouldAutoplay,
  isLoading,
  onImageError,
  onImageLoad,
  itemId,
  currentIndex,
  loop = false,
  muted = true,
  hidePlayButton = false,
  cardType,
  useSmartMedia = false,
  onMediaClick,
  showFeaturedBadge = true
}) => {
  // ✅ CRITICAL: Call ALL hooks unconditionally at the top to prevent hook order mismatch
  // Audio management: exclusive video audio hook - ensures only one video plays audio at a time
  const { isMuted: videoIsMuted, toggleMute: toggleVideoMute } = useExclusiveVideoAudio(itemId);
  
  // Image loading state
  const [imageLoading, setImageLoading] = useState(true);
  const [mediaLoaded, setMediaLoaded] = useState(false);

  // Memoized thumbnail URL generation for performance
  const thumbnailUrl = useMemo(() => {
    if (media.media_type !== 'video') return null;
    
    const { media_url } = media;
    if (media_url.includes('cloudflarestream.com') && media_url.includes('/manifest/video.m3u8')) {
      const match = media_url.match(/\/([a-f0-9]+)\/manifest\/video\.m3u8/);
      if (match) {
        return generateStreamThumbnailUrl(match[1]);
      }
    }
    return null;
  }, [media.media_url, media.media_type]);

  // Memoized validation for invalid src
  const isInvalidSrc = useMemo(() => 
    !media.media_url || 
    media.media_url.trim() === '' || 
    media.media_url === 'null' || 
    media.media_url === 'undefined' ||
    media.media_url === '[object Object]' ||
    typeof media.media_url !== 'string'
  , [media.media_url]);

  const hasCloudflareThumb = thumbnailUrl !== null;

  // Use refs to store latest callbacks to avoid stale closures
  const onImageLoadRef = useRef(onImageLoad);
  const onImageErrorRef = useRef(onImageError);

  // Update refs when props change
  useEffect(() => {
    onImageLoadRef.current = onImageLoad;
    onImageErrorRef.current = onImageError;
  }, [onImageLoad, onImageError]);

  // Stable event handlers that don't cause re-renders
  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
    setMediaLoaded(true);
    onImageLoadRef.current();
  }, []); // No dependencies to prevent re-creation

  const handleImageError = useCallback(() => {
    setImageLoading(false);
    setMediaLoaded(true);
    onImageErrorRef.current();
  }, []); // No dependencies to prevent re-creation

  // ✅ Now safe to use conditional rendering - all hooks are called above
  // Use smart media logic if enabled
  if (useSmartMedia && cardType) {
    return (
      <SmartCardMedia
        media={{
          ...media,
          thumbnail_url: thumbnailUrl || undefined,
          poster_url: thumbnailUrl || undefined
        }}
        cardType={cardType}
        shouldAutoplay={shouldAutoplay}
        onMediaClick={onMediaClick}
        className="w-full h-full"
        showFeaturedBadge={showFeaturedBadge}
      />
    );
  }
  
  // Fallback image for broken/missing images
  const fallbackImage = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=400&fit=crop&crop=center';

  return (
    <div className="relative w-full h-full overflow-hidden bg-muted">
      {/* Loading Skeleton - only show for images */}
      {(media.media_type === 'image' && (isLoading || imageLoading)) && (
        <div className="absolute inset-0 bg-muted/20 flex items-center justify-center z-10">
          <div className="w-8 h-8 border border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin"></div>
        </div>
      )}
      
      {media.media_type === 'video' && !isInvalidSrc ? (
        shouldAutoplay ? (
          <div className="relative w-full h-full">
            <EnhancedVideoPlayer
              src={media.media_url}
              poster={thumbnailUrl || undefined}
              autoplay={shouldAutoplay}
              muted={videoIsMuted} // Use exclusive video audio state
              loop={loop}
              className="w-full h-full pointer-events-none"
              enableHLS={true}
            />
            
            {/* Sound Toggle for autoplaying videos */}
            <div className="absolute top-3 right-3 z-30">
              <SoundToggle
                isMuted={videoIsMuted}
                onToggle={toggleVideoMute}
                size="sm"
                className="rounded-full w-6 h-6 md:w-8 md:h-8"
              />
            </div>
          </div>
        ) : (
          /* Video thumbnail - use Cloudflare thumbnail or video element with first frame */
          <div className="relative w-full h-full">
            {hasCloudflareThumb ? (
               <HighQualityImage
                 src={thumbnailUrl}
                 alt={itemTitle || 'Video thumbnail'}
                 className="w-full h-full object-cover"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                 width={1200}
                 height={1600}
               />
            ) : (
              /* For non-Cloudflare videos, show video element with preload="metadata" to display first frame */
              <video
                src={media.media_url}
                className="w-full h-full object-cover"
                preload="metadata"
                muted
                onLoadedMetadata={handleImageLoad}
                onError={handleImageError}
              />
            )}
            
            {/* Play icon for non-autoplaying videos */}
            {!hidePlayButton && (
              <div className="absolute bottom-3 right-3 z-20">
                <div className="rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 w-6 h-6 md:w-8 md:h-8 flex items-center justify-center">
                  <Play className="h-3 w-3 md:h-4 md:w-4 text-white ml-0.5" fill="currentColor" />
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        <div className="relative w-full h-full">
           <HighQualityImage
             src={isInvalidSrc ? fallbackImage : (media.media_type === 'video' ? (thumbnailUrl || fallbackImage) : media.media_url)}
             alt={itemTitle || 'Content'}
             className="w-full h-full object-cover"
              onLoad={handleImageLoad}
              onError={handleImageError}
             width={1200}
             height={1600}
           />
        </div>
      )}
    </div>
  );
};

export default React.memo(MediaDisplay);