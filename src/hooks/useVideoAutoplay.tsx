
import { useRef, useEffect, useState, useCallback } from 'react';

interface UseVideoAutoplayProps {
  isInView?: boolean;
  isHovered?: boolean;
  videoId: string;
}

// Global state to track currently playing video
let currentlyPlayingVideo: string | null = null;
const videoInstances = new Map<string, HTMLVideoElement>();

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

  // Handle autoplay based on hover (desktop) or in-view (mobile)
  useEffect(() => {
    const shouldPlay = isHovered || isInView;
    
    if (shouldPlay && !isPlaying) {
      playVideo();
    } else if (!shouldPlay && isPlaying) {
      pauseVideo();
    }
  }, [isHovered, isInView, isPlaying, playVideo, pauseVideo]);

  return {
    videoRef,
    isPlaying,
    isLoading,
    playVideo,
    pauseVideo
  };
};
