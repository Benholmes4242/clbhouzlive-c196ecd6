import { useRef, useState, useEffect } from 'react';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';
import { useVideoPlaybackManager } from '@/contexts/VideoPlaybackManager';

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
  const { registerVideo, unregisterVideo, setActiveAudioVideo, muteAllOtherVideos } = useVideoPlaybackManager();
  
  // Generate unique video ID for this player instance
  const videoId = useRef(`video-${src.split('/').pop()?.split('.')[0] || 'unknown'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Register this video with the playback manager only once
    registerVideo(videoId.current, video);

    return () => {
      // Unregister this video when component unmounts
      unregisterVideo(videoId.current);
    };
  }, []); // Empty dependency array - register only once

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
      
      // For feed videos, ensure this becomes the only video with audio
      if (isInFeed && !isGloballyMuted) {
        console.log('🎬 Video started playing in feed, ensuring audio exclusivity');
        muteAllOtherVideos(videoId.current);
        setActiveAudioVideo(videoId.current);
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
      
      // When video pauses, clear it as the active audio video
      if (isInFeed) {
        setActiveAudioVideo(null);
      }
    };

    const handleVolumeChange = () => {
      setIsMuted(video.muted);
    };

    const handleLoadedMetadata = () => {
      // Enable autoplay when ready (regardless of current time position)
      if (autoplay && video.paused) {
        video.play().catch(error => {
          console.log('Autoplay prevented:', error);
        });
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    // Attempt autoplay on initial load if video is ready
    if (autoplay && video.paused && video.readyState >= 1) {
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

  // Add effect to handle autoplay changes for already-loaded videos
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isInFeed) return;

    // If autoplay is enabled and video is paused but has been viewed before
    // This handles the case where videos were paused by pauseAllAndSetActive but should resume
    if (autoplay && video.paused && video.readyState >= 2) {
      console.log('🔄 Resuming autoplay for previously viewed video:', videoId.current, 'from position:', video.currentTime);
      
      // If the video has some currentTime (was playing before), resume from that position
      // Otherwise start from beginning
      video.play().catch(error => {
        console.log('Autoplay resume prevented:', error);
      });
    } else if (!autoplay && !video.paused) {
      // If autoplay is disabled but video is playing, pause it
      video.pause();
    }
  }, [autoplay, isInFeed]);

  // Update video mute state when global mute state changes (for feed videos)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isInFeed) return;
    
    video.muted = isGloballyMuted;
    setIsMuted(isGloballyMuted);
    
    // If globally muted, clear this as active audio video
    if (isGloballyMuted) {
      setActiveAudioVideo(null);
    }
  }, [isGloballyMuted, isInFeed, setActiveAudioVideo]);


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
    
    // Store current playback position and playing state
    const currentTime = video.currentTime;
    const wasPlaying = !video.paused;
    
    video.muted = newMutedState;
    setIsMuted(newMutedState);
    
    // Update global mute state if this is a feed video
    if (isInFeed) {
      setGlobalMute(newMutedState);
      
      // If unmuting this video in feed, make it the active audio video
      if (!newMutedState) {
        muteAllOtherVideos(videoId.current);
        setActiveAudioVideo(videoId.current);
      } else {
        setActiveAudioVideo(null);
      }
    }
    
    // Ensure the video maintains its playback position and state
    if (video.currentTime !== currentTime) {
      video.currentTime = currentTime;
    }
    
    // Maintain playing state - only resume if it was playing before
    if (wasPlaying && video.paused) {
      video.play().catch(console.error);
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