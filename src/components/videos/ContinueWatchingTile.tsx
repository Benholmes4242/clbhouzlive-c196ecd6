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

  return (
    <div 
      className={cn("group cursor-pointer", className)}
      onClick={handleVideoClick}
    >
      {/* Thumbnail container */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-muted mb-3">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20" />
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Duration badge */}
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/80 rounded text-xs font-medium text-white">
          {video.duration}
        </div>

        {/* Resume pill */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-primary rounded-full text-xs font-medium text-primary-foreground">
          <Play className="h-3 w-3 fill-current" />
          Resume at {formatResumeTime(video.lastPositionSeconds)}
        </div>

        {/* Progress bar at bottom of thumbnail */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${video.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Video info */}
      <div className="flex gap-3">
        {/* Creator avatar */}
        <div 
          className="shrink-0 cursor-pointer"
          onClick={handleCreatorClick}
        >
          <div className="w-9 h-9 rounded-full overflow-hidden bg-muted">
            {video.creatorAvatarUrl ? (
              <img
                src={video.creatorAvatarUrl}
                alt={video.creatorName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                <span className="text-sm font-medium text-foreground">
                  {video.creatorName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Title and meta */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
            {video.title}
          </h3>
          <p 
            className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            onClick={handleCreatorClick}
          >
            {video.creatorName}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {video.views?.toLocaleString() ?? 0} views
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContinueWatchingTile;
