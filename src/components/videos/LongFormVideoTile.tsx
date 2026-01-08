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
        "group cursor-pointer bg-white border border-border/30 overflow-hidden",
        className
      )}
      onClick={() => onVideoClick?.(video.id)}
    >
      {/* Media Section - 16:9 aspect ratio matching hero */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-muted">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
            <Play className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}

        {/* Subtle hover effect matching hero */}
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

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

        {/* Likes - bottom left (matching hero: white text with shadow, no pill) */}
        <div 
          className="absolute bottom-3 left-3 flex items-center gap-1 text-white/70 text-[10px] leading-none font-medium"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
        >
          <Heart className="w-3 h-3" />
          <span>{formatLikes(video.likes || video.views)}</span>
        </div>

        {/* Duration badge - bottom right (matching hero position) */}
        <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/70 backdrop-blur-sm text-white text-xs font-medium rounded">
          {video.duration}
        </div>
      </div>

      {/* Meta Area - White card section matching hero exactly */}
      <div className="px-4 py-3 flex items-end justify-between gap-3">
        {/* Text content - constrained to ~80% to leave room for avatar */}
        <div className="flex-1 min-w-0 max-w-[80%]">
          {/* Caption - 2 lines max with ellipsis */}
          <p className="text-sm text-foreground line-clamp-2 leading-snug">
            {video.title}
          </p>
          {/* Creator name */}
          <button
            onClick={handleCreatorClick}
            className="text-xs text-muted-foreground mt-1 truncate block hover:text-foreground transition-colors"
          >
            {video.creatorName}
          </button>
        </div>

        {/* Avatar - bottom right of meta area matching hero */}
        <button
          onClick={handleCreatorClick}
          className="shrink-0 overflow-hidden shadow-sm transition-all"
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
      </div>
    </div>
  );
};

export default LongFormVideoTile;
