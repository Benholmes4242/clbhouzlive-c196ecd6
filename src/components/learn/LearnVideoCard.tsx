import React from 'react';
import { cn } from '@/lib/utils';
import { Play } from 'lucide-react';

export interface LearnVideo {
  id: string;
  title: string;
  creatorName: string;
  creatorAvatarUrl?: string;
  thumbnailUrl: string;
  duration?: string;
  skillLevel?: string;
}

interface LearnVideoCardProps {
  video: LearnVideo;
  onClick?: (id: string) => void;
  className?: string;
  variant?: 'primary' | 'compact';
}

/**
 * LearnVideoCard - Calm, instructional video card
 * Primary variant for main feed, compact for long-form section
 * No trending badges, no social metrics prominence
 */
export const LearnVideoCard: React.FC<LearnVideoCardProps> = ({
  video,
  onClick,
  className,
  variant = 'primary',
}) => {
  const isPrimary = variant === 'primary';

  return (
    <button
      onClick={() => onClick?.(video.id)}
      className={cn(
        "w-full text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl",
        className
      )}
    >
      {/* Thumbnail */}
      <div className={cn(
        "relative overflow-hidden rounded-xl bg-muted",
        isPrimary ? "aspect-video" : "aspect-[16/10]"
      )}>
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800" />
        )}
        
        {/* Play overlay - subtle */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            <Play className="h-5 w-5 text-slate-800 ml-0.5" />
          </div>
        </div>

        {/* Duration badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 text-white text-xs font-medium rounded">
            {video.duration}
          </div>
        )}
      </div>

      {/* Meta */}
      <div className={cn("mt-3", isPrimary ? "px-0.5" : "px-0")}>
        <h3 className={cn(
          "font-medium text-foreground leading-snug line-clamp-2",
          isPrimary ? "text-base" : "text-sm"
        )}>
          {video.title}
        </h3>
        <p className={cn(
          "text-muted-foreground mt-1",
          isPrimary ? "text-sm" : "text-xs"
        )}>
          {video.creatorName}
        </p>
      </div>
    </button>
  );
};

export default LearnVideoCard;
