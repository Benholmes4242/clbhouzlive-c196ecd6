import React, { useRef, useEffect, useState } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useExclusiveVideoAudio } from '@/hooks/useExclusiveVideoAudio';
import { useVideoProgressSync } from '@/hooks/useVideoProgressSync';
import { Volume2, VolumeX, MapPin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatRelativeTime, formatLikes } from '@/utils/dateFormat';
import { clsx } from 'clsx';

interface FeaturedVideoCardProps {
  item: ExploreContentItem;
  onMediaClick?: (item: ExploreContentItem) => void;
}

const FeaturedVideoCard: React.FC<FeaturedVideoCardProps> = ({ item, onMediaClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { ref: containerRef, isInView } = useIntersectionObserver({ threshold: 0.5, rootMargin: '0px' });
  const { isMuted, toggleMute } = useExclusiveVideoAudio(item.id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const { progress, setProgressFillRef } = useVideoProgressSync(videoRef.current);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isInView) {
      video.muted = isMuted;
      video.loop = true;
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isInView, isMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => setDuration(Math.floor(video.duration));
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
  }, []);

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const videoUrl = item.media?.[0]?.media_url || item.src || '';
  const thumbnailUrl = item.thumbnailSrc || '';
  const courseName = item.golfCourse?.name || 'Golf Course';

  return (
    <div ref={containerRef} className="w-full mb-4">
      <div className="relative w-full aspect-[2/1] overflow-hidden rounded-lg shadow-lg">
        <video
          ref={videoRef}
          src={videoUrl}
          poster={thumbnailUrl}
          playsInline
          className={clsx(
            "absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out",
            isInView && isPlaying ? "scale-[1.02]" : "scale-100"
          )}
          style={{ willChange: isInView && isPlaying ? 'transform' : 'auto' }}
          onClick={() => onMediaClick?.(item)}
        />

        {/* Duration Badge */}
        {duration > 0 && (
          <time 
            className="absolute top-4 left-4 rounded-md px-2.5 h-7 inline-flex items-center bg-black/80 backdrop-blur-sm text-white text-[13px] leading-[16px] font-semibold shadow-md z-30"
            dateTime={`PT${duration}S`}
          >
            {formatDuration(duration)}
          </time>
        )}
        
        {/* Mute Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-md transition-all hover:bg-black/70 active:scale-95 z-30"
          aria-pressed={isMuted ? 'true' : 'false'}
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        {/* Progress Bar */}
        <div 
          className="absolute left-0 right-0 bottom-24 h-1 bg-white/20 overflow-hidden z-20"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            ref={setProgressFillRef}
            className="absolute left-0 top-0 h-full bg-white rounded-full origin-left"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>

        {/* Glass Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.35)_40%,rgba(0,0,0,0.45)_100%)] backdrop-blur-[6px] z-20">
          <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
          <div className="h-full px-5 flex flex-col justify-end pb-4 gap-2">
            {/* Course Tag */}
            <div className="flex items-center gap-1.5 text-white/90">
              <MapPin size={14} className="text-white/70" />
              <span className="text-[13px] font-medium">{courseName}</span>
            </div>
            
            {/* Title */}
            <h3 className="text-[19px] leading-[24px] font-semibold tracking-[-0.01em] text-white line-clamp-2 drop-shadow-md">
              {item.title || 'No caption'}
            </h3>
            
            {/* Meta Row */}
            <div className="flex items-center gap-2.5 text-[13px] leading-[18px]">
              <Avatar className="h-6 w-6 border border-white/20">
                <AvatarImage src={item.user?.avatar} />
                <AvatarFallback className="text-xs">{item.user?.name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <span className="text-white/90 font-medium">@{item.user?.username || item.user?.name || 'unknown'}</span>
              <span className="text-white/60">•</span>
              <span className="text-white/70">{item.createdAt ? formatRelativeTime(item.createdAt) : '2d ago'}</span>
              <span className="text-white/60">•</span>
              <span className="text-white/90 tabular-nums">{formatLikes(item.likes || 0)} likes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedVideoCard;
