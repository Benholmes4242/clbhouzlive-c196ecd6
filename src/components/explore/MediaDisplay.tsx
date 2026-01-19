import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import SmartMediaContainer from '@/components/ui/smart-media-container';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import SoundToggle from '@/components/ui/sound-toggle';
import { Play } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { useExclusiveVideoAudio } from '@/hooks/useExclusiveVideoAudio';
import { useDiscoverMediaPreview } from '@/hooks/useDiscoverMediaPreview';
import HighQualityImage from '@/components/ui/high-quality-image';
import SmartCardMedia from './media/SmartCardMedia';
import { CardType } from './media/CardMediaTypes';
import { generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import CreatorOverlay from '@/components/discover/CreatorOverlay';
import { devlog } from '@/utils/log';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';
import { TextOverlay } from '@/types/studio';
import { getFilterClass } from '@/utils/studioFilters';
import { cn } from '@/lib/utils';

import { MediaItem } from '@/types/media';

interface LocalMediaItem {
  id: string;
  media_type: 'video' | 'image';
  media_url: string;
}

interface StudioEdits {
  filter?: string;
  textOverlays?: TextOverlay[];
  music?: any;
  audioMode?: string;
}

interface MediaDisplayProps {
  media: LocalMediaItem;
  itemTitle?: string;
  shouldAutoplay: boolean;
  isLoading?: boolean;
  onImageError: () => void;
  onImageLoad: () => void;
  onLoaded?: () => void; // New unified callback for when media is ready
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
  // Stage context for CSS specificity
  stage?: 'grid' | 'fullscreen' | 'vertical-feed';
  // Above the fold optimization
  isAboveTheFold?: boolean;
  // Discover page specific props
  user?: {
    id: string;
    name: string;
    username?: string;
    avatar: string;
    verified?: boolean;
  };
  isDiscoverPage?: boolean;
  onCreatorClick?: (e: React.MouseEvent) => void;
  // Video ref callback for media autoplay registration
  videoRefCallback?: (el: HTMLVideoElement | null) => void;
  // Studio edits for text overlays, filters, etc.
  studioEdits?: StudioEdits;
}

const MediaDisplay: React.FC<MediaDisplayProps> = ({
  media,
  itemTitle,
  shouldAutoplay,
  isLoading = false,
  onImageError,
  onImageLoad,
  onLoaded,
  itemId,
  currentIndex,
  loop = false,
  muted = true,
  hidePlayButton = false,
  cardType,
  useSmartMedia = false,
  onMediaClick,
  showFeaturedBadge = true,
  stage = 'grid',
  isAboveTheFold = false,
  user,
  isDiscoverPage = false,
  onCreatorClick,
  videoRefCallback,
  studioEdits,
}) => {
  // ✅ CRITICAL: Call ALL hooks unconditionally at the top to prevent hook order mismatch
  // Audio management: exclusive video audio hook - ensures only one video plays audio at a time
  const { isMuted: videoIsMuted, toggleMute: toggleVideoMute } = useExclusiveVideoAudio(itemId);
  
  // Use discover media preview for hover/long-press interactions
  const isVideo = media.media_type === 'video';
  const discoverPreview = useDiscoverMediaPreview({
    itemId,
    mediaType: media.media_type,
    isVideo
  });
  
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
    devlog('[MediaDisplay] handleImageLoad called', {
      itemId: itemId.substring(0, 8),
      src: media.media_url,
      type: media.media_type
    });
    setImageLoading(false);
    setMediaLoaded(true);
    onImageLoadRef.current();
  }, []); // No dependencies to prevent re-creation

  const handleImageError = useCallback(() => {
    devlog('[MediaDisplay] handleImageError called', {
      itemId: itemId.substring(0, 8),
      src: media.media_url,
      type: media.media_type
    });
    setImageLoading(false);
    setMediaLoaded(true);
    onImageErrorRef.current();
  }, []); // No dependencies to prevent re-creation
  
  // DEBUG: Log mount/unmount
  useEffect(() => {
    devlog('[MediaDisplay] Component mounted', {
      itemId: itemId.substring(0, 8),
      src: media.media_url,
      type: media.media_type,
      isLoading,
      cardType,
      useSmartMedia
    });
    
    return () => {
      devlog('[MediaDisplay] Component unmounted', itemId.substring(0, 8));
    };
  }, []);

  // ✅ Now safe to use conditional rendering - all hooks are called above
  // Use smart media logic if enabled
  if (useSmartMedia && cardType) {
    return (
      <div 
        className="relative h-full w-full"
        {...(isDiscoverPage && isVideo ? discoverPreview : {})}
      >
        <SmartCardMedia
          media={{
            ...media,
            thumbnail_url: thumbnailUrl || undefined,
            poster_url: thumbnailUrl || undefined
          }}
          cardType={cardType}
          shouldAutoplay={isDiscoverPage ? discoverPreview.shouldAutoplay : shouldAutoplay}
          onMediaClick={onMediaClick}
          onLoaded={onLoaded}
          className="w-full h-full"
          showFeaturedBadge={showFeaturedBadge}
          isAboveTheFold={isAboveTheFold}
        />
        
        {/* Creator overlay for Discover page */}
        {isDiscoverPage && user && (
          <CreatorOverlay user={user} onCreatorClick={onCreatorClick} />
        )}
      </div>
    );
  }
  
  // Fallback image for broken/missing images
  const fallbackImage = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=400&fit=crop&crop=center';

  // Apply stage-specific CSS data attribute and fit class
  const stageDataAttr = stage === 'grid' ? 'grid' : stage;
  const fitClass = stage === 'grid' ? '!object-cover' : 'object-contain';

  // Compute filter class - prefer filter_id, fallback to studioEdits.filter
  const filterId = (media as any)?.filter_id ?? studioEdits?.filter ?? null;
  const filterClass = getFilterClass(filterId);

  // Apply loading-gated background color
  const wrapperClass = `relative w-full h-full overflow-hidden ${isLoading ? 'bg-muted' : 'bg-transparent'}`;

  return (
    <div className={wrapperClass} data-stage={stageDataAttr}>
      {/* Loading Skeleton - lightweight placeholder for off-screen images */}
      {(!isAboveTheFold && media.media_type === 'image' && (isLoading || imageLoading)) && (
        <div className="absolute inset-0 bg-muted z-0" />
      )}
      
      {media.media_type === 'video' && !isInvalidSrc ? (
        (() => {
          // Determine if should autoplay based on context
          const effectiveShouldAutoplay = isDiscoverPage ? discoverPreview.shouldAutoplay : shouldAutoplay;
          const effectiveMuted = isDiscoverPage ? discoverPreview.shouldMute : videoIsMuted;
          
          return effectiveShouldAutoplay ? (
            <div 
              className="relative w-full h-full"
              {...(isDiscoverPage ? discoverPreview : {})}
            >
              {/* Filtered pixel layer */}
              <div className={cn("w-full h-full", filterClass)}>
                <EnhancedVideoPlayer
                  ref={videoRefCallback}
                  src={media.media_url}
                  autoplay={true}
                  muted={effectiveMuted}
                  loop={loop}
                  className={`w-full h-full pointer-events-none ${fitClass}`}
                  enableHLS={true}
                />
              </div>
              
              {/* Sound Toggle for autoplaying videos - only show if not in Discover preview mode */}
              {!isDiscoverPage && (
                <div className="absolute top-3 right-3 z-30">
                  <SoundToggle
                    isMuted={videoIsMuted}
                    onToggle={toggleVideoMute}
                    size="sm"
                    className="rounded-full w-6 h-6 md:w-8 md:h-8"
                  />
                </div>
              )}
              
              {/* Creator overlay for Discover page */}
              {isDiscoverPage && user && (
                <CreatorOverlay user={user} onCreatorClick={onCreatorClick} />
              )}
            </div>
        ) : (
          /* Video thumbnail - ALWAYS use static poster in grid, defer HLS until click */
          <div 
            className="relative w-full h-full"
            {...(isDiscoverPage ? discoverPreview : {})}
          >
            {/* Video thumbnail loading placeholder - lightweight for off-screen items */}
            {!isAboveTheFold && !mediaLoaded && (
              <div className="absolute inset-0 bg-muted z-0" />
            )}
            
            {/* Filtered pixel layer */}
            <div className={cn("w-full h-full", filterClass)}>
              {hasCloudflareThumb ? (
                 <HighQualityImage
                   src={thumbnailUrl}
                   alt={itemTitle || 'Video thumbnail'}
                    className={`w-full h-full ${fitClass}`}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                   width={1200}
                   height={1600}
                   isAboveTheFold={isAboveTheFold}
                 />
              ) : (
                /* For non-Cloudflare videos, show video element with preload="metadata" to display first frame */
                <video
                  src={media.media_url}
                  className={`w-full h-full videoEl ${fitClass} transition-opacity duration-200 ${
                    mediaLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  preload="metadata"
                  muted
                  onLoadedMetadata={() => {
                    setMediaLoaded(true);
                    handleImageLoad(); // This now calls onLoaded
                  }}
                  onError={() => {
                    setMediaLoaded(true);
                    handleImageError(); // This now calls onLoaded
                  }}
                />
              )}
            </div>
            
            {/* Play icon for non-autoplaying videos */}
            {!hidePlayButton && (
              <div className="absolute bottom-3 right-3 z-20">
                <div className="rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 w-6 h-6 md:w-8 md:h-8 flex items-center justify-center">
                  <Play className="h-3 w-3 md:h-4 md:w-4 text-white ml-0.5" fill="currentColor" />
                </div>
              </div>
            )}
            
            {/* Creator overlay for Discover page */}
            {isDiscoverPage && user && (
              <CreatorOverlay user={user} onCreatorClick={onCreatorClick} />
            )}
          </div>
        );
        })()
      ) : (
        /* Image display with high quality optimization */
        <div className="relative w-full h-full">
          {/* Filtered pixel layer */}
          <div className={cn("w-full h-full", filterClass)}>
            <HighQualityImage
              src={media.media_url}
              alt={itemTitle || 'Photo'}
              className={`w-full h-full ${fitClass}`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              width={1200}
              height={1600}
              isAboveTheFold={isAboveTheFold}
            />
          </div>
          
          {/* Creator overlay for Discover page */}
          {isDiscoverPage && user && (
            <CreatorOverlay user={user} onCreatorClick={onCreatorClick} />
          )}
        </div>
      )}
      
      {/* Text overlays from studio edits */}
      {studioEdits?.textOverlays && studioEdits.textOverlays.length > 0 && (
        <TextOverlayRenderer
          textOverlays={studioEdits.textOverlays}
          isEditable={false}
        />
      )}
    </div>
  );
};

export default React.memo(MediaDisplay);