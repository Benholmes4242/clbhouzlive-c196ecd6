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
      className={cn("group cursor-pointer", className)}
      onClick={handleVideoClick}
    >
      {/* Thumbnail container */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20" />
        )}

        {/* Play overlay on hover - matches LongFormVideoTile */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            <Play className="h-6 w-6 text-foreground ml-0.5" fill="currentColor" />
          </div>
        </div>

        {/* Duration badge - dark glass, bottom-right */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 backdrop-blur-sm text-white text-xs font-medium rounded">
          {video.duration}
        </div>

        {/* Resume pill - dark glass, bottom-left */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-black/70 backdrop-blur-sm rounded text-xs font-medium text-white">
          <Play className="h-3 w-3 fill-current" />
          {formatResumeTime(video.lastPositionSeconds)}
        </div>

        {/* Progress bar - 2px, flush to bottom, rounded ends */}
        {showProgressBar && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/20">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${video.progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Video info */}
      <div className="flex gap-3 mt-3">
        {/* Creator avatar */}
        <button 
          className="shrink-0 w-9 h-9 rounded-full overflow-hidden bg-muted hover:ring-2 hover:ring-ring transition-all"
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
          <h3 className="font-medium text-sm text-foreground leading-snug line-clamp-2">
            {video.title}
          </h3>
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <button
              onClick={handleCreatorClick}
              className="hover:text-foreground transition-colors truncate"
            >
              {video.creatorName}
            </button>
            {video.views !== undefined && video.views > 0 && (
              <>
                <span>·</span>
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