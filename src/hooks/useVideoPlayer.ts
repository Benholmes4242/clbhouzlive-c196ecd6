import { useRef, useState, useEffect } from 'react';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';

interface UseVideoPlayerProps {
  src: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  isInFeed?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  videoRef?: React.RefObject<HTMLVideoElement>;
}

export const useVideoPlayer = ({
  src,
  autoplay = false,
  muted = true,
  loop = true,
  isInFeed = false,
  onPlay,
  onPause,
  videoRef: externalVideoRef
}: UseVideoPlayerProps) => {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalVideoRef || internalVideoRef;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const { isGloballyMuted, setGlobalMute } = useGlobalAudio();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Set initial properties for optimized loading
    video.muted = isInFeed ? isGloballyMuted : muted;
    video.loop = loop;
    video.playsInline = true; // Critical for mobile autoplay
    video.setAttribute('playsinline', 'true'); // iOS compatibility
    video.preload = 'metadata'; // Load metadata for poster frame

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleVolumeChange = () => {
      setIsMuted(video.muted);
    };

    const handleLoadedMetadata = () => {
      // Optimize for immediate autoplay when ready
      if (autoplay && video.paused) {
        video.currentTime = 0;
        video.play().catch(error => {
          console.log('Autoplay prevented:', error);
        });
      }
    };

    // Prevent touch events from interfering with autoplay on mobile
    const handleTouchStart = (e: TouchEvent) => {
      if (isInFeed && autoplay) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isInFeed && autoplay) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isInFeed && autoplay) {
        e.stopPropagation();
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('touchstart', handleTouchStart, { passive: false });
    video.addEventListener('touchend', handleTouchEnd, { passive: false });
    video.addEventListener('touchmove', handleTouchMove);

    // Immediate autoplay attempt with optimization
    if (autoplay) {
      video.currentTime = 0;
      // Use requestAnimationFrame for smoother autoplay timing
      requestAnimationFrame(() => {
        video.play().catch(error => {
          console.log('Autoplay prevented:', error);
        });
      });
    }

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('touchstart', handleTouchStart);
      video.removeEventListener('touchend', handleTouchEnd);
      video.removeEventListener('touchmove', handleTouchMove);
    };
  }, [autoplay, muted, loop, onPlay, onPause, isGloballyMuted, isInFeed]);

  // Update video mute state when global mute state changes (for feed videos)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isInFeed) return;
    
    video.muted = isGloballyMuted;
    setIsMuted(isGloballyMuted);
  }, [isGloballyMuted, isInFeed]);

  // Pause video when autoplay becomes false (when video goes out of view)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isInFeed) return;

    if (!autoplay && !video.paused) {
      video.pause();
    }
  }, [autoplay, isInFeed]);

  const togglePlayPause = (e?: React.MouseEvent | Event) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    const newMutedState = !video.muted;
    video.muted = newMutedState;
    setIsMuted(newMutedState);
    
    // Update global mute state if this is a feed video
    if (isInFeed) {
      setGlobalMute(newMutedState);
    }
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.requestFullscreen) {
      video.requestFullscreen();
    }
  };

  return {
    videoRef,
    isPlaying,
    isMuted,
    togglePlayPause,
    toggleMute,
    handleFullscreen
  };
};