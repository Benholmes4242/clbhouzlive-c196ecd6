import { useRef, useState, useEffect } from 'react';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';

interface UseVideoPlayerProps {
  src: string;
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  isInFeed: boolean;
  isGloballyMuted: boolean;
  setGlobalMute: (muted: boolean) => void;
}

export const useVideoPlayer = ({
  src,
  autoplay,
  muted,
  loop,
  onPlay,
  onPause,
  isInFeed,
  isGloballyMuted,
  setGlobalMute
}: UseVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Set initial properties for optimized loading
    video.muted = isInFeed ? isGloballyMuted : muted;
    video.loop = loop;
    video.playsInline = true; // Critical for mobile autoplay
    video.setAttribute('playsinline', 'true'); // iOS compatibility
    video.preload = 'metadata'; // Load metadata to show poster and prepare for autoplay

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
      // Enable autoplay when ready (for both feed and non-feed videos)
      if (autoplay && video.paused) {
        video.currentTime = 0;
        video.play().catch(error => {
          console.log('Autoplay prevented:', error);
        });
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    // Immediate autoplay attempt for all videos when autoplay is enabled
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
    };
  }, [autoplay, muted, loop, onPlay, onPause, isGloballyMuted, isInFeed]);

  // Update video mute state when global mute state changes (for feed videos)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isInFeed) return;
    
    video.muted = isGloballyMuted;
    setIsMuted(isGloballyMuted);
  }, [isGloballyMuted, isInFeed]);

  const togglePlayPause = (e?: React.MouseEvent | Event) => {
    console.log('🎯 togglePlayPause called:', { isInFeed, paused: videoRef.current?.paused });
    
    if (isInFeed) {
      console.log('🚫 togglePlayPause blocked - in feed mode');
      return; // Block all play/pause interactions in feed
    }
    
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      console.log('▶️ Playing video');
      video.play().catch(console.error);
    } else {
      console.log('⏸️ Pausing video');
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
    showControls,
    setShowControls,
    togglePlayPause,
    toggleMute,
    handleFullscreen
  };
};