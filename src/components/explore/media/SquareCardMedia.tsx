import React, { memo } from 'react';
import HighQualityImage from '@/components/ui/high-quality-image';
import { CardMediaProps, CardType } from './CardMediaTypes';
import { getStreamPoster } from '@/utils/stream';
import { devlog } from '@/utils/log';
import { getFilterClass } from '@/utils/studioFilters';
import { getCropWrapperClass, getPixelLayerStyle } from '@/utils/studioEdit';
import { cn } from '@/lib/utils';
import { VideoPlayIndicator } from '@/components/ui/VideoPlayIndicator';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';

/**
 * Square Card Media Component
 * 
 * Rules:
 * - Content type: Always static images
 * - If source is video: Display poster/thumbnail, NOT the video element
 * - Behavior: No autoplay, no motion, no video decoding on load
 * - Rationale: Keeps feed/carousels fast and light
 */
const SquareCardMedia: React.FC<CardMediaProps> = memo(({
  media,
  onMediaClick,
  onLoaded,
  className = '',
  isAboveTheFold = false
}) => {
  // Always use static image for square cards - use consistent poster generation with fallbacks
  const imageUrl = media.media_type === 'video' 
    ? (media.poster_url || 
       getStreamPoster(media.media_url, '1s') || 
       media.thumbnail_url ||
       'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=640&h=640&fit=crop&crop=center')
    : media.media_url;

  // Get studio edits for crop/rotate
  const studioEdits = (media as any).studio_edits;
  const filterClass = getFilterClass(studioEdits?.filter);
  const cropClass = getCropWrapperClass(studioEdits?.crop);
  const pixelStyle = getPixelLayerStyle(studioEdits);

  // DEBUG: Log image load attempts
  React.useEffect(() => {
    devlog('[SquareCardMedia] Rendered with', {
      mediaId: media.id?.substring(0, 8),
      mediaType: media.media_type,
      imageUrl,
      src: media.media_url
    });
  }, [media.id, imageUrl]);

  return (
    <div 
      className={`relative w-full h-full overflow-hidden cursor-pointer ${className}`}
      onClick={onMediaClick}
      data-media-id={media.id}
      data-role="square-card"
    >
      <div className={cn("w-full h-full", cropClass)}>
        <div className={cn("w-full h-full", filterClass)} style={pixelStyle}>
          <HighQualityImage
            src={imageUrl}
            alt="Media content"
            className="w-full h-full object-cover"
            isAboveTheFold={isAboveTheFold}
            onLoad={() => {
              devlog('[SquareCardMedia] Image loaded', media.id?.substring(0, 8), imageUrl);
              onLoaded?.();
            }}
            onError={() => {
              devlog('[SquareCardMedia] Image error', media.id?.substring(0, 8), imageUrl);
              onLoaded?.();
            }}
          />
        </div>
      </div>
      
      {/* Text overlays */}
      {studioEdits?.textOverlays?.length > 0 && (
        <TextOverlayRenderer
          textOverlays={studioEdits.textOverlays}
          isEditable={false}
          safeAreaContext="feed"
        />
      )}
      
      {/* Video play icon - bottom left, matching VideoPlayIndicator */}
      {media.media_type === 'video' && (
        <VideoPlayIndicator size="md" />
      )}
    </div>
  );
});

SquareCardMedia.displayName = 'SquareCardMedia';

export default SquareCardMedia;