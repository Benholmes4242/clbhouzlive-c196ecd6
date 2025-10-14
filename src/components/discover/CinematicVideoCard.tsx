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
          className={clsx(
            "absolute inset-0 h-full w-full object-cover transition-transform duration-[400ms] ease-out",
            isInView && isPlaying ? "scale-[1.01]" : "scale-100"
          )}
          style={{ willChange: isInView && isPlaying ? 'transform' : 'auto' }}
          onClick={() => onMediaClick?.(item)}
        />

        {/* Progress bar (full-width, at glass top edge) */}
        <div 
          className="absolute left-0 right-0 bottom-14 h-0.5 bg-white/18 rounded-full overflow-hidden z-20"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Video playback progress"
        >
          <div
            ref={setProgressFillRef}
            className="absolute left-0 top-0 h-full bg-white/90 rounded-full origin-left"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>

        {/* Glass strip overlay */}
        <div className="absolute inset-x-0 bottom-0 h-14 bg-[linear-gradient(180deg,rgba(18,18,18,0.08)_0%,rgba(18,18,18,0.32)_100%)] backdrop-blur-[6px] z-20">
          <div className="absolute inset-x-0 top-0 h-px bg-white/12" />
          <div className="h-full px-4 flex items-center justify-between gap-3">
            <h3 className="min-w-0 truncate text-[17px] leading-[22px] font-semibold tracking-[-0.01em] text-white">
              {item.title || 'No caption'}
            </h3>
            <div className="flex items-center gap-2 text-[13px] leading-[18px] shrink-0">
              <span className="text-white/85 truncate max-w-[120px]">
                @{item.user?.username || item.user?.name || 'unknown'}
              </span>
              <span className="text-white/70">•</span>
              <span className="text-white/70 whitespace-nowrap">
                {item.createdAt ? formatRelativeTime(item.createdAt) : '2 days ago'}
              </span>
              <span className="text-white/70">•</span>
              <span className="text-white/85 tabular-nums whitespace-nowrap">
                {formatLikes(item.likes || 0)} likes
              </span>
            </div>
          </div>
        </div>

        {/* Duration Badge - TOP LEFT */}
        {duration > 0 && (
          <time 
            className="absolute top-3 left-3 rounded-[10px] px-2.5 h-6 inline-flex items-center bg-neutral-950/45 backdrop-blur-[6px] border border-white/14 text-white text-[12px] leading-[16px] font-medium shadow-[0_1px_1px_rgba(0,0,0,0.25)] z-30 pointer-events-none"
            dateTime={`PT${duration}S`}
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
          className="absolute top-3 right-3 h-9 w-9 rounded-full bg-neutral-950/45 backdrop-blur-[6px] border border-white/14 flex items-center justify-center text-white/90 shadow-[0_1px_1px_rgba(0,0,0,0.25)] transition-transform active:scale-95 z-30 after:content-[''] after:absolute after:-inset-2"
          aria-pressed={isMuted ? 'true' : 'false'}
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
