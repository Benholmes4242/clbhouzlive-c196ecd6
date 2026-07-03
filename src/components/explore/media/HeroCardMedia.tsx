// [VIDEOSTUB] Poster-only: video engine severed (Stage E).
import React, { memo } from 'react';
import HighQualityImage from '@/components/ui/high-quality-image';
import { CardMediaProps } from './CardMediaTypes';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';
import { generateStreamThumbnailUrl } from '@/config/cloudflareStream';

interface ExtendedCardMediaProps extends CardMediaProps {
  isVideoReady?: boolean;
  onReady?: (id: string) => void;
}

const HeroCardMedia: React.FC<ExtendedCardMediaProps> = memo(({
  media,
  onMediaClick,
  className = '',
  showFeaturedBadge = true,
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
      {(media as any).studio_edits?.textOverlays?.length > 0 && (
        <TextOverlayRenderer
          textOverlays={(media as any).studio_edits.textOverlays}
          isEditable={false}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      {showFeaturedBadge && (
        <div className="absolute top-3 left-3 z-20">
          <span
            style={{
              display: 'inline-block',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#FFFFFF',
              background: 'rgba(0, 0, 0, 0.28)',
              backdropFilter: 'blur(22px) saturate(180%)',
              WebkitBackdropFilter: 'blur(22px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
              padding: '4px 10px',
              borderRadius: 4,
              transform: 'rotate(-6deg)',
              transformOrigin: 'left center',
            }}
          >
            Featured
          </span>
        </div>
      )}
    </div>
  );
});

HeroCardMedia.displayName = 'HeroCardMedia';

export default HeroCardMedia;
