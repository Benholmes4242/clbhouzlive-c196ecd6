import React from 'react';
import { cn } from '@/lib/utils';
import { Play, Flame, Heart } from 'lucide-react';
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
  mediaUrl?: string; // Video URL for autoplay
  duration: string; // Formatted duration e.g. "12:34"
  durationSeconds: number;
  views?: number;
  createdAt?: string;
  golfCourseId?: string;
  golfCourseName?: string;
  isTrending?: boolean;
  likes?: number;
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
 * LongFormVideoTile - Card-style video tile matching WatchPage hero layout exactly
 * - Full-width white card with straight edges (no rounded corners)
 * - 16:9 thumbnail with likes bottom-left, duration bottom-right
 * - White meta card below with caption, creator name, and avatar bottom-right
 */
export const LongFormVideoTile: React.FC<LongFormVideoTileProps> = ({
  video,
  onVideoClick,
  onCreatorClick,
  onPlayNext,
  onEnqueue,
  className,
}) => {
  const formatLikes = (count?: number): string => {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const handleCreatorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCreatorClick?.(video.creatorUserId);
  };

  return (
    <div
      className={cn(
        "group cursor-pointer bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300",
        className
      )}
      onClick={() => onVideoClick?.(video.id)}
    >
      {/* Media Section - 16:9 aspect ratio */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-muted">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              // Hide broken image and show fallback
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : null}
        
        {/* Fallback background - always rendered behind image */}
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center -z-10">
          <Play className="h-12 w-12 text-muted-foreground/40" />
        </div>

        {/* Bottom gradient overlay for better badge contrast */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

        {/* Play overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <Play className="h-6 w-6 text-foreground ml-0.5" fill="currentColor" />
          </div>
        </div>

        {/* Trending label - top left with gradient */}
        {video.isTrending && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-semibold rounded-full shadow-lg shadow-orange-500/30">
            <Flame className="h-3.5 w-3.5" />
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

        {/* Likes - bottom left with better contrast */}
        {(video.likes || video.views) && (video.likes || 0) > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-full">
            <Heart className="w-3.5 h-3.5 text-white" fill="white" />
            <span className="text-white text-xs font-medium">
              {formatLikes(video.likes || video.views)}
            </span>
          </div>
        )}

        {/* Duration badge - bottom right with better styling */}
        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold tabular-nums rounded-md">
          {video.duration}
        </div>
      </div>

      {/* Meta Area - White card section */}
      <div className="px-4 py-3 flex items-start gap-3">
        {/* Creator avatar - left side */}
        <button
          onClick={handleCreatorClick}
          className="shrink-0 mt-0.5 overflow-hidden shadow-sm transition-all hover:ring-2 hover:ring-primary/20"
          style={{
            width: '40px',
            aspectRatio: '1 / 1.05',
            borderRadius: '34%',
          }}
        >
          <GolferAvatar
            name={video.creatorName}
            photoUrl={video.creatorAvatarUrl}
            size={40}
          />
        </button>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {video.title}
          </p>
          {/* Creator name */}
          <button
            onClick={handleCreatorClick}
            className="text-xs text-muted-foreground mt-1.5 truncate block hover:text-foreground transition-colors font-medium"
          >
            {video.creatorName}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LongFormVideoTile;
