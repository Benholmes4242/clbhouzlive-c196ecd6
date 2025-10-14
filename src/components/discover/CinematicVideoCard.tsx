import React, { useRef, useEffect, useState } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useExclusiveVideoAudio } from '@/hooks/useExclusiveVideoAudio';
import { useVideoProgressSync } from '@/hooks/useVideoProgressSync';
import { useAmbientGlow } from '@/hooks/useAmbientGlow';
import { Volume2, VolumeX } from 'lucide-react';
import { formatRelativeTime } from '@/utils/dateFormat';
import '@/styles/dark-glass.css';

interface CinematicVideoCardProps {
  item: ExploreContentItem;
  onMediaClick?: (item: ExploreContentItem) => void;
}

const CinematicVideoCard: React.FC<CinematicVideoCardProps> = ({ item, onMediaClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { ref: containerRef, isInView } = useIntersectionObserver({ threshold: 0.6 });
  const { isMuted, toggleMute } = useExclusiveVideoAudio(item.id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const [isScrollIdle, setIsScrollIdle] = useState(false);
  const [intersectionRatio, setIntersectionRatio] = useState(0);
  const { progress, setProgressFillRef } = useVideoProgressSync(videoRef.current);
  const { applyToElement } = useAmbientGlow({
    videoElement: videoRef.current,
    isActive: isInView,
    interval: 700
  });
  const scrollIdleTimer = useRef<NodeJS.Timeout>();

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

  // Parallax motion effect with IntersectionObserver - refined timing
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIntersectionRatio(entry.intersectionRatio);
        
        // Apply ambient glow to card
        applyToElement(card);
        
        // Apply parallax transform when in view with refined easing
        if (entry.intersectionRatio >= 0.6) {
          card.style.transition = 'transform 380ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity 300ms ease, filter 300ms ease';
          card.style.transform = 'translateY(0) scale(1.015)';
          card.style.opacity = '1';
          card.style.filter = 'blur(0)';
        } else if (entry.intersectionRatio > 0) {
          card.style.transition = 'transform 240ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity 240ms ease, filter 240ms ease';
          card.style.opacity = '0.85';
          card.style.filter = 'blur(1.2px)';
          card.style.transform = 'scale(1)';
        }
      },
      { 
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        rootMargin: '0px'
      }
    );

    observer.observe(card);
    return () => observer.disconnect();
  }, [applyToElement]);

  // Auto-zoom on scroll idle
  useEffect(() => {
    if (!isInView) {
      setIsScrollIdle(false);
      return;
    }

    const handleScroll = () => {
      setIsScrollIdle(false);
      clearTimeout(scrollIdleTimer.current);
      
      scrollIdleTimer.current = setTimeout(() => {
        setIsScrollIdle(true);
      }, 500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollIdleTimer.current);
    };
  }, [isInView]);

  // Apply zoom when scroll is idle - refined scale
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    if (isScrollIdle && intersectionRatio >= 0.6) {
      card.style.transition = 'transform 500ms ease-out';
      card.style.transform = 'translateY(0) scale(1.02)';
    } else if (intersectionRatio >= 0.6) {
      card.style.transform = 'translateY(0) scale(1.015)';
    }
  }, [isScrollIdle, intersectionRatio]);

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
    <div 
      ref={(node) => {
        containerRef.current = node;
        cardRef.current = node;
        applyToElement(node);
      }}
      className="w-full h-[90vh] snap-start relative overflow-hidden ambient-glow"
      style={{
        willChange: 'transform, filter, opacity'
      }}
      role="article"
      aria-live="polite"
      aria-label={`Video in focus: ${item.title} by @${item.user?.username || item.user?.name || 'unknown'}`}
    >
      {/* Video Container */}
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          src={videoUrl}
          poster={thumbnailUrl}
          playsInline
          className="w-full h-full object-cover"
          onClick={() => onMediaClick?.(item)}
          style={{ willChange: 'transform, filter, opacity' }}
        />
          
        {/* Progress Bar */}
        <div className="absolute left-0 right-0 bottom-0 progress-track z-20">
          <div 
            ref={setProgressFillRef}
            className="progress-fill"
            style={{ transform: 'scaleX(0)' }}
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
            aria-label={`Video progress: ${Math.round(progress)}%`}
          />
        </div>

        {/* Glass Caption Overlay - Bottom Left */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-6 text-white z-10 pointer-events-none">
          <div className="glass-caption">
            <p className="font-semibold text-lg leading-tight line-clamp-2 mb-1">
              {item.title || 'No caption'}
            </p>
            <div className="flex items-center gap-3 text-sm opacity-80">
              <span>@{item.user?.username || item.user?.name || 'unknown'}</span>
              <span>•</span>
              <span>{item.createdAt ? formatRelativeTime(item.createdAt) : '2 days ago'}</span>
              <span>•</span>
              <span>{item.likes?.toLocaleString() || 0} likes</span>
            </div>
          </div>
        </div>

        {/* Duration Badge - Above Caption */}
        {duration > 0 && (
          <time 
            className="glass-capsule absolute bottom-24 left-5 z-10"
            aria-label={`Duration ${formatDuration(duration)}`}
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
          className="glass-round absolute bottom-6 right-5 shadow-sm transition-transform active:scale-95 z-10 pointer-events-auto"
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          aria-pressed={!isMuted}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Video Divider Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-[30px] pointer-events-none z-30" 
           style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), transparent)' }} />
    </div>
  );
};

export default CinematicVideoCard;
