import React, { useState } from 'react';
import { Play, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ReviewMediaItem {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  poster_url?: string | null;
}

interface ReviewMediaStripProps {
  media: ReviewMediaItem[];
  onMediaClick: (index: number) => void;
  /** 'default' = 96px thumbnails, 'compact' = 64px thumbnails for inline review cards */
  variant?: 'default' | 'compact';
}

/** Individual thumbnail with shimmer, fade-in, and error fallback */
const ReviewMediaThumb: React.FC<{
  item: ReviewMediaItem;
  index: number;
  onMediaClick: (index: number) => void;
  thumbSize: string;
  playBtnSize: string;
  playIconSize: string;
  isCompact: boolean;
}> = ({ item, index, onMediaClick, thumbSize, playBtnSize, playIconSize, isCompact }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isBroken, setIsBroken] = useState(false);
  const isVideo = item.media_type === 'video';
  const src = isVideo ? (item.poster_url || item.media_url) : item.media_url;
  const fallbackIconSize = isCompact ? 'h-5 w-5' : 'h-6 w-6';

  return (
    <button
      type="button"
      onClick={() => onMediaClick(index)}
      className={cn(
        "relative flex-shrink-0 rounded-lg overflow-hidden bg-muted",
        "hover:opacity-90 transition active:scale-[0.97]",
        thumbSize
      )}
    >
      {/* Shimmer placeholder */}
      {!isLoaded && !isBroken && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      {/* Broken image fallback */}
      {isBroken && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <Camera className={cn("text-muted-foreground/40", fallbackIconSize)} />
        </div>
      )}

      {/* Image with fade-in */}
      {!isBroken && (
        <img
          src={src}
          alt={isVideo ? 'Video thumbnail' : 'Review media'}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-200",
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsBroken(true)}
        />
      )}

      {/* Video play icon overlay — renders on top of both loaded and fallback states */}
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className={cn(
            "bg-white rounded-full flex items-center justify-center shadow-lg",
            playBtnSize
          )}>
            <Play className={cn("text-foreground fill-foreground ml-0.5", playIconSize)} />
          </div>
        </div>
      )}
    </button>
  );
};

export const ReviewMediaStrip: React.FC<ReviewMediaStripProps> = ({ 
  media, 
  onMediaClick,
  variant = 'default',
}) => {
  if (!media || media.length === 0) return null;

  const isCompact = variant === 'compact';
  const thumbSize = isCompact ? 'w-16 h-16' : 'w-24 h-24';
  const playBtnSize = isCompact ? 'w-6 h-6' : 'w-8 h-8';
  const playIconSize = isCompact ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <div className={cn(
      "flex gap-2 overflow-x-auto no-scrollbar",
      isCompact ? "-mx-5 px-5 pb-2" : "mt-3 -mx-1 px-1"
    )}>
      {media.map((item, index) => (
        <ReviewMediaThumb
          key={item.id}
          item={item}
          index={index}
          onMediaClick={onMediaClick}
          thumbSize={thumbSize}
          playBtnSize={playBtnSize}
          playIconSize={playIconSize}
          isCompact={isCompact}
        />
      ))}
    </div>
  );
};
