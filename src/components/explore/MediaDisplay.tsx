import React from 'react';
import SmartMediaContainer from '@/components/ui/smart-media-container';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import { useAdvancedImageOptimization } from '@/hooks/useAdvancedImageOptimization';

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
}

const MediaDisplay: React.FC<MediaDisplayProps> = ({
  media,
  itemTitle,
  shouldAutoplay,
  isLoading,
  onImageError,
  onImageLoad,
  itemId,
  currentIndex
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

  // Use advanced image optimization hook
  const { optimizedImage, isLoading: imageLoading } = useAdvancedImageOptimization(media.media_url);

  return (
    <div className="relative w-full h-full overflow-hidden bg-muted">
      {/* Loading Skeleton */}
      {(isLoading || imageLoading) && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center z-10">
          <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin"></div>
        </div>
      )}
      
      {media.media_type === 'video' && !isInvalidSrc ? (
        <EnhancedVideoPlayer
          src={media.media_url}
          autoplay={shouldAutoplay}
          muted={true}
          loop={true}
          className="w-full h-full pointer-events-none"
          preloadLevel="metadata"
          enableHLS={true}
          quality="auto"
        />
      ) : (
        <SmartMediaContainer
          media={[{
            id: media.id,
            type: 'image',
            url: isInvalidSrc ? fallbackImage : (optimizedImage?.url || media.media_url),
            alt: itemTitle || 'Content'
          }]}
          className="w-full h-full"
          priority={currentIndex === 0}
          enableCarousel={false}
        />
      )}
    </div>
  );
};

export default MediaDisplay;