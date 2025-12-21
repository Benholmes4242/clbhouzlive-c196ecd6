import React from 'react';
import { cn } from '@/lib/utils';
import { Play, Flame } from 'lucide-react';
import { VideoQueueMenu } from './VideoQueueMenu';
import { GolferAvatar } from '@/components/golfers/GolferAvatar';
import type { QueueItemMeta } from '@/hooks/useVideoQueue';

export interface LongFormVideo {
  id: string;
  title: string;
  creatorUserId: string; // UUID - used for navigation
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
  onCreatorClick?: (creatorUserId: string) => void;
  onPlayNext?: (id: string, meta?: QueueItemMeta) => void;
  onEnqueue?: (id: string, meta?: QueueItemMeta) => void;
  className?: string;
}

/**
 * LongFormVideoTile - Card-style video tile matching WatchPage hero layout
 * - Full-width white card
 * - 16:9 thumbnail with avatar bottom-right
 * - White meta card below with title, creator, views, time
 */
export const LongFormVideoTile: React.FC<LongFormVideoTileProps> = ({
  video,
  onVideoClick,
  onCreatorClick,
  onPlayNext,
  onEnqueue,
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
    onCreatorClick?.(video.creatorUserId);
  };

  return (
    <div
      className={cn(
        "group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm",
        className
      )}
      onClick={() => onVideoClick?.(video.id)}
    >
      {/* Thumbnail with avatar overlay */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
            <Play className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}

        {/* Glass highlight overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        {/* Play overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            <Play className="h-6 w-6 text-foreground ml-0.5" fill="currentColor" />
          </div>
        </div>

        {/* Trending label - top left */}
        {video.isTrending && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-orange-500/90 text-white text-xs font-medium rounded-md">
            <Flame className="h-3 w-3" />
            <span>Trending</span>
          </div>
        )}

        {/* Queue menu - top right */}
        {(onPlayNext || onEnqueue) && (
          <VideoQueueMenu
            videoId={video.id}
            videoTitle={video.title}
            thumbnailUrl={video.thumbnailUrl}
            creatorName={video.creatorName}
            durationSeconds={video.durationSeconds}
            onPlayNext={onPlayNext || (() => {})}
            onEnqueue={onEnqueue || (() => {})}
            className="absolute top-3 right-3"
          />
        )}

        {/* Duration badge - bottom left */}
        <div className="absolute bottom-3 left-3 px-2 py-0.5 bg-black/70 backdrop-blur-sm text-white text-xs font-medium rounded">
          {video.duration}
        </div>

        {/* Creator squircle avatar - bottom right, overlapping into meta area */}
        <button
          onClick={handleCreatorClick}
          className="absolute bottom-3 right-3 hover:ring-2 hover:ring-ring transition-all rounded-[34%] z-10"
        >
          <GolferAvatar
            name={video.creatorName}
            photoUrl={video.creatorAvatarUrl}
            size={40}
          />
        </button>
      </div>

      {/* White meta card below thumbnail */}
      <div className="p-4">
        <h3 className="font-semibold text-sm text-foreground leading-snug line-clamp-2 mb-2">
          {video.title}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <button
            onClick={handleCreatorClick}
            className="hover:text-foreground transition-colors font-medium truncate"
          >
            {video.creatorName}
          </button>
          {video.views !== undefined && video.views > 0 && (
            <>
              <span className="text-muted-foreground/50">·</span>
              <span>{formatViews(video.views)}</span>
            </>
          )}
          {video.createdAt && (
            <>
              <span className="text-muted-foreground/50">·</span>
              <span>{formatTimeAgo(video.createdAt)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LongFormVideoTile;
