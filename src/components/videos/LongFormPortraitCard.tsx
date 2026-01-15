import React from 'react';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LongFormCardVideo } from './LongFormLandscapeCard';

interface LongFormPortraitCardProps {
  video: LongFormCardVideo;
  onTap: () => void;
  className?: string;
}

/**
 * LongFormPortraitCard - Portrait 3:4 aspect ratio card for long-form videos
 * Used in the 2-column grid below the featured hero card
 */
export const LongFormPortraitCard: React.FC<LongFormPortraitCardProps> = ({ 
  video, 
  onTap,
  className 
}) => {
  const thumbnailUrl = video.thumbnailUrl;
  const duration = video.duration;

  return (
    <div 
      className={cn(
        "relative w-full aspect-[3/4] rounded-sm overflow-hidden cursor-pointer bg-muted",
        className
      )}
      onClick={onTap}
    >
      {/* Thumbnail */}
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={video.title || 'Video'}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
          <Play className="h-10 w-10 text-muted-foreground/40" />
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

      {/* Duration Badge */}
      {duration && (
        <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-white text-[10px] font-medium tabular-nums">
          {duration}
        </div>
      )}

      {/* Play Icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Play className="w-5 h-5 text-white fill-white" />
        </div>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <h3 className="text-white font-medium text-xs line-clamp-2 mb-1">
          {video.title || 'Untitled video'}
        </h3>
        <span className="text-white/70 text-[10px] truncate block">
          {video.creatorName || 'Unknown'}
        </span>
      </div>
    </div>
  );
};

export default LongFormPortraitCard;
