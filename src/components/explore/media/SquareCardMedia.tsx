import React, { memo } from 'react';
import { Play } from 'lucide-react';
import HighQualityImage from '@/components/ui/high-quality-image';
import { CardMediaProps, CardType } from './CardMediaTypes';

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
  className = ''
}) => {
  // Always use static image for square cards
  const imageUrl = media.media_type === 'video' 
    ? (media.poster_url || media.thumbnail_url || '/placeholder.svg')
    : media.media_url;

  return (
    <div 
      className={`relative w-full h-full overflow-hidden cursor-pointer ${className}`}
      onClick={onMediaClick}
    >
      <HighQualityImage
        src={imageUrl}
        alt="Media content"
        className="w-full h-full object-cover"
      />
      
      {/* Video play icon in bottom right for video sources */}
      {media.media_type === 'video' && (
        <div className="absolute bottom-3 right-3 z-20">
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