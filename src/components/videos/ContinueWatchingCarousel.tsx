import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, Play, Heart, Clock } from 'lucide-react';
import { useContinueWatching } from '@/hooks/useContinueWatching';
import { GolferAvatar } from '@/components/golfers/GolferAvatar';

interface ContinueWatchingCarouselProps {
  onVideoClick?: (id: string, resumeAt?: number) => void;
  onCreatorClick?: (creatorUserId: string) => void;
  onViewAll?: () => void;
  className?: string;
}

const formatTimeLeft = (totalSec: number, watchedSec: number): string => {
  const leftSec = Math.max(0, totalSec - watchedSec);
  const min = Math.floor(leftSec / 60);
  const sec = leftSec % 60;
  if (min === 0) return `${sec}s left`;
  return `${min}:${sec.toString().padStart(2, '0')} left`;
};

/**
 * ContinueWatchingCarousel - Horizontal scroll of in-progress videos
 * 
 * Features:
 * - Shows videos with 10-90% progress
 * - Progress bar indicator
 * - Time remaining display
 */
export const ContinueWatchingCarousel: React.FC<ContinueWatchingCarouselProps> = ({
  onVideoClick,
  onCreatorClick,
  onViewAll,
  className,
}) => {
  const { videos, isLoading } = useContinueWatching(10);

  // Loading skeleton
  if (isLoading) {
    return (
      <section className={cn("mb-6", className)}>
        <div className="flex items-center justify-between px-4 mb-3">
          <div className="h-5 w-36 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex gap-3 overflow-x-auto px-4 no-scrollbar">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-44">
              <div className="aspect-video bg-muted rounded-xl animate-pulse" />
              <div className="h-4 bg-muted rounded mt-2 w-3/4 animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Don't show if no videos
  if (videos.length === 0) {
    return null;
  }

  return (
    <section className={cn("mb-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-base font-bold text-foreground">Continue Watching</h2>
        {videos.length > 3 && onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>See all</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto px-4 no-scrollbar pb-2">
      {videos.map((video) => {
          const progressPercent = video.progressPercent || 0;
          const lastPosition = video.lastPositionSeconds || 0;
          
          return (
            <div
              key={video.id}
              className="flex-shrink-0 w-44 cursor-pointer group"
              onClick={() => onVideoClick?.(video.id, lastPosition)}
            >
              {/* Thumbnail with progress */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Play icon */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="h-4 w-4 text-foreground ml-0.5" fill="currentColor" />
                  </div>
                </div>

                {/* Time remaining */}
                <div className="absolute bottom-6 left-2 flex items-center gap-1 px-2 py-0.5 bg-black/70 backdrop-blur-sm rounded text-white text-xs font-medium">
                  <Play className="h-2.5 w-2.5" fill="currentColor" />
                  <span>{formatTimeLeft(video.durationSeconds, lastPosition)}</span>
                </div>

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Title */}
              <p className="text-sm font-medium text-foreground mt-2 line-clamp-1 group-hover:text-primary transition-colors">
                {video.title}
              </p>
              
              {/* Creator */}
              <p className="text-xs text-muted-foreground truncate">
                {video.creatorName}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ContinueWatchingCarousel;
