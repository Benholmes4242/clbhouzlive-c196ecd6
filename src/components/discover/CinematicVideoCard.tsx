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
      {/* Video Container */}
      <div className="relative w-full aspect-[3/2] overflow-hidden">
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
          className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/15 z-20"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Video progress"
        >
          <div
            ref={setProgressFillRef}
            className="h-full origin-left bg-white/85"
            style={{ transform: 'scaleX(0)' }}
            aria-hidden="true"
          />
        </div>

        {/* Duration Badge - Bottom Left */}
        {duration > 0 && (
          <time 
            className="absolute bottom-2.5 left-2.5 rounded-md px-2.5 py-1 bg-black/45 backdrop-blur-sm border border-white/20 text-white text-[13px] font-medium z-30 pointer-events-none"
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
          className="absolute bottom-2.5 right-2.5 h-9 w-9 rounded-full bg-black/45 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white shadow-[0_2px_8px_rgba(0,0,0,0.25)] transition-transform active:scale-95 z-30"
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
        <h3 className="text-[17px] font-bold leading-tight line-clamp-1 text-foreground">
          {item.title || 'No caption'}
        </h3>

        {/* Meta row: left = handle, center = date, right = likes */}
        <div className="mt-1 grid grid-cols-[auto_1fr_auto] items-center gap-3 text-[14px] text-muted-foreground">
          {/* Handle */}
          <span className="truncate max-w-[35vw]">
            @{item.user?.username || item.user?.name || 'unknown'}
          </span>

          {/* Centered date */}
          <span className="justify-self-center text-muted-foreground/70 tabular-nums">
            {item.createdAt ? formatRelativeTime(item.createdAt) : '2 days ago'}
          </span>

          {/* Likes */}
          <span className="justify-self-end tabular-nums">
            {formatLikes(item.likes || 0)} likes
          </span>
        </div>
      </div>
    </div>
  );
};

export default CinematicVideoCard;
