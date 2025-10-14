import React, { useRef, useEffect, useState } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useExclusiveVideoAudio } from '@/hooks/useExclusiveVideoAudio';
import { Volume2, VolumeX, MapPin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatRelativeTime } from '@/utils/dateFormat';
import { clsx } from 'clsx';

interface VerticalVideoCardProps {
  item: ExploreContentItem;
  onMediaClick?: (item: ExploreContentItem) => void;
}

const VerticalVideoCard: React.FC<VerticalVideoCardProps> = ({ item, onMediaClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { ref: containerRef, isInView } = useIntersectionObserver({ threshold: 0.5, rootMargin: '0px' });
  const { isMuted, toggleMute } = useExclusiveVideoAudio(item.id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number>(0);

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
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const videoUrl = item.media?.[0]?.media_url || item.src || '';
  const thumbnailUrl = item.thumbnailSrc || '';
  const courseName = item.golfCourse?.name || 'Golf Course';

  return (
    <div ref={containerRef} className="w-full">
      <div className="relative w-full aspect-[2/3] overflow-hidden rounded-lg shadow-md">
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
            className="absolute top-3 left-3 rounded-md px-2 h-6 inline-flex items-center bg-black/80 backdrop-blur-sm text-white text-[12px] leading-[16px] font-semibold shadow-sm z-30"
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
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-sm transition-all hover:bg-black/70 active:scale-95 z-30"
          aria-pressed={isMuted ? 'true' : 'false'}
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>

        {/* Glass Overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.35)_50%,rgba(0,0,0,0.45)_100%)] backdrop-blur-[6px] pt-16 pb-3 px-3 z-20">
          {/* Course Tag */}
          <div className="flex items-center gap-1 mb-1.5">
            <MapPin size={12} className="text-white/70" />
            <span className="text-[11px] font-medium text-white/90 truncate">{courseName}</span>
          </div>
          
          {/* Caption */}
          <p className="text-[15px] leading-[19px] font-semibold text-white line-clamp-2 mb-2 drop-shadow-md">
            {item.title || 'No caption'}
          </p>
          
          {/* Creator & Meta */}
          <div className="flex items-center gap-1.5 text-[12px]">
            <Avatar className="h-5 w-5 border border-white/20">
              <AvatarImage src={item.user?.avatar} />
              <AvatarFallback className="text-[10px]">{item.user?.name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <span className="text-white/85 font-medium truncate">@{item.user?.username || item.user?.name || 'unknown'}</span>
            <span className="text-white/60">•</span>
            <span className="text-white/70">{item.createdAt ? formatRelativeTime(item.createdAt) : '2d ago'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerticalVideoCard;
