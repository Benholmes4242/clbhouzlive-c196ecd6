import React, { memo } from 'react';
import { Play } from 'lucide-react';
import HighQualityImage from '@/components/ui/high-quality-image';
import { CardMediaProps, CardType } from './CardMediaTypes';
import { getStreamPoster } from '@/utils/stream';

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
  className = ''
}) => {
  // Always use static image for square cards - use consistent poster generation with fallbacks
  const imageUrl = media.media_type === 'video' 
    ? (media.poster_url || 
       getStreamPoster(media.media_url, '1s') || 
       media.thumbnail_url ||
       'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=640&h=640&fit=crop&crop=center')
    : media.media_url;

  // DEBUG: Log image load attempts
  React.useEffect(() => {
    console.log('[SquareCardMedia] Rendered with', {
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
      <HighQualityImage
        src={imageUrl}
        alt="Media content"
        className="w-full h-full object-cover"
        onLoad={() => {
          console.log('[SquareCardMedia] Image loaded', media.id?.substring(0, 8), imageUrl);
          onLoaded?.();
        }}
        onError={() => {
          console.log('[SquareCardMedia] Image error', media.id?.substring(0, 8), imageUrl);
          onLoaded?.();
        }}
      />
      
      {/* Video play icon in bottom right for video sources */}
      {media.media_type === 'video' && (
        <div className="absolute bottom-1 right-1 z-20">
          <div className="rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 w-5 h-5 flex items-center justify-center">
            <Play className="w-2.5 h-2.5 text-white ml-0.5" fill="currentColor" />
          </div>
        </div>
      )}
    </div>
  );
});

SquareCardMedia.displayName = 'SquareCardMedia';

export default SquareCardMedia;