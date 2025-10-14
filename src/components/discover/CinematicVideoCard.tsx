import React, { useRef, useEffect, useState } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useExclusiveVideoAudio } from '@/hooks/useExclusiveVideoAudio';
import { useVideoProgressSync } from '@/hooks/useVideoProgressSync';
import { Volume2, VolumeX } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatRelativeTime, formatLikes } from '@/utils/dateFormat';

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
  const { progress, setProgressFillRef } = useVideoProgressSync(videoRef.current);

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
        
        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/15 z-10">
          <div 
            ref={setProgressFillRef}
            className="h-full bg-white/85 origin-left will-change-transform"
            style={{ transform: 'scaleX(0)' }}
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
          />
        </div>

        {/* Optional gradient lift for contrast */}
        <div className="absolute inset-x-0 bottom-0 h-24 z-[15] pointer-events-none bg-gradient-to-t from-black/25 via-black/10 to-transparent" />

        {/* On-video dark-glass content overlay (FULL WIDTH) */}
        <div
          className={`
            absolute left-0 right-0 bottom-[10px] z-20
            rounded-none
            border-t border-white/10
            bg-black/55 backdrop-blur-md
            px-4 py-3
            shadow-[0_-6px_16px_rgba(0,0,0,0.22)]
            transition-all duration-250
            will-change-transform will-change-opacity
            pointer-events-none
            ${isInView ? 'opacity-100 translate-y-0' : 'opacity-90 translate-y-[2px]'}
          `}
          role="group"
          aria-label="Video details"
        >
          <h3 className="text-white text-lg font-semibold leading-snug line-clamp-2">
            {item.title || 'No caption'}
          </h3>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="text-white/85">@{item.user?.username || item.user?.name || 'unknown'}</span>
            <span className="text-white/65">•</span>
            <span className="text-white/75">{item.createdAt ? formatRelativeTime(item.createdAt) : '2 days ago'}</span>
            <span className="text-white/65">•</span>
            <span className="text-white/80">{formatLikes(item.likes || 0)} likes</span>
          </div>
        </div>

        {/* Duration Badge - TOP LEFT */}
        {duration > 0 && (
          <time 
            className="absolute top-3 left-3 rounded-md px-2.5 py-1 bg-black/60 backdrop-blur-md border border-white/15 text-white text-[13px] font-medium z-30 pointer-events-none"
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
          className="absolute top-3 right-3 h-9 w-9 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-white shadow-[0_2px_8px_rgba(0,0,0,0.25)] transition-transform active:scale-95 z-30"
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
