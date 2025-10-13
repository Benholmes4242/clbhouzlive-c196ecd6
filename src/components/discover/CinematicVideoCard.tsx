import React, { useRef, useEffect, useState } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useExclusiveVideoAudio } from '@/hooks/useExclusiveVideoAudio';
import { useVideoProgressSync } from '@/hooks/useVideoProgressSync';
import { Volume2, VolumeX } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface CinematicVideoCardProps {
  item: ExploreContentItem;
  onMediaClick?: (item: ExploreContentItem) => void;
}

const CinematicVideoCard: React.FC<CinematicVideoCardProps> = ({ item, onMediaClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { ref: containerRef, isInView } = useIntersectionObserver({ threshold: 0.5 });
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
      {/* Video and Caption Container */}
      <div className="relative overflow-hidden">
        {/* Video (Edge-to-Edge inside card) */}
        <div className="relative w-full aspect-video overflow-hidden">
          <video
            ref={videoRef}
            src={videoUrl}
            poster={thumbnailUrl}
            playsInline
            className="w-full h-full object-cover"
            onClick={() => onMediaClick?.(item)}
          />
          
          {/* Clean Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/30 z-10">
            <div 
              ref={setProgressFillRef}
              className="h-[2px] rounded-sm bg-white/80 origin-left will-change-transform"
              style={{ transform: 'scaleX(0)' }}
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              role="progressbar"
            />
          </div>

          {/* Glass Duration Badge - Bottom Left */}
          {duration > 0 && (
            <time 
              className="absolute bottom-3 left-3 px-2 py-1 bg-white/40 border border-white/30 rounded-md text-[13px] font-medium text-white z-10"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 500 }}
              aria-label={`Duration ${formatDuration(duration)}`}
            >
              {formatDuration(duration)}
            </time>
          )}
          
          {/* Glass Mute/Unmute Toggle - Bottom Right */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
            }}
            className="absolute bottom-3 right-3 w-8 h-8 bg-white/40 border border-white/30 rounded-full flex items-center justify-center transition-transform active:scale-95 z-10"
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-white" strokeWidth={1.5} />
            ) : (
              <Volume2 className="w-5 h-5 text-white" strokeWidth={1.5} />
            )}
          </button>
        </div>

        {/* Caption Area */}
        <div className="relative w-full px-4 py-3">
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarImage src={item.user?.avatar} alt={item.user?.username || item.user?.name} />
              <AvatarFallback>{item.user?.name?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-foreground line-clamp-2 mb-1">
                {item.title || 'No caption'}
              </p>
              <div className="flex items-center justify-between text-sm text-muted-foreground/70">
                <span className="font-medium">@{item.user?.username || item.user?.name || 'unknown'}</span>
                <span>{item.likes?.toLocaleString() || 0} likes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CinematicVideoCard;
