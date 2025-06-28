
import { useRef, useEffect, useState, useCallback } from 'react';

interface UseVideoAutoplayProps {
  isInView?: boolean;
  isHovered?: boolean;
  videoId: string;
}

// Global state to track currently playing video and mobile autoplay
let currentlyPlayingVideo: string | null = null;
let mobileAutoplayVideo: string | null = null;
const videoInstances = new Map<string, HTMLVideoElement>();
const mobileVideoPool: string[] = [];

export const useVideoAutoplay = ({ isInView, isHovered, videoId }: UseVideoAutoplayProps) => {
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

  // Mobile random autoplay logic
  const selectRandomMobileVideo = useCallback(() => {
    if (mobileVideoPool.length === 0) return;
    
    // Pause current mobile autoplay video
    if (mobileAutoplayVideo) {
      const currentMobileVideo = videoInstances.get(mobileAutoplayVideo);
      if (currentMobileVideo && !currentMobileVideo.paused) {
        currentMobileVideo.pause();
        currentMobileVideo.currentTime = 0;
      }
    }
    
    // Select new random video
    const randomIndex = Math.floor(Math.random() * mobileVideoPool.length);
    const selectedVideoId = mobileVideoPool[randomIndex];
    const selectedVideo = videoInstances.get(selectedVideoId);
    
    if (selectedVideo) {
      mobileAutoplayVideo = selectedVideoId;
      selectedVideo.play().catch(console.error);
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Register video instance
    videoInstances.set(videoId, video);
    
    // Add to mobile video pool
    if (!mobileVideoPool.includes(videoId)) {
      mobileVideoPool.push(videoId);
    }

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);

    // Mobile random autoplay timer
    const isMobile = window.innerWidth < 768;
    let mobileInterval: NodeJS.Timeout;
    
    if (isMobile && mobileVideoPool.length > 0 && !mobileAutoplayVideo) {
      // Start random autoplay after a short delay
      setTimeout(() => {
        selectRandomMobileVideo();
        
        // Change video every 5 seconds
        mobileInterval = setInterval(selectRandomMobileVideo, 5000);
      }, 1000);
    }

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      
      videoInstances.delete(videoId);
      const poolIndex = mobileVideoPool.indexOf(videoId);
      if (poolIndex > -1) {
        mobileVideoPool.splice(poolIndex, 1);
      }
      
      if (currentlyPlayingVideo === videoId) {
        currentlyPlayingVideo = null;
      }
      if (mobileAutoplayVideo === videoId) {
        mobileAutoplayVideo = null;
      }
      
      if (mobileInterval) {
        clearInterval(mobileInterval);
      }
    };
  }, [videoId, selectRandomMobileVideo]);

  // Handle desktop hover and mobile in-view autoplay
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    
    if (!isMobile) {
      // Desktop: hover behavior
      if (isHovered && !isPlaying) {
        playVideo();
      } else if (!isHovered && isPlaying && currentlyPlayingVideo === videoId) {
        pauseVideo();
      }
    } else {
      // Mobile: in-view behavior (but respect random autoplay)
      if (isInView && mobileAutoplayVideo === videoId && !isPlaying) {
        playVideo();
      } else if (!isInView && isPlaying && currentlyPlayingVideo === videoId) {
        pauseVideo();
      }
    }
  }, [isHovered, isInView, isPlaying, playVideo, pauseVideo, videoId]);

  return {
    videoRef,
    isPlaying,
    isLoading,
    playVideo,
    pauseVideo
  };
};
