import React, { useRef, useEffect, useState } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useExclusiveVideoAudio } from '@/hooks/useExclusiveVideoAudio';
import { useVideoProgressSync } from '@/hooks/useVideoProgressSync';
import { Volume2, VolumeX } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatRelativeTime, formatLikes } from '@/utils/dateFormat';
import { clsx } from 'clsx';

interface CinematicVideoCardProps {
  item: ExploreContentItem;
  onMediaClick?: (item: ExploreContentItem) => void;
}

const CinematicVideoCard: React.FC<CinematicVideoCardProps> = ({ item, onMediaClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { ref: containerRef, isInView } = useIntersectionObserver({ threshold: 0.4, rootMargin: '0px 0px -10% 0px' });
  const { isMuted, toggleMute } = useExclusiveVideoAudio(item.id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const { progress, setProgressFillRef } = useVideoProgressSync(videoRef.current);

  const toggleExpanded = () => setIsExpanded(v => !v);

  // Auto-play when in view
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isInView) {
      video.muted = isMuted;
      video.loop = true;
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.log('Autoplay prevented:', err);
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isInView, isMuted]);

  // Update mute state
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = isMuted;
    }
  }, [isMuted]);

  // Capture duration once loaded
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(Math.floor(video.duration));
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
    <div ref={containerRef} className="w-full mb-5">
      <div className="relative w-full aspect-[3/2] overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          poster={thumbnailUrl}
          playsInline
          className="w-full h-full object-cover"
          onClick={() => onMediaClick?.(item)}
        />

        {/* Subtle gradient for text readability */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/15 via-black/5 to-transparent z-[15]" />

        {/* ON-VIDEO OVERLAY (BOTTOM, FULL-WIDTH, NO GAP) */}
          <div
          className={clsx(
            "absolute bottom-0 left-0 right-0 z-20",
            "bg-black/25 backdrop-blur-sm",
            "border-t border-white/10",
            "px-4 pt-[6px] pb-[6px]",
            "transition-all duration-200 ease-out overflow-hidden",
            isExpanded ? "max-h-[50vh]" : "max-h-[68px]"
          )}
          onClick={toggleExpanded}
          onKeyDown={(e) => e.key === 'Enter' && toggleExpanded()}
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          aria-label="Video details"
        >
          {/* FULL-WIDTH progress bar at top edge of overlay */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/15">
            <div
              ref={setProgressFillRef}
              className="h-full origin-left bg-white/85"
              style={{ transform: 'scaleX(0)' }}
              aria-hidden="true"
            />
          </div>

          {/* Caption (one line) */}
          <h3
            className={clsx(
              "text-white text-[17px] font-semibold leading-tight",
              isExpanded ? "line-clamp-none" : "line-clamp-1"
            )}
          >
            {item.title || 'No caption'}
          </h3>

          {/* Meta row: left = handle, center = date, right = likes */}
          <div
            className="
              mt-1 grid grid-cols-[auto_1fr_auto] items-center
              text-[13px] text-white/85
              whitespace-nowrap select-none
            "
          >
            {/* Handle (truncate if long) */}
            <span className="truncate max-w-[46vw] shrink-0">
              @{item.user?.username || item.user?.name || 'unknown'}
            </span>

            {/* Centered date */}
            <span className="justify-self-center text-white/70 tabular-nums">
              {item.createdAt ? formatRelativeTime(item.createdAt) : '2 days ago'}
            </span>

            {/* Likes on the right (never wraps) */}
            <span className="justify-self-end shrink-0 tabular-nums">
              {formatLikes(item.likes || 0)} likes
            </span>
          </div>

          {/* Optional: extra gradient on expand */}
          {isExpanded && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 -z-10 bg-gradient-to-t from-black/40 to-transparent" />
          )}
        </div>

        {/* Duration Badge - TOP LEFT */}
        {duration > 0 && (
          <time 
            className="absolute top-3 left-3 rounded-md px-2.5 py-1 bg-black/25 backdrop-blur-sm border border-white/10 text-white text-[13px] font-medium z-30 pointer-events-none"
            aria-label={`Duration ${formatDuration(duration)}`}
          >
            {formatDuration(duration)}
          </time>
        )}
        
        {/* Mute/Unmute Button - TOP RIGHT */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          className="absolute top-3 right-3 h-9 w-9 rounded-full bg-black/25 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white shadow-[0_2px_8px_rgba(0,0,0,0.25)] transition-transform active:scale-95 z-30"
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
        >
          {isMuted ? (
            <VolumeX size={18} />
          ) : (
            <Volume2 size={18} />
          )}
        </button>
      </div>
    </div>
  );
};

export default CinematicVideoCard;
