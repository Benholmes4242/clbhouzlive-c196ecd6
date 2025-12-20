import React from 'react';
import { cn } from '@/lib/utils';
import { Play, Flame } from 'lucide-react';

export interface LongFormVideo {
  id: string;
  title: string;
  creatorId: string;
  creatorName: string;
  creatorAvatarUrl?: string;
  thumbnailUrl: string;
  duration: string; // Formatted duration e.g. "12:34"
  durationSeconds: number;
  views?: number;
  createdAt?: string;
  golfCourseId?: string;
  golfCourseName?: string;
  isTrending?: boolean;
}

interface LongFormVideoTileProps {
  video: LongFormVideo;
  onVideoClick?: (id: string) => void;
  onCreatorClick?: (creatorId: string) => void;
  className?: string;
}

/**
 * LongFormVideoTile - YouTube-style video tile for Videos tab
 * 16:9 thumbnail, duration badge bottom-right, title + creator row below
 */
export const LongFormVideoTile: React.FC<LongFormVideoTileProps> = ({
  video,
  onVideoClick,
  onCreatorClick,
  className,
}) => {
  const formatViews = (views: number): string => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`;
    return `${views} views`;
  };

  const formatTimeAgo = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const handleCreatorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCreatorClick?.(video.creatorId);
  };

  return (
    <div
      className={cn("group cursor-pointer", className)}
      onClick={() => onVideoClick?.(video.id)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
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

        {/* Play overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            <Play className="h-6 w-6 text-foreground ml-0.5" fill="currentColor" />
          </div>
        </div>

        {/* Trending label - top left */}
        {video.isTrending && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-orange-500/90 text-white text-xs font-medium rounded-md">
            <Flame className="h-3 w-3" />
            <span>Trending</span>
          </div>
        )}

        {/* Duration badge - bottom right (glass pill) */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 backdrop-blur-sm text-white text-xs font-medium rounded">
          {video.duration}
        </div>
      </div>

      {/* Meta row below thumbnail */}
      <div className="flex gap-3 mt-3">
        {/* Creator avatar */}
        <button
          onClick={handleCreatorClick}
          className="shrink-0 w-9 h-9 rounded-full overflow-hidden bg-muted hover:ring-2 hover:ring-ring transition-all"
        >
          {video.creatorAvatarUrl ? (
            <img
              src={video.creatorAvatarUrl}
              alt={video.creatorName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-sm font-medium text-primary">
              {video.creatorName.charAt(0).toUpperCase()}
            </div>
          )}
        </button>

        {/* Title + creator + meta */}
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
            {video.views !== undefined && (
              <>
                <span>·</span>
                <span>{formatViews(video.views)}</span>
              </>
            )}
            {video.createdAt && (
              <>
                <span>·</span>
                <span>{formatTimeAgo(video.createdAt)}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LongFormVideoTile;
