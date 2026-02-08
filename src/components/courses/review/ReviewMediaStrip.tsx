import React from 'react';
import { Play } from 'lucide-react';
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
        <button
          key={item.id}
          type="button"
          onClick={() => onMediaClick(index)}
          className={cn(
            "relative flex-shrink-0 rounded-lg overflow-hidden bg-muted",
            "hover:opacity-90 transition active:scale-[0.97]",
            thumbSize
          )}
        >
          {item.media_type === 'video' ? (
            <>
              <img
                src={item.poster_url || item.media_url}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className={cn(
                  "bg-white rounded-full flex items-center justify-center shadow-lg",
                  playBtnSize
                )}>
                  <Play className={cn("text-foreground fill-foreground ml-0.5", playIconSize)} />
                </div>
              </div>
            </>
          ) : (
            <img
              src={item.media_url}
              alt="Review media"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )}
        </button>
      ))}
    </div>
  );
};