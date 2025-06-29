
import { useRef, useEffect, useState } from 'react';
import { useVideoAutoplayManager } from './useVideoAutoplayManager';
import { useIsMobile } from './use-mobile';

interface UseVideoAutoplayProps {
  isInView: boolean;
  isHovered: boolean;
  videoId: string;
  isGridContext?: boolean;
}

export const useVideoAutoplay = ({
  isInView,
  isHovered,
  videoId,
  isGridContext = false
}: UseVideoAutoplayProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Add error handling for context
  let videoAutoplayManager;
  try {
    videoAutoplayManager = useVideoAutoplayManager();
  } catch (error) {
    console.error('VideoAutoplayManager not available:', error);
    // Return default values when context is not available
    return {
      videoRef,
      isPlaying: false,
      isLoading: false,
      shouldShowPlayIcon: true
    };
  }

  const { setActiveVideo, isVideoActive } = videoAutoplayManager;
  const isMobile = useIsMobile();
  
  // Detect iOS Safari
  const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Skip autoplay entirely on iOS Safari to prevent NotSupportedError
    if (isIOSSafari && isGridContext) {
      return;
    }

    // On mobile/tablet devices, don't autoplay at all - keep videos static
    if (isMobile) {
      return;
    }

    // Determine if video should play
    const shouldPlay = isInView && isHovered;

    const handlePlay = async () => {
      if (!shouldPlay || isPlaying) return;

      try {
        // In grid context, claim this video as active when starting to play
        if (isGridContext) {
          setActiveVideo(videoId);
        }

        setIsLoading(true);
        await video.play();
        setIsPlaying(true);
        console.log(`Video ${videoId} started playing on hover`);
      } catch (error) {
        // Silently handle autoplay failures
        console.log(`Video ${videoId} autoplay blocked:`, error);
        setIsPlaying(false);
      } finally {
        setIsLoading(false);
      }
    };

    const handlePause = () => {
      if (shouldPlay) return;

      try {
        video.pause();
        setIsPlaying(false);
        console.log(`Video ${videoId} paused`);
        
        // Release active video if this was it
        if (isGridContext && isVideoActive(videoId)) {
          setActiveVideo(null);
        }
      } catch (error) {
        console.log(`Video ${videoId} pause error:`, error);
      }
    };

    // Handle play/pause based on conditions
    if (shouldPlay) {
      handlePlay();
    } else if (isPlaying) {
      handlePause();
    }

    // Cleanup function
    return () => {
      if (video && isPlaying) {
        try {
          video.pause();
          if (isGridContext && isVideoActive(videoId)) {
            setActiveVideo(null);
          }
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    };
  }, [isInView, isHovered, videoId, isPlaying, isIOSSafari, isGridContext, isVideoActive, setActiveVideo, isMobile]);

  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handlePlaying = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };
    const handlePause = () => setIsPlaying(false);
    const handleError = (e: Event) => {
      console.log(`Video ${videoId} error:`, e);
      setIsPlaying(false);
      setIsLoading(false);
      if (isGridContext && isVideoActive && isVideoActive(videoId)) {
        setActiveVideo(null);
      }
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
    };
  }, [videoId, isGridContext, isVideoActive, setActiveVideo]);

  return {
    videoRef,
    isPlaying,
    isLoading,
    // On mobile, always show play icon. On desktop, show when not playing and not loading
    shouldShowPlayIcon: isMobile ? true : (!isPlaying && !isLoading)
  };
};
