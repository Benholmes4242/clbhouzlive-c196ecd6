import React, { useRef, useEffect, useState, useId } from 'react';
import { cn } from '@/lib/utils';
import { Play, Heart, Flame, Clock, Check, MapPin } from 'lucide-react';
import { GolferAvatar } from '@/components/golfers/GolferAvatar';
import { HLSPlayer, HLSPlayerRef } from '@/media';
import type { RegisterMediaFn } from '@/media';
import type { LongFormVideo } from './LongFormVideoTile';

type BadgeType = 'trending' | 'new' | 'watched' | null;

interface EnhancedVideoTileProps {
  video: LongFormVideo;
  onVideoClick?: (id: string) => void;
  onCreatorClick?: (creatorUserId: string) => void;
  registerVideo?: RegisterMediaFn;
  isPlaying?: boolean;
  videoIndex?: number;
  watchedPercent?: number; // 0-100, if > 90 show watched state
  className?: string;
}

const formatCount = (n: number): string => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

const getBadge = (video: LongFormVideo, watchedPercent?: number): BadgeType => {
  if (watchedPercent && watchedPercent >= 90) return 'watched';
  if (video.isTrending) return 'trending';
  if (video.createdAt) {
    const hoursAgo = (Date.now() - new Date(video.createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursAgo < 24) return 'new';
  }
  return null;
};

/**
 * EnhancedVideoTile - Video card with badges, watched state, and engagement signals
 * 
 * Features:
 * - Badge system (trending, new, watched)
 * - Watched state with desaturation + checkmark
 * - Engagement signals (likes, course tag)
 * - Duration pill
 * - Autoplay preview on scroll
 */
export const EnhancedVideoTile: React.FC<EnhancedVideoTileProps> = ({
  video,
  onVideoClick,
  onCreatorClick,
  registerVideo,
  isPlaying,
  videoIndex = 0,
  watchedPercent,
  className,
}) => {
  const playerRef = useRef<HLSPlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaId = useId();
  const [shouldAttach, setShouldAttach] = useState(false);

  const badge = getBadge(video, watchedPercent);
  const isWatched = badge === 'watched';

  // Register with autoplay system
  useEffect(() => {
    if (!registerVideo || !containerRef.current) return;

    const videoElement = document.createElement('video');
    return registerVideo({
      id: video.id,
      element: videoElement,
      sortIndex: videoIndex,
    });
  }, [registerVideo, video.id, videoIndex]);

  // Handle intersection for attach/detach
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShouldAttach(entry.isIntersecting);
      },
      { rootMargin: '200px', threshold: 0 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Attach/detach player
  useEffect(() => {
    if (shouldAttach) {
      playerRef.current?.attach();
    } else {
      playerRef.current?.detach();
    }
  }, [shouldAttach]);

  // Control playback
  useEffect(() => {
    if (isPlaying) {
      playerRef.current?.play();
    } else {
      playerRef.current?.pause();
    }
  }, [isPlaying]);

  const handleCreatorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCreatorClick?.(video.creatorUserId);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "group cursor-pointer bg-card overflow-hidden",
        isWatched && "relative",
        className
      )}
      onClick={() => onVideoClick?.(video.id)}
    >
      {/* Media Section */}
      <div className={cn(
        "relative w-full aspect-[16/9] overflow-hidden bg-muted",
        isWatched && "saturate-[0.7]"
      )}>
        {video.mediaUrl ? (
          <HLSPlayer
            ref={playerRef}
            src={video.mediaUrl}
            muted={true}
            autoplay={false}
            loop={true}
            managedByMediaRuntime={true}
            mediaId={mediaId}
            className="w-full h-full object-cover"
            poster={video.thumbnailUrl}
          />
        ) : video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Play className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

        {/* Play overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <Play className="h-6 w-6 text-foreground ml-0.5" fill="currentColor" />
          </div>
        </div>

        {/* Badge - top left */}
        {badge === 'trending' && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-semibold rounded-full shadow-lg shadow-orange-500/30">
            <Flame className="h-3.5 w-3.5" />
            <span>Trending</span>
          </div>
        )}
        {badge === 'new' && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold rounded-full shadow-lg shadow-blue-500/30">
            <Clock className="h-3.5 w-3.5" />
            <span>New</span>
          </div>
        )}

        {/* Watched checkmark - top right */}
        {isWatched && (
          <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
            <Check className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
        )}

        {/* Course tag - bottom left */}
        {video.golfCourseName && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-full max-w-[60%]">
            <MapPin className="h-3.5 w-3.5 text-white shrink-0" />
            <span className="text-white text-xs font-medium truncate">{video.golfCourseName}</span>
          </div>
        )}

        {/* Likes - bottom left (if no course) */}
        {!video.golfCourseName && (video.likes || 0) >= 100 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-full">
            <Heart className="w-3.5 h-3.5 text-white" fill="white" />
            <span className="text-white text-xs font-medium">{formatCount(video.likes || 0)}</span>
          </div>
        )}

        {/* Duration - bottom right */}
        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold tabular-nums rounded-md">
          {video.duration}
        </div>
      </div>

      {/* Meta Area */}
      <div className="px-4 py-3 flex items-start gap-3">
        {/* Creator avatar */}
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
          <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {video.title}
          </p>
          <button
            onClick={handleCreatorClick}
            className="text-xs text-muted-foreground mt-1.5 truncate block hover:text-foreground transition-colors font-medium"
          >
            {video.creatorName}
          </button>
        </div>

        {/* Likes (if not shown in thumbnail) */}
        {video.golfCourseName && (video.likes || 0) >= 100 && (
          <div className="flex items-center gap-1 text-muted-foreground shrink-0">
            <Heart className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{formatCount(video.likes || 0)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedVideoTile;
