import React, { useState } from 'react';
import SmartMediaContainer from '@/components/ui/smart-media-container';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';

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
  loop = false
}) => {
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
  const [imageLoading, setImageLoading] = useState(false);
  
  // Debug log the media URL and autoplay
  console.log('MediaDisplay - URL:', media.media_url, 'Type:', media.media_type, 'Invalid:', isInvalidSrc, 'ShouldAutoplay:', shouldAutoplay);

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
    return null;
  };

  const thumbnailUrl = media.media_type === 'video' ? getVideoThumbnail(media.media_url) : null;

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
          <EnhancedVideoPlayer
            src={media.media_url}
            autoplay={shouldAutoplay}
            muted={true}
            loop={loop}
            className="w-full h-full pointer-events-none"
            preloadLevel="metadata"
            enableHLS={true}
            quality="auto"
          />
        ) : (
          // Show thumbnail for non-autoplaying videos to improve performance
          <div className="relative w-full h-full">
            <img
              src={thumbnailUrl || fallbackImage}
              alt={itemTitle || 'Video thumbnail'}
              className="w-full h-full object-cover"
              onLoad={() => {
                console.log('Video thumbnail loaded:', thumbnailUrl);
                onImageLoad();
              }}
              onError={(e) => {
                console.log('Video thumbnail failed to load, using fallback:', thumbnailUrl);
                e.currentTarget.src = fallbackImage;
                onImageError();
              }}
              loading={currentIndex === 0 ? 'eager' : 'lazy'}
            />
          </div>
        )
      ) : (
        <div className="relative w-full h-full">
          <img
            src={isInvalidSrc ? fallbackImage : media.media_url}
            alt={itemTitle || 'Content'}
            className="w-full h-full object-cover"
            onLoad={() => {
              console.log('Image loaded successfully:', media.media_url);
              setImageLoading(false);
              onImageLoad();
            }}
            onError={(e) => {
              console.log('Image failed to load:', media.media_url);
              setImageLoading(false);
              onImageError();
            }}
            onLoadStart={() => {
              setImageLoading(true);
            }}
            loading={currentIndex === 0 ? 'eager' : 'lazy'}
          />
        </div>
      )}
    </div>
  );
};

export default MediaDisplay;