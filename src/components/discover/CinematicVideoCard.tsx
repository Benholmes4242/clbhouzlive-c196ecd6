import React, { useRef, useEffect, useState } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import { useVideoVisibility } from '@/hooks/useVideoVisibility';
import { useExclusiveVideoAudio } from '@/hooks/useExclusiveVideoAudio';
import { useVideoProgressSync } from '@/hooks/useVideoProgressSync';
import { Volume2, VolumeX, Heart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatRelativeTime, formatLikes } from '@/utils/dateFormat';
import { clsx } from 'clsx';
import ClubTagPill from '@/components/clubhouse/ClubTagPill';

interface CinematicVideoCardProps {
  item: ExploreContentItem;
  onMediaClick?: (item: ExploreContentItem) => void;
}

const CinematicVideoCard: React.FC<CinematicVideoCardProps> = ({ item, onMediaClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isMuted, toggleMute } = useExclusiveVideoAudio(item.id);
  const [duration, setDuration] = useState<number>(0);
  const { progress, setProgressFillRef } = useVideoProgressSync(videoRef.current);

  // Use robust video visibility hook with 60% threshold
  const { containerRef, isVisible } = useVideoVisibility({
    threshold: 0.6,
    rootMargin: '0px',
    videoRef,
    shouldAutoplay: true,
    globallyMuted: isMuted
  });

  // Capture duration and set loop
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(Math.floor(video.duration));
      video.loop = true;
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
  }, []);

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  };

  const videoUrl = item.media?.[0]?.media_url || item.src || '';
  const thumbnailUrl = item.thumbnailSrc || '';

  return (
    <div ref={containerRef} className="w-full mb-2">
      {/* Video Container */}
      <div className="relative w-full overflow-hidden" style={{ height: '280px' }}>
        <video
          ref={videoRef}
          src={videoUrl}
          poster={thumbnailUrl}
          playsInline
          className="w-full h-full object-cover"
          onClick={() => onMediaClick?.(item)}
        />

        {/* Progress Bar - Bottom Edge of Video */}
        <div 
          className="pointer-events-none absolute left-0 right-0 bottom-0 h-[2px] bg-black/35 backdrop-blur-sm z-20"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Video progress"
        >
          <div
            ref={setProgressFillRef}
            className="relative h-full origin-left will-change-transform bg-white/55"
            style={{ transform: 'scaleX(0)' }}
            aria-hidden="true"
          />
        </div>

        {/* Golf Club Tag - Top Right */}
        {item.golfCourse && (
          <ClubTagPill 
            course={{
              id: item.golfCourse.id,
              name: item.golfCourse.name,
              country: item.golfCourse.country
            }}
            className="!top-2 !right-2 [&>div]:!px-2 [&>div]:!py-1 [&>div]:!text-xs [&_svg]:!w-3.5 [&_svg]:!h-3.5"
          />
        )}

        {/* Duration Badge - Bottom Left */}
        {duration > 0 && (
          <time 
            className="absolute bottom-2 left-2 inline-flex h-6 items-center rounded-md border border-hud-border bg-hud-bg px-1.5 text-[13px] font-medium text-white backdrop-blur-2xl shadow-hud z-30 pointer-events-none"
            aria-hidden="true"
          >
            {formatDuration(duration)}
          </time>
        )}
        
        {/* Mute/Unmute Button - Bottom Right */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          className="absolute bottom-2 right-2 grid h-7 w-7 place-items-center rounded-full border border-hud-border bg-hud-bg text-white backdrop-blur-2xl shadow-hud transition-transform active:scale-95 z-30"
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          aria-pressed={!isMuted}
        >
          {isMuted ? (
            <VolumeX size={18} />
          ) : (
            <Volume2 size={18} />
          )}
        </button>
      </div>

      {/* Meta Block - Below Video */}
      <div className="px-4 pt-2 pb-3">
        {/* Caption (one line) */}
        <h3 className="text-[17px] leading-tight line-clamp-2 text-foreground">
          {item.title || 'No caption'}
        </h3>

        {/* Meta row: left = handle, center = date, right = likes */}
        <div className="mt-1 grid grid-cols-[auto_1fr_auto] items-center gap-3 text-[14px] text-muted-foreground">
          {/* Avatar + Handle */}
          <div className="flex items-center gap-2 truncate max-w-[45vw]">
            <Avatar className="w-6 h-6 flex-shrink-0">
              <AvatarImage 
                src={item.user?.avatar || ''} 
                alt={item.user?.username || item.user?.name || 'User'} 
              />
              <AvatarFallback className="text-xs">
                {(item.user?.username?.[0] || item.user?.name?.[0] || 'U').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">
              @{item.user?.username || item.user?.name || 'unknown'}
            </span>
          </div>

          {/* Centered likes with heart icon */}
          <div className="justify-self-center flex items-center gap-1 tabular-nums">
            <Heart className="w-3.5 h-3.5" />
            <span>{formatLikes(item.likes || 0)}</span>
          </div>

          {/* Date posted */}
          <span className="justify-self-end text-muted-foreground/70 tabular-nums">
            {item.createdAt ? formatRelativeTime(item.createdAt) : '2 days ago'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CinematicVideoCard;
