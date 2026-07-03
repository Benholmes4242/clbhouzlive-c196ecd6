// [VIDEOSTUB] Poster-only: video engine severed (Stage E).
// Renders a poster image only; no HLS/streaming.
import React, { memo } from 'react';
import { Play } from 'lucide-react';
import HighQualityImage from '@/components/ui/high-quality-image';
import { CardMediaProps } from './CardMediaTypes';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamThumbnailUrl } from '@/config/cloudflareStream';

interface ExtendedCardMediaProps extends CardMediaProps {
  isVideoReady?: boolean;
  onReady?: (id: string) => void;
}

const PortraitCardMedia: React.FC<ExtendedCardMediaProps> = memo(({
  media,
  onMediaClick,
  className = '',
}) => {
  const uid = uidFromNode(media);
  const posterSrc =
    media.media_type === 'video' && uid
      ? generateStreamThumbnailUrl(uid, { height: 600 })
      : media.media_url;

  return (
    <div
      className={`relative w-full h-full overflow-hidden cursor-pointer ${className}`}
      onClick={onMediaClick}
    >
      <HighQualityImage
        src={posterSrc}
        alt="Media content"
        className="w-full h-full object-cover"
      />
      {media.media_type === 'video' && (
        <div className="absolute bottom-3 right-3 z-20">
          <div className="rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 w-5 h-5 md:w-7 md:h-7 flex items-center justify-center">
            <Play className="w-3 h-3 md:w-4 md:h-4 text-white ml-0.5" fill="currentColor" />
          </div>
        </div>
      )}
    </div>
  );
});

PortraitCardMedia.displayName = 'PortraitCardMedia';

export default PortraitCardMedia;
