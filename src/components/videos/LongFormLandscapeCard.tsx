import React from 'react';
import { Play } from 'lucide-react';
import { GolferAvatar } from '@/components/golfers/GolferAvatar';
import { cn } from '@/lib/utils';

export interface LongFormCardVideo {
  id: string;
  title?: string;
  thumbnailUrl?: string;
  mediaUrl?: string;
  duration?: string;
  durationSeconds?: number;
  creatorUserId: string;
  creatorName?: string;
  creatorAvatarUrl?: string;
  likes?: number;
  views?: number;
  createdAt?: string;
}

interface LongFormLandscapeCardProps {
  video: LongFormCardVideo;
  onTap: () => void;
  className?: string;
}

/**
 * LongFormLandscapeCard - Featured 16:9 aspect ratio card for long-form videos
 * Used as the hero/featured card at the top of each section
 */
export const LongFormLandscapeCard: React.FC<LongFormLandscapeCardProps> = ({ 
  video, 
  onTap,
  className 
}) => {
  const thumbnailUrl = video.thumbnailUrl;
  const duration = video.duration;

  return (
    <div 
      className={cn(
        "relative w-full aspect-video rounded-sm overflow-hidden cursor-pointer bg-muted",
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
          <Play className="h-12 w-12 text-muted-foreground/40" />
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

      {/* Duration Badge */}
      {duration && (
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 rounded text-white text-xs font-medium tabular-nums">
          {duration}
        </div>
      )}

      {/* Play Icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Play className="w-6 h-6 text-white fill-white" />
        </div>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="text-white font-medium text-sm line-clamp-2 mb-2">
          {video.title || 'Untitled video'}
        </h3>
        <div className="flex items-center gap-2">
          <div 
            className="shrink-0 overflow-hidden border border-white/50"
            style={{
              width: '24px',
              aspectRatio: '1 / 1.05',
              borderRadius: '34%',
            }}
          >
            <GolferAvatar
              name={video.creatorName}
              photoUrl={video.creatorAvatarUrl}
              size={24}
            />
          </div>
          <span className="text-white/80 text-xs truncate">
            {video.creatorName || 'Unknown'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LongFormLandscapeCard;
