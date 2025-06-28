
import { useRef, useEffect, useState, useCallback } from 'react';

interface UseVideoAutoplayProps {
  isInView?: boolean;
  isHovered?: boolean;
  videoId: string;
  isGridContext?: boolean;
}

// Global state to track currently playing video
let currentlyPlayingVideo: string | null = null;
let gridVideos: string[] = [];
let mobileAutoplayTimer: NodeJS.Timeout | null = null;
const videoInstances = new Map<string, HTMLVideoElement>();

export const useVideoAutoplay = ({ isInView, isHovered, videoId, isGridContext = false }: UseVideoAutoplayProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const pauseCurrentVideo = useCallback(() => {
    if (currentlyPlayingVideo && currentlyPlayingVideo !== videoId) {
      const currentVideo = videoInstances.get(currentlyPlayingVideo);
      if (currentVideo && !currentVideo.paused) {
        currentVideo.pause();
        currentVideo.currentTime = 0;
      }
    }
  }, [videoId]);

  const playVideo = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      setIsLoading(true);
      pauseCurrentVideo();
      await video.play();
      currentlyPlayingVideo = videoId;
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing video:', error);
    } finally {
      setIsLoading(false);
    }
  }, [videoId, pauseCurrentVideo]);

  const pauseVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    video.currentTime = 0;
    if (currentlyPlayingVideo === videoId) {
      currentlyPlayingVideo = null;
    }
    setIsPlaying(false);
  }, [videoId]);

  // Mobile random autoplay for grid context
  useEffect(() => {
    if (!isGridContext) return;

    // Register video in grid
    if (!gridVideos.includes(videoId)) {
      gridVideos.push(videoId);
    }

    // Only setup mobile timer for the first video
    if (gridVideos[0] === videoId && typeof window !== 'undefined' && window.innerWidth < 768) {
      const startRandomAutoplay = () => {
        if (mobileAutoplayTimer) clearInterval(mobileAutoplayTimer);
        
        const playRandomVideo = () => {
          const randomIndex = Math.floor(Math.random() * gridVideos.length);
          const randomVideoId = gridVideos[randomIndex];
          const randomVideo = videoInstances.get(randomVideoId);
          
          // Pause all videos first
          gridVideos.forEach(id => {
            const video = videoInstances.get(id);
            if (video && !video.paused) {
              video.pause();
              video.currentTime = 0;
            }
          });
          
          // Play the random video
          if (randomVideo) {
            randomVideo.play().catch(console.error);
            currentlyPlayingVideo = randomVideoId;
          }
        };
        
        // Play one immediately, then every 5 seconds
        playRandomVideo();
        mobileAutoplayTimer = setInterval(playRandomVideo, 5000);
      };

      startRandomAutoplay();
    }

    return () => {
      // Clean up grid video registration
      gridVideos = gridVideos.filter(id => id !== videoId);
      
      if (gridVideos.length === 0 && mobileAutoplayTimer) {
        clearInterval(mobileAutoplayTimer);
        mobileAutoplayTimer = null;
      }
    };
  }, [videoId, isGridContext]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Register video instance
    videoInstances.set(videoId, video);

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      videoInstances.delete(videoId);
      if (currentlyPlayingVideo === videoId) {
        currentlyPlayingVideo = null;
      }
    };
  }, [videoId]);

  // Handle autoplay based on hover (desktop) or in-view (mobile) - but not for mobile grid context
  useEffect(() => {
    // Skip normal autoplay logic for mobile grid context (handled by random timer)
    if (isGridContext && typeof window !== 'undefined' && window.innerWidth < 768) {
      return;
    }

    const shouldPlay = isHovered || isInView;
    
    if (shouldPlay && !isPlaying) {
      playVideo();
    } else if (!shouldPlay && isPlaying) {
      pauseVideo();
    }
  }, [isHovered, isInView, isPlaying, playVideo, pauseVideo, isGridContext]);

  return {
    videoRef,
    isPlaying,
    isLoading,
    playVideo,
    pauseVideo
  };
};
