import React from 'react';
import { cn } from '@/lib/utils';
import { Play } from 'lucide-react';
import { LongFormVideo } from './LongFormVideoTile';

interface ContinueWatchingVideo extends LongFormVideo {
  progressPercent: number;
  lastPositionSeconds: number;
}

interface ContinueWatchingTileProps {
  video: ContinueWatchingVideo;
  onVideoClick?: (id: string, resumeAt?: number) => void;
  onCreatorClick?: (creatorUserId: string) => void;
  className?: string;
}

/**
 * ContinueWatchingTile - Video tile with progress indicator for resumable videos
 * 
 * UI Rules (Phase 5.2):
 * - Dark-glass duration badge bottom-right
 * - Dark-glass Resume pill with time
 * - 2px progress bar flush to bottom, rounded ends
 * - Hide progress bar if < 5%
 */
export const ContinueWatchingTile: React.FC<ContinueWatchingTileProps> = ({
  video,
  onVideoClick,
  onCreatorClick,
  className,
}) => {
  const handleVideoClick = () => {
    onVideoClick?.(video.id, video.lastPositionSeconds);
  };

  const handleCreatorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCreatorClick?.(video.creatorUserId);
  };

  const formatResumeTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hrs}:${remainingMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Hide progress bar if under 5%
  const showProgressBar = video.progressPercent >= 5;

  return (
    <div 
      className={cn("group cursor-pointer bg-card overflow-hidden", className)}
      onClick={handleVideoClick}
    >
      {/* Thumbnail container */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20" />
        )}

        {/* Bottom gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

        {/* Play overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <Play className="h-6 w-6 text-foreground ml-0.5" fill="currentColor" />
          </div>
        </div>

        {/* Duration badge - bottom-right */}
        <div className="absolute bottom-3 right-3 px-2 py-1 backdrop-blur-md bg-black/35 border border-white/10 text-white text-xs font-semibold tabular-nums rounded-md">
          {video.duration}
        </div>

        {/* Resume pill - bottom-left */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full shadow-sm">
          <Play className="h-3.5 w-3.5 text-primary fill-current" />
          <span className="text-xs font-semibold text-foreground tabular-nums">
            {formatResumeTime(video.lastPositionSeconds)}
          </span>
        </div>

        {/* Progress bar - 3px, flush to bottom, rounded ends */}
        {showProgressBar && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/20">
            <div 
              className="h-full bg-primary rounded-r-full transition-all duration-300"
              style={{ width: `${video.progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Video info */}
      <div className="flex gap-3 px-4 py-3">
        {/* Creator avatar */}
        <button 
          className="shrink-0 w-10 h-10 rounded-full overflow-hidden bg-muted hover:ring-2 hover:ring-primary/20 transition-all"
          onClick={handleCreatorClick}
        >
          {video.creatorAvatarUrl ? (
            <img
              src={video.creatorAvatarUrl}
              alt={video.creatorName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {video.creatorName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </button>

        {/* Title and meta */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {video.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
            <button
              onClick={handleCreatorClick}
              className="font-medium hover:text-foreground transition-colors truncate"
            >
              {video.creatorName}
            </button>
            {video.views !== undefined && video.views > 0 && (
              <>
                <span className="text-muted-foreground/50">·</span>
                <span>{video.views.toLocaleString()} views</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContinueWatchingTile;