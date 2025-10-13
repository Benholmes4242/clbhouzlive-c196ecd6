import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import { Eye, Volume2, VolumeX } from 'lucide-react';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useExclusiveVideoAudio } from '@/hooks/useExclusiveVideoAudio';

interface CinematicVideoCardProps {
  item: ExploreContentItem;
  onMediaClick?: (item: ExploreContentItem) => void;
}

const CinematicVideoCard: React.FC<CinematicVideoCardProps> = ({ item, onMediaClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  
  // Use intersection observer with 50% threshold
  const { ref: observerRef, isInView } = useIntersectionObserver({
    threshold: 0.5,
    rootMargin: '0px'
  });

  // Exclusive audio management
  const { isMuted, toggleMute } = useExclusiveVideoAudio(item.id);

  // Combine refs
  useEffect(() => {
    if (cardRef.current && observerRef.current !== cardRef.current) {
      (observerRef as React.MutableRefObject<HTMLDivElement | null>).current = cardRef.current;
    }
  }, [observerRef]);

  // Mark as entered when first in view
  useEffect(() => {
    if (isInView && !hasEntered) {
      setHasEntered(true);
    }
  }, [isInView, hasEntered]);

  // Auto-play/pause based on visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isInView) {
      // Play when in view
      video.muted = isMuted;
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Autoplay failed:', err);
      });
    } else {
      // Pause when out of view
      video.pause();
      setIsPlaying(false);
    }
  }, [isInView, isMuted]);

  // Update mute state when it changes
  useEffect(() => {
    const video = videoRef.current;
    if (video && isPlaying) {
      video.muted = isMuted;
    }
  }, [isMuted, isPlaying]);

  // Format view count
  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  // Format upload time
  const getUploadTime = () => {
    const daysSince = Math.floor(Math.random() * 30) + 1;
    if (daysSince === 1) return '1 day ago';
    if (daysSince < 7) return `${daysSince} days ago`;
    if (daysSince < 14) return '1 week ago';
    if (daysSince < 30) return `${Math.floor(daysSince / 7)} weeks ago`;
    return '1 month ago';
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleMute();
  };

  return (
    <div
      ref={cardRef}
      className="w-full cinematic-video-card"
      style={{ marginBottom: '16px' }}
    >
      {/* Video Container - Edge to edge */}
      <div 
        className="relative w-full bg-black cursor-pointer overflow-hidden"
        onClick={() => onMediaClick?.(item)}
        style={{
          aspectRatio: '16/9',
          borderRadius: '8px'
        }}
      >
        {/* Video Player */}
        <div className={`
          w-full h-full 
          transition-all duration-[3000ms] ease-out
          ${isInView && hasEntered ? 'scale-102' : 'scale-100'}
        `}>
          <EnhancedVideoPlayer
            ref={videoRef}
            src={item.src}
            poster={item.thumbnailSrc}
            autoplay={false}
            loop={true}
            muted={isMuted}
            playsInline={true}
            className="w-full h-full"
            objectFit="cover"
            enableHLS={true}
          />
        </div>

        {/* Mute Toggle - Bottom Right */}
        <button
          onClick={handleMuteToggle}
          className="absolute bottom-3 right-3 z-20 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-all"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-white" />
          ) : (
            <Volume2 className="w-4 h-4 text-white" />
          )}
        </button>

        {/* Fade overlay on scroll out */}
        <div 
          className={`
            absolute inset-0 bg-black/0 pointer-events-none transition-all duration-300
            ${!isInView ? 'opacity-20' : 'opacity-0'}
          `}
        />
      </div>

      {/* Info Bar - Fades in when in view */}
      <div 
        className={`
          mt-3 px-3 transition-all duration-200
          ${hasEntered && isInView 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-2'
          }
        `}
      >
        <div className="flex items-start gap-3">
          {/* Creator Avatar */}
          {item.user?.avatar && (
            <img
              src={item.user.avatar}
              alt={item.user.name}
              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
            />
          )}
          
          {/* Content Info */}
          <div className="flex-1 min-w-0">
            {/* Creator Name */}
            <p className="text-sm font-medium text-foreground truncate">
              {item.user?.name || 'Anonymous'}
            </p>
            
            {/* Title/Caption */}
            <h3 className="text-sm text-foreground/90 line-clamp-2 leading-tight mt-0.5">
              {item.title}
            </h3>
            
            {/* Stats */}
            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground/70">
              <Eye className="w-3 h-3" />
              <span>{formatViews(item.likes * 100)} views</span>
              <span className="mx-0.5">•</span>
              <span>{getUploadTime()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CinematicVideoCard;
