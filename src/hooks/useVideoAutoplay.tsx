
import { useRef, useEffect, useState } from 'react';

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
  
  // Detect iOS Safari
  const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Skip autoplay entirely on iOS Safari to prevent NotSupportedError
    if (isIOSSafari && isGridContext) {
      return;
    }

    const shouldPlay = isInView || isHovered;

    const handlePlay = async () => {
      if (!shouldPlay || isPlaying) return;

      try {
        setIsLoading(true);
        await video.play();
        setIsPlaying(true);
        console.log(`Video ${videoId} started playing`);
      } catch (error) {
        // Silently handle autoplay failures (common on mobile)
        console.log(`Video ${videoId} autoplay blocked:`, error);
        setIsPlaying(false);
      } finally {
        setIsLoading(false);
      }
    };

    const handlePause = () => {
      if (shouldPlay || !isPlaying) return;

      try {
        video.pause();
        setIsPlaying(false);
        console.log(`Video ${videoId} paused`);
      } catch (error) {
        console.log(`Video ${videoId} pause error:`, error);
      }
    };

    if (shouldPlay) {
      handlePlay();
    } else {
      handlePause();
    }

    // Cleanup function
    return () => {
      if (video && isPlaying) {
        try {
          video.pause();
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    };
  }, [isInView, isHovered, videoId, isPlaying, isIOSSafari, isGridContext]);

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
  }, [videoId]);

  return {
    videoRef,
    isPlaying,
    isLoading
  };
};
