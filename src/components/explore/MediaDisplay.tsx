import React, { useState } from 'react';
import SmartMediaContainer from '@/components/ui/smart-media-container';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import SoundToggle from '@/components/ui/sound-toggle';
import { MdOutlinePlayCircle } from 'react-icons/md';
import { Loader2 } from 'lucide-react';
import { useExclusiveVideoAudio } from '@/hooks/useExclusiveVideoAudio';
import ImageOptimizer from '@/components/ui/image-optimizer';

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
  hidePlayButton = false
}) => {
  // Audio management: exclusive video audio hook - ensures only one video plays audio at a time
  const { isMuted: videoIsMuted, toggleMute: toggleVideoMute } = useExclusiveVideoAudio(itemId);
  
  // Fallback image for broken/missing images
  const fallbackImage = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=400&fit=crop&crop=center';

  // Enhanced validation for invalid src
  const isInvalidSrc = !media.media_url || 
                      media.media_url.trim() === '' || 
                      media.media_url === 'null' || 
                      media.media_url === 'undefined' ||
                      media.media_url === '[object Object]' ||
                      typeof media.media_url !== 'string';

  // Image loading state
  const [imageLoading, setImageLoading] = useState(true);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  // Video autoplay transition state
  const [videoTransitioning, setVideoTransitioning] = useState(shouldAutoplay);

  // Generate thumbnail URL for Cloudflare Stream videos
  const getVideoThumbnail = (videoUrl: string) => {
    if (videoUrl.includes('cloudflarestream.com') && videoUrl.includes('/manifest/video.m3u8')) {
      // Extract video ID from Cloudflare Stream URL
      const match = videoUrl.match(/\/([a-f0-9]+)\/manifest\/video\.m3u8/);
      if (match) {
        const videoId = match[1];
        return `https://customer-4ah4gni80ytefpck.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg`;
      }
    }
    // For non-Cloudflare videos, we'll show the video element with preload="metadata" 
    // which will display the first frame as thumbnail
    return null;
  };

  const thumbnailUrl = media.media_type === 'video' ? getVideoThumbnail(media.media_url) : null;
  const hasCloudflareThumb = thumbnailUrl !== null;

  // Handle smooth transition for autoplay videos
  React.useEffect(() => {
    if (shouldAutoplay && media.media_type === 'video') {
      setVideoTransitioning(true);
      // Reduced timeout for faster loading
      const timer = setTimeout(() => setVideoTransitioning(false), 200);
      return () => clearTimeout(timer);
    } else {
      setVideoTransitioning(false);
    }
  }, [shouldAutoplay, media.media_type, media.id]);

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
            {/* Smooth loading overlay for video transition */}
            {videoTransitioning && (
              <div className="absolute inset-0 bg-muted/60 backdrop-blur-sm flex items-center justify-center z-20 transition-opacity duration-300">
                <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
              </div>
            )}
            <EnhancedVideoPlayer
              src={media.media_url}
              autoplay={shouldAutoplay}
              muted={videoIsMuted} // Use exclusive video audio state
              loop={loop}
              className="w-full h-full pointer-events-none"
              preloadLevel="metadata"
              enableHLS={true}
              quality="auto"
            />
            
            {/* Sound Toggle for autoplaying videos */}
            <div className="absolute top-3 right-3 z-30">
              <SoundToggle
                isMuted={videoIsMuted}
                onToggle={toggleVideoMute}
                size="sm"
                className="rounded-full"
              />
            </div>
          </div>
        ) : (
          /* Video thumbnail - use Cloudflare thumbnail or video element with first frame */
          <div className="relative w-full h-full">
            {hasCloudflareThumb ? (
              <ImageOptimizer
                src={thumbnailUrl}
                alt={itemTitle || 'Video thumbnail'}
                className="w-full h-full object-cover"
                onError={() => {
                  setImageLoading(false);
                  setMediaLoaded(true);
                  onImageError();
                }}
                width={600}
                height={800}
                priority={currentIndex <= 5}
              />
            ) : (
              /* For non-Cloudflare videos, show video element with preload="metadata" to display first frame */
              <video
                src={media.media_url}
                className="w-full h-full object-cover"
                preload="metadata"
                muted
                onLoadedMetadata={() => {
                  setImageLoading(false);
                  setMediaLoaded(true);
                  onImageLoad();
                }}
                onError={() => {
                  setImageLoading(false);
                  setMediaLoaded(true);
                  onImageError();
                }}
              />
            )}
            
            {/* Play icon for non-autoplaying videos */}
            {!hidePlayButton && (
              <div className="absolute bottom-3 right-3 z-20">
                <MdOutlinePlayCircle className="h-6 w-6 text-white drop-shadow-lg" />
              </div>
            )}
          </div>
        )
      ) : (
        <div className="relative w-full h-full">
          <ImageOptimizer
            src={isInvalidSrc ? fallbackImage : media.media_url}
            alt={itemTitle || 'Content'}
            className="w-full h-full object-cover"
            onError={() => {
              setImageLoading(false);
              setMediaLoaded(true);
              onImageError();
            }}
            width={600}
            height={800}
            priority={currentIndex <= 5}
          />
        </div>
      )}
    </div>
  );
};

export default MediaDisplay;