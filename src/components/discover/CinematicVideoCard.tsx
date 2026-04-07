import React, { useRef, useEffect, useState } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import { useVideoVisibility } from '@/hooks/useVideoVisibility';
import { useExclusiveVideoAudio } from '@/hooks/useExclusiveVideoAudio';
import { useVideoProgressSync } from '@/hooks/useVideoProgressSync';
import { Volume2, VolumeX, Heart } from 'lucide-react';
import { Squircle } from '@/components/ui/squircle';
import { formatRelativeTime, formatLikes } from '@/utils/dateFormat';
import { buildImageThumbnailUrl, buildVideoPosterUrl } from '@/utils/mediaThumbs';
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
  const baseThumbnailUrl = item.thumbnailSrc || '';
  const thumbnailUrl = baseThumbnailUrl 
    ? buildVideoPosterUrl(baseThumbnailUrl, { width: 800, height: 800 })
    : '';

  return (
    <div ref={containerRef} className="w-full mb-2">
      {/* Video Container */}
      <div className="relative w-full overflow-hidden" style={{ height: 'clamp(220px, 45vh, 280px)' }}>
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          className="w-full h-full object-cover"
          onClick={() => onMediaClick?.(item)}
        />

        {/* Progress Bar - Bottom Edge of Video */}
        <div 
          className="pointer-events-none absolute left-0 right-0 bottom-0 h-[2px] bg-hud-bg backdrop-blur-2xl z-20"
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
            positioning="absolute"
            course={{
              id: item.golfCourse.id,
            name: item.golfCourse.name,
            country: item.golfCourse.country
          }}
          className="top-2 right-2 [&>div]:!px-1.5 [&>div]:!py-0.5 [&>div]:!text-meta [&_svg]:!w-4 [&_svg]:!h-4"
        />
        )}

        {/* Duration Badge - Bottom Left */}
        {duration > 0 && (
          <time 
            className="absolute bottom-2 left-2 inline-flex h-6 items-center rounded-md border border-hud-border bg-hud-bg px-1.5 text-body-sm font-medium text-white backdrop-blur-2xl shadow-hud z-30 pointer-events-none"
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
        <h3 className="text-heading-md font-semibold leading-snug line-clamp-2 text-foreground">
          {item.title || 'No caption'}
        </h3>

        {/* Meta row: left = handle, center = date, right = likes */}
        <div className="mt-1 grid grid-cols-[auto_1fr_auto] items-center gap-3 text-body-md text-muted-foreground">
          {/* Avatar + Handle */}
          <div className="flex items-center gap-2 truncate max-w-[45vw]">
            <Squircle width={24} height={24}>
              {item.user?.avatar ? (
                <img 
                  src={buildImageThumbnailUrl(item.user.avatar, { width: 128, height: 128 })}
                  alt={item.user?.username || item.user?.name || 'User'} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  onError={(e) => {
                    e.currentTarget.src = '/default-avatar.svg';
                  }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', fontSize: '10px', fontWeight: 600 }}>
                  {(item.user?.name?.[0] || 'G').toUpperCase()}
                </div>
              )}
            </Squircle>
            <span className="truncate">
              {item.user?.name || 'Golfer'}
            </span>
          </div>

          {/* Centered likes with heart icon */}
          <div className="justify-self-center flex items-center gap-1 tabular-nums">
            <span style={{ fontSize: 13, lineHeight: 1 }}>🧡</span>
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
