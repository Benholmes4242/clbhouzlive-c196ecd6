/**
 * MomentCard - Large cinematic post card for the Moments timeline
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Heart, MessageCircle, MapPin } from 'lucide-react';
import { MomentPost } from './types';
import { formatRelativeAgoLong } from '@/i18n/format';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';
import { CHIP_GLASS_BG, CHIP_GLASS_BORDER } from '@/styles/photoScrim';

interface MomentCardProps {
  moment: MomentPost;
  onClick?: () => void;
  className?: string;
}

export const MomentCard: React.FC<MomentCardProps> = ({
  moment,
  onClick,
  className,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const formattedDate = moment.date 
    ? formatRelativeAgoLong(moment.date)
    : '';

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full dgp-moment-card text-left',
        className
      )}
    >
      {/* Media — poster-only chassis: videos render their poster frame as an <img> */}
      <div className="relative aspect-[4/5] overflow-hidden">
        {(() => {
          const posterSrc = moment.mediaType === 'video'
            ? (moment.posterUrl || moment.mediaUrl)
            : moment.mediaUrl;
          return (
            <img
              src={posterSrc}
              alt=""
              className={cn(
                'w-full h-full object-cover transition-opacity duration-300',
                isLoaded ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={() => setIsLoaded(true)}
              loading="lazy"
            />
          );
        })()}

        {!isLoaded && (
          <div className="absolute inset-0 bg-slate-800 animate-pulse" />
        )}

        {/* Text overlays from studioEdits */}
        {moment.studioEdits?.textOverlays?.length ? (
          <TextOverlayRenderer
            textOverlays={moment.studioEdits.textOverlays}
            isEditable={false}
          />
        ) : null}

        {/* Course tag overlay */}
        {moment.courseName && (
          <div
            className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{
              background: CHIP_GLASS_BG,
              border: CHIP_GLASS_BORDER,
              color: '#FFFFFF',
            }}
          >
            <MapPin className="w-3 h-3" />
            {moment.courseName}
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="p-4 space-y-2">
        {moment.caption && (
          <p
            className="text-sm line-clamp-2"
            style={{ color: 'var(--dgp-text-primary)' }}
          >
            {moment.caption}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span
            className="text-xs"
            style={{ color: 'var(--dgp-text-muted)' }}
          >
            {formattedDate}
          </span>

          <div
            className="flex items-center gap-3 text-xs"
            style={{ color: 'var(--dgp-text-muted)' }}
          >
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" />
              {moment.likesCount}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              {moment.commentsCount}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};

export default MomentCard;
